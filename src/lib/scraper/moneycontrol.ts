// src/lib/scraper/moneycontrol.ts
//
// Scraper for MoneyControl stock ideas using their JSON API.
// Fetches brokerage recommendations (buy/sell with targets) from
// https://api.moneycontrol.com/mcapi/v1/broker-research/stock-ideas
//
// The API returns paginated JSON with real CMP, target prices,
// recommendation dates, and brokerage names — much richer than
// HTML scraping.

import { createLogger } from "@/lib/logger";
import { RateLimiter } from "./rate-limiter";
import type { ScrapedPost } from "./types";

const log = createLogger("scraper/moneycontrol");

// ──── Types ────

export interface MoneyControlRecommendation {
  readonly id: string;
  readonly brokerageName: string;
  readonly stockName: string;
  readonly stockShortName: string;
  readonly stockSymbol: string | null;
  readonly scid: string;
  readonly recommendationType: string; // "BUY", "SELL", "ACCUMULATE", "REDUCE", etc.
  readonly targetPrice: number;
  readonly currentPrice: number;
  readonly recommendedPrice: number;
  readonly upsidePct: number;
  readonly reportDate: string;
  readonly sourceUrl: string;
  readonly attachmentUrl: string | null;
  readonly exchange: string;
}

/** Stock metadata returned by the MoneyControl price API */
export interface MoneyControlStockInfo {
  readonly nseSymbol: string;
  readonly bseCode: string | null;
  readonly fullName: string;
  readonly sector: string | null;
  readonly industry: string | null;
  readonly marketCapCrores: number | null;
  readonly lastPrice: number | null;
  readonly high52w: number | null;
  readonly low52w: number | null;
}

// Shape of each item returned by the stock-ideas API
interface StockIdeaApiItem {
  readonly id: string;
  readonly organization: string;
  readonly entry_date: string;
  readonly heading: string;
  readonly attachment: string | null;
  readonly recommend_date: string;
  readonly target_price_date: string;
  readonly target_price: string;
  readonly recommended_price: number;
  readonly scid: string;
  readonly stkname: string;
  readonly stockShortName: string;
  readonly cmp: string;
  readonly change: string;
  readonly perChange: string;
  readonly current_returns: number;
  readonly potential_returns_per: number;
  readonly exchange: string;
  readonly recommend_flag: string;
  readonly stk_url: string;
  readonly stock_data: {
    readonly current: {
      readonly recommend_flag: string;
      readonly target_price: string;
      readonly target_price_date: string;
      readonly P_ORGANIZATION: string;
    };
    readonly previous:
      | {
          readonly recommend_flag: string;
          readonly target_price: string;
          readonly target_price_date: string;
          readonly P_ORGANIZATION: string;
        }
      | readonly [];
  };
}

interface StockIdeaApiResponse {
  readonly success: number;
  readonly data: readonly StockIdeaApiItem[];
}

// ──── Constants ────

const API_BASE = "https://api.moneycontrol.com/mcapi/v1/broker-research";
const STOCK_IDEAS_ENDPOINT = `${API_BASE}/stock-ideas`;
const PRICE_API_BASE = "https://priceapi.moneycontrol.com/pricefeed/nse/equitycash";
const DEFAULT_USER_AGENT =
  process.env.MONEYCONTROL_USER_AGENT ??
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const DEFAULT_REFERER = "https://www.moneycontrol.com/markets/stock-ideas/";

// Map recommend_flag to readable recommendation type
const RECOMMEND_FLAG_MAP: Record<string, string> = {
  BUY: "Buy",
  SELL: "Sell",
  HOLD: "Hold",
  ACCUMULATE: "Accumulate",
  REDUCE: "Reduce",
  OUTPERFORM: "Outperform",
  UNDERPERFORM: "Underperform",
  B: "Buy",
  S: "Sell",
  H: "Hold",
};

// ──── Scraper Class ────

export class MoneyControlScraper {
  private readonly rateLimiter: RateLimiter;

  constructor(rateLimiter: RateLimiter) {
    this.rateLimiter = rateLimiter;
  }

