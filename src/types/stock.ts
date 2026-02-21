// src/types/stock.ts
// Types for Stock entities, matching the Prisma schema.

import type { CreatorSummary } from "./creator";
import type { TipSummary } from "./tip";

// ──── Enum mirrors (match Prisma enums exactly) ────

type Exchange = "NSE" | "BSE" | "MCX" | "CRYPTO" | "INDEX";

type MarketCap = "LARGE" | "MID" | "SMALL" | "MICRO";

// ──── Stock price record (daily OHLCV) ────

interface StockPriceData {
  readonly id: string;
  readonly stockId: string;
  readonly date: string;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number | null;
  readonly source: string;
}

// ──── Stock summary (used in lists, search results, tip cards) ────

interface StockSummary {
  readonly id: string;
  readonly symbol: string;
  readonly exchange: Exchange;
  readonly name: string;
  readonly sector: string | null;
  readonly marketCap: MarketCap | null;
  readonly isIndex: boolean;
  readonly lastPrice: number | null;
  readonly lastPriceAt: string | null;
}

// ──── Consensus data (bull vs bear breakdown for a stock) ────

interface StockConsensus {
  readonly bullish: number;
  readonly bearish: number;
}

// ──── Full stock detail (stock page) ────

interface StockDetail {
  readonly id: string;
  readonly symbol: string;
  readonly exchange: Exchange;
  readonly name: string;
  readonly sector: string | null;
  readonly industry: string | null;
  readonly marketCap: MarketCap | null;
  readonly isIndex: boolean;
  readonly isActive: boolean;
  readonly lastPrice: number | null;
  readonly lastPriceAt: string | null;
  readonly createdAt: string;

  // Aggregated tip metrics
  readonly tipCount: number;
  readonly activeTipCount: number;
  readonly consensus: StockConsensus;
  readonly avgAccuracy: number;

  // Related data
  readonly topCreators: readonly CreatorSummary[];
  readonly recentTips: readonly TipSummary[];
  readonly priceHistory: readonly StockPriceData[];
}

export type {
  Exchange,
  MarketCap,
  StockPriceData,
  StockSummary,
  StockConsensus,
  StockDetail,
};
