// src/lib/queue/workers/score-worker.ts
//
// BullMQ worker that recalculates RMT scores for creators.
// Supports two job types:
//   - "recalculate-creator": Recalculate a single creator's score
//   - "recalculate-all": Recalculate scores for all active creators (daily job)
//
// Uses the scoring algorithm components (accuracy, risk-adjusted, consistency,
// volume factor) to produce the composite RMT Score.

import { Worker, type Job } from "bullmq";

import { createLogger } from "@/lib/logger";
import { db } from "@/lib/db";

const log = createLogger("worker/score");
import {
  SCORING,
  COMPLETED_TIP_STATUSES,
  TARGET_HIT_STATUSES,
  TIP_TIMEFRAME,
} from "@/lib/constants";
import { calculateAccuracy, calculateFilteredAccuracy } from "@/lib/scoring/accuracy";
import type { CompletedTip, TipStatusType } from "@/lib/scoring/types";

// ──── Job payload types ────

interface RecalculateCreatorJobData {
  readonly creatorId: string;
}

interface RecalculateAllJobData {
  readonly type: "full";
}

type ScoreJobData = RecalculateCreatorJobData | RecalculateAllJobData;

// ──── Redis connection ────

function getConnection(): { host: string; port: number; password?: string } {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || "6379", 10),
    password: parsed.password || undefined,
  };
}

// ──── Helper: Risk-adjusted return for a single tip ────

function calculateTipReturn(tip: CompletedTip): {
  returnPct: number;
  riskPct: number;
  riskRewardRatio: number;
} {
  const isBuy = tip.direction === "BUY";
  let returnPct: number;

  if (tip.returnPct !== null) {
    returnPct = tip.returnPct;
  } else if (tip.closedPrice !== null) {
    returnPct = isBuy
      ? ((tip.closedPrice - tip.entryPrice) / tip.entryPrice) * 100
      : ((tip.entryPrice - tip.closedPrice) / tip.entryPrice) * 100;
  } else {
    returnPct = 0;
  }

  const riskPct = Math.abs(tip.entryPrice - tip.stopLoss) / tip.entryPrice * 100;
  const riskRewardRatio = riskPct > 0 ? returnPct / riskPct : 0;

  return { returnPct, riskPct, riskRewardRatio };
}

// ──── Helper: Risk-adjusted return score ────

function calculateRiskAdjustedScore(tips: readonly CompletedTip[]): {
  avgReturnPct: number;
  avgRiskRewardRatio: number;
  riskAdjustedScore: number;
  bestTipReturnPct: number | null;
  worstTipReturnPct: number | null;
} {
  if (tips.length === 0) {
    return {
      avgReturnPct: 0,
      avgRiskRewardRatio: 0,
      riskAdjustedScore: 0,
      bestTipReturnPct: null,
      worstTipReturnPct: null,
    };
  }

  let totalReturn = 0;
  let totalRR = 0;
  let best = -Infinity;
  let worst = Infinity;

  for (const tip of tips) {
    const { returnPct, riskRewardRatio } = calculateTipReturn(tip);
    totalReturn += returnPct;
    totalRR += riskRewardRatio;
    if (returnPct > best) best = returnPct;
    if (returnPct < worst) worst = returnPct;
  }

  const avgReturnPct = totalReturn / tips.length;
  const avgRiskRewardRatio = totalRR / tips.length;

  // Normalize: avg_rr of -2 -> 0, avg_rr of +5 -> 100
  const floor = SCORING.RISK_ADJUSTED_FLOOR;
  const ceiling = SCORING.RISK_ADJUSTED_CEILING;
  const range = ceiling - floor;
  const riskAdjustedScore = Math.max(
    0,
    Math.min(100, ((avgRiskRewardRatio - floor) / range) * 100)
  );

  return {
    avgReturnPct,
    avgRiskRewardRatio,
    riskAdjustedScore,
    bestTipReturnPct: best === -Infinity ? null : best,
    worstTipReturnPct: worst === Infinity ? null : worst,
  };
}

// ──── Helper: Consistency score ────

