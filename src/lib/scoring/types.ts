// src/lib/scoring/types.ts
//
// Type definitions for the RMT scoring algorithm.
// All scoring component inputs and outputs are defined here.

import type {
  TIP_STATUS,
  TIP_DIRECTION,
  TIP_TIMEFRAME,
  CREATOR_TIER,
} from "@/lib/constants";

// ────────────────────────────────────────
// Utility types derived from constants
// ────────────────────────────────────────

type TipStatusValues = typeof TIP_STATUS;
type TipDirectionValues = typeof TIP_DIRECTION;
type TipTimeframeValues = typeof TIP_TIMEFRAME;
type CreatorTierValues = typeof CREATOR_TIER;

export type TipStatusType = TipStatusValues[keyof TipStatusValues];
export type TipDirectionType = TipDirectionValues[keyof TipDirectionValues];
export type TipTimeframeType = TipTimeframeValues[keyof TipTimeframeValues];
export type CreatorTierType = CreatorTierValues[keyof CreatorTierValues];

// ────────────────────────────────────────
// Core data types
// ────────────────────────────────────────

/**
 * A tip that has reached a terminal status (target hit, stoploss hit, or expired).
 * Only completed tips are used in score calculation.
 */
export interface CompletedTip {
  readonly id: string;
  readonly creatorId: string;
  readonly status: TipStatusType;
  readonly direction: TipDirectionType;
  readonly timeframe: TipTimeframeType;
  readonly entryPrice: number;
  readonly target1: number;
  readonly target2: number | null;
  readonly target3: number | null;
  readonly stopLoss: number;
  readonly closedPrice: number | null;
  readonly closedAt: Date;
  readonly tipTimestamp: Date;
  readonly returnPct: number | null;
  readonly riskRewardRatio: number | null;
}

// ────────────────────────────────────────
// Accuracy score types
// ────────────────────────────────────────

export interface AccuracyInput {
  readonly tips: readonly CompletedTip[];
  readonly halfLifeDays: number;
}

export interface AccuracyOutput {
  /** Raw accuracy rate: hits / total, range 0-1 */
  readonly accuracyRate: number;
  /** Recency-weighted accuracy rate, range 0-1 */
  readonly weightedAccuracyRate: number;
  /** Normalized accuracy score, range 0-100 */
  readonly accuracyScore: number;
  /** Total completed tips used in the calculation */
  readonly totalCompleted: number;
  /** Number of tips that hit at least target 1 */
  readonly totalHit: number;
}

// ────────────────────────────────────────
// Risk-adjusted return types
// ────────────────────────────────────────

export interface RiskAdjustedInput {
  readonly tips: readonly CompletedTip[];
}

export interface TipReturnDetail {
  readonly tipId: string;
  readonly returnPct: number;
  readonly riskPct: number;
  readonly riskRewardRatio: number;
}

export interface RiskAdjustedOutput {
  /** Average return percentage across all completed tips */
  readonly avgReturnPct: number;
  /** Average risk-reward ratio across all completed tips */
  readonly avgRiskRewardRatio: number;
  /** Normalized risk-adjusted score, range 0-100 */
  readonly riskAdjustedScore: number;
  /** Best single-tip return percentage */
  readonly bestTipReturnPct: number | null;
  /** Worst single-tip return percentage */
  readonly worstTipReturnPct: number | null;
  /** Individual tip return details */
  readonly tipDetails: readonly TipReturnDetail[];
}

// ────────────────────────────────────────
// Consistency score types
// ────────────────────────────────────────

export interface ConsistencyInput {
  readonly tips: readonly CompletedTip[];
}

export interface MonthlyAccuracy {
  /** Month key in YYYY-MM format */
  readonly month: string;
  /** Accuracy rate for that month, range 0-1 */
  readonly accuracyRate: number;
  /** Number of completed tips in the month */
  readonly tipCount: number;
}

export interface ConsistencyOutput {
  /** Coefficient of variation of monthly accuracy rates */
  readonly coefficientOfVariation: number;
  /** Normalized consistency score, range 0-100 */
  readonly consistencyScore: number;
  /** Number of months with data used in calculation */
  readonly monthsWithData: number;
  /** Monthly accuracy breakdown */
  readonly monthlyBreakdown: readonly MonthlyAccuracy[];
}

// ────────────────────────────────────────
// Volume factor types
// ────────────────────────────────────────

export interface VolumeFactorInput {
  readonly totalScoredTips: number;
}

export interface VolumeFactorOutput {
  /** Raw volume factor before normalization, range 0-1+ */
  readonly volumeFactor: number;
  /** Normalized volume factor score, range 0-100 */
  readonly volumeFactorScore: number;
}

// ────────────────────────────────────────
// Composite score types
// ────────────────────────────────────────

export interface CompositeScoreInput {
  readonly tips: readonly CompletedTip[];
  readonly halfLifeDays: number;
}

export interface TimeframeAccuracyBreakdown {
  readonly intradayAccuracy: number | null;
  readonly swingAccuracy: number | null;
  readonly positionalAccuracy: number | null;
  readonly longTermAccuracy: number | null;
}

export interface CompositeScoreOutput {
  /** The final RMT Score, range 0-100 */
  readonly rmtScore: number;
  /** Confidence interval (+/- range at 95% confidence) */
  readonly confidenceInterval: number;

  /** Individual component scores (all 0-100) */
  readonly accuracyScore: number;
  readonly riskAdjustedScore: number;
  readonly consistencyScore: number;
  readonly volumeFactorScore: number;

  /** Raw metrics */
  readonly accuracyRate: number;
  readonly avgReturnPct: number;
  readonly avgRiskRewardRatio: number;
  readonly bestTipReturnPct: number | null;
  readonly worstTipReturnPct: number | null;

  /** Streak tracking */
  readonly winStreak: number;
  readonly lossStreak: number;

  /** Timeframe accuracy breakdown */
  readonly timeframeAccuracy: TimeframeAccuracyBreakdown;

  /** Creator tier based on total completed tips */
  readonly tier: CreatorTierType;
  readonly totalScoredTips: number;

  /** Period covered by this score */
  readonly scorePeriodStart: Date;
  readonly scorePeriodEnd: Date;
}
