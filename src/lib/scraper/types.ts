// src/lib/scraper/types.ts

/** Metadata specific to a Twitter post */
interface TwitterPostMetadata {
  readonly retweetCount: number;
  readonly likeCount: number;
  readonly replyCount: number;
  readonly quoteCount: number;
  readonly hashtags: readonly string[];
  readonly mentions: readonly string[];
  readonly isQuoteTweet: boolean;
}

/** Metadata specific to a YouTube video */
interface YouTubePostMetadata {
  readonly videoId: string;
  readonly title: string;
  readonly viewCount: number;
  readonly likeCount: number;
  readonly commentCount: number;
  readonly duration: string;
  readonly channelTitle: string;
}

/** Metadata specific to a MoneyControl brokerage recommendation */
export interface MoneyControlPostMetadata {
  readonly brokerageName: string;
  readonly recommendationType: string;
  readonly targetPrice: number;
  readonly currentPrice: number;
  readonly upsidePct: number;
  readonly reportDate?: string;
}

/** Union of platform-specific metadata */
export type PlatformMetadata = TwitterPostMetadata | YouTubePostMetadata | MoneyControlPostMetadata;

/** A single scraped post from any platform, before NLP parsing */
export interface ScrapedPost {
  readonly platformPostId: string;
  readonly content: string;
  readonly postedAt: Date;
  readonly mediaUrls: readonly string[];
  readonly metadata: PlatformMetadata;
}

/** Result summary of a scraping run for a single creator */
export interface ScrapeResult {
  readonly postsFound: number;
  readonly tipsExtracted: number;
  readonly errors: readonly ScrapeError[];
  readonly posts: readonly ScrapedPost[];
}

/** Structured scraper error for logging and retry decisions */
export interface ScrapeError {
  readonly code: string;
  readonly message: string;
  readonly retryable: boolean;
  readonly timestamp: Date;
}

/** Configuration for a scraper instance */
export interface ScraperConfig {
  readonly batchSize: number;
  readonly maxRetries: number;
  readonly retryDelayMs: number;
}

/** Rate limiter configuration per platform */
export interface RateLimiterConfig {
  readonly maxRequests: number;
  readonly windowMs: number;
}

/** Twitter API v2 tweet fields we request */
export interface TwitterTweetData {
  readonly id: string;
  readonly text: string;
  readonly created_at: string;
  readonly public_metrics: {
    readonly retweet_count: number;
    readonly reply_count: number;
    readonly like_count: number;
    readonly quote_count: number;
  };
  readonly entities?: {
    readonly hashtags?: readonly { readonly tag: string }[];
    readonly mentions?: readonly { readonly username: string }[];
  };
  readonly referenced_tweets?: readonly {
    readonly type: "retweeted" | "quoted" | "replied_to";
    readonly id: string;
  }[];
}

/** Twitter API v2 response envelope */
export interface TwitterApiResponse {
  readonly data?: readonly TwitterTweetData[];
  readonly meta?: {
    readonly result_count: number;
    readonly next_token?: string;
    readonly newest_id?: string;
    readonly oldest_id?: string;
  };
  readonly errors?: readonly { readonly message: string; readonly type: string }[];
}

/** YouTube Data API v3 search result item */
export interface YouTubeSearchItem {
  readonly id: {
    readonly kind: string;
    readonly videoId: string;
  };
  readonly snippet: {
    readonly publishedAt: string;
    readonly channelId: string;
    readonly title: string;
    readonly description: string;
    readonly channelTitle: string;
  };
}

/** YouTube Data API v3 search response */
export interface YouTubeSearchResponse {
  readonly items: readonly YouTubeSearchItem[];
  readonly pageInfo: {
    readonly totalResults: number;
    readonly resultsPerPage: number;
  };
  readonly nextPageToken?: string;
}

/** YouTube Data API v3 video detail item */
export interface YouTubeVideoDetail {
  readonly id: string;
  readonly snippet: {
    readonly publishedAt: string;
    readonly title: string;
    readonly description: string;
    readonly channelTitle: string;
  };
  readonly statistics: {
    readonly viewCount: string;
    readonly likeCount: string;
    readonly commentCount: string;
  };
  readonly contentDetails: {
    readonly duration: string;
  };
}

/** YouTube Data API v3 video list response */
export interface YouTubeVideoResponse {
  readonly items: readonly YouTubeVideoDetail[];
}
