// src/lib/queue/workers/scrape-yahoo-analyst-worker.ts
//
// BullMQ worker that scrapes Yahoo Finance analyst data for all tracked stocks.
// Stores consensus in AnalystConsensus, individual upgrades as Tips.
// Covers global stocks (including Indian .NS/.BO symbols).

import { Worker, type Job } from "bullmq";

import { createLogger } from "@/lib/logger";
import { db } from "@/lib/db";

const log = createLogger("worker/yahoo-analyst");
import { YahooAnalystScraper } from "@/lib/scraper/yahoo-analyst";
import {
  parseYahooUpgradeDowngrade,
  firmSlug,
} from "@/lib/scraper/yahoo-analyst-parser";
import { createYahooAnalystRateLimiter } from "@/lib/scraper/rate-limiter";
import { calculateTipContentHash } from "@/lib/utils/crypto";
import { YAHOO_ANALYST, TIMEFRAME_EXPIRY_DAYS } from "@/lib/constants";
import { addDays } from "date-fns";

// ──── Job payload type ────

interface ScrapeYahooAnalystJobData {
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

// ──── Brokerage creator cache ────

const firmCache = new Map<
  string,
  { creatorId: string; platformId: string }
>();

async function findOrCreateFirm(
  firmName: string
): Promise<{ creatorId: string; platformId: string }> {
  const slug = firmSlug(firmName);

  const cached = firmCache.get(slug);
  if (cached) return cached;

  let creator = await db.creator.findUnique({
    where: { slug },
    include: { platforms: { where: { platform: "YAHOO_FINANCE" } } },
  });

  if (creator) {
    if (creator.creatorType !== "BROKERAGE") {
      await db.creator.update({
        where: { id: creator.id },
        data: { creatorType: "BROKERAGE" },
      });
    }

    const platform = creator.platforms[0];
    if (platform) {
      const result = { creatorId: creator.id, platformId: platform.id };
      firmCache.set(slug, result);
      return result;
    }

    // Add YAHOO_FINANCE platform
    const newPlatform = await db.creatorPlatform.create({
      data: {
        creatorId: creator.id,
        platform: "YAHOO_FINANCE",
        platformUserId: `yahoo-${slug}`,
        platformHandle: firmName,
        platformUrl: "https://finance.yahoo.com",
      },
    });

    const result = { creatorId: creator.id, platformId: newPlatform.id };
    firmCache.set(slug, result);
    return result;
  }

  // Create new firm
  creator = await db.creator.create({
    data: {
      slug,
      displayName: firmName,
      bio: `${firmName} — Analyst recommendations tracked by RateMyTip via Yahoo Finance`,
      creatorType: "BROKERAGE",
      specializations: ["LONG_TERM", "LARGE_CAP"],
      isVerified: false,
    },
    include: { platforms: { where: { platform: "YAHOO_FINANCE" } } },
  });

  const platform = await db.creatorPlatform.create({
    data: {
      creatorId: creator.id,
      platform: "YAHOO_FINANCE",
      platformUserId: `yahoo-${slug}`,
      platformHandle: firmName,
      platformUrl: "https://finance.yahoo.com",
    },
  });

  const result = { creatorId: creator.id, platformId: platform.id };
  firmCache.set(slug, result);
  return result;
}

// ──── Main job processor ────

async function processYahooAnalystScrapeJob(
  job: Job<ScrapeYahooAnalystJobData>
): Promise<{
  consensusStored: number;
  tipsCreated: number;
  errors: number;
}> {
  log.info({ triggeredAt: job.data.triggeredAt }, "Starting Yahoo Analyst scrape job");

  if (process.env.ENABLE_YAHOO_ANALYST_SCRAPER !== "true") {
    log.info("Yahoo Analyst scraper is disabled via feature flag");
    return { consensusStored: 0, tipsCreated: 0, errors: 0 };
  }

  const rateLimiter = createYahooAnalystRateLimiter();
  const scraper = new YahooAnalystScraper(rateLimiter);

  let consensusStored = 0;
  let tipsCreated = 0;
  let errors = 0;

  try {
    // Fetch all active stocks (not just US — Yahoo covers global)
    const stocks = await db.stock.findMany({
      where: { isActive: true, isIndex: false },
      select: { id: true, symbol: true, exchange: true, lastPrice: true },
    });

    log.info({ stockCount: stocks.length }, "Processing stocks for Yahoo Analyst data");

    const scrapeJob = await db.scrapeJob.create({
      data: {
        platform: "YAHOO_FINANCE",
        jobType: "FULL_SCRAPE",
        status: "RUNNING",
        startedAt: new Date(),
        postsFound: 0,
      },
    });

    for (let i = 0; i < stocks.length; i += YAHOO_ANALYST.SYMBOLS_PER_BATCH) {
      const batch = stocks.slice(i, i + YAHOO_ANALYST.SYMBOLS_PER_BATCH);

      for (const stock of batch) {
        try {
          const data = await scraper.getAnalystData(
            stock.symbol,
            stock.exchange
          );
          if (!data) continue;

          // 1. Store consensus data
          if (data.recommendations.length > 0) {
            const latest = data.recommendations[0];
            if (latest && latest.period) {
              // Parse period like "0m" (current month), "-1m", "-2m"
              const periodDate = new Date();
              const monthOffset = parseInt(latest.period.replace("m", ""), 10);
              if (!isNaN(monthOffset)) {
                periodDate.setMonth(periodDate.getMonth() + monthOffset);
              }

              await db.analystConsensus.upsert({
                where: {
                  stockId_source_period: {
                    stockId: stock.id,
                    source: "YAHOO_FINANCE",
                    period: periodDate,
                  },
                },
                create: {
                  stockId: stock.id,
                  source: "YAHOO_FINANCE",
                  strongBuy: latest.strongBuy,
                  buy: latest.buy,
                  hold: latest.hold,
                  sell: latest.sell,
                  strongSell: latest.strongSell,
                  targetHigh: data.targetHigh,
                  targetLow: data.targetLow,
                  targetMean: data.targetMean,
                  targetMedian: data.targetMedian,
                  numberOfAnalysts: data.numberOfAnalysts,
                  period: periodDate,
                  rawData: JSON.parse(JSON.stringify({ trend: latest, financial: { targetHigh: data.targetHigh, targetLow: data.targetLow, targetMean: data.targetMean } })),
                },
                update: {
                  strongBuy: latest.strongBuy,
                  buy: latest.buy,
                  hold: latest.hold,
                  sell: latest.sell,
                  strongSell: latest.strongSell,
                  targetHigh: data.targetHigh,
                  targetLow: data.targetLow,
                  targetMean: data.targetMean,
                  targetMedian: data.targetMedian,
                  numberOfAnalysts: data.numberOfAnalysts,
                  fetchedAt: new Date(),
                },
              });
              consensusStored++;
            }
          }

          // 2. Process upgrade/downgrade actions (last 30 days only)
          const currentPrice = data.currentPrice ?? stock.lastPrice ?? 0;
          const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

          for (const record of data.upgrades) {
            if (record.epochGradeDate * 1000 < thirtyDaysAgo) continue;

            try {
              const parsedTip = parseYahooUpgradeDowngrade(
                record,
                stock.symbol,
                currentPrice,
                data.targetMean
              );
              if (!parsedTip) continue;

              const { creatorId, platformId } = await findOrCreateFirm(
                record.firm
              );

              const platformPostId =
                `yf-${firmSlug(record.firm)}-${stock.symbol}-${record.epochGradeDate}`
                  .toLowerCase()
                  .replace(/[^a-z0-9-]/g, "-");

              const content = [
                `${record.action.toUpperCase()}: ${record.toGrade} ${stock.symbol}`,
                `Firm: ${record.firm}`,
                `From: ${record.fromGrade} → To: ${record.toGrade}`,
                `Price: $${currentPrice}`,
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
                  postedAt: new Date(record.epochGradeDate * 1000),
                  isParsed: true,
                  isTipContent: true,
                  parseConfidence: YAHOO_ANALYST.CONFIDENCE,
                  metadata: JSON.parse(JSON.stringify({
                    firm: record.firm,
                    action: record.action,
                    fromGrade: record.fromGrade,
                    toGrade: record.toGrade,
                    epochGradeDate: record.epochGradeDate,
                  })),
                },
                update: {},
              });

              const tipTimestamp = new Date(record.epochGradeDate * 1000);
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

              const existingTip = await db.tip.findUnique({
                where: { contentHash },
              });
              if (existingTip) continue;

              const expiryDays =
                TIMEFRAME_EXPIRY_DAYS[parsedTip.timeframe] ?? 365;
              const expiresAt = addDays(tipTimestamp, expiryDays);

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
                  rationale: `${record.firm} ${record.action}: ${record.fromGrade} → ${record.toGrade}`,
                  sourceUrl: `https://finance.yahoo.com/quote/${YahooAnalystScraper.toYahooSymbol(stock.symbol, stock.exchange)}`,
                  contentHash,
                  tipTimestamp,
                  priceAtTip: currentPrice,
                  status: "ACTIVE",
                  reviewStatus: "AUTO_APPROVED",
                  parseConfidence: YAHOO_ANALYST.CONFIDENCE,
                  expiresAt,
                },
              });

              tipsCreated++;

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
              log.error({ err: error instanceof Error ? error : new Error(String(error)), symbol: stock.symbol }, "Error processing Yahoo Analyst upgrade");
            }
          }
        } catch (error) {
          errors++;
          log.error({ err: error instanceof Error ? error : new Error(String(error)), symbol: stock.symbol }, "Error processing Yahoo Analyst stock");
        }
      }

      await job.updateProgress(
        Math.round(((i + batch.length) / stocks.length) * 100)
      );
    }

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

    log.info({ consensusStored, tipsCreated, errors }, "Yahoo Analyst scrape complete");
  } catch (error) {
    log.error({ err: error instanceof Error ? error : new Error(String(error)) }, "Fatal Yahoo Analyst scrape error");
    throw error;
  }

  firmCache.clear();
  return { consensusStored, tipsCreated, errors };
}

// ──── Worker registration ────

export function createYahooAnalystScrapeWorker(): Worker {
  const worker = new Worker<ScrapeYahooAnalystJobData>(
    "scrape-yahoo-analyst",
    processYahooAnalystScrapeJob,
    {
      connection: getConnection(),
      concurrency: 1,
    }
  );

  worker.on("completed", (job) => {
    log.info({ jobId: job.id }, "Yahoo Analyst scrape job completed");
  });

  worker.on("failed", (job, error) => {
    log.error({ err: error, jobId: job?.id }, "Yahoo Analyst scrape job failed");
  });

  return worker;
}
