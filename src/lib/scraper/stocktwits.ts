// src/lib/scraper/stocktwits.ts
//
// Fetches community posts from the StockTwits API for tracked symbols.
// No authentication required. Rate limit: 200 requests/hour.
//
// Unlike Finnhub/Yahoo, StockTwits messages are unstructured community posts
// that feed into the NLP parsing pipeline (same as Twitter posts).
//
// API: GET https://api.stocktwits.com/api/2/streams/symbol/{symbol}.json

import { RateLimiter } from "./rate-limiter";
import { STOCKTWITS } from "@/lib/constants";

// ──── StockTwits API response types ────

export interface StockTwitsMessage {
  readonly id: number;
  readonly body: string;
  readonly created_at: string;
  readonly user: {
    readonly id: number;
    readonly username: string;
    readonly name: string;
    readonly followers: number;
    readonly following: number;
    readonly join_date: string;
  };
  readonly entities?: {
    readonly sentiment?: {
      readonly basic: "Bullish" | "Bearish" | null;
    };
  };
  readonly likes?: {
    readonly total: number;
  };
  readonly symbols?: readonly {
    readonly id: number;
    readonly symbol: string;
    readonly title: string;
  }[];
}

interface StockTwitsStreamResponse {
  readonly response?: {
    readonly status: number;
  };
  readonly messages?: readonly StockTwitsMessage[];
  readonly cursor?: {
    readonly max?: number;
    readonly since?: number;
    readonly more?: boolean;
  };
  readonly errors?: readonly { readonly message: string }[];
}

// ──── Exported result type ────

export interface StockTwitsScrapedMessage {
  readonly messageId: number;
  readonly body: string;
  readonly createdAt: Date;
  readonly userId: number;
  readonly username: string;
  readonly displayName: string;
  readonly followers: number;
  readonly sentiment: "Bullish" | "Bearish" | null;
  readonly likes: number;
  readonly symbols: readonly string[];
}

// ──── Scraper Class ────

export class StockTwitsScraper {
  private readonly rateLimiter: RateLimiter;

  constructor(rateLimiter: RateLimiter) {
    this.rateLimiter = rateLimiter;
  }

  /**
   * Fetch recent messages for a stock symbol.
   * Returns up to 30 messages per call (StockTwits default).
   */
  async getSymbolStream(
    symbol: string,
    sinceId?: number
  ): Promise<readonly StockTwitsScrapedMessage[]> {
    let url = `${STOCKTWITS.BASE_URL}/streams/symbol/${encodeURIComponent(symbol)}.json`;
    if (sinceId) {
      url += `?since=${sinceId}`;
    }

    await this.rateLimiter.waitForSlot();
    this.rateLimiter.recordRequest();

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; RateMyTipBot/1.0)",
        },
      });

      if (response.status === 429) {
        console.warn("[StockTwits] Rate limited — waiting 60s...");
        await new Promise((resolve) => setTimeout(resolve, 60_000));
        return [];
      }

      if (!response.ok) {
        console.warn(
          `[StockTwits] HTTP ${response.status} for ${symbol}`
        );
        return [];
      }

      const data = (await response.json()) as StockTwitsStreamResponse;

      if (data.errors && data.errors.length > 0) {
        console.warn(
          `[StockTwits] API error for ${symbol}: ${data.errors[0]?.message}`
        );
        return [];
      }

      if (!data.messages) return [];

      return data.messages.map((msg) => ({
        messageId: msg.id,
        body: msg.body,
        createdAt: new Date(msg.created_at),
        userId: msg.user.id,
        username: msg.user.username,
        displayName: msg.user.name,
        followers: msg.user.followers,
        sentiment: msg.entities?.sentiment?.basic ?? null,
        likes: msg.likes?.total ?? 0,
        symbols: msg.symbols?.map((s) => s.symbol) ?? [],
      }));
    } catch (error) {
      console.error(
        `[StockTwits] Error fetching ${symbol}:`,
        error instanceof Error ? error.message : String(error)
      );
      return [];
    }
  }

  /**
   * Check if a user has enough followers to be tracked as a Creator.
   */
  static isTrackableUser(followers: number): boolean {
    return followers >= STOCKTWITS.MIN_FOLLOWERS_FOR_TRACKING;
  }
}
