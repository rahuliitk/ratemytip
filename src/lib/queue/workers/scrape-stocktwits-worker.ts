// src/lib/queue/workers/scrape-stocktwits-worker.ts
//
// BullMQ worker that scrapes StockTwits community posts for tracked symbols.
// Unlike Finnhub/Yahoo, StockTwits messages are unstructured — they go through
// the existing NLP pipeline (like Twitter posts).
//
// For each tracked US stock:
//   1. Fetch recent messages from StockTwits symbol stream
//   2. For high-follower users (>1000), auto-create as Creator
//   3. Store as RawPost entries
//   4. Enqueue for NLP parsing via parseTipQueue

import { Worker, type Job } from "bullmq";

import { db } from "@/lib/db";
import { StockTwitsScraper } from "@/lib/scraper/stocktwits";
import { createStockTwitsRateLimiter } from "@/lib/scraper/rate-limiter";
import { STOCKTWITS } from "@/lib/constants";
import { parseTipQueue } from "@/lib/queue/queues";

// ──── Job payload type ────

interface ScrapeStockTwitsJobData {
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

// ──── User/Creator cache ────

const userCache = new Map<
  number,
  { creatorId: string; platformId: string }
>();

/**
 * Find or create a StockTwits user as a Creator.
 * Only creates Creators for users with sufficient followers.
 */
async function findOrCreateStockTwitsUser(
  userId: number,
  username: string,
  displayName: string,
  followers: number
): Promise<{ creatorId: string; platformId: string } | null> {
  // Only track users with enough followers
  if (!StockTwitsScraper.isTrackableUser(followers)) return null;

  const cached = userCache.get(userId);
  if (cached) return cached;

  const slug = `st-${username.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  let creator = await db.creator.findUnique({
    where: { slug },
    include: { platforms: { where: { platform: "STOCKTWITS" } } },
  });

  if (creator) {
    const platform = creator.platforms[0];
    if (platform) {
      const result = { creatorId: creator.id, platformId: platform.id };
      userCache.set(userId, result);
      return result;
    }

    // Add STOCKTWITS platform
    const newPlatform = await db.creatorPlatform.create({
      data: {
        creatorId: creator.id,
        platform: "STOCKTWITS",
        platformUserId: String(userId),
        platformHandle: username,
        platformUrl: `https://stocktwits.com/${username}`,
        followerCount: followers,
      },
    });

    const result = { creatorId: creator.id, platformId: newPlatform.id };
    userCache.set(userId, result);
    return result;
  }

  // Create new user
  creator = await db.creator.create({
    data: {
      slug,
      displayName: displayName || username,
      bio: `StockTwits user @${username} with ${followers.toLocaleString()} followers`,
      creatorType: "INDIVIDUAL",
      specializations: ["SWING", "US_EQUITIES"],
      followerCount: followers,
    },
    include: { platforms: { where: { platform: "STOCKTWITS" } } },
  });

  const platform = await db.creatorPlatform.create({
    data: {
      creatorId: creator.id,
      platform: "STOCKTWITS",
      platformUserId: String(userId),
      platformHandle: username,
      platformUrl: `https://stocktwits.com/${username}`,
      followerCount: followers,
    },
  });

  const result = { creatorId: creator.id, platformId: platform.id };
  userCache.set(userId, result);
  return result;
}

// ──── Main job processor ────

