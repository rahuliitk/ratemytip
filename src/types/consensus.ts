// src/types/consensus.ts
// Types for AnalystConsensus data — aggregate analyst sentiment per stock.

/** A single analyst consensus snapshot from a data source */
interface AnalystConsensusData {
  readonly id: string;
  readonly stockId: string;
  readonly source: "FINNHUB" | "YAHOO_FINANCE";
  readonly strongBuy: number;
  readonly buy: number;
  readonly hold: number;
  readonly sell: number;
  readonly strongSell: number;
  readonly targetHigh: number | null;
  readonly targetLow: number | null;
  readonly targetMean: number | null;
  readonly targetMedian: number | null;
  readonly numberOfAnalysts: number | null;
  readonly period: string | null;
  readonly fetchedAt: string;
}

/** Finnhub recommendation trend response item */
interface FinnhubRecommendationTrend {
  readonly buy: number;
  readonly hold: number;
  readonly period: string;
  readonly sell: number;
  readonly strongBuy: number;
  readonly strongSell: number;
  readonly symbol: string;
}

/** Finnhub price target response */
interface FinnhubPriceTarget {
  readonly lastUpdated: string;
  readonly symbol: string;
  readonly targetHigh: number;
  readonly targetLow: number;
  readonly targetMean: number;
  readonly targetMedian: number;
}

/** Finnhub upgrade/downgrade record */
interface FinnhubUpgradeDowngrade {
  readonly symbol: string;
  readonly company: string;
  readonly action: string;
  readonly fromGrade: string;
  readonly toGrade: string;
  readonly gradeTime: number;
}

/** Yahoo Finance recommendation trend item */
interface YahooRecommendationTrend {
  readonly period: string;
  readonly strongBuy: number;
  readonly buy: number;
  readonly hold: number;
  readonly sell: number;
  readonly strongSell: number;
}

/** Yahoo Finance upgrade/downgrade history item */
interface YahooUpgradeDowngrade {
  readonly epochGradeDate: number;
  readonly firm: string;
  readonly toGrade: string;
  readonly fromGrade: string;
  readonly action: string;
}

export type {
  AnalystConsensusData,
  FinnhubRecommendationTrend,
  FinnhubPriceTarget,
  FinnhubUpgradeDowngrade,
  YahooRecommendationTrend,
  YahooUpgradeDowngrade,
};
