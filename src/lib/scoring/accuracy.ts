// src/lib/scoring/accuracy.ts
//
// Accuracy Score Calculator (Weight: 40% of RMT Score)
//
// Measures the percentage of tips where at least Target 1 was reached
// before the stop-loss was hit or the tip expired.
//
// Applies exponential recency weighting so that recent performance
// is weighted more heavily than older tips.

import { differenceInDays } from "date-fns";

import { TARGET_HIT_STATUSES } from "@/lib/constants";
import type { AccuracyInput, AccuracyOutput, CompletedTip, TipStatusType } from "./types";

/**
 * Determines whether a tip status counts as a "target hit" (success).
 * A hit means at least Target 1 was reached before stop-loss or expiry.
 */
function isTargetHit(status: TipStatusType): boolean {
  return (TARGET_HIT_STATUSES as readonly string[]).includes(status);
}

/**
 * Calculates accuracy score for a set of completed tips.
 *
 * Two accuracy rates are computed:
 *   1. Raw accuracy: simple hits / total ratio
 *   2. Weighted accuracy: exponential recency decay with configurable half-life
 *
 * The final accuracyScore is derived from the weighted accuracy rate,
 * normalized to the 0-100 range.
 *
 * @param input - Completed tips and recency decay half-life in days
 * @returns Accuracy metrics including raw rate, weighted rate, and normalized score
 */
export function calculateAccuracy(input: AccuracyInput): AccuracyOutput {
  const { tips, halfLifeDays } = input;

  if (tips.length === 0) {
    return {
      accuracyRate: 0,
      weightedAccuracyRate: 0,
      accuracyScore: 0,
      totalCompleted: 0,
      totalHit: 0,
    };
  }

  const now = new Date();
  // Decay constant: lambda = ln(2) / halfLifeDays
  // A tip from halfLifeDays ago will have weight = 0.5
  const lambda = Math.LN2 / halfLifeDays;

  let weightedHits = 0;
  let weightedTotal = 0;
  let totalHit = 0;

  for (const tip of tips) {
    const daysAgo = differenceInDays(now, tip.closedAt);
    // Exponential decay: more recent tips get higher weight
    const weight = Math.exp(-lambda * Math.max(0, daysAgo));
    const hit = isTargetHit(tip.status);

    weightedTotal += weight;
    if (hit) {
      weightedHits += weight;
      totalHit++;
    }
  }

  const accuracyRate = totalHit / tips.length;
  const weightedAccuracyRate = weightedTotal > 0
    ? weightedHits / weightedTotal
    : 0;

  return {
    accuracyRate,
    weightedAccuracyRate,
    accuracyScore: weightedAccuracyRate * 100,
    totalCompleted: tips.length,
    totalHit,
  };
}

/**
 * Calculates accuracy rate for a subset of tips filtered by a predicate.
 * Useful for computing timeframe-specific accuracy (intraday, swing, etc.).
 *
 * @param tips - All completed tips
 * @param predicate - Filter function to select tips for this sub-calculation
 * @returns Accuracy rate as a decimal (0-1), or null if no matching tips
 */
export function calculateFilteredAccuracy(
  tips: readonly CompletedTip[],
  predicate: (tip: CompletedTip) => boolean,
): number | null {
  const filtered = tips.filter(predicate);
  if (filtered.length === 0) {
    return null;
  }

  const hits = filtered.filter((tip) => isTargetHit(tip.status)).length;
  return hits / filtered.length;
}
