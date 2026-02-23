// src/lib/queue/workers/tip-status-worker.ts
//
// BullMQ worker that checks for expired tips and updates their status.
// Runs every hour to catch tips whose expiry date has passed but that
// were not caught by the real-time price monitor (e.g., tips that expired
// outside market hours or during downtime).
//
// Also handles daily score snapshot creation after score recalculation.

import { Worker, type Job } from "bullmq";

import { createLogger } from "@/lib/logger";
import { db } from "@/lib/db";

const log = createLogger("worker/tip-status");
import { TIP_STATUS } from "@/lib/constants";

// ──── Job payload types ────

interface CheckExpirationsJobData {
  readonly triggeredAt: string;
}

interface DailySnapshotJobData {
  readonly triggeredAt: string;
}

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

// ──── Expiration check processor ────

async function processCheckExpirations(
  job: Job<CheckExpirationsJobData>
): Promise<{ expiredCount: number }> {
  log.info({ triggeredAt: job.data.triggeredAt }, "Checking for expired tips");

  const now = new Date();

  // Find all tips that are still active/monitoring but past their expiry date
  const expiredTips = await db.tip.findMany({
    where: {
      status: {
        in: ["ACTIVE", "TARGET_1_HIT", "TARGET_2_HIT"],
      },
      expiresAt: { lte: now },
    },
    select: {
      id: true,
      creatorId: true,
      entryPrice: true,
      direction: true,
      stopLoss: true,
      status: true,
      stock: {
        select: {
          symbol: true,
          lastPrice: true,
        },
      },
    },
  });

  if (expiredTips.length === 0) {
    log.info("No expired tips found");
    return { expiredCount: 0 };
  }

  log.info({ count: expiredTips.length }, "Found expired tips to process");

  let expiredCount = 0;

  for (const tip of expiredTips) {
    try {
      // Use the stock's last known price as the closing price
      const closedPrice = tip.stock.lastPrice ?? tip.entryPrice;

      // Calculate return percentage
      const isBuy = tip.direction === "BUY";
      const returnPct = isBuy
        ? ((closedPrice - tip.entryPrice) / tip.entryPrice) * 100
        : ((tip.entryPrice - closedPrice) / tip.entryPrice) * 100;

      // Calculate risk-reward ratio
      const riskPct =
        Math.abs(tip.entryPrice - tip.stopLoss) / tip.entryPrice;
      const riskRewardRatio =
        riskPct > 0 ? (returnPct / 100) / riskPct : 0;

      await db.tip.update({
        where: { id: tip.id },
        data: {
          status: TIP_STATUS.EXPIRED,
          statusUpdatedAt: now,
          closedPrice,
          closedAt: now,
          returnPct,
          riskRewardRatio,
        },
      });

      expiredCount++;

      log.info({ tipId: tip.id, symbol: tip.stock.symbol, returnPct }, "Expired tip processed");
    } catch (error) {
      log.error({ err: error instanceof Error ? error : new Error(String(error)), tipId: tip.id }, "Failed to expire tip");
    }
  }

  // Update creator active tip counts for affected creators
  const affectedCreatorIds = [
    ...new Set(expiredTips.map((t) => t.creatorId)),
  ];

  for (const creatorId of affectedCreatorIds) {
    try {
      const activeTipCount = await db.tip.count({
        where: { creatorId, status: "ACTIVE" },
      });
      const completedTipCount = await db.tip.count({
        where: {
          creatorId,
          status: {
            in: [
              "TARGET_1_HIT",
              "TARGET_2_HIT",
              "TARGET_3_HIT",
              "ALL_TARGETS_HIT",
              "STOPLOSS_HIT",
              "EXPIRED",
            ],
          },
        },
      });

      await db.creator.update({
        where: { id: creatorId },
        data: {
          activeTips: activeTipCount,
          completedTips: completedTipCount,
        },
      });
    } catch (error) {
      log.error({ err: error instanceof Error ? error : new Error(String(error)), creatorId }, "Failed to update creator counts");
    }
  }

  log.info({ expiredCount, affectedCreators: affectedCreatorIds.length }, "Processed expired tips");

  return { expiredCount };
}

// ──── Daily snapshot processor ────

async function processDailySnapshot(
  job: Job<DailySnapshotJobData>
): Promise<{ snapshotsCreated: number }> {
  log.info({ triggeredAt: job.data.triggeredAt }, "Creating daily snapshots");

  const today = new Date();
  // Normalize to date-only (strip time component)
  const snapshotDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  // Fetch all creator scores
  const scores = await db.creatorScore.findMany({
    select: {
      creatorId: true,
      rmtScore: true,
      accuracyRate: true,
      totalScoredTips: true,
    },
  });

  let snapshotsCreated = 0;

  for (const score of scores) {
    try {
      await db.scoreSnapshot.upsert({
        where: {
          creatorId_date: {
            creatorId: score.creatorId,
            date: snapshotDate,
          },
        },
        create: {
          creatorId: score.creatorId,
          date: snapshotDate,
          rmtScore: score.rmtScore,
          accuracyRate: score.accuracyRate,
          totalScoredTips: score.totalScoredTips,
        },
        update: {
          rmtScore: score.rmtScore,
          accuracyRate: score.accuracyRate,
          totalScoredTips: score.totalScoredTips,
        },
      });

      snapshotsCreated++;
    } catch (error) {
      log.error({ err: error instanceof Error ? error : new Error(String(error)), creatorId: score.creatorId }, "Failed to create snapshot for creator");
    }
  }

  log.info({ snapshotsCreated }, "Created daily snapshots");

  return { snapshotsCreated };
}

// ──── Worker registration ────

/**
 * Create and return the tip expiration check worker.
 * Processes jobs from the "check-expirations" queue with concurrency 5.
 */
export function createCheckExpirationsWorker(): Worker {
  const worker = new Worker<CheckExpirationsJobData>(
    "check-expirations",
    processCheckExpirations,
    {
      connection: getConnection(),
      concurrency: 5,
    }
  );

  worker.on("completed", (job) => {
    log.info({ jobId: job.id }, "Expiration check job completed");
  });

  worker.on("failed", (job, error) => {
    log.error({ err: error, jobId: job?.id }, "Expiration check job failed");
  });

  return worker;
}

/**
 * Create and return the daily snapshot worker.
 * Processes jobs from the "daily-snapshot" queue with concurrency 10.
 */
export function createDailySnapshotWorker(): Worker {
  const worker = new Worker<DailySnapshotJobData>(
    "daily-snapshot",
    processDailySnapshot,
    {
      connection: getConnection(),
      concurrency: 10,
    }
  );

  worker.on("completed", (job) => {
    log.info({ jobId: job.id }, "Daily snapshot job completed");
  });

  worker.on("failed", (job, error) => {
    log.error({ err: error, jobId: job?.id }, "Daily snapshot job failed");
  });

  return worker;
}
