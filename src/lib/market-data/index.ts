// src/lib/market-data/index.ts
//
// Market data service barrel export and convenience functions.
// Provides a simple interface for fetching prices without
// needing to instantiate service classes directly.

import { subDays } from "date-fns";

import { createLogger } from "@/lib/logger";
import { NseService } from "./nse";
import { YahooFinanceService } from "./yahoo-finance";
import { PriceMonitor } from "./price-monitor";
import type { CurrentPrice, PriceData } from "./types";

const log = createLogger("market-data");

export { NseService } from "./nse";
export { YahooFinanceService } from "./yahoo-finance";
export { PriceMonitor } from "./price-monitor";
export type {
  CurrentPrice,
  HistoricalPriceParams,
  PriceData,
  TipStatusUpdate,
} from "./types";

/** Shared singleton instance of the NSE service */
let nseServiceInstance: NseService | undefined;

function getNseService(): NseService {
  if (!nseServiceInstance) {
    nseServiceInstance = new NseService();
  }
  return nseServiceInstance;
}

/** Shared singleton instance of the Yahoo Finance service */
let yahooServiceInstance: YahooFinanceService | undefined;

function getYahooService(): YahooFinanceService {
  if (!yahooServiceInstance) {
    yahooServiceInstance = new YahooFinanceService();
  }
  return yahooServiceInstance;
}

/** Shared singleton instance of the price monitor */
let priceMonitorInstance: PriceMonitor | undefined;

export function getPriceMonitor(): PriceMonitor {
  if (!priceMonitorInstance) {
    priceMonitorInstance = new PriceMonitor(getYahooService());
  }
  return priceMonitorInstance;
}

/**
 * Fetch the current price for a stock.
 * Uses NSE as primary source for Indian equities, falling back to Yahoo Finance.
 *
 * @param symbol - Stock symbol (e.g. "AAPL", "RELIANCE", "BTC")
 * @param exchange - Exchange code (e.g. "NYSE", "NSE", "CRYPTO")
 * @returns Current price data or null if unavailable
 */
export async function fetchCurrentPrice(
  symbol: string,
  exchange: string
): Promise<CurrentPrice | null> {
  // Try NSE first for Indian equities only (INDEX may include global indices)
  if (exchange === "NSE") {
    try {
      const nsePrice = await getNseService().getCurrentPrice(symbol);
      if (nsePrice) return nsePrice;
    } catch {
      // NSE unavailable — fall through to Yahoo
    }
    log.warn({ symbol }, "NSE price unavailable, falling back to Yahoo");
  }

  // Fallback to Yahoo Finance for all exchanges
  return getYahooService().getCurrentPrice(symbol, exchange);
}

/**
 * Fetch historical daily OHLCV data for a stock.
 *
 * @param symbol - Stock symbol
 * @param exchange - Exchange code
 * @param days - Number of days of history to fetch (default: 90)
 * @returns Array of PriceData sorted by date ascending
 */
export async function fetchHistoricalPrices(
  symbol: string,
  exchange: string,
  days = 90
): Promise<PriceData[]> {
  const endDate = new Date();
  const startDate = subDays(endDate, days);

  return getYahooService().getHistoricalPrices(
    { symbol, startDate, endDate, interval: "1d" },
    exchange
  );
}
