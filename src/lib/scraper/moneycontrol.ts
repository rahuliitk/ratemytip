// src/lib/scraper/moneycontrol.ts
//
// Web scraper for MoneyControl stock ideas page.
// Fetches brokerage recommendations (buy/sell with targets) from
// https://www.moneycontrol.com/markets/stock-ideas/
//
// Uses cheerio for HTML parsing. Runs daily at 8 AM IST.

import * as cheerio from "cheerio";
import { RateLimiter } from "./rate-limiter";
import type { ScrapedPost } from "./types";

// ──── Types ────

export interface MoneyControlRecommendation {
  readonly brokerageName: string;
  readonly stockName: string;
  readonly stockSymbol: string | null;
  readonly recommendationType: string; // "Buy", "Sell", "Accumulate", "Reduce", "Hold"
  readonly targetPrice: number;
  readonly currentPrice: number;
  readonly upsidePct: number;
  readonly reportDate: string;
  readonly sourceUrl: string;
}

// ──── Constants ────

const BASE_URL = "https://www.moneycontrol.com/markets/stock-ideas/";
const DEFAULT_USER_AGENT =
  process.env.MONEYCONTROL_USER_AGENT ??
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Common CSS selectors for MoneyControl stock ideas page
// These may need updating if MoneyControl changes their HTML structure
const SELECTORS = {
  // The stock ideas are typically in a table or card-based layout
  ideaRow: "table tbody tr, .stock-idea-card, .bsr_table tbody tr, .FL table tbody tr",
  // Fallback: try any table row with enough cells
  fallbackRow: "table tbody tr",
} as const;

// ──── Scraper Class ────

export class MoneyControlScraper {
  private readonly rateLimiter: RateLimiter;

  constructor(rateLimiter: RateLimiter) {
    this.rateLimiter = rateLimiter;
  }

