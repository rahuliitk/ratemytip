// src/lib/scraper/telegram.ts

import { AppError } from "@/lib/errors";
import { containsFinancialKeywords } from "@/lib/parser/templates";
import { RateLimiter } from "./rate-limiter";
import type { ScrapedPost, ScraperConfig, ScrapeResult } from "./types";

const TELEGRAM_API_BASE = "https://api.telegram.org/bot";

/** Metadata specific to a Telegram message */
export interface TelegramPostMetadata {
  readonly messageId: number;
  readonly chatId: number;
  readonly chatTitle: string;
  readonly viewCount: number;
  readonly forwardCount: number;
}

/** Telegram Bot API message shape (subset) */
interface TelegramMessage {
  message_id: number;
  date: number;
  text?: string;
  caption?: string;
  chat: {
    id: number;
    title?: string;
    type: string;
  };
  photo?: Array<{ file_id: string }>;
  views?: number;
  forwards?: number;
}

/** Telegram Bot API getUpdates response */
interface TelegramUpdatesResponse {
  ok: boolean;
  result: Array<{
    update_id: number;
    channel_post?: TelegramMessage;
    message?: TelegramMessage;
  }>;
}

/** Default configuration for the Telegram scraper */
const DEFAULT_CONFIG: ScraperConfig = {
  batchSize: 100,
  maxRetries: 3,
  retryDelayMs: 5000,
};

/**
 * Telegram scraper using the Bot API.
 *
 * Reads messages from public Telegram channels where the bot is a member.
 * Uses getUpdates with offset-based pagination to fetch new messages.
 *
 * Rate limit: Telegram Bot API allows ~30 requests/second.
 */
export class TelegramScraper {
  private readonly botToken: string;
  private readonly rateLimiter: RateLimiter;
  private readonly config: ScraperConfig;

  constructor(
    botToken: string,
    rateLimiter: RateLimiter,
    config: Partial<ScraperConfig> = {}
  ) {
    this.botToken = botToken;
    this.rateLimiter = rateLimiter;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Scrape recent messages from a Telegram channel.
   *
   * NOTE: The Bot API's getUpdates only returns messages the bot has received
   * (new messages since the bot was added, not historical). For public channels,
   * the bot must be added as an admin or member.
   *
   * @param channelId - The Telegram channel username (e.g., "@channelname") or numeric chat ID
   * @param lastOffset - Offset from the last processed update (for incremental scraping)
   */
  async scrapeChannel(
    channelId: string,
    lastOffset?: number
  ): Promise<ScrapedPost[]> {
    const posts: ScrapedPost[] = [];
    let offset = lastOffset;
    let hasMore = true;
    let attempts = 0;

    while (hasMore && attempts < 10) {
      attempts++;
      await this.rateLimiter.waitForSlot();

      try {
        const params = new URLSearchParams({
          limit: this.config.batchSize.toString(),
          allowed_updates: JSON.stringify(["channel_post", "message"]),
        });
        if (offset !== undefined) {
          params.set("offset", offset.toString());
        }

        const response = await fetch(
          `${TELEGRAM_API_BASE}${this.botToken}/getUpdates?${params}`,
          { signal: AbortSignal.timeout(15000) }
        );

        if (!response.ok) {
          throw new AppError(
            `Telegram API error: ${response.status}`,
            "TELEGRAM_API_ERROR",
            response.status
          );
        }

        const data = (await response.json()) as TelegramUpdatesResponse;

        if (!data.ok || data.result.length === 0) {
          hasMore = false;
          break;
        }

        for (const update of data.result) {
          const message = update.channel_post ?? update.message;
          if (!message) continue;

          const text = message.text ?? message.caption ?? "";
          if (!text || !containsFinancialKeywords(text)) continue;

          // Filter by channel if specified
          const chatIdStr = message.chat.id.toString();
          if (channelId && channelId !== chatIdStr && channelId !== `@${message.chat.title}`) {
            continue;
          }

          const mediaUrls: string[] = [];
          if (message.photo && message.photo.length > 0) {
            // Store file_id of the largest photo
            const largestPhoto = message.photo[message.photo.length - 1];
            if (largestPhoto) {
              mediaUrls.push(`tg://file/${largestPhoto.file_id}`);
            }
          }

          posts.push({
            platformPostId: `${message.chat.id}_${message.message_id}`,
            content: text,
            postedAt: new Date(message.date * 1000),
            mediaUrls,
            metadata: {
              messageId: message.message_id,
              chatId: message.chat.id,
              chatTitle: message.chat.title ?? "",
              viewCount: message.views ?? 0,
              forwardCount: message.forwards ?? 0,
            } as TelegramPostMetadata,
          });

          // Track the highest update_id for offset
          offset = update.update_id + 1;
        }

        // If we got fewer than batch size, we've caught up
        if (data.result.length < this.config.batchSize) {
          hasMore = false;
        }
      } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError(
          `Telegram scrape error: ${error instanceof Error ? error.message : String(error)}`,
          "TELEGRAM_SCRAPE_ERROR",
          500
        );
      }
    }

    return posts;
  }

  /**
   * Scrape messages from multiple channels.
   *
   * @param channels - Array of channel IDs/usernames to scrape
   * @param lastOffsets - Map of channelId → last processed offset
   */
  async scrapeMany(
    channels: string[],
    lastOffsets?: Map<string, number>
  ): Promise<Map<string, ScrapeResult>> {
    const results = new Map<string, ScrapeResult>();

    // Telegram getUpdates is global (all channels the bot sees),
    // so we fetch once and filter by channel
    const allPosts = await this.scrapeChannel("", lastOffsets?.values().next().value);

    // Group posts by channel
    const postsByChannel = new Map<string, ScrapedPost[]>();
    for (const post of allPosts) {
      const meta = post.metadata as TelegramPostMetadata;
      const key = meta.chatId.toString();
      if (!postsByChannel.has(key)) {
        postsByChannel.set(key, []);
      }
      postsByChannel.get(key)!.push(post);
    }

    for (const channelId of channels) {
      const channelPosts = postsByChannel.get(channelId) ?? [];
      results.set(channelId, {
        postsFound: channelPosts.length,
        tipsExtracted: 0,
        errors: [],
        posts: channelPosts,
      });
    }

    return results;
  }
}
