// src/lib/scoring/composite.ts
//
// Composite RMT Score Calculator
//
// Combines all four scoring components with their weights:
//   RMT Score = (0.40 x Accuracy) + (0.30 x Risk-Adjusted) + (0.20 x Consistency) + (0.10 x Volume)
//
// Also calculates:
//   - Confidence interval (95% CI based on binomial proportion)
//   - Creator tier based on completed tip count
//   - Win/loss streak tracking
//   - Timeframe-specific accuracy breakdown

import {
  SCORING,
  CREATOR_TIER,
  TARGET_HIT_STATUSES,
  TIP_TIMEFRAME,
} from "@/lib/constants";
import { calculateAccuracy, calculateFilteredAccuracy } from "./accuracy";
import { calculateRiskAdjustedReturn } from "./risk-adjusted";
import { calculateConsistency } from "./consistency";
import { calculateVolumeFactor } from "./volume-factor";
import type {
  CompositeScoreInput,
  CompositeScoreOutput,
  CompletedTip,
  CreatorTierType,
  TimeframeAccuracyBreakdown,
  TipStatusType,
} from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isTargetHit(status: TipStatusType): boolean {
  return (TARGET_HIT_STATUSES as readonly string[]).includes(status);
}

/**
 * Determines the creator tier based on total completed tips.
 *
 * Tier thresholds:
 *   < 20 tips  -> UNRATED (no RMT Score displayed)
 *   20-49      -> BRONZE
 *   50-199     -> SILVER
 *   200-499    -> GOLD
 *   500-999    -> PLATINUM
 *   1000+      -> DIAMOND
 */
function determineTier(totalScoredTips: number): CreatorTierType {
  if (totalScoredTips < 20) return CREATOR_TIER.UNRATED;
  if (totalScoredTips < 50) return CREATOR_TIER.BRONZE;
  if (totalScoredTips < 200) return CREATOR_TIER.SILVER;
  if (totalScoredTips < 500) return CREATOR_TIER.GOLD;
  if (totalScoredTips < 1000) return CREATOR_TIER.PLATINUM;
  return CREATOR_TIER.DIAMOND;
}

/**
 * Calculates the 95% confidence interval for the RMT score.
 *
 * Based on the standard error of a binomial proportion:
 *   SE = sqrt(p * (1 - p) / n)
 *   CI = Z * SE * 100
 *
 * Where:
 *   p = accuracy rate (0-1)
 *   n = total scored tips
 *   Z = 1.96 (95% confidence)
 *
 * The interval represents how much the score might vary due to
 * limited sample size. More tips = smaller interval = more confidence.
 */
function calculateConfidenceInterval(
  accuracyRate: number,
  totalScoredTips: number,
): number {
  if (totalScoredTips <= 0) return 0;

  // Clamp accuracy rate to avoid negative values under the square root
  const p = clamp(accuracyRate, 0, 1);
  const standardError = Math.sqrt((p * (1 - p)) / totalScoredTips);
  return SCORING.CONFIDENCE_Z_SCORE * standardError * 100;
}

/**
 * Calculates win and loss streaks from a chronologically sorted set of tips.
 *
 * The current streak is the most recent consecutive run of wins or losses.
 * Tips are sorted by closedAt (most recent first) and we count backward
 * until the streak breaks.
 */
function calculateStreaks(tips: readonly CompletedTip[]): {
  winStreak: number;
  lossStreak: number;
} {
  if (tips.length === 0) {
    return { winStreak: 0, lossStreak: 0 };
  }

  // Sort by closedAt descending (most recent first) to find current streak
  const sorted = [...tips].sort(
    (a, b) => b.closedAt.getTime() - a.closedAt.getTime(),
  );

  let currentWinStreak = 0;
  let currentLossStreak = 0;

  // Check if the most recent tip was a win or loss to start the streak
  const mostRecent = sorted[0];
  if (!mostRecent) {
    return { winStreak: 0, lossStreak: 0 };
  }
  const mostRecentIsHit = isTargetHit(mostRecent.status);

  if (mostRecentIsHit) {
    // Count consecutive wins from the most recent tip
    for (const tip of sorted) {
      if (isTargetHit(tip.status)) {
        currentWinStreak++;
      } else {
        break;
      }
    }
  } else {
    // Count consecutive losses from the most recent tip
    for (const tip of sorted) {
      if (!isTargetHit(tip.status)) {
        currentLossStreak++;
      } else {
        break;
      }
    }
  }

  return {
    winStreak: currentWinStreak,
    lossStreak: currentLossStreak,
  };
}

