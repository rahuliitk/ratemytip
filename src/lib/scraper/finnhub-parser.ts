// src/lib/scraper/finnhub-parser.ts
//
// Converts Finnhub upgrade/downgrade records into structured tips.
// Follows the same pattern as moneycontrol-parser.ts — structured data
// bypasses the NLP pipeline and is auto-approved.

import { FINNHUB } from "@/lib/constants";
import type { FinnhubUpgradeDowngrade } from "@/types/consensus";

// ──── Types ────

export interface FinnhubParsedTip {
  readonly stockSymbol: string;
  readonly direction: "BUY" | "SELL";
  readonly entryPrice: number;
  readonly target1: number;
  readonly stopLoss: number;
  readonly timeframe: "LONG_TERM";
  readonly conviction: "LOW" | "MEDIUM" | "HIGH";
  readonly confidence: number;
  readonly brokerageName: string;
  readonly action: string;
  readonly fromGrade: string;
  readonly toGrade: string;
}

// ──── Grade-to-direction mapping ────

/** Grades that indicate a BUY direction */
const BUY_GRADES = new Set([
  "buy",
  "strong buy",
  "outperform",
  "overweight",
  "positive",
  "sector outperform",
  "market outperform",
  "top pick",
  "conviction buy",
  "accumulate",
]);

/** Grades that indicate a SELL direction */
const SELL_GRADES = new Set([
  "sell",
  "strong sell",
  "underperform",
  "underweight",
  "negative",
  "sector underperform",
  "market underperform",
  "reduce",
]);

// ──── Parser Functions ────

/**
 * Determine direction from the target grade (toGrade).
 * Returns null for Hold/Neutral/Equal-Weight — these are not actionable.
 */
function gradeToDirection(grade: string): "BUY" | "SELL" | null {
  const normalized = grade.toLowerCase().trim();
  if (BUY_GRADES.has(normalized)) return "BUY";
  if (SELL_GRADES.has(normalized)) return "SELL";
  return null;
}

/**
 * Determine conviction from the action type and grade change.
 *
 * - Upgrade to Buy/Strong Buy = HIGH conviction
 * - Initiated with Buy = MEDIUM conviction
 * - Reiterated = LOW conviction
 * - Downgrade to Sell = HIGH conviction
 */
function determineConviction(
  action: string,
  toGrade: string
): "LOW" | "MEDIUM" | "HIGH" {
  const actionLower = action.toLowerCase();
  const gradeLower = toGrade.toLowerCase();

  if (
    actionLower === "upgrade" &&
    (gradeLower.includes("buy") || gradeLower.includes("outperform"))
  ) {
    return "HIGH";
  }

  if (
    actionLower === "downgrade" &&
    (gradeLower.includes("sell") || gradeLower.includes("underperform"))
  ) {
    return "HIGH";
  }

  if (actionLower === "initiated" || actionLower === "init") {
    return "MEDIUM";
  }

  // Reiterated, maintained, etc.
  return "LOW";
}

/**
 * Parse a Finnhub upgrade/downgrade record into a structured tip.
 * Returns null if the grade is not directional (Hold/Neutral).
 *
 * @param record - The Finnhub upgrade/downgrade record
 * @param currentPrice - The current stock price (needed for stop-loss calculation)
 * @param targetMean - The consensus mean target price (used as target1)
 */
export function parseFinnhubUpgradeDowngrade(
  record: FinnhubUpgradeDowngrade,
  currentPrice: number,
  targetMean: number | null
): FinnhubParsedTip | null {
  const direction = gradeToDirection(record.toGrade);
  if (!direction) return null;

  if (currentPrice <= 0) return null;

  // Use consensus target price if available, otherwise estimate from direction
  let target1: number;
  if (targetMean && targetMean > 0) {
    target1 = targetMean;
  } else {
    // Fallback: assume 15% upside for BUY, 15% downside for SELL
    target1 =
      direction === "BUY"
        ? Math.round(currentPrice * 1.15 * 100) / 100
        : Math.round(currentPrice * 0.85 * 100) / 100;
  }

  // Validate target direction makes sense
  if (direction === "BUY" && target1 <= currentPrice) {
    target1 = Math.round(currentPrice * 1.15 * 100) / 100;
  }
  if (direction === "SELL" && target1 >= currentPrice) {
    target1 = Math.round(currentPrice * 0.85 * 100) / 100;
  }

  // Calculate stop-loss
  const stopLoss =
    direction === "BUY"
      ? Math.round(currentPrice * (1 - FINNHUB.DEFAULT_STOP_LOSS_PCT) * 100) /
        100
      : Math.round(currentPrice * (1 + FINNHUB.DEFAULT_STOP_LOSS_PCT) * 100) /
        100;

  const conviction = determineConviction(record.action, record.toGrade);

  return {
    stockSymbol: record.symbol,
    direction,
    entryPrice: currentPrice,
    target1,
    stopLoss,
    timeframe: FINNHUB.DEFAULT_TIMEFRAME,
    conviction,
    confidence: FINNHUB.CONFIDENCE,
    brokerageName: record.company,
    action: record.action,
    fromGrade: record.fromGrade,
    toGrade: record.toGrade,
  };
}

/**
 * Generate a slug for a brokerage name (same pattern as moneycontrol-parser).
 */
export function brokerageSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
