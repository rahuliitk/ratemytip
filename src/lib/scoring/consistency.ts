// src/lib/scoring/consistency.ts
//
// Consistency Score Calculator (Weight: 20% of RMT Score)
//
// Measures how stable a creator's accuracy is over time.
// Uses the coefficient of variation (CV) of monthly accuracy rates.
// Lower CV = more consistent performance = higher score.
//
// Edge cases:
//   - Less than 3 months of data: return neutral score of 50
//   - Mean accuracy of 0: return score of 0 (consistently wrong is still bad)
//   - CV > 1 (highly inconsistent): return score of 0

import { format, startOfMonth } from "date-fns";

import { TARGET_HIT_STATUSES } from "@/lib/constants";
import type {
  ConsistencyInput,
  ConsistencyOutput,
  MonthlyAccuracy,
  CompletedTip,
  TipStatusType,
} from "./types";

/** Minimum number of months with data required for a meaningful consistency score */
const MIN_MONTHS_FOR_CONSISTENCY = 3;

/** Default (neutral) consistency score when insufficient data is available */
const NEUTRAL_CONSISTENCY_SCORE = 50;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isTargetHit(status: TipStatusType): boolean {
  return (TARGET_HIT_STATUSES as readonly string[]).includes(status);
}

/**
 * Groups completed tips by the month they were closed, then calculates
 * the accuracy rate for each month.
 *
 * Only months with at least one completed tip are included.
 * Tips are bucketed by their closedAt date (not tipTimestamp) to reflect
 * when the outcome was actually determined.
 *
 * @param tips - All completed tips to group
 * @returns Sorted array of monthly accuracy records (oldest first)
 */
function groupTipsByMonth(tips: readonly CompletedTip[]): MonthlyAccuracy[] {
  // Map of "YYYY-MM" -> { hits, total }
  const monthMap = new Map<string, { hits: number; total: number }>();

  for (const tip of tips) {
    const monthKey = format(startOfMonth(tip.closedAt), "yyyy-MM");
    const entry = monthMap.get(monthKey) ?? { hits: 0, total: 0 };

    entry.total++;
    if (isTargetHit(tip.status)) {
      entry.hits++;
    }

    monthMap.set(monthKey, entry);
  }

  // Convert to sorted array (oldest first)
  const months: MonthlyAccuracy[] = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { hits, total }]) => ({
      month,
      accuracyRate: total > 0 ? hits / total : 0,
      tipCount: total,
    }));

  return months;
}

/**
 * Computes the mean of an array of numbers.
 */
function mean(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

/**
 * Computes the standard deviation of an array of numbers.
 * Uses population standard deviation (divides by n, not n-1)
 * since we are measuring the actual variation of the creator's
 * performance, not estimating a population parameter.
 */
function standardDeviation(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const avg = mean(values);
  const squaredDiffs = values.map((val) => (val - avg) ** 2);
  const avgSquaredDiff = squaredDiffs.reduce((acc, val) => acc + val, 0) / values.length;
  return Math.sqrt(avgSquaredDiff);
}

/**
 * Calculates the consistency score for a set of completed tips.
 *
 * Algorithm:
 * 1. Group tips by month and calculate monthly accuracy rates
 * 2. Compute the coefficient of variation (CV = std_dev / mean) of monthly rates
 * 3. Convert to a score: Consistency Score = clamp((1 - CV) * 100, 0, 100)
 *
 * Interpretation:
 *   - CV near 0 (very consistent) --> score near 100
 *   - CV near 1 (highly variable)  --> score near 0
 *   - CV > 1 (extremely variable)  --> score = 0
 *
 * @param input - Completed tips to evaluate for consistency
 * @returns Consistency metrics and normalized score
 */
export function calculateConsistency(input: ConsistencyInput): ConsistencyOutput {
  const { tips } = input;

  if (tips.length === 0) {
    return {
      coefficientOfVariation: 0,
      consistencyScore: 0,
      monthsWithData: 0,
      monthlyBreakdown: [],
    };
  }

  const monthlyBreakdown = groupTipsByMonth(tips);
  const monthsWithData = monthlyBreakdown.length;

  // Not enough months for a statistically meaningful consistency measurement
  if (monthsWithData < MIN_MONTHS_FOR_CONSISTENCY) {
    return {
      coefficientOfVariation: 0,
      consistencyScore: NEUTRAL_CONSISTENCY_SCORE,
      monthsWithData,
      monthlyBreakdown,
    };
  }

  const monthlyRates = monthlyBreakdown.map((m) => m.accuracyRate);
  const avgRate = mean(monthlyRates);

  // If mean accuracy is 0, the creator has never hit a target.
  // Consistently wrong is still 0.
  if (avgRate === 0) {
    return {
      coefficientOfVariation: 0,
      consistencyScore: 0,
      monthsWithData,
      monthlyBreakdown,
    };
  }

  const stdDev = standardDeviation(monthlyRates);
  const cv = stdDev / avgRate;

  // CV > 1 means standard deviation exceeds the mean (extremely inconsistent)
  const consistencyScore = clamp((1 - cv) * 100, 0, 100);

  return {
    coefficientOfVariation: cv,
    consistencyScore,
    monthsWithData,
    monthlyBreakdown,
  };
}
