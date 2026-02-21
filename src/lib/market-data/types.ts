// src/lib/market-data/types.ts
//
// Type definitions for the market data service.
// Covers price data structures, monitoring outputs, and API params.

/** OHLCV price data for a single trading day or period */
export interface PriceData {
  readonly symbol: string;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number;
  readonly date: Date;
  readonly source: string;
}

/** Real-time or near-real-time price quote for a stock */
export interface CurrentPrice {
  readonly symbol: string;
  readonly price: number;
  readonly change: number;
  readonly changePct: number;
  readonly timestamp: Date;
}

/** Parameters for fetching historical OHLCV data */
export interface HistoricalPriceParams {
  readonly symbol: string;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly interval?: "1d" | "1wk" | "1mo";
}

/** Record of a tip status change triggered by price monitoring */
export interface TipStatusUpdate {
  readonly tipId: string;
  readonly oldStatus: string;
  readonly newStatus: string;
  readonly price: number;
  readonly timestamp: Date;
}

/** Yahoo Finance quote response fields we use */
export interface YahooQuoteResult {
  readonly symbol: string;
  readonly regularMarketPrice: number;
  readonly regularMarketChange: number;
  readonly regularMarketChangePercent: number;
  readonly regularMarketTime: number;
}

/** Yahoo Finance chart data point */
export interface YahooChartIndicator {
  readonly open: (number | null)[];
  readonly high: (number | null)[];
  readonly low: (number | null)[];
  readonly close: (number | null)[];
  readonly volume: (number | null)[];
}

/** Yahoo Finance chart API response structure */
export interface YahooChartResponse {
  readonly chart: {
    readonly result: readonly {
      readonly meta: {
        readonly symbol: string;
        readonly currency: string;
      };
      readonly timestamp: readonly number[];
      readonly indicators: {
        readonly quote: readonly YahooChartIndicator[];
      };
    }[] | null;
    readonly error: { readonly description: string } | null;
  };
}

/** Yahoo Finance quote API response structure */
export interface YahooQuoteResponse {
  readonly quoteResponse: {
    readonly result: readonly YahooQuoteResult[];
    readonly error: string | null;
  };
}