async function processStockTwitsScrapeJob(
  job: Job<ScrapeStockTwitsJobData>
): Promise<{
  postsStored: number;
  parsedEnqueued: number;
  creatorsCreated: number;
  errors: number;
}> {
  console.log(
    `[StockTwitsWorker] Starting scrape job (triggered: ${job.data.triggeredAt})`
  );

  if (process.env.ENABLE_STOCKTWITS_SCRAPER !== "true") {
    console.log(
      "[StockTwitsWorker] StockTwits scraper is disabled via feature flag"
    );
    return { postsStored: 0, parsedEnqueued: 0, creatorsCreated: 0, errors: 0 };
  }

  const rateLimiter = createStockTwitsRateLimiter();
  const scraper = new StockTwitsScraper(rateLimiter);

  let postsStored = 0;
  let parsedEnqueued = 0;
  let creatorsCreated = 0;
  let errors = 0;

  try {
    // Fetch US stocks only (StockTwits primarily covers US equities)
    const stocks = await db.stock.findMany({
      where: {
        isActive: true,
        exchange: { in: ["NYSE", "NASDAQ"] },
        isIndex: false,
      },
      select: { id: true, symbol: true },
    });

    console.log(
      `[StockTwitsWorker] Fetching messages for ${stocks.length} US stocks`
    );

    const scrapeJob = await db.scrapeJob.create({
      data: {
        platform: "STOCKTWITS",
        jobType: "FULL_SCRAPE",
        status: "RUNNING",
        startedAt: new Date(),
        postsFound: 0,
      },
    });

    for (let i = 0; i < stocks.length; i++) {
      const stock = stocks[i];
      if (!stock) continue;

      try {
        const messages = await scraper.getSymbolStream(stock.symbol);

        for (const msg of messages) {
          try {
            // Find or create user as creator (only if high follower count)
            const userResult = await findOrCreateStockTwitsUser(
              msg.userId,
              msg.username,
              msg.displayName,
              msg.followers
            );

            if (!userResult) continue; // User below follower threshold

            const platformPostId = `st-${msg.messageId}`;

            // Store as RawPost (upsert to avoid duplicates)
            const rawPost = await db.rawPost.upsert({
              where: {
                creatorPlatformId_platformPostId: {
                  creatorPlatformId: userResult.platformId,
                  platformPostId,
                },
              },
              create: {
                creatorPlatformId: userResult.platformId,
                platformPostId,
                content: msg.body,
                postedAt: msg.createdAt,
                isParsed: false,
                isTipContent: null, // Will be classified by NLP parser
                metadata: JSON.parse(JSON.stringify({
                  messageId: msg.messageId,
                  sentiment: msg.sentiment,
                  userId: msg.userId,
                  username: msg.username,
                  followers: msg.followers,
                  likes: msg.likes,
                })),
              },
              update: {},
            });

            postsStored++;

            // Enqueue for NLP parsing (only new posts — isParsed is false)
            if (!rawPost.isParsed) {
              await parseTipQueue.add(
                "parse-post",
                {
                  rawPostId: rawPost.id,
                  content: msg.body,
                  creatorId: userResult.creatorId,
                },
                { jobId: `parse-${rawPost.id}` }
              );
              parsedEnqueued++;
            }
          } catch (error) {
            if (
              error instanceof Error &&
              error.message.includes("Unique constraint")
            ) {
              continue;
            }
            errors++;
            console.error(
              `[StockTwitsWorker] Error processing message ${msg.messageId}:`,
              error instanceof Error ? error.message : String(error)
            );
          }
        }
      } catch (error) {
        errors++;
        console.error(
          `[StockTwitsWorker] Error fetching ${stock.symbol}:`,
          error instanceof Error ? error.message : String(error)
        );
      }

      // Report progress
      if (i % 10 === 0) {
        await job.updateProgress(
          Math.round(((i + 1) / stocks.length) * 100)
        );
      }
    }

    await db.scrapeJob.update({
      where: { id: scrapeJob.id },
      data: {
        status: errors > 0 && postsStored === 0 ? "FAILED" : "COMPLETED",
        completedAt: new Date(),
        postsFound: postsStored,
        tipsExtracted: parsedEnqueued,
        errorMessage: errors > 0 ? `${errors} errors during processing` : null,
      },
    });

    console.log(
      `[StockTwitsWorker] Scrape complete: ${postsStored} posts, ${parsedEnqueued} enqueued for parsing, ${creatorsCreated} new creators, ${errors} errors`
    );
  } catch (error) {
    console.error(
      "[StockTwitsWorker] Fatal scrape error:",
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }

  userCache.clear();
  return { postsStored, parsedEnqueued, creatorsCreated, errors };
}

// ──── Worker registration ────

export function createStockTwitsScrapeWorker(): Worker {
  const worker = new Worker<ScrapeStockTwitsJobData>(
    "scrape-stocktwits",
    processStockTwitsScrapeJob,
    {
      connection: getConnection(),
      concurrency: 1,
    }
  );

  worker.on("completed", (job) => {
    console.log(`[StockTwitsWorker] Job ${job.id} completed`);
  });

  worker.on("failed", (job, error) => {
    console.error(
      `[StockTwitsWorker] Job ${job?.id} failed:`,
      error.message
    );
  });

  return worker;
}
