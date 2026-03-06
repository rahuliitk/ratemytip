// src/lib/queue/workers/price-worker.ts
//
// BullMQ worker that fetches current market prices and checks active tips
// against their targets and stop-losses using the PriceMonitor service.
// Runs periodically; skips checking when no global markets are open.

import { Worker, type Job } from "bullmq";
import { toZonedTime } from "date-fns-tz";

import { createLogger } from "@/lib/logger";
import { PriceMonitor } from "@/lib/market-data/price-monitor";

const log = createLogger("worker/price");
import { EXCHANGE_MARKET_HOURS } from "@/lib/constants";

const IST_TIMEZONE = "Asia/Kolkata";
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
 * Check if NSE market is currently open (9:15 AM - 3:30 PM IST, Mon-Fri).
 * Uses proper IST timezone conversion instead of static UTC offsets.
 */
function isNseMarketOpen(): boolean {
  const nowIST = toZonedTime(new Date(), IST_TIMEZONE);
  const day = nowIST.getDay(); // 0=Sun, 6=Sat

  if (day === 0 || day === 6) return false;

  const hours = nowIST.getHours();
  const minutes = nowIST.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  const marketOpen = 9 * 60 + 15;   // 9:15 AM IST
  const marketClose = 15 * 60 + 30;  // 3:30 PM IST

  return timeInMinutes >= marketOpen && timeInMinutes <= marketClose;
}

/**
 * Check if any global market is currently open.
 * Uses IST-aware check for NSE/BSE, UTC-based for other exchanges.
 * Returns true if at least one exchange is currently in trading hours.
 */
function isAnyMarketOpen(): boolean {
  // Check NSE/BSE with proper IST timezone handling
  if (isNseMarketOpen()) return true;

  const now = new Date();
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const dayOfWeek = now.getUTCDay(); // 0=Sun, 6=Sat

  for (const [exchange, hours] of Object.entries(EXCHANGE_MARKET_HOURS)) {
    // Skip NSE/BSE — already checked with IST-aware function above
    if (exchange === "NSE" || exchange === "BSE") continue;

    // Skip weekday-only exchanges on weekends
    if (hours.weekdays && (dayOfWeek === 0 || dayOfWeek === 6)) {
      continue;
    }

    const openMinutes = hours.openUTC.hour * 60 + hours.openUTC.minute;
    const closeMinutes = hours.closeUTC.hour * 60 + hours.closeUTC.minute;

    if (utcMinutes >= openMinutes && utcMinutes <= closeMinutes) {
      return true;
    }
  }

  return false;
}

// ──── Main job processor ────

async function processUpdatePricesJob(
  job: Job<UpdatePricesJobData>
): Promise<{ updatesApplied: number; marketOpen: boolean; scoresTriggered: boolean }> {
  log.info({ triggeredAt: job.data.triggeredAt }, "Processing price update job");

  // Check if market is open — if not, skip the price check
  // but still process (the PriceMonitor handles empty results gracefully)
  const marketOpen = isAnyMarketOpen();

  if (!marketOpen) {
    log.info("Market is closed, skipping price check");
    return { updatesApplied: 0, marketOpen: false, scoresTriggered: false };
  }

  const monitor = new PriceMonitor();

  try {
    const updates = await monitor.checkActiveTips();

    log.info({ updatesApplied: updates.length }, "Price check complete");

    // Chain: trigger full score recalculation after price check
    log.info("Chaining full score recalculation");
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
    log.info("Score recalculation and snapshot jobs enqueued");

    return { updatesApplied: updates.length, marketOpen: true, scoresTriggered: true };
  } catch (error) {
    log.error({ err: error instanceof Error ? error : new Error(String(error)) }, "Price update failed");
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
    log.info({ jobId: job.id }, "Price job completed");
  });

  worker.on("failed", (job, error) => {
    log.error({ err: error, jobId: job?.id }, "Price job failed");
  });

  return worker;
}
