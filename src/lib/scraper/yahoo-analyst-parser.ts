// src/lib/scraper/yahoo-analyst-parser.ts
//
// Converts Yahoo Finance upgrade/downgrade records into structured tips.
// Same pattern as finnhub-parser.ts — structured data bypasses NLP.

import { YAHOO_ANALYST } from "@/lib/constants";
import type { YahooUpgradeDowngrade } from "@/types/consensus";

// ──── Types ────

export interface YahooAnalystParsedTip {
  readonly stockSymbol: string;
  readonly direction: "BUY" | "SELL";
  readonly entryPrice: number;
  readonly target1: number;
  readonly stopLoss: number;
  readonly timeframe: "LONG_TERM";
  readonly conviction: "LOW" | "MEDIUM" | "HIGH";
  readonly confidence: number;
  readonly firmName: string;
  readonly action: string;
  readonly fromGrade: string;
  readonly toGrade: string;
}

// ──── Grade-to-direction mapping ────

/** Yahoo grade names that indicate a BUY direction */
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
  "long-term buy",
  "add",
]);

/** Yahoo grade names that indicate a SELL direction */
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

function gradeToDirection(grade: string): "BUY" | "SELL" | null {
  const normalized = grade.toLowerCase().trim();
  if (BUY_GRADES.has(normalized)) return "BUY";
  if (SELL_GRADES.has(normalized)) return "SELL";
  return null;
}

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

  if (actionLower === "init" || actionLower === "initiated") {
    return "MEDIUM";
  }

  return "LOW";
}

/**
 * Parse a Yahoo Finance upgrade/downgrade record into a structured tip.
 * Returns null if the grade is not directional (Hold/Neutral/Equal-Weight).
 *
 * @param record - Yahoo upgrade/downgrade record
 * @param stockSymbol - The canonical stock symbol (not Yahoo format)
 * @param currentPrice - Current stock price
 * @param targetMean - Consensus mean target price from financialData
 */
export function parseYahooUpgradeDowngrade(
  record: YahooUpgradeDowngrade,
  stockSymbol: string,
  currentPrice: number,
  targetMean: number | null
): YahooAnalystParsedTip | null {
  const direction = gradeToDirection(record.toGrade);
  if (!direction) return null;

  if (currentPrice <= 0) return null;

  // Use consensus target if available
  let target1: number;
  if (targetMean && targetMean > 0) {
    target1 = targetMean;
  } else {
    target1 =
      direction === "BUY"
        ? Math.round(currentPrice * 1.15 * 100) / 100
        : Math.round(currentPrice * 0.85 * 100) / 100;
  }

  // Validate target direction
  if (direction === "BUY" && target1 <= currentPrice) {
    target1 = Math.round(currentPrice * 1.15 * 100) / 100;
  }
  if (direction === "SELL" && target1 >= currentPrice) {
    target1 = Math.round(currentPrice * 0.85 * 100) / 100;
  }

  const stopLoss =
    direction === "BUY"
      ? Math.round(
          currentPrice * (1 - YAHOO_ANALYST.DEFAULT_STOP_LOSS_PCT) * 100
        ) / 100
      : Math.round(
          currentPrice * (1 + YAHOO_ANALYST.DEFAULT_STOP_LOSS_PCT) * 100
        ) / 100;

  const conviction = determineConviction(record.action, record.toGrade);

  return {
    stockSymbol,
    direction,
    entryPrice: currentPrice,
    target1,
    stopLoss,
    timeframe: YAHOO_ANALYST.DEFAULT_TIMEFRAME,
    conviction,
    confidence: YAHOO_ANALYST.CONFIDENCE,
    firmName: record.firm,
    action: record.action,
    fromGrade: record.fromGrade,
    toGrade: record.toGrade,
  };
}

/**
 * Generate a slug for a firm name.
 */
export function firmSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
