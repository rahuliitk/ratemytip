// src/lib/queue/workers/scrape-worker.ts
//
// BullMQ worker that processes Twitter and YouTube scraping jobs.
// For each creator platform, fetches new posts since the last scrape,
// stores them as raw_posts, and enqueues them for NLP parsing.

import { Worker, type Job } from "bullmq";

import { db } from "@/lib/db";
import { TwitterScraper } from "@/lib/scraper/twitter";
import { YouTubeScraper } from "@/lib/scraper/youtube";
import {
  createTwitterRateLimiter,
  createYouTubeRateLimiter,
} from "@/lib/scraper/rate-limiter";
import { parseTipQueue, scrapeTwitterQueue, scrapeYoutubeQueue } from "@/lib/queue/queues";

// ──── Job payload types ────

interface ScrapeTwitterJobData {
  readonly creatorPlatformId?: string;
  readonly sinceId?: string;
  readonly type?: "full-scrape";
  readonly triggeredAt?: string;
}

interface ScrapeYoutubeJobData {
  readonly creatorPlatformId?: string;
  readonly publishedAfter?: string;
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

// ──── Twitter scrape processor ────

async function processTwitterScrapeJob(
  job: Job<ScrapeTwitterJobData>
): Promise<{ postsStored: number; tipsParsed: number }> {
  // Handle full-scrape dispatch: fan out to individual creator jobs
  if (job.data.type === "full-scrape") {
    console.log("[ScrapeWorker:Twitter] Full scrape triggered, dispatching individual jobs...");
    const platforms = await db.creatorPlatform.findMany({
      where: { platform: "TWITTER", isActive: true },
      select: { id: true },
      orderBy: { lastScrapedAt: "asc" },
    });

    for (const p of platforms) {
      await scrapeTwitterQueue.add(
        "scrape-creator",
        { creatorPlatformId: p.id },
        { jobId: `twitter-${p.id}-${Date.now()}` }
      );
    }

    console.log(`[ScrapeWorker:Twitter] Dispatched ${platforms.length} individual scrape jobs`);
    return { postsStored: 0, tipsParsed: platforms.length };
  }

  const { creatorPlatformId, sinceId } = job.data;

  if (!creatorPlatformId) {
    console.warn("[ScrapeWorker:Twitter] No creatorPlatformId provided, skipping");
    return { postsStored: 0, tipsParsed: 0 };
  }

  console.log(
    `[ScrapeWorker:Twitter] Processing job for platform ${creatorPlatformId}`
  );

  // Look up the creator platform record
  const platform = await db.creatorPlatform.findUnique({
    where: { id: creatorPlatformId },
    include: { creator: true },
  });

  if (!platform || !platform.isActive) {
    console.warn(
      `[ScrapeWorker:Twitter] Platform ${creatorPlatformId} not found or inactive`
    );
    return { postsStored: 0, tipsParsed: 0 };
  }

  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  if (!bearerToken) {
    throw new Error("TWITTER_BEARER_TOKEN environment variable is not set");
  }

  const rateLimiter = createTwitterRateLimiter();
  const scraper = new TwitterScraper(bearerToken, rateLimiter);

  // Scrape tweets since the last known tweet ID
  const effectiveSinceId = sinceId ?? undefined;
  const posts = await scraper.scrapeCreator(
    platform.platformUserId,
    effectiveSinceId
  );

  console.log(
    `[ScrapeWorker:Twitter] Found ${posts.length} new posts for ${platform.platformHandle}`
  );

  let postsStored = 0;
  let tipsParsed = 0;

  for (const post of posts) {
    try {
      // Upsert raw post (avoid duplicates)
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
        update: {}, // Do not overwrite existing records
      });

      postsStored++;

      // Enqueue for NLP parsing if not already parsed
      if (!rawPost.isParsed) {
        await parseTipQueue.add(
          "parse-post",
          {
            rawPostId: rawPost.id,
            content: rawPost.content,
            creatorId: platform.creatorId,
          },
          { jobId: `parse-${rawPost.id}` }
        );
        tipsParsed++;
      }
    } catch (error) {
      console.error(
        `[ScrapeWorker:Twitter] Failed to store post ${post.platformPostId}:`,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  // Update last scraped timestamp
  await db.creatorPlatform.update({
    where: { id: platform.id },
    data: { lastScrapedAt: new Date() },
  });

  // Record scrape job in the database
  await db.scrapeJob.create({
    data: {
      platform: "TWITTER",
      jobType: sinceId ? "INCREMENTAL" : "FULL_SCRAPE",
      status: "COMPLETED",
      creatorPlatformId: platform.id,
      postsFound: posts.length,
      tipsExtracted: tipsParsed,
      startedAt: new Date(job.processedOn ?? Date.now()),
      completedAt: new Date(),
    },
  });

  console.log(
    `[ScrapeWorker:Twitter] Completed: ${postsStored} stored, ${tipsParsed} enqueued for parsing`
  );

  return { postsStored, tipsParsed };
}

// ──── YouTube scrape processor ────

async function processYoutubeScrapeJob(
  job: Job<ScrapeYoutubeJobData>
): Promise<{ postsStored: number; tipsParsed: number }> {
  // Handle full-scrape dispatch: fan out to individual creator jobs
  if (job.data.type === "full-scrape") {
    console.log("[ScrapeWorker:YouTube] Full scrape triggered, dispatching individual jobs...");
    const platforms = await db.creatorPlatform.findMany({
      where: { platform: "YOUTUBE", isActive: true },
      select: { id: true },
      orderBy: { lastScrapedAt: "asc" },
    });

    for (const p of platforms) {
      await scrapeYoutubeQueue.add(
        "scrape-creator",
        { creatorPlatformId: p.id },
        { jobId: `youtube-${p.id}-${Date.now()}` }
      );
    }

    console.log(`[ScrapeWorker:YouTube] Dispatched ${platforms.length} individual scrape jobs`);
    return { postsStored: 0, tipsParsed: platforms.length };
  }

  const { creatorPlatformId, publishedAfter } = job.data;

  if (!creatorPlatformId) {
    console.warn("[ScrapeWorker:YouTube] No creatorPlatformId provided, skipping");
    return { postsStored: 0, tipsParsed: 0 };
  }

  console.log(
    `[ScrapeWorker:YouTube] Processing job for platform ${creatorPlatformId}`
  );

  const platform = await db.creatorPlatform.findUnique({
    where: { id: creatorPlatformId },
    include: { creator: true },
  });

  if (!platform || !platform.isActive) {
    console.warn(
      `[ScrapeWorker:YouTube] Platform ${creatorPlatformId} not found or inactive`
    );
    return { postsStored: 0, tipsParsed: 0 };
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY environment variable is not set");
  }

  const rateLimiter = createYouTubeRateLimiter();
  const scraper = new YouTubeScraper(apiKey, rateLimiter);

  const afterDate = publishedAfter ? new Date(publishedAfter) : undefined;
  const posts = await scraper.scrapeCreator(
    platform.platformUserId,
    afterDate
  );

  console.log(
    `[ScrapeWorker:YouTube] Found ${posts.length} new posts for ${platform.platformHandle}`
  );

  let postsStored = 0;
  let tipsParsed = 0;

  for (const post of posts) {
    try {
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
      });

      postsStored++;

      if (!rawPost.isParsed) {
        await parseTipQueue.add(
          "parse-post",
          {
            rawPostId: rawPost.id,
            content: rawPost.content,
            creatorId: platform.creatorId,
          },
          { jobId: `parse-${rawPost.id}` }
        );
        tipsParsed++;
      }
    } catch (error) {
      console.error(
        `[ScrapeWorker:YouTube] Failed to store post ${post.platformPostId}:`,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  await db.creatorPlatform.update({
    where: { id: platform.id },
    data: { lastScrapedAt: new Date() },
  });

  await db.scrapeJob.create({
    data: {
      platform: "YOUTUBE",
      jobType: publishedAfter ? "INCREMENTAL" : "FULL_SCRAPE",
      status: "COMPLETED",
      creatorPlatformId: platform.id,
      postsFound: posts.length,
      tipsExtracted: tipsParsed,
      startedAt: new Date(job.processedOn ?? Date.now()),
      completedAt: new Date(),
    },
  });

  console.log(
    `[ScrapeWorker:YouTube] Completed: ${postsStored} stored, ${tipsParsed} enqueued for parsing`
  );

  return { postsStored, tipsParsed };
}

// ──── Worker registration ────

/**
 * Create and return the Twitter scrape worker.
 * Processes jobs from the "scrape-twitter" queue with concurrency 2.
 */
export function createTwitterScrapeWorker(): Worker {
  const worker = new Worker<ScrapeTwitterJobData>(
    "scrape-twitter",
    processTwitterScrapeJob,
    {
      connection: getConnection(),
      concurrency: 2,
    }
  );

  worker.on("completed", (job) => {
    console.log(`[ScrapeWorker:Twitter] Job ${job.id} completed`);
  });

  worker.on("failed", (job, error) => {
    console.error(
      `[ScrapeWorker:Twitter] Job ${job?.id} failed:`,
      error.message
    );
  });

  return worker;
}

/**
 * Create and return the YouTube scrape worker.
 * Processes jobs from the "scrape-youtube" queue with concurrency 2.
 */
export function createYoutubeScrapeWorker(): Worker {
  const worker = new Worker<ScrapeYoutubeJobData>(
    "scrape-youtube",
    processYoutubeScrapeJob,
    {
      connection: getConnection(),
      concurrency: 2,
    }
  );

  worker.on("completed", (job) => {
    console.log(`[ScrapeWorker:YouTube] Job ${job.id} completed`);
  });

  worker.on("failed", (job, error) => {
    console.error(
      `[ScrapeWorker:YouTube] Job ${job?.id} failed:`,
      error.message
    );
  });

  return worker;
}
