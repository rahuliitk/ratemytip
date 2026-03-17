// src/lib/scraper/moneycontrol-parser.ts
//
// Specialized parser for MoneyControl brokerage recommendations.
// Unlike the NLP parser used for tweets, MoneyControl data is already
// structured via their JSON API, so we directly create ParsedTip objects
// with high confidence.

import type { MoneyControlRecommendation } from "./moneycontrol";
import { normalizeStockName } from "@/lib/parser/normalizer";

// ──── Types ────

export interface MoneyControlParsedTip {
  readonly stockSymbol: string;
  readonly direction: "BUY" | "SELL";
  readonly entryPrice: number;
  readonly target1: number;
  readonly stopLoss: number;
  readonly timeframe: "POSITIONAL";
  readonly conviction: "LOW" | "MEDIUM" | "HIGH";
  readonly confidence: number;
  readonly brokerageName: string;
  readonly sourceUrl: string;
}

// ──── Constants ────

const DEFAULT_STOP_LOSS_PCT = 0.05; // 5% default stop-loss

// Map MoneyControl recommendation types to BUY/SELL direction
const DIRECTION_MAP: Record<string, "BUY" | "SELL" | null> = {
  buy: "BUY",
  accumulate: "BUY",
  outperform: "BUY",
  overweight: "BUY",
  "strong buy": "BUY",
  sell: "SELL",
  reduce: "SELL",
  underperform: "SELL",
  underweight: "SELL",
  "strong sell": "SELL",
  hold: null,   // Skip — not actionable
  neutral: null, // Skip — not actionable
};

// ──── Parser Functions ────

/**
 * Parse a MoneyControl recommendation into a structured tip.
 * Returns null if the recommendation is not actionable (Hold/Neutral)
 * or if required data is missing.
 */
export function parseMoneyControlRecommendation(
  rec: MoneyControlRecommendation
): MoneyControlParsedTip | null {
  // Map recommendation type to direction
  const direction = DIRECTION_MAP[rec.recommendationType.toLowerCase()] ?? null;

  if (!direction) {
    return null;
  }

  // Use recommendedPrice (CMP at time of recommendation) as entry price,
  // falling back to currentPrice (live CMP) if not available
  const entryPrice = rec.recommendedPrice > 0 ? rec.recommendedPrice : rec.currentPrice;

  if (entryPrice <= 0 || rec.targetPrice <= 0) {
    return null;
  }

  // For BUY: target should be above entry price
  // For SELL: target should be below entry price
  if (direction === "BUY" && rec.targetPrice <= entryPrice) {
    return null;
  }
  if (direction === "SELL" && rec.targetPrice >= entryPrice) {
    return null;
  }

  // Normalize stock name to NSE symbol
  const stockSymbol = normalizeStockName(rec.stockName);

  // Calculate stop-loss (MoneyControl doesn't provide this)
  const stopLoss =
    direction === "BUY"
      ? Math.round(entryPrice * (1 - DEFAULT_STOP_LOSS_PCT) * 100) / 100
      : Math.round(entryPrice * (1 + DEFAULT_STOP_LOSS_PCT) * 100) / 100;

  // Determine conviction based on upside percentage
  let conviction: "LOW" | "MEDIUM" | "HIGH";
  const absUpside = Math.abs(rec.upsidePct);
  if (absUpside >= 20) {
    conviction = "HIGH";
  } else if (absUpside >= 10) {
    conviction = "MEDIUM";
  } else {
    conviction = "LOW";
  }

  return {
    stockSymbol,
    direction,
    entryPrice,
    target1: rec.targetPrice,
    stopLoss,
    timeframe: "POSITIONAL",
    conviction,
    confidence: 0.95, // Structured data from brokerage API = high confidence
    brokerageName: rec.brokerageName,
    sourceUrl: rec.sourceUrl,
  };
}

/**
 * Generate a slug for a brokerage name.
 * e.g., "ICICI Direct" -> "icici-direct"
 */
export function brokerageSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
