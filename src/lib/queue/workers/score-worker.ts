// src/lib/queue/workers/score-worker.ts
//
// BullMQ worker that recalculates RMT scores for creators.
// Supports two job types:
//   - "recalculate-creator": Recalculate a single creator's score
//   - "recalculate-all": Recalculate scores for all active creators (daily job)
//
// Delegates all scoring logic to the shared scoring module
// (src/lib/scoring/) to avoid duplication.

import { Worker, type Job } from "bullmq";

import { createLogger } from "@/lib/logger";
import { db } from "@/lib/db";
import { SCORING, COMPLETED_TIP_STATUSES } from "@/lib/constants";
import { calculateCompositeScore } from "@/lib/scoring/composite";
import type { CompletedTip, TipStatusType } from "@/lib/scoring/types";

const log = createLogger("worker/score");

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

  // Use the shared scoring module for all calculations
  const score = calculateCompositeScore({
    tips,
    halfLifeDays: SCORING.RECENCY_DECAY_HALFLIFE_DAYS,
  });

  // Creators below minimum threshold get tier updated but no score
  if (score.totalScoredTips < SCORING.MIN_TIPS_FOR_RATING) {
    await db.creator.update({
      where: { id: creatorId },
      data: {
        tier: score.tier,
        completedTips: score.totalScoredTips,
      },
    });
    log.info({ creatorId, totalScoredTips: score.totalScoredTips, tier: score.tier }, "Creator below minimum tip threshold");
    return;
  }

  const now = new Date();

  // Upsert the creator score
  const scoreData = {
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
  };

  await db.creatorScore.upsert({
    where: { creatorId },
    create: { creatorId, ...scoreData },
    update: scoreData,
  });

  // Update creator record
  const activeTipCount = await db.tip.count({
    where: { creatorId, status: "ACTIVE" },
  });

  await db.creator.update({
    where: { id: creatorId },
    data: {
      tier: score.tier,
      completedTips: score.totalScoredTips,
      activeTips: activeTipCount,
    },
  });

  log.info({
    creatorId,
    rmtScore: score.rmtScore,
    accuracyScore: score.accuracyScore,
    riskAdjustedScore: score.riskAdjustedScore,
    consistencyScore: score.consistencyScore,
    volumeFactorScore: score.volumeFactorScore,
    tier: score.tier,
    totalScoredTips: score.totalScoredTips,
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
