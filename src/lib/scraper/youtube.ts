// src/lib/scraper/youtube.ts

import { SCRAPER } from "@/lib/constants";
import { AppError } from "@/lib/errors";
import { containsFinancialKeywords } from "@/lib/parser/templates";

import { RateLimiter } from "./rate-limiter";
import type {
  ScrapedPost,
  ScraperConfig,
  ScrapeError,
  ScrapeResult,
  YouTubeSearchResponse,
  YouTubeVideoDetail,
  YouTubeVideoResponse,
} from "./types";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

/** Default configuration for the YouTube scraper */
const DEFAULT_CONFIG: ScraperConfig = {
  batchSize: SCRAPER.YOUTUBE_BATCH_SIZE,
  maxRetries: SCRAPER.MAX_RETRIES,
  retryDelayMs: SCRAPER.RETRY_DELAY_MS,
};

/**
 * YouTube scraper using Data API v3.
 *
 * Searches for recent videos from tracked channels and extracts tip content
 * from video titles and descriptions.
 *
 * Quota management:
 *   - search.list: 100 units per call
 *   - videos.list: 1 unit per call
 *   With 10,000 daily quota and 500 creators, budget is ~20 units per creator.
 */
export class YouTubeScraper {
  private readonly apiKey: string;
  private readonly rateLimiter: RateLimiter;
  private readonly config: ScraperConfig;

