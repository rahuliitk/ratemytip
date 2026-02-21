// src/lib/queue/workers/scrape-moneycontrol-worker.ts
//
// BullMQ worker that scrapes MoneyControl stock ideas page.
// For each recommendation found:
//   1. Find or create the brokerage as a Creator (platform=WEBSITE)
//   2. Store the recommendation as a RawPost
//   3. Parse and create a Tip with high confidence (auto-approved)

import { Worker, type Job } from "bullmq";

import { db } from "@/lib/db";
import { MoneyControlScraper } from "@/lib/scraper/moneycontrol";
import {
  parseMoneyControlRecommendation,
  brokerageSlug,
} from "@/lib/scraper/moneycontrol-parser";
import { createMoneyControlRateLimiter } from "@/lib/scraper/rate-limiter";
import { normalizeStockName } from "@/lib/parser/normalizer";
import { calculateTipContentHash } from "@/lib/utils/crypto";
import { TIMEFRAME_EXPIRY_DAYS } from "@/lib/constants";
import { addDays } from "date-fns";

// ──── Job payload type ────

interface ScrapeMoneyControlJobData {
  readonly type?: string;
  readonly triggeredAt: string;
}

// ──── Redis connection ────

function getConnection(): { host: string; port: number; password?: string } {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || "6379", 10),
    password: parsed.password || undefined,
  };
}

// ──── Brokerage creator cache (in-memory for the job duration) ────

const brokerageCache = new Map<string, { creatorId: string; platformId: string }>();

/**
 * Find or create a brokerage as a Creator with platform=WEBSITE.
 * Caches results in memory for the duration of the scrape job.
 */
async function findOrCreateBrokerage(
  brokerageName: string
): Promise<{ creatorId: string; platformId: string }> {
  const slug = brokerageSlug(brokerageName);

  // Check in-memory cache first
  const cached = brokerageCache.get(slug);
  if (cached) return cached;

  // Check database
  let creator = await db.creator.findUnique({
    where: { slug },
    include: { platforms: { where: { platform: "WEBSITE" } } },
  });

  if (creator) {
    const platform = creator.platforms[0];
    if (platform) {
      const result = { creatorId: creator.id, platformId: platform.id };
      brokerageCache.set(slug, result);
      return result;
    }
  }

  // Create new brokerage creator
  if (!creator) {
    creator = await db.creator.create({
      data: {
        slug,
        displayName: brokerageName,
        bio: `${brokerageName} — Brokerage stock recommendations tracked by RateMyTip`,
        specializations: ["POSITIONAL", "LARGE_CAP"],
        isVerified: false,
        isClaimed: false,
      },
      include: { platforms: { where: { platform: "WEBSITE" } } },
    });
  }

  // Create platform record
  const platform = await db.creatorPlatform.create({
    data: {
      creatorId: creator.id,
      platform: "WEBSITE",
      platformUserId: slug,
      platformHandle: brokerageName,
      platformUrl: "https://www.moneycontrol.com/markets/stock-ideas/",
    },
  });

  const result = { creatorId: creator.id, platformId: platform.id };
  brokerageCache.set(slug, result);
  return result;
}

// ──── Main job processor ────

