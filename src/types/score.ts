// src/types/score.ts
// Types for scoring data, matching the Prisma CreatorScore and ScoreSnapshot models.

// ──── Full creator score (current score — one per creator) ────

interface CreatorScoreData {
  readonly id: string;
  readonly creatorId: string;

  // Component scores (0-100 each)
  readonly accuracyScore: number;
  readonly riskAdjustedScore: number;
  readonly consistencyScore: number;
  readonly volumeFactorScore: number;

  // Composite score
  readonly rmtScore: number;
  readonly confidenceInterval: number;

  // Raw metrics
  readonly accuracyRate: number;
  readonly avgReturnPct: number;
  readonly avgRiskRewardRatio: number;
  readonly winStreak: number;
  readonly lossStreak: number;
  readonly bestTipReturnPct: number | null;
  readonly worstTipReturnPct: number | null;

  // Breakdown by timeframe
  readonly intradayAccuracy: number | null;
  readonly swingAccuracy: number | null;
  readonly positionalAccuracy: number | null;
  readonly longTermAccuracy: number | null;

  // Metadata
  readonly totalScoredTips: number;
  readonly scorePeriodStart: string;
  readonly scorePeriodEnd: string;
  readonly calculatedAt: string;
}

// ──── Daily score snapshot (for charts and history) ────

interface ScoreSnapshotData {
  readonly id: string;
  readonly creatorId: string;
  readonly date: string;
  readonly rmtScore: number;
  readonly accuracyRate: number;
  readonly totalScoredTips: number;
}

// ──── Scoring algorithm input/output types ────

interface AccuracyInput {
  readonly tips: readonly import("./tip").CompletedTip[];
  readonly halfLifeDays: number;
}

interface AccuracyOutput {
  readonly accuracyRate: number;
  readonly weightedAccuracyRate: number;
  readonly accuracyScore: number;
  readonly totalCompleted: number;
  readonly totalHit: number;
}

interface RiskAdjustedInput {
  readonly tips: readonly import("./tip").CompletedTip[];
}

interface RiskAdjustedOutput {
  readonly avgRiskRewardRatio: number;
  readonly avgReturnPct: number;
  readonly riskAdjustedScore: number;
  readonly bestReturnPct: number | null;
  readonly worstReturnPct: number | null;
}

interface ConsistencyInput {
  readonly tips: readonly import("./tip").CompletedTip[];
  readonly monthsRequired: number;
}

interface ConsistencyOutput {
  readonly consistencyScore: number;
  readonly coefficientOfVariation: number;
  readonly monthlyAccuracies: readonly number[];
}

interface VolumeFactorInput {
  readonly totalScoredTips: number;
  readonly maxExpectedTips: number;
}

interface VolumeFactorOutput {
  readonly volumeFactorScore: number;
  readonly volumeFactor: number;
}

interface CompositeScoreInput {
  readonly accuracyScore: number;
  readonly riskAdjustedScore: number;
  readonly consistencyScore: number;
  readonly volumeFactorScore: number;
}

interface CompositeScoreOutput {
  readonly rmtScore: number;
  readonly components: {
    readonly accuracy: number;
    readonly riskAdjusted: number;
    readonly consistency: number;
    readonly volumeFactor: number;
  };
}

export type {
  CreatorScoreData,
  ScoreSnapshotData,
  AccuracyInput,
  AccuracyOutput,
  RiskAdjustedInput,
  RiskAdjustedOutput,
  ConsistencyInput,
  ConsistencyOutput,
  VolumeFactorInput,
  VolumeFactorOutput,
  CompositeScoreInput,
  CompositeScoreOutput,
};
