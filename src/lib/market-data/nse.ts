// src/lib/market-data/nse.ts
//
// NSE India data feed.
// Backup data source for Indian equities when Yahoo Finance is unavailable.
// NSE's unofficial API requires cookie-based session management.

import type { CurrentPrice, PriceData } from "./types";

const NSE_BASE_URL = "https://www.nseindia.com";
const NSE_API_URL = "https://www.nseindia.com/api";

/**
 * NSE India market data service.
 *
 * Uses NSE's unofficial web API endpoints which require a valid session
 * cookie obtained by first visiting the homepage. Implements session
 * management and rate limiting to avoid getting blocked.
 */
export class NseService {
  private cookie: string | null = null;
  private cookieExpiry = 0;
  private readonly requestTimestamps: number[] = [];
  private readonly maxRequestsPerMinute = 30;

  /**
   * Refresh the session cookie by hitting the NSE homepage.
   * NSE requires a valid cookie for API access — without it,
   * API calls return 401 or redirect to the homepage.
   */
  private async refreshCookie(): Promise<void> {
    const now = Date.now();
    if (this.cookie && now < this.cookieExpiry) return;

    try {
      const response = await fetch(NSE_BASE_URL, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
        redirect: "follow",
      });

      const setCookie = response.headers.get("set-cookie");
      if (setCookie) {
        this.cookie = setCookie.split(";")[0] ?? null;
        this.cookieExpiry = now + 4 * 60 * 1000; // 4 minutes
      }
    } catch (error) {
      console.error(
        "[NSE] Failed to refresh cookie:",
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Make an authenticated request to the NSE API.
   */
  private async apiRequest<T>(endpoint: string): Promise<T | null> {
    await this.refreshCookie();
    await this.waitForRateLimit();

    if (!this.cookie) {
      console.warn("[NSE] No session cookie available");
      return null;
    }

    try {
      const response = await fetch(`${NSE_API_URL}${endpoint}`, {
        headers: {
          Cookie: this.cookie,
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "application/json",
          Referer: NSE_BASE_URL,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          this.cookie = null;
          this.cookieExpiry = 0;
        }
        console.error(`[NSE] API request failed: ${response.status} ${endpoint}`);
        return null;
      }

      return (await response.json()) as T;
    } catch (error) {
      console.error(
        `[NSE] Error fetching ${endpoint}:`,
        error instanceof Error ? error.message : String(error)
      );
      return null;
    }
  }

  /**
   * Fetch the current price for an NSE-listed stock.
   *
   * @param symbol - NSE stock symbol (e.g., "RELIANCE", "TCS")
   * @returns Current price data or null if unavailable
   */
  async getCurrentPrice(symbol: string): Promise<CurrentPrice | null> {
    interface NseQuoteData {
      readonly priceInfo: {
        readonly lastPrice: number;
        readonly change: number;
        readonly pChange: number;
        readonly previousClose: number;
      };
      readonly metadata: {
        readonly symbol: string;
        readonly lastUpdateTime: string;
      };
    }

    const data = await this.apiRequest<NseQuoteData>(
      `/quote-equity?symbol=${encodeURIComponent(symbol)}`
    );

    if (!data?.priceInfo) return null;

    return {
      symbol,
      price: data.priceInfo.lastPrice,
      change: data.priceInfo.change,
      changePct: data.priceInfo.pChange,
      timestamp: new Date(data.metadata.lastUpdateTime),
    };
  }

  /**
   * Fetch historical OHLCV data from NSE for a given symbol.
   * NSE provides limited historical data (typically last 1-2 years).
   *
   * @param symbol - NSE stock symbol
   * @param fromDate - Start date (DD-MM-YYYY format required by NSE)
   * @param toDate - End date
   * @returns Array of daily price data
   */
  async getHistoricalPrices(
    symbol: string,
    fromDate: Date,
    toDate: Date
  ): Promise<PriceData[]> {
    const from = formatNseDate(fromDate);
    const to = formatNseDate(toDate);

    interface NseHistoricalResponse {
      readonly data: readonly {
        readonly CH_TIMESTAMP: string;
        readonly CH_OPENING_PRICE: number;
        readonly CH_TRADE_HIGH_PRICE: number;
        readonly CH_TRADE_LOW_PRICE: number;
        readonly CH_CLOSING_PRICE: number;
        readonly CH_TOT_TRADED_QTY: number;
      }[];
    }

    const data = await this.apiRequest<NseHistoricalResponse>(
      `/historical/cm/equity?symbol=${encodeURIComponent(symbol)}&from=${from}&to=${to}`
    );

    if (!data?.data) return [];

    return data.data.map((d) => ({
      symbol,
      open: d.CH_OPENING_PRICE,
      high: d.CH_TRADE_HIGH_PRICE,
      low: d.CH_TRADE_LOW_PRICE,
      close: d.CH_CLOSING_PRICE,
      volume: d.CH_TOT_TRADED_QTY,
      date: new Date(d.CH_TIMESTAMP),
      source: "NSE",
    }));
  }

  /**
   * Fetch market status (open/closed/pre-open).
   */
  async getMarketStatus(): Promise<{ isOpen: boolean; status: string } | null> {
    interface NseMarketStatus {
      readonly marketState: readonly {
        readonly market: string;
        readonly marketStatus: string;
      }[];
    }

    const data = await this.apiRequest<NseMarketStatus>("/marketStatus");
    if (!data?.marketState) return null;

    const equity = data.marketState.find((m) => m.market === "Capital Market");
    if (!equity) return null;

    return {
      isOpen: equity.marketStatus === "Open",
      status: equity.marketStatus,
    };
  }

  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const windowMs = 60_000;

    while (
      this.requestTimestamps.length > 0 &&
      this.requestTimestamps[0] !== undefined &&
      this.requestTimestamps[0] < now - windowMs
    ) {
      this.requestTimestamps.shift();
    }

    if (this.requestTimestamps.length >= this.maxRequestsPerMinute) {
      const oldestTimestamp = this.requestTimestamps[0];
      if (oldestTimestamp !== undefined) {
        const waitTime = oldestTimestamp + windowMs - now + 100;
        if (waitTime > 0) {
          await new Promise<void>((resolve) => {
            setTimeout(resolve, waitTime);
          });
        }
      }
    }

    this.requestTimestamps.push(Date.now());
  }
}

/** Format a Date to DD-MM-YYYY as required by NSE API */
function formatNseDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}