/**
 * Calculates accuracy rates broken down by tip timeframe.
 *
 * Returns null for timeframes with no completed tips.
 */
function calculateTimeframeAccuracy(
  tips: readonly CompletedTip[],
): TimeframeAccuracyBreakdown {
  return {
    intradayAccuracy: calculateFilteredAccuracy(
      tips,
      (tip) => tip.timeframe === TIP_TIMEFRAME.INTRADAY,
    ),
    swingAccuracy: calculateFilteredAccuracy(
      tips,
      (tip) => tip.timeframe === TIP_TIMEFRAME.SWING,
    ),
    positionalAccuracy: calculateFilteredAccuracy(
      tips,
      (tip) => tip.timeframe === TIP_TIMEFRAME.POSITIONAL,
    ),
    longTermAccuracy: calculateFilteredAccuracy(
      tips,
      (tip) => tip.timeframe === TIP_TIMEFRAME.LONG_TERM,
    ),
  };
}

/**
 * Calculates the complete composite RMT Score for a creator.
 *
 * This is the main scoring function that orchestrates all four components
 * and produces the final score along with all supporting metrics.
 *
 * Returns null-like values if the creator has fewer than MIN_TIPS_FOR_RATING
 * completed tips (the creator is UNRATED and should not have a displayed score).
 *
 * @param input - All completed tips for the creator and scoring parameters
 * @returns Full composite score with component scores, raw metrics, and metadata
 */
export function calculateCompositeScore(
  input: CompositeScoreInput,
): CompositeScoreOutput {
  const { tips, halfLifeDays } = input;
  const totalScoredTips = tips.length;
  const tier = determineTier(totalScoredTips);

  // Determine the scoring period from the tips
  const scorePeriodStart = tips.length > 0
    ? new Date(Math.min(...tips.map((t) => t.tipTimestamp.getTime())))
    : new Date();
  const scorePeriodEnd = tips.length > 0
    ? new Date(Math.max(...tips.map((t) => t.closedAt.getTime())))
    : new Date();

  // If below minimum tips for rating, still compute but mark as unrated
  // The caller should check tier === UNRATED to decide whether to display the score

  // 1. Accuracy Score (40%)
  const accuracyResult = calculateAccuracy({ tips, halfLifeDays });

  // 2. Risk-Adjusted Return Score (30%)
  const riskAdjustedResult = calculateRiskAdjustedReturn({ tips });

  // 3. Consistency Score (20%)
  const consistencyResult = calculateConsistency({ tips });

  // 4. Volume Factor Score (10%)
  const volumeFactorResult = calculateVolumeFactor({ totalScoredTips });

  // Composite weighted score
  const rmtScore = clamp(
    SCORING.WEIGHTS.ACCURACY * accuracyResult.accuracyScore +
      SCORING.WEIGHTS.RISK_ADJUSTED_RETURN * riskAdjustedResult.riskAdjustedScore +
      SCORING.WEIGHTS.CONSISTENCY * consistencyResult.consistencyScore +
      SCORING.WEIGHTS.VOLUME_FACTOR * volumeFactorResult.volumeFactorScore,
    SCORING.SCORE_MIN,
    SCORING.SCORE_MAX,
  );

  // Confidence interval
  const confidenceInterval = calculateConfidenceInterval(
    accuracyResult.accuracyRate,
    totalScoredTips,
  );

  // Streaks
  const { winStreak, lossStreak } = calculateStreaks(tips);

  // Timeframe breakdown
  const timeframeAccuracy = calculateTimeframeAccuracy(tips);

  return {
    rmtScore,
    confidenceInterval,

    accuracyScore: accuracyResult.accuracyScore,
    riskAdjustedScore: riskAdjustedResult.riskAdjustedScore,
    consistencyScore: consistencyResult.consistencyScore,
    volumeFactorScore: volumeFactorResult.volumeFactorScore,

    accuracyRate: accuracyResult.accuracyRate,
    avgReturnPct: riskAdjustedResult.avgReturnPct,
    avgRiskRewardRatio: riskAdjustedResult.avgRiskRewardRatio,
    bestTipReturnPct: riskAdjustedResult.bestTipReturnPct,
    worstTipReturnPct: riskAdjustedResult.worstTipReturnPct,

    winStreak,
    lossStreak,

    timeframeAccuracy,

    tier,
    totalScoredTips,

    scorePeriodStart,
    scorePeriodEnd,
  };
}
