// src/lib/scraper/twitter.ts

import { SCRAPER } from "@/lib/constants";
import { AppError } from "@/lib/errors";
import { containsFinancialKeywords } from "@/lib/parser/templates";

import { RateLimiter } from "./rate-limiter";
import type {
  ScrapedPost,
  ScraperConfig,
  ScrapeError,
  ScrapeResult,
  TwitterApiResponse,
  TwitterTweetData,
} from "./types";

const TWITTER_API_BASE = "https://api.twitter.com/2";

/** Default configuration for the Twitter scraper */
const DEFAULT_CONFIG: ScraperConfig = {
  batchSize: SCRAPER.TWITTER_BATCH_SIZE,
  maxRetries: SCRAPER.MAX_RETRIES,
  retryDelayMs: SCRAPER.RETRY_DELAY_MS,
};

/**
 * Twitter/X scraper using API v2 with Bearer Token authentication.
 *
 * Fetches recent tweets from tracked creators, filters for financial content,
 * and returns structured ScrapedPost objects ready for NLP parsing.
 */
export class TwitterScraper {
  private readonly bearerToken: string;
  private readonly rateLimiter: RateLimiter;
  private readonly config: ScraperConfig;

  constructor(
    bearerToken: string,
    rateLimiter: RateLimiter,
    config: Partial<ScraperConfig> = {}
  ) {
    this.bearerToken = bearerToken;
    this.rateLimiter = rateLimiter;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Scrape recent tweets from a single creator.
   *
   * @param platformUserId - The Twitter user ID (numeric string)
   * @param sinceId - Only return tweets newer than this tweet ID (for incremental scraping)
   * @returns Array of scraped posts containing financial content
   */
  async scrapeCreator(
    platformUserId: string,
    sinceId?: string
  ): Promise<ScrapedPost[]> {
    const allPosts: ScrapedPost[] = [];
    let nextToken: string | undefined;
    let pagesProcessed = 0;
    const maxPages = 10; // Safety limit to avoid infinite pagination

    do {
      const tweets = await this.fetchTweetsPage(
        platformUserId,
        sinceId,
        nextToken
      );

      if (tweets.data) {
        for (const tweet of tweets.data) {
          if (this.shouldProcessTweet(tweet)) {
            const post = this.tweetToScrapedPost(tweet);
            if (containsFinancialKeywords(post.content)) {
              allPosts.push(post);
            }
          }
        }
      }

      nextToken = tweets.meta?.next_token;
      pagesProcessed++;
    } while (nextToken && pagesProcessed < maxPages);

    return allPosts;
  }

  /**
   * Scrape multiple creators and return aggregated results.
   *
   * @param creators - Array of objects with platformUserId and optional sinceId
   * @returns Aggregated scrape results with errors per creator
   */
  async scrapeMany(
    creators: readonly { platformUserId: string; sinceId?: string }[]
  ): Promise<ScrapeResult> {
    const allPosts: ScrapedPost[] = [];
    const errors: ScrapeError[] = [];

    for (const creator of creators) {
      try {
        const posts = await this.scrapeCreator(
          creator.platformUserId,
          creator.sinceId
        );
        allPosts.push(...posts);
      } catch (error) {
        const scrapeError = this.toScrapeError(error, creator.platformUserId);
        errors.push(scrapeError);
      }
    }

    return {
      postsFound: allPosts.length,
      tipsExtracted: 0, // Tip extraction happens in the parser pipeline
      errors,
      posts: allPosts,
    };
  }

  /**
   * Fetch a single page of tweets from the Twitter API.
   */
  private async fetchTweetsPage(
    userId: string,
    sinceId?: string,
    paginationToken?: string
  ): Promise<TwitterApiResponse> {
    await this.rateLimiter.waitForSlot();

    const params = new URLSearchParams({
      "tweet.fields": "created_at,text,public_metrics,entities,referenced_tweets",
      max_results: String(this.config.batchSize),
    });

    if (sinceId) {
      params.set("since_id", sinceId);
    }
    if (paginationToken) {
      params.set("pagination_token", paginationToken);
    }

    const url = `${TWITTER_API_BASE}/users/${userId}/tweets?${params.toString()}`;
    const response = await this.fetchWithRetry(url);

    this.rateLimiter.recordRequest();
    return response;
  }

  /**
   * Make a GET request to the Twitter API with retry logic.
   */
  private async fetchWithRetry(url: string): Promise<TwitterApiResponse> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.bearerToken}`,
            "Content-Type": "application/json",
          },
        });

        if (response.status === 429) {
          // Rate limited by Twitter — extract retry-after or use exponential backoff
          const retryAfter = response.headers.get("retry-after");
          const waitMs = retryAfter
            ? parseInt(retryAfter, 10) * 1000
            : this.config.retryDelayMs * Math.pow(2, attempt);
          await this.sleep(waitMs);
          continue;
        }

        if (!response.ok) {
          const body = await response.text();
          throw new AppError(
            `Twitter API error: ${response.status} ${body}`,
            "TWITTER_API_ERROR",
            response.status
          );
        }

        return (await response.json()) as TwitterApiResponse;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.config.maxRetries - 1) {
          const backoffMs = this.config.retryDelayMs * Math.pow(2, attempt);
          await this.sleep(backoffMs);
        }
      }
    }

    throw (
      lastError ??
      new AppError(
        "Twitter API request failed after all retries",
        "TWITTER_API_EXHAUSTED",
        503
      )
    );
  }

  /**
   * Determine whether a tweet should be processed.
   *
   * Rules:
   * - Skip pure retweets (they appear as referenced_tweets with type "retweeted")
   * - Keep quote tweets (they have original commentary)
   * - Skip plain replies to other users (keep self-replies / threads)
   */
  private shouldProcessTweet(tweet: TwitterTweetData): boolean {
    if (!tweet.referenced_tweets) {
      return true; // Original tweet — always process
    }

    const isRetweet = tweet.referenced_tweets.some(
      (ref) => ref.type === "retweeted"
    );
    if (isRetweet) {
      return false; // Pure retweet — skip
    }

    // Quote tweets are fine (creator added their own text)
    const isQuoteTweet = tweet.referenced_tweets.some(
      (ref) => ref.type === "quoted"
    );
    if (isQuoteTweet) {
      return true;
    }

    // Replies: we keep them because many Indian finfluencers post tips as threads
    // The parser will determine if the content is tip-worthy
    return true;
  }

  /**
   * Convert a Twitter API tweet object into a ScrapedPost.
   */
  private tweetToScrapedPost(tweet: TwitterTweetData): ScrapedPost {
    const hashtags =
      tweet.entities?.hashtags?.map((h) => h.tag) ?? [];
    const mentions =
      tweet.entities?.mentions?.map((m) => m.username) ?? [];
    const isQuoteTweet =
      tweet.referenced_tweets?.some((ref) => ref.type === "quoted") ?? false;

    return {
      platformPostId: tweet.id,
      content: tweet.text,
      postedAt: new Date(tweet.created_at),
      mediaUrls: [], // Media URLs require additional expansion fields
      metadata: {
        retweetCount: tweet.public_metrics.retweet_count,
        likeCount: tweet.public_metrics.like_count,
        replyCount: tweet.public_metrics.reply_count,
        quoteCount: tweet.public_metrics.quote_count,
        hashtags,
        mentions,
        isQuoteTweet,
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
        ? error.statusCode === 429 || error.statusCode >= 500
        : true;

    return {
      code: "TWITTER_SCRAPE_FAILED",
      message: `Failed to scrape user ${context}: ${message}`,
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
