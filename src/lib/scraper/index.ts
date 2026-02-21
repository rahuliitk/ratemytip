// src/lib/scraper/index.ts

import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";

import {
  createTwitterRateLimiter,
  createYouTubeRateLimiter,
} from "./rate-limiter";
import { TwitterScraper } from "./twitter";
import { YouTubeScraper } from "./youtube";
import type { ScrapedPost, ScrapeResult } from "./types";

/** Platform identifiers matching the Prisma Platform enum */
type Platform = "TWITTER" | "YOUTUBE";

/** Options for running a scrape job */
interface ScrapeJobOptions {
  readonly platform: Platform;
  readonly creatorPlatformId?: string;
  readonly incremental?: boolean;
}

/** Result of storing scraped posts in the database */
interface StoreResult {
  readonly stored: number;
  readonly duplicates: number;
}

/**
 * Scraper orchestrator.
 *
 * Coordinates scraping across platforms, stores raw posts in the database,
 * and returns structured results. Designed to be called by BullMQ workers.
 */

/**
 * Run a scraping job for a single creator on a given platform.
 *
 * @param creatorPlatformId - The ID from the creator_platforms table
 * @returns ScrapeResult with posts found and stored
 */
export async function scrapeCreator(
  creatorPlatformId: string
): Promise<ScrapeResult> {
  const creatorPlatform = await db.creatorPlatform.findUnique({
    where: { id: creatorPlatformId },
    include: { creator: true },
  });

  if (!creatorPlatform) {
    throw new AppError(
      `Creator platform not found: ${creatorPlatformId}`,
      "CREATOR_PLATFORM_NOT_FOUND",
      404
    );
  }

  let posts: ScrapedPost[];

  if (creatorPlatform.platform === "TWITTER") {
    posts = await scrapeTwitterCreator(
      creatorPlatform.platformUserId,
      creatorPlatform.lastScrapedAt
    );
  } else if (creatorPlatform.platform === "YOUTUBE") {
    posts = await scrapeYouTubeCreator(
      creatorPlatform.platformUserId,
      creatorPlatform.lastScrapedAt
    );
  } else {
    throw new AppError(
      `Unsupported platform: ${creatorPlatform.platform}`,
      "UNSUPPORTED_PLATFORM",
      400
    );
  }

  // Store raw posts in database
  const storeResult = await storeRawPosts(creatorPlatform.id, posts);

  // Update last scraped timestamp
  await db.creatorPlatform.update({
    where: { id: creatorPlatformId },
    data: { lastScrapedAt: new Date() },
  });

  return {
    postsFound: posts.length,
    tipsExtracted: 0, // Tips are extracted in the parser pipeline
    errors: [],
    posts,
  };
}

/**
 * Run a full or incremental scrape for all creators on a given platform.
 *
 * @param options - Platform and whether to run incremental scraping
 * @returns Array of individual scrape results per creator
 */
export async function scrapeAllCreators(
  options: ScrapeJobOptions
): Promise<readonly ScrapeResult[]> {
  const whereClause: Record<string, unknown> = {
    platform: options.platform,
    isActive: true,
  };

  if (options.creatorPlatformId) {
    whereClause.id = options.creatorPlatformId;
  }

  const creatorPlatforms = await db.creatorPlatform.findMany({
    where: whereClause,
    include: { creator: true },
    orderBy: { lastScrapedAt: "asc" }, // Prioritize least-recently scraped
  });

  const results: ScrapeResult[] = [];

  for (const cp of creatorPlatforms) {
    try {
      const result = await scrapeCreator(cp.id);
      results.push(result);
    } catch (error) {
      // Log the error but continue with other creators
      const message = error instanceof Error ? error.message : String(error);
      results.push({
        postsFound: 0,
        tipsExtracted: 0,
        errors: [
          {
            code: `${options.platform}_SCRAPE_FAILED`,
            message: `Failed to scrape ${cp.platformHandle}: ${message}`,
            retryable: true,
            timestamp: new Date(),
          },
        ],
        posts: [],
      });
    }
  }

  return results;
}

// ──── Internal helpers ────

/**
 * Scrape a single Twitter user's recent tweets.
 */
async function scrapeTwitterCreator(
  platformUserId: string,
  lastScrapedAt: Date | null
): Promise<ScrapedPost[]> {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  if (!bearerToken) {
    throw new AppError(
      "TWITTER_BEARER_TOKEN not configured",
      "MISSING_CONFIG",
      500
    );
  }

  const rateLimiter = createTwitterRateLimiter();
  const scraper = new TwitterScraper(bearerToken, rateLimiter);

  // For incremental scraping, we could pass sinceId if we tracked it.
  // For now, we rely on deduplication in storeRawPosts.
  return scraper.scrapeCreator(platformUserId);
}

/**
 * Scrape a single YouTube channel's recent videos.
 */
async function scrapeYouTubeCreator(
  channelId: string,
  lastScrapedAt: Date | null
): Promise<ScrapedPost[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new AppError(
      "YOUTUBE_API_KEY not configured",
      "MISSING_CONFIG",
      500
    );
  }

  const rateLimiter = createYouTubeRateLimiter();
  const scraper = new YouTubeScraper(apiKey, rateLimiter);

  return scraper.scrapeCreator(
    channelId,
    lastScrapedAt ?? undefined
  );
}

/**
 * Store scraped posts in the raw_posts table.
 * Skips duplicates (same platformPostId for the same creatorPlatformId).
 */
async function storeRawPosts(
  creatorPlatformId: string,
  posts: readonly ScrapedPost[]
): Promise<StoreResult> {
  let stored = 0;
  let duplicates = 0;

  for (const post of posts) {
    try {
      await db.rawPost.create({
        data: {
          creatorPlatformId,
          platformPostId: post.platformPostId,
          content: post.content,
          mediaUrls: [...post.mediaUrls],
          postedAt: post.postedAt,
          scrapedAt: new Date(),
          isParsed: false,
          isTipContent: null,
          parseConfidence: null,
          metadata: post.metadata ? JSON.parse(JSON.stringify(post.metadata)) : undefined,
        },
      });
      stored++;
    } catch (error) {
      // Prisma unique constraint violation (P2002) means it's a duplicate
      if (isPrismaUniqueConstraintError(error)) {
        duplicates++;
      } else {
        throw error;
      }
    }
  }

  return { stored, duplicates };
}

/**
 * Check if a Prisma error is a unique constraint violation (P2002).
 */
function isPrismaUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  );
}
