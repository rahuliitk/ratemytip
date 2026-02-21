// src/lib/queue/workers/tip-status-worker.ts
//
// BullMQ worker that checks for expired tips and updates their status.
// Runs every hour to catch tips whose expiry date has passed but that
// were not caught by the real-time price monitor (e.g., tips that expired
// outside market hours or during downtime).
//
// Also handles daily score snapshot creation after score recalculation.

import { Worker, type Job } from "bullmq";

import { db } from "@/lib/db";
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
  console.log(
    `[TipStatusWorker] Checking for expired tips (triggered: ${job.data.triggeredAt})`
  );

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
    console.log("[TipStatusWorker] No expired tips found");
    return { expiredCount: 0 };
  }

  console.log(
    `[TipStatusWorker] Found ${expiredTips.length} expired tips to process`
  );

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

      console.log(
        `[TipStatusWorker] Expired tip ${tip.id}: ${tip.stock.symbol} ` +
          `(return: ${returnPct.toFixed(2)}%)`
      );
    } catch (error) {
      console.error(
        `[TipStatusWorker] Failed to expire tip ${tip.id}:`,
        error instanceof Error ? error.message : String(error)
      );
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
      console.error(
        `[TipStatusWorker] Failed to update creator ${creatorId} counts:`,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  console.log(
    `[TipStatusWorker] Processed ${expiredCount} expired tips across ${affectedCreatorIds.length} creators`
  );

  return { expiredCount };
}

// ──── Daily snapshot processor ────

async function processDailySnapshot(
  job: Job<DailySnapshotJobData>
): Promise<{ snapshotsCreated: number }> {
  console.log(
    `[TipStatusWorker:Snapshot] Creating daily snapshots (triggered: ${job.data.triggeredAt})`
  );

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
      console.error(
        `[TipStatusWorker:Snapshot] Failed to create snapshot for creator ${score.creatorId}:`,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  console.log(
    `[TipStatusWorker:Snapshot] Created ${snapshotsCreated} daily snapshots`
  );

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
    console.log(`[TipStatusWorker] Job ${job.id} completed`);
  });

  worker.on("failed", (job, error) => {
    console.error(
      `[TipStatusWorker] Job ${job?.id} failed:`,
      error.message
    );
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
    console.log(`[TipStatusWorker:Snapshot] Job ${job.id} completed`);
  });

  worker.on("failed", (job, error) => {
    console.error(
      `[TipStatusWorker:Snapshot] Job ${job?.id} failed:`,
      error.message
    );
  });

  return worker;
}
