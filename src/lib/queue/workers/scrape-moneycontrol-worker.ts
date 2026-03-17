// src/lib/queue/workers/scrape-moneycontrol-worker.ts
//
// BullMQ worker that scrapes MoneyControl stock ideas via their JSON API.
// Runs every 3 hours (8 times daily).
//
// For each recommendation found:
//   1. Find or create the brokerage as a Creator (platform=WEBSITE)
//   2. Store the recommendation as a RawPost
//   3. Parse and create a Tip with high confidence (auto-approved)

import { Worker, type Job } from "bullmq";

import { createLogger } from "@/lib/logger";
import { db } from "@/lib/db";
import { MoneyControlScraper, type MoneyControlStockInfo } from "@/lib/scraper/moneycontrol";

const log = createLogger("worker/moneycontrol");
import {
  parseMoneyControlRecommendation,
  brokerageSlug,
} from "@/lib/scraper/moneycontrol-parser";
import { createMoneyControlRateLimiter } from "@/lib/scraper/rate-limiter";
import { calculateTipContentHash } from "@/lib/utils/crypto";
import { TIMEFRAME_EXPIRY_DAYS } from "@/lib/constants";
import { calculateCreatorScore, persistCreatorScore } from "@/lib/scoring";
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

// ──── Market cap classification (crores) ────

function classifyMarketCap(crores: number | null): "LARGE" | "MID" | "SMALL" | "MICRO" | null {
  if (crores == null) return null;
  if (crores >= 20_000) return "LARGE";
  if (crores >= 5_000) return "MID";
  if (crores >= 1_000) return "SMALL";
  return "MICRO";
}

// ──── In-memory caches (for the job duration) ────

