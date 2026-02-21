// src/lib/market-data/yahoo-finance.ts
//
// Yahoo Finance data fetcher.
// Primary data source for current and historical stock prices.
// Handles rate limiting and exchange suffix mapping for global markets.

import type {
  CurrentPrice,
  HistoricalPriceParams,
  PriceData,
  YahooChartResponse,
  YahooQuoteResponse,
} from "./types";

const YAHOO_QUOTE_URL = "https://query1.finance.yahoo.com/v7/finance/quote";
const YAHOO_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart";

/** Exchange suffix map for Yahoo Finance ticker symbols */
const EXCHANGE_SUFFIX: Record<string, string> = {
  // Americas — no suffix for US exchanges
  NYSE: "",
  NASDAQ: "",
  TSX: ".TO",
  // Europe
  LSE: ".L",
  XETRA: ".DE",
  EURONEXT: ".PA",
  // Asia-Pacific
  NSE: ".NS",
  BSE: ".BO",
  TSE: ".T",
  HKEX: ".HK",
  ASX: ".AX",
  KRX: ".KS",
  SGX: ".SI",
  // Other
  MCX: ".NS",
  CRYPTO: "-USD",  // e.g., BTC-USD
  INDEX: "",       // Indices vary; handled in toYahooSymbol
};

/**
 * Yahoo Finance data service.
 *
 * Fetches current quotes and historical OHLCV data for global market stocks and crypto.
 * Implements sliding-window rate limiting to stay within the configured
 * requests-per-second threshold.
 */
export class YahooFinanceService {
  private readonly rateLimit: number;
  private readonly requestTimestamps: number[] = [];

  constructor() {
    this.rateLimit = parseInt(
      process.env.YAHOO_FINANCE_RATE_LIMIT ?? "5",
      10
    );
  }

