// src/lib/scraper/yahoo-analyst.ts
//
// Fetches analyst recommendation and upgrade/downgrade data from
// Yahoo Finance quoteSummary endpoint. Covers global stocks including
// Indian equities (.NS/.BO symbols).
//
// Endpoint (unofficial, no API key required):
//   GET https://query2.finance.yahoo.com/v10/finance/quoteSummary/{symbol}
//       ?modules=recommendationTrend,upgradeDowngradeHistory,financialData

import { createLogger } from "@/lib/logger";
import { RateLimiter } from "./rate-limiter";
import type {
  YahooRecommendationTrend,
  YahooUpgradeDowngrade,
} from "@/types/consensus";

const log = createLogger("scraper/yahoo-analyst");

// ──── Yahoo Finance response types ────

interface YahooQuoteSummaryResult {
  readonly recommendationTrend?: {
    readonly trend: readonly YahooRecommendationTrend[];
  };
  readonly upgradeDowngradeHistory?: {
    readonly history: readonly YahooUpgradeDowngrade[];
  };
  readonly financialData?: {
    readonly currentPrice?: { readonly raw: number };
    readonly targetHighPrice?: { readonly raw: number };
    readonly targetLowPrice?: { readonly raw: number };
    readonly targetMeanPrice?: { readonly raw: number };
    readonly targetMedianPrice?: { readonly raw: number };
    readonly numberOfAnalystOpinions?: { readonly raw: number };
  };
}

interface YahooQuoteSummaryResponse {
  readonly quoteSummary?: {
    readonly result?: readonly YahooQuoteSummaryResult[];
    readonly error?: { readonly description: string } | null;
  };
}

// ──── Exported result type ────

export interface YahooAnalystData {
  readonly recommendations: readonly YahooRecommendationTrend[];
  readonly upgrades: readonly YahooUpgradeDowngrade[];
  readonly currentPrice: number | null;
  readonly targetHigh: number | null;
  readonly targetLow: number | null;
  readonly targetMean: number | null;
  readonly targetMedian: number | null;
  readonly numberOfAnalysts: number | null;
}

// ──── Exchange-to-Yahoo symbol mapping ────

const EXCHANGE_SUFFIX: Record<string, string> = {
  NSE: ".NS",
  BSE: ".BO",
  TSE: ".T",
  HKEX: ".HK",
  ASX: ".AX",
  LSE: ".L",
  XETRA: ".DE",
  EURONEXT: ".PA",
  KRX: ".KS",
  SGX: ".SI",
  TSX: ".TO",
};

const INDEX_SYMBOLS: Record<string, string> = {
  SPX: "^GSPC",
  DJI: "^DJI",
  IXIC: "^IXIC",
  UKX: "^FTSE",
  DAX: "^GDAXI",
  CAC: "^FCHI",
  NI225: "^N225",
  HSI: "^HSI",
  "NIFTY 50": "^NSEI",
  "NIFTY BANK": "^NSEBANK",
  SENSEX: "^BSESN",
};

// ──── Scraper Class ────

export class YahooAnalystScraper {
  private readonly rateLimiter: RateLimiter;

  constructor(rateLimiter: RateLimiter) {
    this.rateLimiter = rateLimiter;
  }

  /**
   * Convert a canonical stock symbol + exchange to Yahoo Finance format.
   */
  static toYahooSymbol(symbol: string, exchange: string): string {
    // Check index mapping first
    const indexSymbol = INDEX_SYMBOLS[symbol];
    if (indexSymbol) return indexSymbol;

    // For US exchanges, symbol is used directly
    if (exchange === "NYSE" || exchange === "NASDAQ") return symbol;

    // Add exchange suffix
    const suffix = EXCHANGE_SUFFIX[exchange];
    if (suffix) return `${symbol}${suffix}`;

    return symbol;
  }

  /**
   * Fetch analyst data for a single symbol from Yahoo Finance.
   */
  async getAnalystData(
    symbol: string,
    exchange: string
  ): Promise<YahooAnalystData | null> {
    const yahooSymbol = YahooAnalystScraper.toYahooSymbol(symbol, exchange);
    const modules =
      "recommendationTrend,upgradeDowngradeHistory,financialData";
    const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(yahooSymbol)}?modules=${modules}`;

    await this.rateLimiter.waitForSlot();
    this.rateLimiter.recordRequest();

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (response.status === 429) {
        log.warn({ symbol: yahooSymbol }, "Yahoo Analyst rate limited — waiting 30s");
        await new Promise((resolve) => setTimeout(resolve, 30_000));
        return null;
      }

      if (!response.ok) {
        log.warn({ status: response.status, symbol: yahooSymbol }, "Yahoo Analyst HTTP error");
        return null;
      }

      const json = (await response.json()) as YahooQuoteSummaryResponse;
      const result = json.quoteSummary?.result?.[0];

      if (!result) return null;

      const financialData = result.financialData;

      return {
        recommendations: result.recommendationTrend?.trend ?? [],
        upgrades: result.upgradeDowngradeHistory?.history ?? [],
        currentPrice: financialData?.currentPrice?.raw ?? null,
        targetHigh: financialData?.targetHighPrice?.raw ?? null,
        targetLow: financialData?.targetLowPrice?.raw ?? null,
        targetMean: financialData?.targetMeanPrice?.raw ?? null,
        targetMedian: financialData?.targetMedianPrice?.raw ?? null,
        numberOfAnalysts:
          financialData?.numberOfAnalystOpinions?.raw ?? null,
      };
    } catch (error) {
      log.error(
        { err: error instanceof Error ? error : new Error(String(error)), symbol: yahooSymbol },
        "Yahoo Analyst fetch error"
      );
      return null;
    }
  }
}