  /**
   * Scrape stock ideas from MoneyControl JSON API.
   *
   * @param maxPages - Max pages to fetch. Use 0 for unlimited.
   *   - First crawl (FULL_SCRAPE): 20 pages = ~1000 tips
   *   - Recurring 3-hour runs (INCREMENTAL): 3 pages = ~150 tips
   *     (MoneyControl adds ~20-50 new tips per day, so 150 covers 3+ days)
   *   Default: 3 pages (incremental mode).
   *
   * Returns recommendations in the exact order the API returns them,
   * matching MoneyControl's page display order.
   */
  async scrapeStockIdeas(maxPages: number = 3): Promise<{
    recommendations: MoneyControlRecommendation[];
    posts: ScrapedPost[];
    totalApiItems: number;
    skippedItems: number;
  }> {
    const unlimited = maxPages === 0;
    log.info(
      { maxPages: unlimited ? "UNLIMITED" : maxPages },
      "Starting MoneyControl stock-ideas API scrape"
    );

    const recommendations: MoneyControlRecommendation[] = [];
    const seen = new Set<string>();
    const pageSize = 50;
    let start = 0;
    let pagesFetched = 0;
    let totalApiItems = 0;
    let skippedItems = 0;

    while (unlimited || pagesFetched < maxPages) {
      await this.rateLimiter.waitForSlot();

      const items = await this.fetchStockIdeas(start, pageSize);
      this.rateLimiter.recordRequest();
      pagesFetched++;

      if (!items || items.length === 0) {
        log.info({ start, pagesFetched }, "No more items from API, stopping");
        break;
      }

      totalApiItems += items.length;

      for (const item of items) {
        const rec = this.apiItemToRecommendation(item);
        if (!rec) {
          skippedItems++;
          continue;
        }

        if (seen.has(rec.id)) continue;
        seen.add(rec.id);
        recommendations.push(rec);
      }

      log.info(
        { page: pagesFetched, itemsOnPage: items.length, totalSoFar: recommendations.length },
        "Fetched page of MoneyControl recommendations"
      );

      start += items.length;

      // If fewer items than requested, we've reached the end
      if (items.length < pageSize) break;
    }

    log.info(
      { totalApiItems, totalRecommendations: recommendations.length, skippedItems, pagesFetched },
      "MoneyControl API scrape complete"
    );

    const posts = recommendations.map((rec) =>
      this.recommendationToScrapedPost(rec)
    );

    return { recommendations, posts, totalApiItems, skippedItems };
  }

  /**
   * Look up a stock's NSE symbol and metadata from MoneyControl's price API.
   * Uses the `scid` (MoneyControl internal stock code) to fetch the data.
   * Returns null if the stock is not found or the API fails.
   */
  async lookupStockByScid(scid: string): Promise<MoneyControlStockInfo | null> {
    if (!scid) return null;

    const url = `${PRICE_API_BASE}/${encodeURIComponent(scid)}`;
    await this.rateLimiter.waitForSlot();
    const json = await this.fetchJsonWithRetry<{
      code: string;
      data: Record<string, unknown>;
    }>(url);
    this.rateLimiter.recordRequest();

    if (!json || json.code !== "200" || !json.data) {
      log.warn({ scid }, "MoneyControl price API lookup failed");
      return null;
    }

    const d = json.data;
    const nseSymbol = d.NSEID as string | undefined;
    if (!nseSymbol) {
      log.warn({ scid }, "No NSEID in MoneyControl price API response");
      return null;
    }

    const mktcap = typeof d.MKTCAP === "number" ? d.MKTCAP : null;
    const lastPrice = typeof d.pricecurrent === "string" ? parseFloat(d.pricecurrent) : null;
    const high52w = typeof d["52H"] === "string" ? parseFloat(d["52H"] as string) : null;
    const low52w = typeof d["52L"] === "string" ? parseFloat(d["52L"] as string) : null;

    return {
      nseSymbol,
      bseCode: (d.BSEID as string) || null,
      fullName: (d.SC_FULLNM as string) || "",
      sector: (d.main_sector as string) || (d.SC_SUBSEC as string) || null,
      industry: (d.newSubsector as string) || (d.SC_SUBSEC as string) || null,
      marketCapCrores: mktcap,
      lastPrice: lastPrice && !isNaN(lastPrice) ? lastPrice : null,
      high52w: high52w && !isNaN(high52w) ? high52w : null,
      low52w: low52w && !isNaN(low52w) ? low52w : null,
    };
  }

  /**
   * Fetch a page of stock ideas from the API.
   */
  private async fetchStockIdeas(
    start: number,
    limit: number
  ): Promise<readonly StockIdeaApiItem[] | null> {
    const url = `${STOCK_IDEAS_ENDPOINT}?start=${start}&limit=${limit}&deviceType=W`;

    const json = await this.fetchJsonWithRetry<StockIdeaApiResponse>(url);
    if (!json || json.success !== 1) {
      log.warn({ start, limit }, "MoneyControl API returned unsuccessful response");
      return null;
    }

    return json.data;
  }

