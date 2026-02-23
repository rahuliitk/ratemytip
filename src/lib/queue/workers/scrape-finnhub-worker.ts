// src/lib/queue/workers/scrape-finnhub-worker.ts
//
// BullMQ worker that scrapes Finnhub for global analyst data.
// For each tracked US stock:
//   1. Fetch recommendation trends + price targets → upsert AnalystConsensus
//   2. Fetch upgrade/downgrade actions → create Tips (auto-approved)
//   3. Find or create brokerage as Creator (platform=FINNHUB)

import { Worker, type Job } from "bullmq";

import { createLogger } from "@/lib/logger";
import { db } from "@/lib/db";

const log = createLogger("worker/finnhub");
import { FinnhubScraper } from "@/lib/scraper/finnhub";
import {
  parseFinnhubUpgradeDowngrade,
  brokerageSlug,
} from "@/lib/scraper/finnhub-parser";
import { createFinnhubRateLimiter } from "@/lib/scraper/rate-limiter";
import { calculateTipContentHash } from "@/lib/utils/crypto";
import { FINNHUB, TIMEFRAME_EXPIRY_DAYS } from "@/lib/constants";
import { addDays } from "date-fns";

// ──── Job payload type ────

interface ScrapeFinnhubJobData {
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

const brokerageCache = new Map<
  string,
  { creatorId: string; platformId: string }
>();

/**
 * Find or create a brokerage as a Creator with platform=FINNHUB.
 * Caches results in memory for the duration of the scrape job.
 */
async function findOrCreateBrokerage(
  brokerageName: string
): Promise<{ creatorId: string; platformId: string }> {
  const slug = brokerageSlug(brokerageName);

  const cached = brokerageCache.get(slug);
  if (cached) return cached;

  // Check database for existing creator
  let creator = await db.creator.findUnique({
    where: { slug },
    include: { platforms: { where: { platform: "FINNHUB" } } },
  });

  if (creator) {
    // Ensure creatorType is BROKERAGE
    if (creator.creatorType !== "BROKERAGE") {
      await db.creator.update({
        where: { id: creator.id },
        data: { creatorType: "BROKERAGE" },
      });
    }

    const platform = creator.platforms[0];
    if (platform) {
      const result = { creatorId: creator.id, platformId: platform.id };
      brokerageCache.set(slug, result);
      return result;
    }

    // Creator exists but no FINNHUB platform — add one
    const newPlatform = await db.creatorPlatform.create({
      data: {
        creatorId: creator.id,
        platform: "FINNHUB",
        platformUserId: `finnhub-${slug}`,
        platformHandle: brokerageName,
        platformUrl: "https://finnhub.io",
      },
    });

    const result = { creatorId: creator.id, platformId: newPlatform.id };
    brokerageCache.set(slug, result);
    return result;
  }

  // Create new brokerage creator
  creator = await db.creator.create({
    data: {
      slug,
      displayName: brokerageName,
      bio: `${brokerageName} — Global brokerage analyst recommendations tracked by RateMyTip`,
      creatorType: "BROKERAGE",
      specializations: ["LONG_TERM", "LARGE_CAP"],
      isVerified: false,
    },
    include: { platforms: { where: { platform: "FINNHUB" } } },
  });

  const platform = await db.creatorPlatform.create({
    data: {
      creatorId: creator.id,
      platform: "FINNHUB",
      platformUserId: `finnhub-${slug}`,
      platformHandle: brokerageName,
      platformUrl: "https://finnhub.io",
    },
  });

  const result = { creatorId: creator.id, platformId: platform.id };
  brokerageCache.set(slug, result);
  return result;
}

// ──── Main job processor ────

async function processFinnhubScrapeJob(
  job: Job<ScrapeFinnhubJobData>
): Promise<{
  consensusStored: number;
  tipsCreated: number;
  errors: number;
}> {
  log.info({ triggeredAt: job.data.triggeredAt }, "Starting Finnhub scrape job");

  if (process.env.ENABLE_FINNHUB_SCRAPER !== "true") {
    log.info("Finnhub scraper is disabled via feature flag");
    return { consensusStored: 0, tipsCreated: 0, errors: 0 };
  }

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    log.error("FINNHUB_API_KEY not set");
    return { consensusStored: 0, tipsCreated: 0, errors: 0 };
  }

