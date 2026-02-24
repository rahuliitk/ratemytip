// src/lib/queue/workers/scrape-telegram-worker.ts
//
// BullMQ worker that processes Telegram channel scraping jobs.
// Fetches messages from tracked channels, stores as raw_posts,
// and enqueues them for NLP parsing.

import { Worker, type Job } from "bullmq";

import { createLogger } from "@/lib/logger";
import { db } from "@/lib/db";
import { TelegramScraper } from "@/lib/scraper/telegram";
import { RateLimiter } from "@/lib/scraper/rate-limiter";
import { parseTipQueue, scrapeTelegramQueue } from "@/lib/queue/queues";

const log = createLogger("worker/scrape-telegram");

// ──── Job payload types ────

interface ScrapeTelegramJobData {
  readonly creatorPlatformId?: string;
  readonly type?: "full-scrape";
  readonly triggeredAt?: string;
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

// ──── Telegram scrape processor ────

async function processTelegramScrapeJob(
  job: Job<ScrapeTelegramJobData>
): Promise<{ postsStored: number; tipsParsed: number }> {
  // Handle full-scrape dispatch: fan out to individual creator jobs
  if (job.data.type === "full-scrape") {
    log.info("Full Telegram scrape triggered, dispatching individual jobs");
    const platforms = await db.creatorPlatform.findMany({
      where: { platform: "TELEGRAM", isActive: true },
      select: { id: true },
      orderBy: { lastScrapedAt: "asc" },
    });

    for (const p of platforms) {
      await scrapeTelegramQueue.add(
        "scrape-creator",
        { creatorPlatformId: p.id },
        { jobId: `telegram-${p.id}-${Date.now()}` }
      );
    }

    log.info({ count: platforms.length }, "Dispatched individual Telegram scrape jobs");
    return { postsStored: 0, tipsParsed: platforms.length };
  }

  const { creatorPlatformId } = job.data;

  if (!creatorPlatformId) {
    log.warn("No creatorPlatformId provided for Telegram scrape, skipping");
    return { postsStored: 0, tipsParsed: 0 };
  }

  const platform = await db.creatorPlatform.findUnique({
    where: { id: creatorPlatformId },
    include: { creator: { select: { id: true, displayName: true } } },
  });

  if (!platform || !platform.isActive) {
    log.warn({ creatorPlatformId }, "Platform not found or inactive");
    return { postsStored: 0, tipsParsed: 0 };
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    log.error("TELEGRAM_BOT_TOKEN not configured");
    return { postsStored: 0, tipsParsed: 0 };
  }

  const rateLimiter = new RateLimiter({ maxRequests: 30, windowMs: 1000 });
  const scraper = new TelegramScraper(botToken, rateLimiter);

  log.info(
    { creatorPlatformId, handle: platform.platformHandle },
    "Starting Telegram scrape"
  );

  let postsStored = 0;
  let tipsParsed = 0;

  try {
    const posts = await scraper.scrapeChannel(platform.platformUserId);

    // Record scrape job
    await db.scrapeJob.create({
      data: {
        platform: "TELEGRAM",
        jobType: "INCREMENTAL",
        status: "RUNNING",
        creatorPlatformId: platform.id,
        startedAt: new Date(),
      },
    });

    for (const post of posts) {
      // Upsert to avoid duplicates
      const rawPost = await db.rawPost.upsert({
        where: {
          creatorPlatformId_platformPostId: {
            creatorPlatformId: platform.id,
            platformPostId: post.platformPostId,
          },
        },
        create: {
          creatorPlatformId: platform.id,
          platformPostId: post.platformPostId,
          content: post.content,
          mediaUrls: [...post.mediaUrls],
          postedAt: post.postedAt,
          metadata: post.metadata ? JSON.parse(JSON.stringify(post.metadata)) : undefined,
        },
        update: {},
        select: { id: true, isParsed: true },
      });

      postsStored++;

      // Enqueue for NLP parsing if not already parsed
      if (!rawPost.isParsed) {
        await parseTipQueue.add(
          "parse-post",
          {
            rawPostId: rawPost.id,
            content: post.content,
            creatorId: platform.creator.id,
          },
          { jobId: `parse-${rawPost.id}` }
        );
        tipsParsed++;
      }
    }

    // Update platform last scraped
    await db.creatorPlatform.update({
      where: { id: platform.id },
      data: { lastScrapedAt: new Date() },
    });

    // Update scrape job as completed
    await db.scrapeJob.updateMany({
      where: { creatorPlatformId: platform.id, status: "RUNNING", platform: "TELEGRAM" },
      data: {
        status: "COMPLETED",
        postsFound: postsStored,
        tipsExtracted: tipsParsed,
        completedAt: new Date(),
      },
    });

    log.info(
      { creatorPlatformId, postsStored, tipsParsed },
      "Telegram scrape complete"
    );
  } catch (error) {
    log.error(
      { creatorPlatformId, error: error instanceof Error ? error.message : String(error) },
      "Telegram scrape failed"
    );

    await db.scrapeJob.updateMany({
      where: { creatorPlatformId: platform.id, status: "RUNNING", platform: "TELEGRAM" },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : String(error),
        completedAt: new Date(),
      },
    });

    throw error;
  }

  return { postsStored, tipsParsed };
}

// ──── Worker factory ────

export function createTelegramScrapeWorker(): Worker {
  const connection = getConnection();

  const worker = new Worker("scrape-telegram", processTelegramScrapeJob, {
    connection,
    concurrency: 2,
  });

  worker.on("completed", (job, result) => {
    log.info(
      { jobId: job?.id, ...result },
      "Telegram scrape job completed"
    );
  });

  worker.on("failed", (job, error) => {
    log.error(
      { jobId: job?.id, error: error.message },
      "Telegram scrape job failed"
    );
  });

  return worker;
}