  /**
   * Convert an API item to our internal recommendation format.
   * Includes ALL recommendation types (Buy, Sell, Hold, Accumulate, etc.)
   * to preserve exact MoneyControl page order. The worker decides which
   * ones to create as actionable Tips.
   */
  private apiItemToRecommendation(
    item: StockIdeaApiItem
  ): MoneyControlRecommendation | null {
    const targetPrice = parseFloat(item.target_price);
    const cmp = parseFloat(item.cmp);

    // Only skip items with truly invalid/missing prices
    if (isNaN(targetPrice) || isNaN(cmp) || cmp <= 0) {
      log.warn(
        { id: item.id, stock: item.stkname, target: item.target_price, cmp: item.cmp },
        "Skipping item with invalid prices"
      );
      return null;
    }

    const rawFlag = (item.recommend_flag || "").toUpperCase();
    const recommendationType =
      RECOMMEND_FLAG_MAP[rawFlag] ?? (rawFlag || "Buy");

    // Do NOT skip Hold/Neutral here — include ALL items to preserve
    // exact MoneyControl page ordering. The worker will decide which
    // to create as actionable tips.

    const upsidePct = cmp > 0 ? ((targetPrice - cmp) / cmp) * 100 : 0;

    // Use the stock-ideas page filtered by stock as the source URL
    // Direct stk_url links are blocked by MoneyControl's Akamai CDN
    const sourceUrl = `https://www.moneycontrol.com/stocks/marketinfo/stock-ideas`;

    return {
      id: item.id,
      brokerageName: item.organization,
      stockName: item.stkname,
      stockShortName: item.stockShortName || item.stkname,
      stockSymbol: item.scid || null,
      scid: item.scid,
      recommendationType,
      targetPrice: targetPrice > 0 ? targetPrice : cmp, // fallback for Hold with 0 target
      currentPrice: cmp,
      recommendedPrice: item.recommended_price || cmp,
      upsidePct,
      reportDate: item.entry_date || item.target_price_date || (new Date().toISOString().split("T")[0] ?? ""),
      sourceUrl,
      attachmentUrl: item.attachment || null,
      exchange: item.exchange === "B" ? "BSE" : "NSE",
    };
  }

  /**
   * Convert a recommendation into a ScrapedPost for storage.
   */
  private recommendationToScrapedPost(
    rec: MoneyControlRecommendation
  ): ScrapedPost {
    const platformPostId = `mc-${rec.id}`;

    const content = [
      `${rec.recommendationType.toUpperCase()} ${rec.stockName}`,
      `Brokerage: ${rec.brokerageName}`,
      `Target: ₹${rec.targetPrice}`,
      `CMP: ₹${rec.currentPrice}`,
      `Rec Price: ₹${rec.recommendedPrice}`,
      `Upside: ${rec.upsidePct.toFixed(1)}%`,
      `Date: ${rec.reportDate}`,
    ].join("\n");

    return {
      platformPostId,
      content,
      postedAt: new Date(rec.reportDate || Date.now()),
      mediaUrls: [],
      metadata: {
        brokerageName: rec.brokerageName,
        recommendationType: rec.recommendationType,
        targetPrice: rec.targetPrice,
        currentPrice: rec.currentPrice,
        upsidePct: rec.upsidePct,
        reportDate: rec.reportDate,
      },
    };
  }

  /**
   * Fetch JSON from a URL with retry logic and rate limiting.
   */
  private async fetchJsonWithRetry<T>(
    url: string,
    maxRetries: number = 3
  ): Promise<T | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": DEFAULT_USER_AGENT,
            Accept: "application/json",
            Referer: DEFAULT_REFERER,
            Origin: "https://www.moneycontrol.com",
          },
        });

        if (!response.ok) {
          log.warn(
            { status: response.status, url, attempt, maxRetries },
            "MoneyControl API HTTP error"
          );

          if (response.status === 429) {
            const waitMs = 10_000 * attempt;
            log.info({ waitMs }, "MoneyControl rate limited, backing off");
            await new Promise((resolve) => setTimeout(resolve, waitMs));
            continue;
          }

          if (attempt < maxRetries) {
            await new Promise((resolve) =>
              setTimeout(resolve, 5000 * attempt)
            );
            continue;
          }

          return null;
        }

        return (await response.json()) as T;
      } catch (error) {
        log.error(
          {
            err:
              error instanceof Error ? error : new Error(String(error)),
            url,
            attempt,
            maxRetries,
          },
          "MoneyControl API fetch error"
        );

        if (attempt < maxRetries) {
          await new Promise((resolve) =>
            setTimeout(resolve, 5000 * attempt)
          );
        }
      }
    }

    return null;
  }
}