function calculateConsistencyScore(tips: readonly CompletedTip[]): {
  consistencyScore: number;
  coefficientOfVariation: number;
  monthsWithData: number;
} {
  // Group tips by month
  const monthlyMap = new Map<string, { hits: number; total: number }>();

  for (const tip of tips) {
    const month = `${tip.closedAt.getFullYear()}-${String(tip.closedAt.getMonth() + 1).padStart(2, "0")}`;
    const entry = monthlyMap.get(month) ?? { hits: 0, total: 0 };
    entry.total++;
    if ((TARGET_HIT_STATUSES as readonly string[]).includes(tip.status)) {
      entry.hits++;
    }
    monthlyMap.set(month, entry);
  }

  const monthsWithData = monthlyMap.size;

  // Need at least 3 months of data for meaningful consistency
  if (monthsWithData < 3) {
    return { consistencyScore: 50, coefficientOfVariation: 0, monthsWithData };
  }

  // Calculate monthly accuracy rates
  const monthlyAccuracies: number[] = [];
  for (const [, stats] of monthlyMap) {
    monthlyAccuracies.push(stats.total > 0 ? stats.hits / stats.total : 0);
  }

  // Mean accuracy
  const mean =
    monthlyAccuracies.reduce((sum, val) => sum + val, 0) /
    monthlyAccuracies.length;

  if (mean === 0) {
    return { consistencyScore: 0, coefficientOfVariation: Infinity, monthsWithData };
  }

  // Standard deviation
  const variance =
    monthlyAccuracies.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    monthlyAccuracies.length;
  const stdDev = Math.sqrt(variance);

  // Coefficient of variation
  const cv = stdDev / mean;

  // Lower CV = more consistent = higher score
  const consistencyScore = Math.max(0, Math.min(100, (1 - cv) * 100));

  return { consistencyScore, coefficientOfVariation: cv, monthsWithData };
}

// ──── Helper: Volume factor score ────

function calculateVolumeFactorScore(totalScoredTips: number): number {
  if (totalScoredTips <= 0) return 0;

  const maxExpected = SCORING.MAX_EXPECTED_TIPS;
  const volumeFactor = Math.log10(totalScoredTips) / Math.log10(maxExpected);
  return Math.max(0, Math.min(100, volumeFactor * 100));
}

// ──── Helper: Streak calculation ────

function calculateStreaks(tips: readonly CompletedTip[]): {
  winStreak: number;
  lossStreak: number;
} {
  // Sort tips by closed date descending to find current streaks
  const sorted = [...tips].sort(
    (a, b) => b.closedAt.getTime() - a.closedAt.getTime()
  );

  let winStreak = 0;
  let lossStreak = 0;

  // Count current win streak (from most recent)
  for (const tip of sorted) {
    if ((TARGET_HIT_STATUSES as readonly string[]).includes(tip.status)) {
      winStreak++;
    } else {
      break;
    }
  }

  // If no current win streak, count current loss streak
  if (winStreak === 0) {
    for (const tip of sorted) {
      if (!(TARGET_HIT_STATUSES as readonly string[]).includes(tip.status)) {
        lossStreak++;
      } else {
        break;
      }
    }
  }

  return { winStreak, lossStreak };
}

// ──── Helper: Creator tier ────

function calculateTier(
  totalScoredTips: number
): "UNRATED" | "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND" {
  if (totalScoredTips < 20) return "UNRATED";
  if (totalScoredTips < 50) return "BRONZE";
  if (totalScoredTips < 200) return "SILVER";
  if (totalScoredTips < 500) return "GOLD";
  if (totalScoredTips < 1000) return "PLATINUM";
  return "DIAMOND";
}

// ──── Helper: Confidence interval ────

function calculateConfidenceInterval(
  accuracyRate: number,
  totalScoredTips: number
): number {
  if (totalScoredTips <= 0) return 0;
  const standardError = Math.sqrt(
    (accuracyRate * (1 - accuracyRate)) / totalScoredTips
  );
  return SCORING.CONFIDENCE_Z_SCORE * standardError * 100;
}

// ──── Core: Recalculate score for a single creator ────

