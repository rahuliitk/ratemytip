// src/lib/scoring/index.ts
//
// Main scoring orchestrator for the RMT Score calculation.
//
// This module provides the primary entry point for calculating
// a creator's score from their database records, as well as
// re-exports of individual component calculators for testing
// and granular usage.

import { db } from "@/lib/db";
import { SCORING, COMPLETED_TIP_STATUSES } from "@/lib/constants";
import { calculateCompositeScore } from "./composite";
import type { CompletedTip, CompositeScoreOutput, TipStatusType, TipDirectionType, TipTimeframeType } from "./types";

// ────────────────────────────────────────
// Re-exports for convenience
// ────────────────────────────────────────

export { calculateAccuracy, calculateFilteredAccuracy } from "./accuracy";
export { calculateRiskAdjustedReturn } from "./risk-adjusted";
export { calculateConsistency } from "./consistency";
export { calculateVolumeFactor } from "./volume-factor";
export { calculateCompositeScore } from "./composite";

export type {
  CompletedTip,
  AccuracyInput,
  AccuracyOutput,
  RiskAdjustedInput,
  RiskAdjustedOutput,
  TipReturnDetail,
  ConsistencyInput,
  ConsistencyOutput,
  MonthlyAccuracy,
  VolumeFactorInput,
  VolumeFactorOutput,
  CompositeScoreInput,
  CompositeScoreOutput,
  TimeframeAccuracyBreakdown,
  TipStatusType,
  TipDirectionType,
  TipTimeframeType,
  CreatorTierType,
} from "./types";

// ────────────────────────────────────────
// Database-backed scoring orchestrator
// ────────────────────────────────────────

/**
 * Maps a Prisma tip record to the CompletedTip interface used by the scoring engine.
 * Only tips with a closedAt date are valid completed tips.
 */
function mapToCompletedTip(tip: {
  id: string;
  creatorId: string;
  status: string;
  direction: string;
  timeframe: string;
  entryPrice: number;
  target1: number;
  target2: number | null;
  target3: number | null;
  stopLoss: number;
  closedPrice: number | null;
  closedAt: Date | null;
  tipTimestamp: Date;
  returnPct: number | null;
  riskRewardRatio: number | null;
}): CompletedTip | null {
  // A completed tip must have a closedAt date
  if (tip.closedAt === null) {
    return null;
  }

  return {
    id: tip.id,
    creatorId: tip.creatorId,
    status: tip.status as TipStatusType,
    direction: tip.direction as TipDirectionType,
    timeframe: tip.timeframe as TipTimeframeType,
    entryPrice: tip.entryPrice,
    target1: tip.target1,
    target2: tip.target2,
    target3: tip.target3,
    stopLoss: tip.stopLoss,
    closedPrice: tip.closedPrice,
    closedAt: tip.closedAt,
    tipTimestamp: tip.tipTimestamp,
    returnPct: tip.returnPct,
    riskRewardRatio: tip.riskRewardRatio,
  };
}

/**
 * Fetches all completed tips for a creator from the database and calculates
 * their full composite RMT Score.
 *
 * This is the primary entry point for the scoring worker. It:
 * 1. Queries all completed tips for the given creator
 * 2. Maps them to the scoring engine's CompletedTip format
 * 3. Runs the composite score calculation
 * 4. Returns the full score output
 *
 * Returns null if the creator has no completed tips.
 *
 * @param creatorId - The database ID of the creator to score
 * @returns Full composite score output, or null if no completed tips
 */
export async function calculateCreatorScore(
  creatorId: string,
): Promise<CompositeScoreOutput | null> {
  // Fetch all completed tips for this creator from the database
  const rawTips = await db.tip.findMany({
    where: {
      creatorId,
      status: {
        in: [...COMPLETED_TIP_STATUSES],
      },
    },
    select: {
      id: true,
      creatorId: true,
      status: true,
      direction: true,
      timeframe: true,
      entryPrice: true,
      target1: true,
      target2: true,
      target3: true,
      stopLoss: true,
      closedPrice: true,
      closedAt: true,
      tipTimestamp: true,
      returnPct: true,
      riskRewardRatio: true,
    },
    orderBy: {
      tipTimestamp: "asc",
    },
  });

  // Map to CompletedTip, filtering out any tips without a closedAt date
  const completedTips = rawTips
    .map(mapToCompletedTip)
    .filter((tip): tip is CompletedTip => tip !== null);

  if (completedTips.length === 0) {
    return null;
  }

  // Calculate the composite score using the configured recency half-life
  return calculateCompositeScore({
    tips: completedTips,
    halfLifeDays: SCORING.RECENCY_DECAY_HALFLIFE_DAYS,
  });
}

