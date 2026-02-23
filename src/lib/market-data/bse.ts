// src/lib/market-data/bse.ts
//
// BSE India data feed.
// Backup data source for BSE-listed stocks.
// BSE has a more accessible API compared to NSE.

import { createLogger } from "@/lib/logger";
import type { CurrentPrice, PriceData } from "./types";

const log = createLogger("market-data/bse");

const BSE_API_URL = "https://api.bseindia.com/BseIndiaAPI/api";

/**
 * BSE India market data service.
 *
 * Fetches current and historical price data from the Bombay Stock Exchange.
 * BSE's API is more lenient than NSE's but still requires rate limiting.
 */
export class BseService {
  private readonly requestTimestamps: number[] = [];
  private readonly maxRequestsPerMinute = 30;

  /**
   * Fetch the current price for a BSE-listed stock.
   *
   * @param scripCode - BSE scrip code (e.g., "500325" for Reliance)
   * @returns Current price data or null if unavailable
   */
  async getCurrentPrice(scripCode: string): Promise<CurrentPrice | null> {
    await this.waitForRateLimit();

    interface BseQuoteResponse {
      readonly CurrRate: string;
      readonly PrevClose: string;
      readonly ScripName: string;
      readonly ScripCode: string;
      readonly UpdTime: string;
    }

    try {
      const url = `${BSE_API_URL}/getScripHeaderData/Equity/${encodeURIComponent(scripCode)}`;
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; RateMyTip/1.0)",
          Accept: "application/json",
          Referer: "https://www.bseindia.com/",
        },
      });

      if (!response.ok) {
        log.error({ status: response.status, scripCode }, "BSE quote request failed");
        return null;
      }

      const data = (await response.json()) as { Currdatatable?: string; Header?: BseQuoteResponse };
      const header = data.Header;

      if (!header) return null;

      const currentPrice = parseFloat(header.CurrRate.replace(/,/g, ""));
      const prevClose = parseFloat(header.PrevClose.replace(/,/g, ""));

      if (isNaN(currentPrice) || isNaN(prevClose)) return null;

      const change = currentPrice - prevClose;
      const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;

      return {
        symbol: header.ScripCode,
        price: currentPrice,
        change,
        changePct,
        timestamp: new Date(header.UpdTime),
      };
    } catch (error) {
      log.error(
        { err: error instanceof Error ? error : new Error(String(error)), scripCode },
        "BSE error fetching quote"
      );
      return null;
    }
  }

  /**
   * Fetch historical OHLCV data from BSE.
   *
   * @param scripCode - BSE scrip code
   * @param fromDate - Start date
   * @param toDate - End date
   * @returns Array of daily price data sorted by date ascending
   */
  async getHistoricalPrices(
    scripCode: string,
    fromDate: Date,
    toDate: Date
  ): Promise<PriceData[]> {
    await this.waitForRateLimit();

    const from = formatBseDate(fromDate);
    const to = formatBseDate(toDate);

    interface BseHistoricalData {
      readonly Table: readonly {
        readonly trd_date: string;
        readonly opn_price: string;
        readonly hi_price: string;
        readonly lo_price: string;
        readonly cls_price: string;
        readonly ttl_trd_qty: string;
      }[];
    }

    try {
      const url =
        `${BSE_API_URL}/StockPriceCSVDownload/w` +
        `?Atea=C&Group=EQ&Ession=0&Type=EQ&Flag=0` +
        `&scripcode=${encodeURIComponent(scripCode)}` +
        `&fdate=${from}&tdate=${to}`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; RateMyTip/1.0)",
          Accept: "application/json",
          Referer: "https://www.bseindia.com/",
        },
      });

      if (!response.ok) {
        log.error({ status: response.status, scripCode }, "BSE historical request failed");
        return [];
      }

      const data = (await response.json()) as BseHistoricalData;
      if (!data.Table || data.Table.length === 0) return [];

      return data.Table.map((row) => ({
        symbol: scripCode,
        open: parseFloat(row.opn_price.replace(/,/g, "")),
        high: parseFloat(row.hi_price.replace(/,/g, "")),
        low: parseFloat(row.lo_price.replace(/,/g, "")),
        close: parseFloat(row.cls_price.replace(/,/g, "")),
        volume: parseInt(row.ttl_trd_qty.replace(/,/g, ""), 10) || 0,
        date: new Date(row.trd_date),
        source: "BSE",
      }))
        .filter(
          (p) => !isNaN(p.open) && !isNaN(p.high) && !isNaN(p.low) && !isNaN(p.close)
        )
        .sort((a, b) => a.date.getTime() - b.date.getTime());
    } catch (error) {
      log.error(
        { err: error instanceof Error ? error : new Error(String(error)), scripCode },
        "BSE error fetching historical prices"
      );
      return [];
    }
  }

  /**
   * Search for stocks on BSE by name or code.
   */
  async searchStocks(
    query: string
  ): Promise<{ scripCode: string; name: string; group: string }[]> {
    await this.waitForRateLimit();

    interface BseSearchResult {
      readonly SCRIP_CD: number;
      readonly Scrip_Name: string;
      readonly INDUSTRY: string;
    }

    try {
      const url = `${BSE_API_URL}/Suggest/getSuggestData/${encodeURIComponent(query)}/All`;
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; RateMyTip/1.0)",
          Accept: "application/json",
          Referer: "https://www.bseindia.com/",
        },
      });

      if (!response.ok) return [];

      const data = (await response.json()) as readonly BseSearchResult[];
      return data.map((item) => ({
        scripCode: String(item.SCRIP_CD),
        name: item.Scrip_Name,
        group: item.INDUSTRY,
      }));
    } catch {
      return [];
    }
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

/** Format a Date to DD/MM/YYYY as expected by BSE API */
function formatBseDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