const brokerageCache = new Map<string, { creatorId: string; platformId: string }>();
const stockInfoCache = new Map<string, MoneyControlStockInfo | null>();

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
  log.info({ triggeredAt: job.data.triggeredAt }, "Starting MoneyControl scrape job");

  // Check feature flag
  if (process.env.ENABLE_MONEYCONTROL_SCRAPER !== "true") {
    log.info("MoneyControl scraper is disabled via feature flag");
    return { postsStored: 0, tipsCreated: 0, errors: 0 };
  }

  const rateLimiter = createMoneyControlRateLimiter();
  const scraper = new MoneyControlScraper(rateLimiter);

  let postsStored = 0;
  let tipsCreated = 0;
  let errors = 0;
  const updatedCreatorIds = new Set<string>();

  try {
    // Determine scrape mode:
    //   FULL_SCRAPE (first run or manual trigger) → 20 pages (~1000 tips)
    //   INCREMENTAL (recurring 3-hour runs) → 3 pages (~150 tips, only new ones)
    //   Tips already in DB are deduplicated by contentHash, so overlap is fine.
    const isFullScrape = job.data.type === "FULL_SCRAPE";
    const maxPages = isFullScrape ? 20 : 3;

    const { recommendations, totalApiItems, skippedItems } = await scraper.scrapeStockIdeas(maxPages);

    log.info(
      { totalApiItems, totalRecommendations: recommendations.length, skippedItems, mode: isFullScrape ? "FULL" : "INCREMENTAL" },
      "Found MoneyControl recommendations to process"
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

    for (let recIndex = 0; recIndex < recommendations.length; recIndex++) {
      const rec = recommendations[recIndex]!;
      try {
        // Skip Hold/Neutral at the tip-creation level (not actionable tips)
        // but still store them as RawPosts and preserve sourcePosition ordering
        const isHoldNeutral = /^(hold|neutral)$/i.test(rec.recommendationType);

        // Parse recommendation into structured tip
        const parsedTip = parseMoneyControlRecommendation(rec);
        if (!parsedTip && !isHoldNeutral) continue;

        // Find or create brokerage creator
        const { creatorId, platformId } = await findOrCreateBrokerage(
          rec.brokerageName
        );
        updatedCreatorIds.add(creatorId);

        // Generate unique platform post ID using the API's unique id
        const platformPostId = `mc-${rec.id}`;

        // Store as RawPost (upsert to avoid duplicates)
        const content = [
          `${rec.recommendationType.toUpperCase()} ${rec.stockName}`,
          `Brokerage: ${rec.brokerageName}`,
          `Target: ₹${rec.targetPrice}`,
          `CMP: ₹${rec.currentPrice}`,
          `Rec Price: ₹${rec.recommendedPrice}`,
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
                recommendedPrice: rec.recommendedPrice,
                upsidePct: rec.upsidePct,
                reportDate: rec.reportDate,
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

        // Hold/Neutral: RawPost stored above but skip Tip creation (not actionable)
        if (isHoldNeutral || !parsedTip) {
          log.info(
            { id: rec.id, stock: rec.stockName, type: rec.recommendationType, position: recIndex },
            "Stored RawPost but skipping tip creation (Hold/Neutral/unparseable)"
          );
          continue;
        }

        // Look up stock info from MoneyControl price API (cached per scid)
        let stockInfo: MoneyControlStockInfo | null | undefined = stockInfoCache.get(rec.scid);
        if (stockInfo === undefined) {
          stockInfo = await scraper.lookupStockByScid(rec.scid);
          stockInfoCache.set(rec.scid, stockInfo);
        }

        // Determine the stock symbol: prefer NSE symbol from API, fallback to parser
        const nseSymbol = stockInfo?.nseSymbol ?? parsedTip.stockSymbol.toUpperCase();

        // Look up stock in database
        let stock = await db.stock.findFirst({
          where: {
            OR: [
              { symbol: nseSymbol },
              { name: { contains: rec.stockName, mode: "insensitive" } },
            ],
          },
        });

        if (!stock) {
          log.info({ stockName: rec.stockName, symbol: nseSymbol, scid: rec.scid }, "Auto-creating stock from MoneyControl data");
          try {
            stock = await db.stock.upsert({
              where: { symbol: nseSymbol },
              create: {
                symbol: nseSymbol,
                name: stockInfo?.fullName || rec.stockName,
                exchange: rec.exchange === "BSE" ? "BSE" : "NSE",
                sector: stockInfo?.sector ?? null,
                industry: stockInfo?.industry ?? null,
                marketCap: classifyMarketCap(stockInfo?.marketCapCrores ?? null),
                lastPrice: stockInfo?.lastPrice ?? rec.currentPrice,
                lastPriceAt: new Date(),
                isActive: true,
              },
              update: {},
            });
          } catch (error) {
            log.error({ err: error instanceof Error ? error : new Error(String(error)), symbol: nseSymbol }, "Failed to auto-create stock");
            continue;
          }
        } else if (stockInfo && !stock.sector) {
          // Enrich existing stock with missing metadata
          await db.stock.update({
            where: { id: stock.id },
            data: {
              sector: stockInfo.sector ?? undefined,
              industry: stockInfo.industry ?? undefined,
              marketCap: classifyMarketCap(stockInfo.marketCapCrores ?? null) ?? undefined,
              lastPrice: stockInfo.lastPrice ?? undefined,
              lastPriceAt: stockInfo.lastPrice ? new Date() : undefined,
            },
          });
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
            sourcePosition: recIndex,
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
        log.error({ err: error instanceof Error ? error : new Error(String(error)) }, "Error processing MoneyControl recommendation");
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

    log.info({ postsStored, tipsCreated, errors }, "MoneyControl scrape complete");

    // Recalculate scores for creators whose data was updated
    if (updatedCreatorIds.size > 0) {
      log.info({ count: updatedCreatorIds.size }, "Recalculating scores for updated creators");
      for (const creatorId of updatedCreatorIds) {
        try {
          const score = await calculateCreatorScore(creatorId);
          if (score) {
            await persistCreatorScore(creatorId, score);
            log.info({ creatorId, rmtScore: score.rmtScore }, "Recalculated creator score after scrape");
          }
        } catch (error) {
          log.error({ err: error instanceof Error ? error : new Error(String(error)), creatorId }, "Failed to recalculate score after scrape");
        }
      }
    }
  } catch (error) {
    log.error({ err: error instanceof Error ? error : new Error(String(error)) }, "Fatal MoneyControl scrape error");
    throw error;
  }

  // Clear in-memory caches
  brokerageCache.clear();
  stockInfoCache.clear();

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
    log.info({ jobId: job.id }, "MoneyControl scrape job completed");
  });

  worker.on("failed", (job, error) => {
    log.error({ err: error, jobId: job?.id }, "MoneyControl scrape job failed");
  });

  return worker;
}
