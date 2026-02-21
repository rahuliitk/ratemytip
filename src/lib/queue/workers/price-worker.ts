// src/lib/queue/workers/price-worker.ts
//
// BullMQ worker that fetches current market prices and checks active tips
// against their targets and stop-losses using the PriceMonitor service.
// Runs every 5 minutes during market hours (Mon-Fri, 9:15 AM - 3:30 PM IST).

import { Worker, type Job } from "bullmq";

import { PriceMonitor } from "@/lib/market-data/price-monitor";
import { MARKET_HOURS } from "@/lib/constants";
import { calculateScoresQueue, dailySnapshotQueue } from "@/lib/queue/queues";

// ──── Job payload type ────

interface UpdatePricesJobData {
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

/**
 * Check if the Indian stock market is currently open.
 * Market hours: 9:15 AM - 3:30 PM IST, Monday through Friday.
 */
function isMarketOpen(): boolean {
  // Get current time in IST
  const now = new Date();
  const istOffset = 5.5 * 60; // IST is UTC+5:30 in minutes
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const istMinutes = utcMinutes + istOffset;

  // Get IST day of week (0 = Sunday, 6 = Saturday)
  const istDate = new Date(now.getTime() + istOffset * 60 * 1000);
  const dayOfWeek = istDate.getUTCDay();

  // Skip weekends
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }

  const openMinutes =
    MARKET_HOURS.NSE_OPEN.hour * 60 + MARKET_HOURS.NSE_OPEN.minute;
  const closeMinutes =
    MARKET_HOURS.NSE_CLOSE.hour * 60 + MARKET_HOURS.NSE_CLOSE.minute;

  return istMinutes >= openMinutes && istMinutes <= closeMinutes;
}

// ──── Main job processor ────

async function processUpdatePricesJob(
  job: Job<UpdatePricesJobData>
): Promise<{ updatesApplied: number; marketOpen: boolean; scoresTriggered: boolean }> {
  console.log(
    `[PriceWorker] Processing price update job (triggered: ${job.data.triggeredAt})`
  );

  // Check if market is open — if not, skip the price check
  // but still process (the PriceMonitor handles empty results gracefully)
  const marketOpen = isMarketOpen();

  if (!marketOpen) {
    console.log("[PriceWorker] Market is closed, skipping price check");
    return { updatesApplied: 0, marketOpen: false, scoresTriggered: false };
  }

  const monitor = new PriceMonitor();

  try {
    const updates = await monitor.checkActiveTips();

    console.log(
      `[PriceWorker] Price check complete: ${updates.length} tip status updates applied`
    );

    // Chain: trigger full score recalculation after price check
    console.log("[PriceWorker] Chaining full score recalculation...");
    await calculateScoresQueue.add(
      "recalculate-all",
      { type: "full", triggeredBy: "price-check" },
      { jobId: `score-after-price-${Date.now()}` }
    );

    // Chain: trigger daily snapshot (delayed 5 min to let scores finish)
    await dailySnapshotQueue.add(
      "scheduled-daily-snapshot",
      { triggeredAt: new Date().toISOString() },
      {
        jobId: `snapshot-after-price-${Date.now()}`,
        delay: 300_000, // 5 minutes
      }
    );
    console.log("[PriceWorker] Score recalculation and snapshot jobs enqueued");

    return { updatesApplied: updates.length, marketOpen: true, scoresTriggered: true };
  } catch (error) {
    console.error(
      "[PriceWorker] Price update failed:",
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }
}

// ──── Worker registration ────

/**
 * Create and return the price update worker.
 * Processes jobs from the "update-prices" queue with concurrency 5.
 */
export function createPriceWorker(): Worker {
  const worker = new Worker<UpdatePricesJobData>(
    "update-prices",
    processUpdatePricesJob,
    {
      connection: getConnection(),
      concurrency: 5,
    }
  );

  worker.on("completed", (job) => {
    console.log(`[PriceWorker] Job ${job.id} completed`);
  });

  worker.on("failed", (job, error) => {
    console.error(
      `[PriceWorker] Job ${job?.id} failed:`,
      error.message
    );
  });

  return worker;
}