  const rateLimiter = createFinnhubRateLimiter();
  const scraper = new FinnhubScraper(apiKey, rateLimiter);

  let consensusStored = 0;
  let tipsCreated = 0;
  let errors = 0;

  try {
    // Query stocks on US exchanges (NYSE/NASDAQ)
    const stocks = await db.stock.findMany({
      where: {
        isActive: true,
        exchange: { in: ["NYSE", "NASDAQ"] },
        isIndex: false,
      },
      select: { id: true, symbol: true, lastPrice: true },
    });

    log.info({ stockCount: stocks.length, batchSize: FINNHUB.SYMBOLS_PER_BATCH }, "Processing US stocks in batches");

    // Create ScrapeJob record
    const scrapeJob = await db.scrapeJob.create({
      data: {
        platform: "FINNHUB",
        jobType: "FULL_SCRAPE",
        status: "RUNNING",
        startedAt: new Date(),
        postsFound: 0,
      },
    });

    // Process in batches
    for (let i = 0; i < stocks.length; i += FINNHUB.SYMBOLS_PER_BATCH) {
      const batch = stocks.slice(i, i + FINNHUB.SYMBOLS_PER_BATCH);
      const symbols = batch.map((s) => s.symbol);

      log.info({ batch: Math.floor(i / FINNHUB.SYMBOLS_PER_BATCH) + 1, symbols }, "Processing Finnhub batch");

      const results = await scraper.processSymbolBatch(symbols);

      for (const stock of batch) {
        const data = results.get(stock.symbol);
        if (!data) continue;

        try {
          // 1. Store consensus data (recommendation trends)
          if (data.recommendations.length > 0) {
            const latest = data.recommendations[0];
            if (latest) {
              await db.analystConsensus.upsert({
                where: {
                  stockId_source_period: {
                    stockId: stock.id,
                    source: "FINNHUB",
                    period: new Date(latest.period),
                  },
                },
                create: {
                  stockId: stock.id,
                  source: "FINNHUB",
                  strongBuy: latest.strongBuy,
                  buy: latest.buy,
                  hold: latest.hold,
                  sell: latest.sell,
                  strongSell: latest.strongSell,
                  targetHigh: data.priceTarget?.targetHigh ?? null,
                  targetLow: data.priceTarget?.targetLow ?? null,
                  targetMean: data.priceTarget?.targetMean ?? null,
                  targetMedian: data.priceTarget?.targetMedian ?? null,
                  numberOfAnalysts:
                    latest.strongBuy +
                    latest.buy +
                    latest.hold +
                    latest.sell +
                    latest.strongSell,
                  period: new Date(latest.period),
                  rawData: JSON.parse(JSON.stringify({ recommendations: latest, priceTarget: data.priceTarget })),
                },
                update: {
                  strongBuy: latest.strongBuy,
                  buy: latest.buy,
                  hold: latest.hold,
                  sell: latest.sell,
                  strongSell: latest.strongSell,
                  targetHigh: data.priceTarget?.targetHigh ?? null,
                  targetLow: data.priceTarget?.targetLow ?? null,
                  targetMean: data.priceTarget?.targetMean ?? null,
                  targetMedian: data.priceTarget?.targetMedian ?? null,
                  fetchedAt: new Date(),
                },
              });
              consensusStored++;
            }
          }

          // 2. Process upgrade/downgrade actions as individual Tips
          const currentPrice = stock.lastPrice ?? 0;
          const targetMean = data.priceTarget?.targetMean ?? null;

          // Only process recent upgrades (last 30 days)
          const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

          for (const record of data.upgrades) {
            if (record.gradeTime * 1000 < thirtyDaysAgo) continue;

            try {
              const parsedTip = parseFinnhubUpgradeDowngrade(
                record,
                currentPrice,
                targetMean
              );
              if (!parsedTip) continue;

              // Find or create the brokerage
              const { creatorId, platformId } = await findOrCreateBrokerage(
                record.company
              );

              // Generate unique platform post ID
              const platformPostId =
                `fh-${brokerageSlug(record.company)}-${stock.symbol}-${record.gradeTime}`
                  .toLowerCase()
                  .replace(/[^a-z0-9-]/g, "-");

              // Store as RawPost (upsert to avoid duplicates)
              const content = [
                `${record.action.toUpperCase()}: ${record.toGrade} ${stock.symbol}`,
                `Firm: ${record.company}`,
                `From: ${record.fromGrade} → To: ${record.toGrade}`,
                `Entry: $${currentPrice}`,
                `Target: $${parsedTip.target1}`,
              ].join(" | ");

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
                  postedAt: new Date(record.gradeTime * 1000),
                  isParsed: true,
                  isTipContent: true,
                  parseConfidence: FINNHUB.CONFIDENCE,
                  metadata: JSON.parse(JSON.stringify({
                    company: record.company,
                    action: record.action,
                    fromGrade: record.fromGrade,
                    toGrade: record.toGrade,
                    gradeTime: record.gradeTime,
                  })),
                },
                update: {},
              });

              // Calculate content hash for tip deduplication
              const tipTimestamp = new Date(record.gradeTime * 1000);
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

              // Skip duplicate
              const existingTip = await db.tip.findUnique({
                where: { contentHash },
              });
              if (existingTip) continue;

              // Calculate expiry
              const expiryDays =
                TIMEFRAME_EXPIRY_DAYS[parsedTip.timeframe] ?? 365;
              const expiresAt = addDays(tipTimestamp, expiryDays);

              // Create tip (auto-approved)
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
                  rationale: `${record.company} ${record.action}: ${record.fromGrade} → ${record.toGrade}`,
                  sourceUrl: `https://finnhub.io/api/v1/stock/upgrade-downgrade?symbol=${stock.symbol}`,
                  contentHash,
                  tipTimestamp,
                  priceAtTip: currentPrice,
                  status: "ACTIVE",
                  reviewStatus: "AUTO_APPROVED",
                  parseConfidence: FINNHUB.CONFIDENCE,
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
              if (
                error instanceof Error &&
                error.message.includes("Unique constraint")
              ) {
                continue;
              }
              errors++;
              log.error({ err: error instanceof Error ? error : new Error(String(error)), symbol: stock.symbol }, "Error processing Finnhub upgrade");
            }
          }
        } catch (error) {
          errors++;
          log.error({ err: error instanceof Error ? error : new Error(String(error)), symbol: stock.symbol }, "Error processing Finnhub stock");
        }
      }

      // Report progress
      await job.updateProgress(
        Math.round(((i + batch.length) / stocks.length) * 100)
      );
    }

    // Update scrape job status
    await db.scrapeJob.update({
      where: { id: scrapeJob.id },
      data: {
        status: errors > 0 && tipsCreated === 0 ? "FAILED" : "COMPLETED",
        completedAt: new Date(),
        postsFound: consensusStored,
        tipsExtracted: tipsCreated,
        errorMessage: errors > 0 ? `${errors} errors during processing` : null,
      },
    });

    log.info({ consensusStored, tipsCreated, errors }, "Finnhub scrape complete");
  } catch (error) {
    log.error({ err: error instanceof Error ? error : new Error(String(error)) }, "Fatal Finnhub scrape error");
    throw error;
  }

  brokerageCache.clear();
  return { consensusStored, tipsCreated, errors };
}

// ──── Worker registration ────

export function createFinnhubScrapeWorker(): Worker {
  const worker = new Worker<ScrapeFinnhubJobData>(
    "scrape-finnhub",
    processFinnhubScrapeJob,
    {
      connection: getConnection(),
      concurrency: 1,
    }
  );

  worker.on("completed", (job) => {
    log.info({ jobId: job.id }, "Finnhub scrape job completed");
  });

  worker.on("failed", (job, error) => {
    log.error({ err: error, jobId: job?.id }, "Finnhub scrape job failed");
  });

  return worker;
}
