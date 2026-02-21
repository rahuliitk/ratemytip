// src/lib/scraper/trendlyne.ts
//
// Trendlyne stock recommendations scraper.
// Fetches analyst consensus and buy/sell recommendations from Trendlyne.
// Uses cheerio for HTML parsing (Trendlyne has SSR-friendly pages).
//
// Primary endpoint: https://trendlyne.com/equity/recommendations/
// Fallback: https://trendlyne.com/stock-screeners/

import * as cheerio from "cheerio";
import type { ScrapedPost } from "./types";

// ──── Types ────

export interface TrendlyneRecommendation {
  readonly stockName: string;
  readonly stockSymbol: string | null;
  readonly analystName: string;
  readonly recommendation: string; // "Buy", "Sell", "Strong Buy", etc.
  readonly targetPrice: number;
  readonly currentPrice: number;
  readonly upsidePct: number;
  readonly date: string;
  readonly sourceUrl: string;
}

// ──── Constants ────

const TRENDLYNE_RECOS_URL = "https://trendlyne.com/equity/recommendations/";
const TRENDLYNE_SCREENER_URL = "https://trendlyne.com/stock-screeners/";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// ──── Scraper ────

export class TrendlyneScraper {
  /**
   * Scrape analyst recommendations from Trendlyne.
   * Tries the recommendations page first, then falls back to screener signals.
   */
  async scrapeRecommendations(): Promise<{
    recommendations: TrendlyneRecommendation[];
    posts: ScrapedPost[];
  }> {
    console.log("[Trendlyne] Starting recommendations scrape...");

    // Try recommendations page first
    let recs = await this.scrapeRecosPage();

    if (recs.length === 0) {
      console.log("[Trendlyne] Recommendations page returned 0 results, trying screener...");
      recs = await this.scrapeScreenerPage();
    }

    const posts: ScrapedPost[] = recs.map((rec) => this.toScrapedPost(rec));

    console.log(`[Trendlyne] Scrape complete: ${recs.length} recommendations`);
    return { recommendations: recs, posts };
  }

  /**
   * Scrape the main recommendations page.
   */
  private async scrapeRecosPage(): Promise<TrendlyneRecommendation[]> {
    const html = await this.fetchPage(TRENDLYNE_RECOS_URL);
    if (!html) return [];

    const $ = cheerio.load(html);
    const recommendations: TrendlyneRecommendation[] = [];

    // Trendlyne uses table rows or card layouts for recommendations
    const rows = $(
      "table tbody tr, .reco-card, .analyst-reco-row, .stock-reco-item, [data-reco]"
    );

    if (rows.length === 0) {
      console.warn("[Trendlyne] No recommendation rows found on recos page");
      console.warn("[Trendlyne] Page title:", $("title").text().trim());
      return [];
    }

    rows.each((_i, el) => {
      try {
        const cells = $(el).find("td");
        if (cells.length < 3) return;
        const cellTexts = cells.map((_j, cell) => $(cell).text().trim()).get();
        const rec = this.extractFromCells(cellTexts, TRENDLYNE_RECOS_URL);
        if (rec) recommendations.push(rec);
      } catch {
        // Skip malformed rows
      }
    });

    return recommendations;
  }

  /**
   * Scrape the screener page for buy/sell signals.
   */
  private async scrapeScreenerPage(): Promise<TrendlyneRecommendation[]> {
    const html = await this.fetchPage(TRENDLYNE_SCREENER_URL);
    if (!html) return [];

    const $ = cheerio.load(html);
    const recommendations: TrendlyneRecommendation[] = [];

    // Screener page may have different structure
    const rows = $("table tbody tr, .screener-row, .stock-item");

    rows.each((_i, el) => {
      try {
        const cells = $(el).find("td");
        if (cells.length < 3) return;
        const cellTexts = cells.map((_j, cell) => $(cell).text().trim()).get();
        const rec = this.extractFromCells(cellTexts, TRENDLYNE_SCREENER_URL);
        if (rec) recommendations.push(rec);
      } catch {
        // Skip malformed rows
      }
    });

    return recommendations;
  }