  /**
   * Scrape all stock ideas from MoneyControl.
   * Returns an array of ScrapedPost objects ready for storage.
   */
  async scrapeStockIdeas(): Promise<{
    recommendations: MoneyControlRecommendation[];
    posts: ScrapedPost[];
  }> {
    console.log("[MoneyControl] Starting stock ideas scrape...");

    const allRecommendations: MoneyControlRecommendation[] = [];
    const allPosts: ScrapedPost[] = [];

    // Scrape main page and up to 10 additional pages
    const maxPages = 10;

    for (let page = 1; page <= maxPages; page++) {
      await this.rateLimiter.waitForSlot();

      const url = page === 1 ? BASE_URL : `${BASE_URL}?page=${page}`;
      const html = await this.fetchWithRetry(url);

      if (!html) {
        console.warn(`[MoneyControl] Empty response for page ${page}, stopping`);
        break;
      }

      const recs = this.parseStockIdeasHtml(html, url);

      if (recs.length === 0) {
        console.log(`[MoneyControl] No recommendations found on page ${page}, stopping pagination`);
        break;
      }

      allRecommendations.push(...recs);
      console.log(`[MoneyControl] Page ${page}: found ${recs.length} recommendations`);

      // Convert to ScrapedPost format
      for (const rec of recs) {
        allPosts.push(this.recommendationToScrapedPost(rec));
      }

      // Polite delay between pages
      if (page < maxPages) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    console.log(`[MoneyControl] Scrape complete: ${allRecommendations.length} total recommendations`);

    return { recommendations: allRecommendations, posts: allPosts };
  }

  /**
   * Parse MoneyControl HTML and extract brokerage recommendations.
   * Handles multiple possible HTML structures with fallback selectors.
   */
  private parseStockIdeasHtml(
    html: string,
    sourceUrl: string
  ): MoneyControlRecommendation[] {
    const $ = cheerio.load(html);
    const recommendations: MoneyControlRecommendation[] = [];

    // Try primary selectors first, then fallback
    let rows = $(SELECTORS.ideaRow);

    if (rows.length === 0) {
      rows = $(SELECTORS.fallbackRow);
    }

    if (rows.length === 0) {
      console.warn("[MoneyControl] No data rows found. HTML structure may have changed.");
      console.warn("[MoneyControl] Page title:", $("title").text().trim());
      return [];
    }

    rows.each((_index, element) => {
      try {
        const cells = $(element).find("td");

        // We need at least 4 cells for meaningful data
        if (cells.length < 4) return;

        const cellTexts = cells
          .map((_i, cell) => $(cell).text().trim())
          .get();

        // Try to extract recommendation from cell data
        const rec = this.extractRecommendationFromCells(cellTexts, sourceUrl);
        if (rec) {
          recommendations.push(rec);
        }
      } catch {
        // Skip malformed rows silently
      }
    });

    return recommendations;
  }

  /**
   * Extract a recommendation from table cell texts.
   * Handles various column orderings by looking for patterns.
   */
  private extractRecommendationFromCells(
    cells: string[],
    sourceUrl: string
  ): MoneyControlRecommendation | null {
    // Look for recommendation type keywords in any cell
    const recTypeIndex = cells.findIndex((c) =>
      /^(buy|sell|hold|accumulate|reduce|outperform|underperform|neutral|overweight|underweight)$/i.test(c)
    );

    if (recTypeIndex === -1) return null;

    const recommendationType = cells[recTypeIndex] ?? "";

    // Skip "Hold" / "Neutral" — not actionable tips
    if (/^(hold|neutral)$/i.test(recommendationType)) return null;

    // Look for price-like numbers
    const prices: number[] = [];
    const priceIndices: number[] = [];

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      if (!cell) continue;
      const cleaned = cell.replace(/[₹,\s]/g, "");
      const num = parseFloat(cleaned);
      if (!isNaN(num) && num > 0 && num < 1_000_000) {
        prices.push(num);
        priceIndices.push(i);
      }
    }

    if (prices.length < 2) return null;

    // Find text cells that are likely stock name and brokerage
    const textCells = cells.filter(
      (c, i) =>
        i !== recTypeIndex &&
        !priceIndices.includes(i) &&
        c.length > 1 &&
        !/^\d/.test(c) &&
        !/^[₹%]/.test(c)
    );

    if (textCells.length < 2) return null;

    // Heuristic: first text cell is usually stock name, second is brokerage
    // (or vice versa — we handle both)
    const stockName = textCells[0] ?? "";
    const brokerageName = textCells[1] ?? "";

    // Heuristic: target is usually the largest price, current is the smaller
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const currentPrice = sortedPrices[0] ?? 0;
    const targetPrice = sortedPrices[sortedPrices.length - 1] ?? 0;

    if (currentPrice <= 0 || targetPrice <= 0) return null;

    const upsidePct =
      currentPrice > 0
        ? ((targetPrice - currentPrice) / currentPrice) * 100
        : 0;

    // Look for a date in the cells
    const dateCell = cells.find((c) => /\d{1,2}[-\/]\w{3}[-\/]\d{2,4}|\d{4}-\d{2}-\d{2}/.test(c));
    const reportDate = dateCell ?? new Date().toISOString().split("T")[0] ?? "";

    return {
      brokerageName,
      stockName,
      stockSymbol: null, // Will be resolved via normalizer
      recommendationType,
      targetPrice,
      currentPrice,
      upsidePct,
      reportDate,
      sourceUrl,
    };
  }

  /**
   * Convert a MoneyControl recommendation into a ScrapedPost for storage.
   */
  private recommendationToScrapedPost(rec: MoneyControlRecommendation): ScrapedPost {
    // Create a unique platform post ID from brokerage + stock + date
    const platformPostId = `mc-${rec.brokerageName}-${rec.stockName}-${rec.reportDate}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-");

    // Construct content string that represents the recommendation
    const content = [
      `${rec.recommendationType.toUpperCase()} ${rec.stockName}`,
      `Brokerage: ${rec.brokerageName}`,
      `Target: ₹${rec.targetPrice}`,
      `CMP: ₹${rec.currentPrice}`,
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
   * Fetch a URL with retry logic and rate limiting.
   */
  private async fetchWithRetry(
    url: string,
    maxRetries: number = 3
  ): Promise<string | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": DEFAULT_USER_AGENT,
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
          },
        });

        if (!response.ok) {
          console.warn(
            `[MoneyControl] HTTP ${response.status} for ${url} (attempt ${attempt}/${maxRetries})`
          );

          if (response.status === 429) {
            // Rate limited — wait longer
            const waitMs = 10_000 * attempt;
            console.log(`[MoneyControl] Rate limited, waiting ${waitMs}ms...`);
            await new Promise((resolve) => setTimeout(resolve, waitMs));
            continue;
          }

          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 5000 * attempt));
            continue;
          }

          return null;
        }

        return await response.text();
      } catch (error) {
        console.error(
          `[MoneyControl] Fetch error (attempt ${attempt}/${maxRetries}):`,
          error instanceof Error ? error.message : String(error)
        );

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 5000 * attempt));
        }
      }
    }

    return null;
  }
}