async function processMoneyControlScrapeJob(
  job: Job<ScrapeMoneyControlJobData>
): Promise<{ postsStored: number; tipsCreated: number; errors: number }> {
  console.log(
    `[MoneyControlWorker] Starting scrape job (triggered: ${job.data.triggeredAt})`
  );

  // Check feature flag
  if (process.env.ENABLE_MONEYCONTROL_SCRAPER !== "true") {
    console.log("[MoneyControlWorker] MoneyControl scraper is disabled via feature flag");
    return { postsStored: 0, tipsCreated: 0, errors: 0 };
  }

  const rateLimiter = createMoneyControlRateLimiter();
  const scraper = new MoneyControlScraper(rateLimiter);

  let postsStored = 0;
  let tipsCreated = 0;
  let errors = 0;

  try {
    const { recommendations } = await scraper.scrapeStockIdeas();

    console.log(
      `[MoneyControlWorker] Found ${recommendations.length} recommendations to process`
    );

    // Create ScrapeJob record
    const scrapeJob = await db.scrapeJob.create({
      data: {
        platform: "WEBSITE",
        jobType: "FULL_SCRAPE",
        status: "RUNNING",
        startedAt: new Date(),
        postsFound: recommendations.length,
      },
    });

    for (const rec of recommendations) {
      try {
        // Parse recommendation into structured tip
        const parsedTip = parseMoneyControlRecommendation(rec);
        if (!parsedTip) continue;

        // Find or create brokerage creator
        const { creatorId, platformId } = await findOrCreateBrokerage(
          rec.brokerageName
        );

        // Generate unique platform post ID
        const platformPostId = `mc-${brokerageSlug(rec.brokerageName)}-${normalizeStockName(rec.stockName)}-${rec.reportDate}`
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "-");

        // Store as RawPost (upsert to avoid duplicates)
        const content = [
          `${rec.recommendationType.toUpperCase()} ${rec.stockName}`,
          `Brokerage: ${rec.brokerageName}`,
          `Target: ₹${rec.targetPrice}`,
          `CMP: ₹${rec.currentPrice}`,
          `Upside: ${rec.upsidePct.toFixed(1)}%`,
        ].join(" | ");

        try {
          await db.rawPost.upsert({
            where: {
              creatorPlatformId_platformPostId: {
                creatorPlatformId: platformId,
                platformPostId,
              },
            },
            create: {
              creatorPlatformId: platformId,
              platformPostId,
              content,
              postedAt: new Date(rec.reportDate || Date.now()),
              isParsed: true,
              isTipContent: true,
              parseConfidence: 0.95,
              metadata: JSON.parse(JSON.stringify({
                brokerageName: rec.brokerageName,
                recommendationType: rec.recommendationType,
                targetPrice: rec.targetPrice,
                currentPrice: rec.currentPrice,
                upsidePct: rec.upsidePct,
              })),
            },
            update: {},
          });
          postsStored++;
        } catch (error) {
          // Duplicate — already stored
          if (
            error instanceof Error &&
            error.message.includes("Unique constraint")
          ) {
            continue;
          }
          throw error;
        }

        // Look up stock in database
        const stock = await db.stock.findFirst({
          where: {
            OR: [
              { symbol: parsedTip.stockSymbol.toUpperCase() },
              { name: { contains: rec.stockName, mode: "insensitive" } },
            ],
          },
        });

        if (!stock) {
          console.warn(
            `[MoneyControlWorker] Stock not found: ${rec.stockName} (normalized: ${parsedTip.stockSymbol})`
          );
          continue;
        }

        // Calculate content hash for deduplication
        const tipTimestamp = new Date(rec.reportDate || Date.now());
        const contentHash = calculateTipContentHash({
          creatorId,
          stockSymbol: stock.symbol,
          direction: parsedTip.direction,
          entryPrice: parsedTip.entryPrice,
          target1: parsedTip.target1,
          target2: null,
          target3: null,
          stopLoss: parsedTip.stopLoss,
          timeframe: parsedTip.timeframe,
          tipTimestamp,
        });

        // Check for duplicate tip by content hash
        const existingTip = await db.tip.findUnique({
          where: { contentHash },
        });
        if (existingTip) continue;

        // Calculate expiry date
        const expiryDays = TIMEFRAME_EXPIRY_DAYS[parsedTip.timeframe] ?? 90;
        const expiresAt = addDays(tipTimestamp, expiryDays);

        // Create tip (auto-approved since confidence is 0.95)
        await db.tip.create({
          data: {
            creatorId,
            stockId: stock.id,
            direction: parsedTip.direction,
            assetClass: "EQUITY",
            entryPrice: parsedTip.entryPrice,
            target1: parsedTip.target1,
            target2: null,
            target3: null,
            stopLoss: parsedTip.stopLoss,
            timeframe: parsedTip.timeframe,
            conviction: parsedTip.conviction,
            rationale: `${rec.brokerageName} ${rec.recommendationType} recommendation`,
            sourceUrl: rec.sourceUrl,
            contentHash,
            tipTimestamp,
            priceAtTip: parsedTip.entryPrice,
            status: "ACTIVE",
            reviewStatus: "AUTO_APPROVED",
            parseConfidence: 0.95,
            expiresAt,
          },
        });

        tipsCreated++;

        // Update creator tip counts
        await db.creator.update({
          where: { id: creatorId },
          data: {
            totalTips: { increment: 1 },
            activeTips: { increment: 1 },
            lastTipAt: tipTimestamp,
          },
        });
      } catch (error) {
        errors++;
        console.error(
          "[MoneyControlWorker] Error processing recommendation:",
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    // Update scrape job status
    await db.scrapeJob.update({
      where: { id: scrapeJob.id },
      data: {
        status: errors > 0 && tipsCreated === 0 ? "FAILED" : "COMPLETED",
        completedAt: new Date(),
        tipsExtracted: tipsCreated,
        errorMessage: errors > 0 ? `${errors} errors during processing` : null,
      },
    });

    console.log(
      `[MoneyControlWorker] Scrape complete: ${postsStored} posts stored, ${tipsCreated} tips created, ${errors} errors`
    );
  } catch (error) {
    console.error(
      "[MoneyControlWorker] Fatal scrape error:",
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }

  // Clear the in-memory brokerage cache
  brokerageCache.clear();

  return { postsStored, tipsCreated, errors };
}

// ──── Worker registration ────

export function createMoneyControlScrapeWorker(): Worker {
  const worker = new Worker<ScrapeMoneyControlJobData>(
    "scrape-moneycontrol",
    processMoneyControlScrapeJob,
    {
      connection: getConnection(),
      concurrency: 1, // Only 1 concurrent scrape — be polite
    }
  );

  worker.on("completed", (job) => {
    console.log(`[MoneyControlWorker] Job ${job.id} completed`);
  });

  worker.on("failed", (job, error) => {
    console.error(
      `[MoneyControlWorker] Job ${job?.id} failed:`,
      error.message
    );
  });

  return worker;
}