async function recalculateCreatorScore(creatorId: string): Promise<void> {
  log.info({ creatorId }, "Recalculating score for creator");

  // Fetch all completed tips for this creator
  const rawTips = await db.tip.findMany({
    where: {
      creatorId,
      status: { in: [...COMPLETED_TIP_STATUSES] },
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
    orderBy: { closedAt: "desc" },
  });

  // Cast to CompletedTip type — filter out tips without closedAt
  const tips: CompletedTip[] = rawTips
    .filter((t) => t.closedAt !== null)
    .map((t) => ({
      id: t.id,
      creatorId: t.creatorId,
      status: t.status as TipStatusType,
      direction: t.direction as "BUY" | "SELL",
      timeframe: t.timeframe as "INTRADAY" | "SWING" | "POSITIONAL" | "LONG_TERM",
      entryPrice: t.entryPrice,
      target1: t.target1,
      target2: t.target2,
      target3: t.target3,
      stopLoss: t.stopLoss,
      closedPrice: t.closedPrice,
      closedAt: t.closedAt!,
      tipTimestamp: t.tipTimestamp,
      returnPct: t.returnPct,
      riskRewardRatio: t.riskRewardRatio,
    }));

  const totalScoredTips = tips.length;

  // Creators below minimum threshold get tier updated but no score
  if (totalScoredTips < SCORING.MIN_TIPS_FOR_RATING) {
    const tier = calculateTier(totalScoredTips);
    await db.creator.update({
      where: { id: creatorId },
      data: {
        tier,
        completedTips: totalScoredTips,
      },
    });
    log.info({ creatorId, totalScoredTips, tier }, "Creator below minimum tip threshold");
    return;
  }

  // 1. Accuracy Score (40%)
  const accuracyResult = calculateAccuracy({
    tips,
    halfLifeDays: SCORING.RECENCY_DECAY_HALFLIFE_DAYS,
  });

  // 2. Risk-Adjusted Return Score (30%)
  const riskResult = calculateRiskAdjustedScore(tips);

  // 3. Consistency Score (20%)
  const consistencyResult = calculateConsistencyScore(tips);

  // 4. Volume Factor Score (10%)
  const volumeFactorScore = calculateVolumeFactorScore(totalScoredTips);

  // Composite RMT Score
  const rmtScore =
    SCORING.WEIGHTS.ACCURACY * accuracyResult.accuracyScore +
    SCORING.WEIGHTS.RISK_ADJUSTED_RETURN * riskResult.riskAdjustedScore +
    SCORING.WEIGHTS.CONSISTENCY * consistencyResult.consistencyScore +
    SCORING.WEIGHTS.VOLUME_FACTOR * volumeFactorScore;

  // Clamp to 0-100
  const clampedRmtScore = Math.max(
    SCORING.SCORE_MIN,
    Math.min(SCORING.SCORE_MAX, rmtScore)
  );

  // Confidence interval
  const confidenceInterval = calculateConfidenceInterval(
    accuracyResult.accuracyRate,
    totalScoredTips
  );

  // Streaks
  const { winStreak, lossStreak } = calculateStreaks(tips);

  // Timeframe accuracy breakdown
  const intradayAccuracy = calculateFilteredAccuracy(
    tips,
    (t) => t.timeframe === TIP_TIMEFRAME.INTRADAY
  );
  const swingAccuracy = calculateFilteredAccuracy(
    tips,
    (t) => t.timeframe === TIP_TIMEFRAME.SWING
  );
  const positionalAccuracy = calculateFilteredAccuracy(
    tips,
    (t) => t.timeframe === TIP_TIMEFRAME.POSITIONAL
  );
  const longTermAccuracy = calculateFilteredAccuracy(
    tips,
    (t) => t.timeframe === TIP_TIMEFRAME.LONG_TERM
  );

  // Tier
  const tier = calculateTier(totalScoredTips);

  // Period
  const sortedByTimestamp = [...tips].sort(
    (a, b) => a.tipTimestamp.getTime() - b.tipTimestamp.getTime()
  );
  const scorePeriodStart = sortedByTimestamp[0]?.tipTimestamp ?? new Date();
  const scorePeriodEnd =
    sortedByTimestamp[sortedByTimestamp.length - 1]?.tipTimestamp ?? new Date();

  const now = new Date();

  // Upsert the creator score
  await db.creatorScore.upsert({
    where: { creatorId },
    create: {
      creatorId,
      accuracyScore: accuracyResult.accuracyScore,
      riskAdjustedScore: riskResult.riskAdjustedScore,
      consistencyScore: consistencyResult.consistencyScore,
      volumeFactorScore,
      rmtScore: clampedRmtScore,
      confidenceInterval,
      accuracyRate: accuracyResult.accuracyRate,
      avgReturnPct: riskResult.avgReturnPct,
      avgRiskRewardRatio: riskResult.avgRiskRewardRatio,
      winStreak,
      lossStreak,
      bestTipReturnPct: riskResult.bestTipReturnPct,
      worstTipReturnPct: riskResult.worstTipReturnPct,
      intradayAccuracy,
      swingAccuracy,
      positionalAccuracy,
      longTermAccuracy,
      totalScoredTips,
      scorePeriodStart,
      scorePeriodEnd,
      calculatedAt: now,
    },
    update: {
      accuracyScore: accuracyResult.accuracyScore,
      riskAdjustedScore: riskResult.riskAdjustedScore,
      consistencyScore: consistencyResult.consistencyScore,
      volumeFactorScore,
      rmtScore: clampedRmtScore,
      confidenceInterval,
      accuracyRate: accuracyResult.accuracyRate,
      avgReturnPct: riskResult.avgReturnPct,
      avgRiskRewardRatio: riskResult.avgRiskRewardRatio,
      winStreak,
      lossStreak,
      bestTipReturnPct: riskResult.bestTipReturnPct,
      worstTipReturnPct: riskResult.worstTipReturnPct,
      intradayAccuracy,
      swingAccuracy,
      positionalAccuracy,
      longTermAccuracy,
      totalScoredTips,
      scorePeriodStart,
      scorePeriodEnd,
      calculatedAt: now,
    },
  });

  // Update creator record
  const activeTipCount = await db.tip.count({
    where: { creatorId, status: "ACTIVE" },
  });

  await db.creator.update({
    where: { id: creatorId },
    data: {
      tier,
      completedTips: totalScoredTips,
      activeTips: activeTipCount,
    },
  });

  log.info({
    creatorId,
    rmtScore: clampedRmtScore,
    accuracyScore: accuracyResult.accuracyScore,
    riskAdjustedScore: riskResult.riskAdjustedScore,
    consistencyScore: consistencyResult.consistencyScore,
    volumeFactorScore,
    tier,
    totalScoredTips,
  }, "Creator score recalculated");
}

// ──── Main job processor ────

async function processScoreJob(
  job: Job<ScoreJobData>
): Promise<{ creatorsProcessed: number }> {
  const data = job.data;

  if ("creatorId" in data) {
    // Single creator recalculation
    await recalculateCreatorScore(data.creatorId);
    return { creatorsProcessed: 1 };
  }

  // Full recalculation for all active creators
  log.info("Starting full score recalculation for all creators");

  const creators = await db.creator.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  let processed = 0;
  const batchSize = 50;

  for (let i = 0; i < creators.length; i += batchSize) {
    const batch = creators.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (creator) => {
        try {
          await recalculateCreatorScore(creator.id);
          processed++;
        } catch (error) {
          log.error({ err: error instanceof Error ? error : new Error(String(error)), creatorId: creator.id }, "Failed to recalculate score for creator");
        }
      })
    );

    log.info({ processed, total: creators.length }, "Score recalculation progress");
  }

  log.info({ processed, total: creators.length }, "Full score recalculation complete");

  return { creatorsProcessed: processed };
}

// ──── Worker registration ────

/**
 * Create and return the score calculation worker.
 * Processes jobs from the "calculate-scores" queue with concurrency 10.
 */
export function createScoreWorker(): Worker {
  const worker = new Worker<ScoreJobData>(
    "calculate-scores",
    processScoreJob,
    {
      connection: getConnection(),
      concurrency: 10,
    }
  );

  worker.on("completed", (job) => {
    log.info({ jobId: job.id }, "Score job completed");
  });

  worker.on("failed", (job, error) => {
    log.error({ err: error, jobId: job?.id }, "Score job failed");
  });

  return worker;
}
