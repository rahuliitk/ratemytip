// src/lib/parser/confidence.ts

import type { RawExtraction } from "./types";

/**
 * Confidence thresholds for field extraction.
 *
 * Scoring is based on how many of the four core fields were extracted:
 *   - stock symbol
 *   - entry price
 *   - at least one target
 *   - stop loss
 *
 * All 4 fields present  -> confidence >= 0.90
 * 3 of 4 fields present -> confidence ~= 0.70
 * 2 of 4 fields present -> confidence ~= 0.50
 * 1 or 0 fields present -> confidence ~= 0.30
 */

/** Base confidence for each number of extracted core fields */
const CONFIDENCE_BY_FIELD_COUNT: Record<number, number> = {
  4: 0.90,
  3: 0.70,
  2: 0.50,
  1: 0.30,
  0: 0.10,
};

/** Small bonus for additional signals that increase certainty */
const BONUS = {
  HAS_DIRECTION: 0.03,
  HAS_TIMEFRAME: 0.03,
  HAS_MULTIPLE_TARGETS: 0.02,
  HAS_ENTRY_AND_SL_LOGICAL: 0.02,
} as const;

/**
 * Calculate a confidence score (0 to 1) for a raw extraction result.
 *
 * The score reflects how likely it is that the source text contains
 * a genuine, actionable stock tip with all required fields.
 *
 * @param extraction - The raw extraction from the rule-based parser
 * @returns A confidence value between 0 and 1
 */
export function calculateConfidence(extraction: RawExtraction): number {
  let coreFieldsFound = 0;

  const hasStock = extraction.stockSymbols.length > 0;
  const hasEntry = extraction.entryPrices.length > 0;
  const hasTarget = extraction.targets.length > 0;
  const hasStopLoss = extraction.stopLosses.length > 0;

  if (hasStock) coreFieldsFound++;
  if (hasEntry) coreFieldsFound++;
  if (hasTarget) coreFieldsFound++;
  if (hasStopLoss) coreFieldsFound++;

  // Start with the base confidence for the number of core fields found
  let confidence = CONFIDENCE_BY_FIELD_COUNT[coreFieldsFound] ?? 0.10;

  // Apply bonuses for additional signals
  if (extraction.directions.length > 0) {
    confidence += BONUS.HAS_DIRECTION;
  }

  if (extraction.timeframes.length > 0) {
    confidence += BONUS.HAS_TIMEFRAME;
  }

  if (extraction.targets.length > 1) {
    confidence += BONUS.HAS_MULTIPLE_TARGETS;
  }

  // Sanity check: if we have both entry and stop loss, verify logical relationship
  if (hasEntry && hasStopLoss) {
    const entry = extraction.entryPrices[0]!;
    const sl = extraction.stopLosses[0]!;
    // For BUY: SL should be below entry. For SELL: SL should be above entry.
    // Without knowing direction, just check they differ (basic sanity).
    if (entry !== sl) {
      confidence += BONUS.HAS_ENTRY_AND_SL_LOGICAL;
    }
  }

  // Clamp to [0, 1]
  return Math.min(1.0, Math.max(0.0, confidence));
}

/**
 * Determine if a confidence score qualifies for auto-approval.
 *
 * @param confidence - The confidence value (0 to 1)
 * @param highThreshold - Minimum confidence for auto-approval (default 0.85)
 * @returns true if confidence meets or exceeds the high threshold
 */
export function isHighConfidence(
  confidence: number,
  highThreshold = 0.85
): boolean {
  return confidence >= highThreshold;
}

/**
 * Determine if a confidence score is too low to be a real tip.
 *
 * @param confidence - The confidence value (0 to 1)
 * @param lowThreshold - Maximum confidence for auto-rejection (default 0.40)
 * @returns true if confidence is below the low threshold
 */
export function isLowConfidence(
  confidence: number,
  lowThreshold = 0.40
): boolean {
  return confidence < lowThreshold;
}

/**
 * Determine if a confidence score falls in the "needs human review" range.
 *
 * @param confidence - The confidence value (0 to 1)
 * @param lowThreshold - Lower boundary (default 0.40)
 * @param highThreshold - Upper boundary (default 0.85)
 * @returns true if confidence is between low and high thresholds
 */
export function needsReview(
  confidence: number,
  lowThreshold = 0.40,
  highThreshold = 0.85
): boolean {
  return confidence >= lowThreshold && confidence < highThreshold;
}