  /**
   * Fetch the current quote for a single stock.
   *
   * @param symbol - Stock symbol (e.g. "AAPL", "RELIANCE", "BTC")
   * @param exchange - Exchange code used to determine the Yahoo suffix (default: "NYSE")
   * @returns Current price data or null if the quote could not be fetched
   */
  async getCurrentPrice(
    symbol: string,
    exchange = "NYSE"
  ): Promise<CurrentPrice | null> {
    const yahooSymbol = this.toYahooSymbol(symbol, exchange);

    try {
      await this.waitForRateLimit();

      // Use v8 chart API (v7 quote API now requires authentication)
      const url = `${YAHOO_CHART_URL}/${encodeURIComponent(yahooSymbol)}?range=1d&interval=1d`;
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        console.error(
          `[YahooFinance] Chart request failed: ${response.status} for ${yahooSymbol}`
        );
        return null;
      }

      const data = (await response.json()) as YahooChartResponse;

      if (data.chart.error) {
        console.warn(
          `[YahooFinance] Chart API error for ${yahooSymbol}:`,
          data.chart.error.description
        );
        return null;
      }

      if (!data.chart.result || data.chart.result.length === 0) {
        console.warn(
          `[YahooFinance] No chart data returned for ${yahooSymbol}`
        );
        return null;
      }

      const result = data.chart.result[0];
      if (result === undefined) {
        return null;
      }

      const meta = result.meta as unknown as {
        regularMarketPrice: number;
        regularMarketTime: number;
        previousClose?: number;
      };

      const prevClose = meta.previousClose ?? meta.regularMarketPrice;
      const priceChange = meta.regularMarketPrice - prevClose;
      const priceChangePct = prevClose > 0 ? (priceChange / prevClose) * 100 : 0;

      return {
        symbol,
        price: meta.regularMarketPrice,
        change: priceChange,
        changePct: priceChangePct,
        timestamp: new Date(meta.regularMarketTime * 1000),
      };
    } catch (error) {
      console.error(
        `[YahooFinance] Error fetching quote for ${yahooSymbol}:`,
        error instanceof Error ? error.message : String(error)
      );
      return null;
    }
  }

  /**
   * Fetch historical OHLCV data for a stock.
   *
   * @param params - Symbol, date range, and optional interval
   * @param exchange - Exchange code for Yahoo suffix mapping (default: "NSE")
   * @returns Array of PriceData sorted by date ascending
   */
  async getHistoricalPrices(
    params: HistoricalPriceParams,
    exchange = "NYSE"
  ): Promise<PriceData[]> {
    const yahooSymbol = this.toYahooSymbol(params.symbol, exchange);
    const interval = params.interval ?? "1d";

    // Yahoo Finance expects UNIX timestamps in seconds
    const period1 = Math.floor(params.startDate.getTime() / 1000);
    const period2 = Math.floor(params.endDate.getTime() / 1000);

    try {
      await this.waitForRateLimit();

      const url =
        `${YAHOO_CHART_URL}/${encodeURIComponent(yahooSymbol)}` +
        `?period1=${period1}&period2=${period2}&interval=${interval}`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; RateMyTip/1.0)",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        console.error(
          `[YahooFinance] Chart request failed: ${response.status} for ${yahooSymbol}`
        );
        return [];
      }

      const data = (await response.json()) as YahooChartResponse;

      if (data.chart.error) {
        console.error(
          `[YahooFinance] Chart API error for ${yahooSymbol}:`,
          data.chart.error.description
        );
        return [];
      }

      if (!data.chart.result || data.chart.result.length === 0) {
        console.warn(
          `[YahooFinance] No chart data returned for ${yahooSymbol}`
        );
        return [];
      }

      const result = data.chart.result[0];
      if (result === undefined) {
        return [];
      }

      return this.parseChartResponse(params.symbol, result);
    } catch (error) {
      console.error(
        `[YahooFinance] Error fetching historical prices for ${yahooSymbol}:`,
        error instanceof Error ? error.message : String(error)
      );
      return [];
    }
  }

  /**
   * Convert a chart API response into an array of PriceData objects.
   * Filters out days with null/missing data points.
   */
  private parseChartResponse(
    symbol: string,
    result: {
      readonly timestamp: readonly number[];
      readonly indicators: {
        readonly quote: readonly {
          readonly open: (number | null)[];
          readonly high: (number | null)[];
          readonly low: (number | null)[];
          readonly close: (number | null)[];
          readonly volume: (number | null)[];
        }[];
      };
    }
  ): PriceData[] {
    const { timestamp, indicators } = result;
    const quote = indicators.quote[0];

    if (!quote) {
      return [];
    }

    const prices: PriceData[] = [];

    for (let i = 0; i < timestamp.length; i++) {
      const ts = timestamp[i];
      const open = quote.open[i];
      const high = quote.high[i];
      const low = quote.low[i];
      const close = quote.close[i];
      const volume = quote.volume[i];

      // Skip data points where any core OHLC value is null
      if (
        ts === undefined ||
        open === null ||
        open === undefined ||
        high === null ||
        high === undefined ||
        low === null ||
        low === undefined ||
        close === null ||
        close === undefined
      ) {
        continue;
      }

      prices.push({
        symbol,
        open,
        high,
        low,
        close,
        volume: volume ?? 0,
        date: new Date(ts * 1000),
        source: "YAHOO",
      });
    }

    return prices;
  }

  /**
   * Convert a stock symbol and exchange to a Yahoo Finance ticker.
   * Each exchange has a specific suffix (e.g., .NS for NSE, .L for LSE, none for NYSE).
   */
  private toYahooSymbol(symbol: string, exchange: string): string {
    const suffix = EXCHANGE_SUFFIX[exchange] ?? "";
    // Some symbols already have a suffix (e.g. "NIFTY 50" on INDEX)
    // or are indices that need special handling
    const cleanSymbol = symbol.replace(/\s+/g, "");
    return `${cleanSymbol}${suffix}`;
  }

  /**
   * Enforce rate limiting using a sliding window approach.
   * Waits if the number of requests in the last second exceeds the limit.
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const windowMs = 1000; // 1 second window

    // Remove timestamps older than the window
    while (
      this.requestTimestamps.length > 0 &&
      this.requestTimestamps[0] !== undefined &&
      this.requestTimestamps[0] < now - windowMs
    ) {
      this.requestTimestamps.shift();
    }

    // If at the limit, wait until the oldest request in the window expires
    if (this.requestTimestamps.length >= this.rateLimit) {
      const oldestTimestamp = this.requestTimestamps[0];
      if (oldestTimestamp !== undefined) {
        const waitTime = oldestTimestamp + windowMs - now + 10; // +10ms buffer
        if (waitTime > 0) {
          await new Promise<void>((resolve) => {
            setTimeout(resolve, waitTime);
          });
        }
      }
    }

    // Record this request
    this.requestTimestamps.push(Date.now());
  }
}