/**
 * Saves a calculated score to the database, updating both the
 * CreatorScore record and creating a daily ScoreSnapshot.
 *
 * This is called by the scoring worker after calculateCreatorScore.
 *
 * @param creatorId - The creator to update
 * @param score - The calculated composite score
 */
export async function persistCreatorScore(
  creatorId: string,
  score: CompositeScoreOutput,
): Promise<void> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  await db.$transaction([
    // Upsert the current score (one record per creator)
    db.creatorScore.upsert({
      where: { creatorId },
      create: {
        creatorId,
        accuracyScore: score.accuracyScore,
        riskAdjustedScore: score.riskAdjustedScore,
        consistencyScore: score.consistencyScore,
        volumeFactorScore: score.volumeFactorScore,
        rmtScore: score.rmtScore,
        confidenceInterval: score.confidenceInterval,
        accuracyRate: score.accuracyRate,
        avgReturnPct: score.avgReturnPct,
        avgRiskRewardRatio: score.avgRiskRewardRatio,
        winStreak: score.winStreak,
        lossStreak: score.lossStreak,
        bestTipReturnPct: score.bestTipReturnPct,
        worstTipReturnPct: score.worstTipReturnPct,
        intradayAccuracy: score.timeframeAccuracy.intradayAccuracy,
        swingAccuracy: score.timeframeAccuracy.swingAccuracy,
        positionalAccuracy: score.timeframeAccuracy.positionalAccuracy,
        longTermAccuracy: score.timeframeAccuracy.longTermAccuracy,
        totalScoredTips: score.totalScoredTips,
        scorePeriodStart: score.scorePeriodStart,
        scorePeriodEnd: score.scorePeriodEnd,
        calculatedAt: now,
      },
      update: {
        accuracyScore: score.accuracyScore,
        riskAdjustedScore: score.riskAdjustedScore,
        consistencyScore: score.consistencyScore,
        volumeFactorScore: score.volumeFactorScore,
        rmtScore: score.rmtScore,
        confidenceInterval: score.confidenceInterval,
        accuracyRate: score.accuracyRate,
        avgReturnPct: score.avgReturnPct,
        avgRiskRewardRatio: score.avgRiskRewardRatio,
        winStreak: score.winStreak,
        lossStreak: score.lossStreak,
        bestTipReturnPct: score.bestTipReturnPct,
        worstTipReturnPct: score.worstTipReturnPct,
        intradayAccuracy: score.timeframeAccuracy.intradayAccuracy,
        swingAccuracy: score.timeframeAccuracy.swingAccuracy,
        positionalAccuracy: score.timeframeAccuracy.positionalAccuracy,
        longTermAccuracy: score.timeframeAccuracy.longTermAccuracy,
        totalScoredTips: score.totalScoredTips,
        scorePeriodStart: score.scorePeriodStart,
        scorePeriodEnd: score.scorePeriodEnd,
        calculatedAt: now,
      },
    }),

    // Upsert a daily snapshot for charting history
    db.scoreSnapshot.upsert({
      where: {
        creatorId_date: {
          creatorId,
          date: today,
        },
      },
      create: {
        creatorId,
        date: today,
        rmtScore: score.rmtScore,
        accuracyRate: score.accuracyRate,
        totalScoredTips: score.totalScoredTips,
      },
      update: {
        rmtScore: score.rmtScore,
        accuracyRate: score.accuracyRate,
        totalScoredTips: score.totalScoredTips,
      },
    }),

    // Update the creator's tier and denormalized counts
    db.creator.update({
      where: { id: creatorId },
      data: {
        tier: score.tier,
        completedTips: score.totalScoredTips,
      },
    }),
  ]);
}