  constructor(
    apiKey: string,
    rateLimiter: RateLimiter,
    config: Partial<ScraperConfig> = {}
  ) {
    this.apiKey = apiKey;
    this.rateLimiter = rateLimiter;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Scrape recent videos from a single YouTube channel.
   *
   * @param channelId - The YouTube channel ID
   * @param publishedAfter - Only return videos published after this date
   * @returns Array of scraped posts with financial content
   */
  async scrapeCreator(
    channelId: string,
    publishedAfter?: Date
  ): Promise<ScrapedPost[]> {
    // Stage 1: Search for recent videos from this channel (100 quota units)
    const searchResults = await this.searchChannelVideos(
      channelId,
      publishedAfter
    );

    if (searchResults.items.length === 0) {
      return [];
    }

    // Pre-filter: only fetch details for videos whose title/description looks financial
    const candidateVideoIds = searchResults.items
      .filter((item) => {
        const combinedText = `${item.snippet.title} ${item.snippet.description}`;
        return containsFinancialKeywords(combinedText);
      })
      .map((item) => item.id.videoId);

    if (candidateVideoIds.length === 0) {
      return [];
    }

    // Stage 2: Fetch full video details for candidates (1 quota unit per batch of 50)
    const videoDetails = await this.fetchVideoDetails(candidateVideoIds);

    // Convert to ScrapedPost format
    const posts: ScrapedPost[] = [];
    for (const video of videoDetails) {
      const post = this.videoToScrapedPost(video);
      if (containsFinancialKeywords(post.content)) {
        posts.push(post);
      }
    }

    return posts;
  }

  /**
   * Scrape multiple channels and return aggregated results.
   */
  async scrapeMany(
    channels: readonly { channelId: string; publishedAfter?: Date }[]
  ): Promise<ScrapeResult> {
    const allPosts: ScrapedPost[] = [];
    const errors: ScrapeError[] = [];

    for (const channel of channels) {
      try {
        const posts = await this.scrapeCreator(
          channel.channelId,
          channel.publishedAfter
        );
        allPosts.push(...posts);
      } catch (error) {
        const scrapeError = this.toScrapeError(error, channel.channelId);
        errors.push(scrapeError);
      }
    }

    return {
      postsFound: allPosts.length,
      tipsExtracted: 0,
      errors,
      posts: allPosts,
    };
  }

  /**
   * Search for recent videos from a channel.
   * Costs 100 quota units per call.
   */
  private async searchChannelVideos(
    channelId: string,
    publishedAfter?: Date
  ): Promise<YouTubeSearchResponse> {
    await this.rateLimiter.waitForSlot();

    const params = new URLSearchParams({
      key: this.apiKey,
      channelId,
      part: "snippet",
      type: "video",
      order: "date",
      maxResults: String(this.config.batchSize),
    });

    if (publishedAfter) {
      params.set("publishedAfter", publishedAfter.toISOString());
    }

    const url = `${YOUTUBE_API_BASE}/search?${params.toString()}`;
    const response = await this.fetchWithRetry<YouTubeSearchResponse>(url);

    // Record 100 units for a search call
    this.rateLimiter.recordRequest();

    return response;
  }

  /**
   * Fetch full video details for a batch of video IDs.
   * Costs 1 quota unit per call (can batch up to 50 IDs).
   */
  private async fetchVideoDetails(
    videoIds: readonly string[]
  ): Promise<readonly YouTubeVideoDetail[]> {
    const allDetails: YouTubeVideoDetail[] = [];
    const batchSize = 50; // YouTube API allows up to 50 IDs per request

    for (let i = 0; i < videoIds.length; i += batchSize) {
      const batchIds = videoIds.slice(i, i + batchSize);

      await this.rateLimiter.waitForSlot();

      const params = new URLSearchParams({
        key: this.apiKey,
        id: batchIds.join(","),
        part: "snippet,statistics,contentDetails",
      });

      const url = `${YOUTUBE_API_BASE}/videos?${params.toString()}`;
      const response = await this.fetchWithRetry<YouTubeVideoResponse>(url);

      this.rateLimiter.recordRequest();
      allDetails.push(...response.items);
    }

    return allDetails;
  }

  /**
   * Make a GET request to the YouTube API with retry logic.
   */
  private async fetchWithRetry<T>(url: string): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });

        if (response.status === 403) {
          const body = await response.text();
          // Check if this is a quota exceeded error
          if (body.includes("quotaExceeded")) {
            throw new AppError(
              "YouTube API daily quota exceeded",
              "YOUTUBE_QUOTA_EXCEEDED",
              403
            );
          }
          throw new AppError(
            `YouTube API forbidden: ${body}`,
            "YOUTUBE_API_FORBIDDEN",
            403
          );
        }

        if (response.status === 429) {
          const backoffMs = this.config.retryDelayMs * Math.pow(2, attempt);
          await this.sleep(backoffMs);
          continue;
        }

        if (!response.ok) {
          const body = await response.text();
          throw new AppError(
            `YouTube API error: ${response.status} ${body}`,
            "YOUTUBE_API_ERROR",
            response.status
          );
        }

        return (await response.json()) as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry quota exceeded errors — they won't resolve with retries
        if (
          error instanceof AppError &&
          error.code === "YOUTUBE_QUOTA_EXCEEDED"
        ) {
          throw error;
        }

        if (attempt < this.config.maxRetries - 1) {
          const backoffMs = this.config.retryDelayMs * Math.pow(2, attempt);
          await this.sleep(backoffMs);
        }
      }
    }

    throw (
      lastError ??
      new AppError(
        "YouTube API request failed after all retries",
        "YOUTUBE_API_EXHAUSTED",
        503
      )
    );
  }

  /**
   * Convert a YouTube video detail into a ScrapedPost.
   *
   * The post content combines title and description, since Indian finfluencers
   * commonly put structured tips in both fields.
   */
  private videoToScrapedPost(video: YouTubeVideoDetail): ScrapedPost {
    // Combine title and description for full content extraction
    const content = `${video.snippet.title}\n\n${video.snippet.description}`;

    return {
      platformPostId: video.id,
      content,
      postedAt: new Date(video.snippet.publishedAt),
      mediaUrls: [`https://www.youtube.com/watch?v=${video.id}`],
      metadata: {
        videoId: video.id,
        title: video.snippet.title,
        viewCount: parseInt(video.statistics.viewCount, 10) || 0,
        likeCount: parseInt(video.statistics.likeCount, 10) || 0,
        commentCount: parseInt(video.statistics.commentCount, 10) || 0,
        duration: video.contentDetails.duration,
        channelTitle: video.snippet.channelTitle,
      },
    };
  }

  /**
   * Convert an unknown caught error into a structured ScrapeError.
   */
  private toScrapeError(error: unknown, context: string): ScrapeError {
    const message =
      error instanceof Error ? error.message : String(error);
    const isRetryable =
      error instanceof AppError
        ? error.statusCode >= 500
        : true;

    return {
      code: "YOUTUBE_SCRAPE_FAILED",
      message: `Failed to scrape channel ${context}: ${message}`,
      retryable: isRetryable,
      timestamp: new Date(),
    };
  }

  /**
   * Sleep for a given number of milliseconds.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
