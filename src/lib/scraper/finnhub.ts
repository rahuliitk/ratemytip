// src/lib/scraper/finnhub.ts
//
// Wraps three Finnhub API endpoints for global equity research data:
//   1. /stock/recommendation  → Aggregate buy/hold/sell consensus
//   2. /stock/price-target    → Consensus target price range
//   3. /stock/upgrade-downgrade → Individual analyst upgrade/downgrade actions
//
// Rate limit: 60 calls/min (free tier). With 3 endpoints per symbol,
// processes ~20 symbols/min.

import { createLogger } from "@/lib/logger";
import { FINNHUB } from "@/lib/constants";
import { RateLimiter } from "./rate-limiter";

const log = createLogger("scraper/finnhub");
import type {
  FinnhubRecommendationTrend,
  FinnhubPriceTarget,
  FinnhubUpgradeDowngrade,
} from "@/types/consensus";

// ──── Response types from Finnhub API ────

interface FinnhubErrorResponse {
  readonly error?: string;
}

// ──── Scraper Class ────

export class FinnhubScraper {
  private readonly apiKey: string;
  private readonly rateLimiter: RateLimiter;

  constructor(apiKey: string, rateLimiter: RateLimiter) {
    this.apiKey = apiKey;
    this.rateLimiter = rateLimiter;
  }

  /**
   * Fetch aggregate analyst recommendation trends for a symbol.
   * Returns an array of monthly snapshots (most recent first).
   */
  async getRecommendationTrends(
    symbol: string
  ): Promise<readonly FinnhubRecommendationTrend[]> {
    const data = await this.fetchEndpoint<
      FinnhubRecommendationTrend[] | FinnhubErrorResponse
    >(`/stock/recommendation?symbol=${encodeURIComponent(symbol)}`);

    if (!data || !Array.isArray(data)) return [];
    return data;
  }

  /**
   * Fetch consensus price target for a symbol.
   * Returns target high, low, mean, median.
   */
  async getPriceTarget(symbol: string): Promise<FinnhubPriceTarget | null> {
    const data = await this.fetchEndpoint<
      FinnhubPriceTarget | FinnhubErrorResponse
    >(`/stock/price-target?symbol=${encodeURIComponent(symbol)}`);

    if (!data || "error" in data) return null;
    if (!("symbol" in data) || !data.symbol) return null;
    return data as FinnhubPriceTarget;
  }

  /**
   * Fetch individual analyst upgrade/downgrade actions for a symbol.
   * Returns historical actions (most recent first).
   */
  async getUpgradeDowngrades(
    symbol: string
  ): Promise<readonly FinnhubUpgradeDowngrade[]> {
    const data = await this.fetchEndpoint<
      FinnhubUpgradeDowngrade[] | FinnhubErrorResponse
    >(`/stock/upgrade-downgrade?symbol=${encodeURIComponent(symbol)}`);

    if (!data || !Array.isArray(data)) return [];
    return data;
  }

  /**
   * Process a batch of symbols: fetch all three endpoints for each.
   * Returns structured results grouped by symbol.
   */
  async processSymbolBatch(
    symbols: readonly string[]
  ): Promise<
    Map<
      string,
      {
        recommendations: readonly FinnhubRecommendationTrend[];
        priceTarget: FinnhubPriceTarget | null;
        upgrades: readonly FinnhubUpgradeDowngrade[];
      }
    >
  > {
    const results = new Map<
      string,
      {
        recommendations: readonly FinnhubRecommendationTrend[];
        priceTarget: FinnhubPriceTarget | null;
        upgrades: readonly FinnhubUpgradeDowngrade[];
      }
    >();

    for (const symbol of symbols) {
      try {
        const [recommendations, priceTarget, upgrades] = await Promise.all([
          this.getRecommendationTrends(symbol),
          this.getPriceTarget(symbol),
          this.getUpgradeDowngrades(symbol),
        ]);

        results.set(symbol, { recommendations, priceTarget, upgrades });
      } catch (error) {
        log.error(
          { err: error instanceof Error ? error : new Error(String(error)), symbol },
          "Error processing Finnhub symbol batch entry"
        );
        results.set(symbol, {
          recommendations: [],
          priceTarget: null,
          upgrades: [],
        });
      }
    }

    return results;
  }

  /**
   * Generic fetch wrapper with rate limiting and error handling.
   */
  private async fetchEndpoint<T>(path: string): Promise<T | null> {
    await this.rateLimiter.waitForSlot();
    this.rateLimiter.recordRequest();

    const url = `${FINNHUB.BASE_URL}${path}&token=${this.apiKey}`;

    try {
      const response = await fetch(url, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.status === 429) {
        log.warn({ path }, "Finnhub rate limited — waiting 60s");
        await new Promise((resolve) => setTimeout(resolve, 60_000));
        return this.fetchEndpoint<T>(path);
      }

      if (!response.ok) {
        log.warn({ status: response.status, path }, "Finnhub HTTP error");
        return null;
      }

      return (await response.json()) as T;
    } catch (error) {
      log.error(
        { err: error instanceof Error ? error : new Error(String(error)), path },
        "Finnhub fetch error"
      );
      return null;
    }
  }
}