  /**
   * Extract recommendation data from cell texts.
   */
  private extractFromCells(
    cells: string[],
    sourceUrl: string
  ): TrendlyneRecommendation | null {
    // Look for recommendation type keywords
    const recIndex = cells.findIndex((c) =>
      /^(buy|sell|strong buy|strong sell|accumulate|reduce|outperform|underperform|hold)$/i.test(c)
    );

    if (recIndex === -1) return null;
    const recommendation = cells[recIndex] ?? "";

    // Skip "hold" — not actionable
    if (/^(hold|neutral)$/i.test(recommendation)) return null;

    // Find prices
    const prices: number[] = [];
    for (const cell of cells) {
      const cleaned = cell.replace(/[₹,\s%]/g, "");
      const num = parseFloat(cleaned);
      if (!isNaN(num) && num > 0 && num < 1_000_000) {
        prices.push(num);
      }
    }

    if (prices.length < 2) return null;

    // Find text cells (stock name, analyst)
    const textCells = cells.filter(
      (c, i) =>
        i !== recIndex &&
        c.length > 1 &&
        !/^\d/.test(c) &&
        !/^[₹%]/.test(c) &&
        !/^(buy|sell|hold|accumulate|reduce)$/i.test(c)
    );

    if (textCells.length < 1) return null;

    const stockName = textCells[0] ?? "";
    const analystName = textCells[1] ?? "Trendlyne Screener";

    const sortedPrices = [...prices].sort((a, b) => a - b);
    const currentPrice = sortedPrices[0] ?? 0;
    const targetPrice = sortedPrices[sortedPrices.length - 1] ?? 0;

    if (currentPrice <= 0 || targetPrice <= 0) return null;

    const upsidePct = ((targetPrice - currentPrice) / currentPrice) * 100;

    return {
      stockName,
      stockSymbol: null,
      analystName,
      recommendation,
      targetPrice,
      currentPrice,
      upsidePct,
      date: new Date().toISOString().split("T")[0] ?? "",
      sourceUrl,
    };
  }

  /**
   * Convert to ScrapedPost format for storage.
   */
  private toScrapedPost(rec: TrendlyneRecommendation): ScrapedPost {
    const platformPostId = `tl-${rec.stockName}-${rec.analystName}-${rec.date}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-");

    const content = [
      `${rec.recommendation.toUpperCase()} ${rec.stockName}`,
      `Analyst: ${rec.analystName}`,
      `Target: ₹${rec.targetPrice}`,
      `CMP: ₹${rec.currentPrice}`,
      `Upside: ${rec.upsidePct.toFixed(1)}%`,
    ].join("\n");

    return {
      platformPostId,
      content,
      postedAt: new Date(rec.date || Date.now()),
      mediaUrls: [],
      metadata: {
        brokerageName: rec.analystName,
        recommendationType: rec.recommendation,
        targetPrice: rec.targetPrice,
        currentPrice: rec.currentPrice,
        upsidePct: rec.upsidePct,
        reportDate: rec.date,
      },
    };
  }

  /**
   * Fetch a page with proper headers and retry logic.
   */
  private async fetchPage(url: string): Promise<string | null> {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": USER_AGENT,
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
          },
        });

        if (!response.ok) {
          console.warn(
            `[Trendlyne] HTTP ${response.status} for ${url} (attempt ${attempt}/3)`
          );
          if (attempt < 3) {
            await new Promise((r) => setTimeout(r, 5000 * attempt));
            continue;
          }
          return null;
        }

        return await response.text();
      } catch (error) {
        console.error(
          `[Trendlyne] Fetch error (attempt ${attempt}/3):`,
          error instanceof Error ? error.message : String(error)
        );
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, 5000 * attempt));
        }
      }
    }

    return null;
  }
}
