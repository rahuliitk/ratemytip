// src/lib/queue/index.ts
//
// Queue barrel export and helper functions for enqueuing jobs.
// Other parts of the application should import from this file
// rather than directly from queues.ts.

export {
  scrapeTwitterQueue,
  scrapeYoutubeQueue,
  parseTipQueue,
  updatePricesQueue,
  calculateScoresQueue,
  checkExpirationsQueue,
  dailySnapshotQueue,
  scrapeMoneycontrolQueue,
} from "./queues";

import {
  scrapeTwitterQueue,
  scrapeYoutubeQueue,
  parseTipQueue,
  calculateScoresQueue,
  scrapeMoneycontrolQueue,
} from "./queues";

/**
 * Enqueue a Twitter scraping job for a specific creator platform.
 *
 * @param creatorPlatformId - The creator_platforms record ID
 * @param sinceId - Optional tweet ID to scrape incrementally from
 * @returns The BullMQ job object
 */
export async function enqueueScrapeTwitter(
  creatorPlatformId: string,
  sinceId?: string
): Promise<void> {
  await scrapeTwitterQueue.add(
    "scrape-creator",
    { creatorPlatformId, sinceId },
    { jobId: `twitter-${creatorPlatformId}-${Date.now()}` }
  );
}

/**
 * Enqueue a YouTube scraping job for a specific creator platform.
 *
 * @param creatorPlatformId - The creator_platforms record ID
 * @param publishedAfter - Optional ISO date to scrape incrementally from
 * @returns The BullMQ job object
 */
export async function enqueueScrapeYoutube(
  creatorPlatformId: string,
  publishedAfter?: string
): Promise<void> {
  await scrapeYoutubeQueue.add(
    "scrape-creator",
    { creatorPlatformId, publishedAfter },
    { jobId: `youtube-${creatorPlatformId}-${Date.now()}` }
  );
}

/**
 * Enqueue a raw post for NLP tip parsing.
 *
 * @param rawPostId - The raw_posts record ID
 * @param content - The raw text content to parse
 * @param creatorId - The creator who authored the post
 */
export async function enqueueParseRawPost(
  rawPostId: string,
  content: string,
  creatorId: string
): Promise<void> {
  await parseTipQueue.add(
    "parse-post",
    { rawPostId, content, creatorId },
    { jobId: `parse-${rawPostId}` }
  );
}

/**
 * Enqueue a score recalculation job for a specific creator.
 *
 * @param creatorId - The creator ID to recalculate scores for
 */
export async function enqueueScoreRecalculation(
  creatorId: string
): Promise<void> {
  await calculateScoresQueue.add(
    "recalculate-creator",
    { creatorId },
    { jobId: `score-${creatorId}-${Date.now()}` }
  );
}

/**
 * Enqueue a batch score recalculation for all active creators.
 * Used by the daily cron job after market close.
 */
export async function enqueueFullScoreRecalculation(): Promise<void> {
  await calculateScoresQueue.add(
    "recalculate-all",
    { type: "full" },
    { jobId: `score-full-${Date.now()}` }
  );
}

/**
 * Enqueue a MoneyControl scraping job.
 *
 * @param type - The scrape type: "full-scrape" for all pages, "incremental" for latest only
 */
export async function enqueueScrapeMoneycontrol(
  type: "full-scrape" | "incremental" = "full-scrape"
): Promise<void> {
  await scrapeMoneycontrolQueue.add(
    "scrape-moneycontrol",
    { type, triggeredAt: new Date().toISOString() },
    { jobId: `moneycontrol-${type}-${Date.now()}` }
  );
}
