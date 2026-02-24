// workers/index.ts
//
// Worker entry point that registers all BullMQ workers and sets up
// cron-based repeatable job schedules.
//
// This runs as a SEPARATE process from the Next.js application.
// Start with: npx tsx workers/start.ts
//
// Cron schedules (IST = UTC+5:30):
//   scrape-twitter:   Daily at 6 AM IST (0:30 UTC)
//   scrape-youtube:   Twice daily (2 AM, 2 PM IST = 20:30 UTC prev day, 8:30 UTC)
//   update-prices:    Twice daily at 10 AM & 2 PM IST (4:30 & 8:30 UTC, Mon-Fri)
//   calculate-scores: Chained after price updates (no standalone cron)
//   check-expirations: Every hour
//   daily-snapshot:   Chained after score calculation (no standalone cron)

import type { Worker } from "bullmq";

import {
  scrapeTwitterQueue,
  scrapeYoutubeQueue,
  updatePricesQueue,
  calculateScoresQueue,
  checkExpirationsQueue,
  dailySnapshotQueue,
  scrapeMoneycontrolQueue,
  scrapeFinnhubQueue,
  scrapeYahooAnalystQueue,
  scrapeStocktwitsQueue,
  scrapeTelegramQueue,
  portfolioQueue,
  recommendationQueue,
} from "../src/lib/queue/queues";
import { createTwitterScrapeWorker, createYoutubeScrapeWorker } from "../src/lib/queue/workers/scrape-worker";
import { createParseTipWorker } from "../src/lib/queue/workers/parse-worker";
import { createScoreWorker } from "../src/lib/queue/workers/score-worker";
import { createPriceWorker } from "../src/lib/queue/workers/price-worker";
import {
  createCheckExpirationsWorker,
  createDailySnapshotWorker,
} from "../src/lib/queue/workers/tip-status-worker";
import { createMoneyControlScrapeWorker } from "../src/lib/queue/workers/scrape-moneycontrol-worker";
import { createFinnhubScrapeWorker } from "../src/lib/queue/workers/scrape-finnhub-worker";
import { createYahooAnalystScrapeWorker } from "../src/lib/queue/workers/scrape-yahoo-analyst-worker";
import { createStockTwitsScrapeWorker } from "../src/lib/queue/workers/scrape-stocktwits-worker";
import { createTelegramScrapeWorker } from "../src/lib/queue/workers/scrape-telegram-worker";
import { createNotificationWorker } from "../src/lib/queue/workers/notification-worker";
import { createPortfolioWorker } from "../src/lib/queue/workers/portfolio-worker";
import { createRecommendationWorker } from "../src/lib/queue/workers/recommendation-worker";

// ──── Worker instances ────

const workers: Worker[] = [];

function registerWorkers(): void {
  console.log("[Workers] Registering all workers...");

  // Scraping workers
  workers.push(createTwitterScrapeWorker());
  console.log("[Workers] Registered: scrape-twitter (concurrency: 2)");

  workers.push(createYoutubeScrapeWorker());
  console.log("[Workers] Registered: scrape-youtube (concurrency: 2)");

  // MoneyControl scraping worker
  workers.push(createMoneyControlScrapeWorker());
  console.log("[Workers] Registered: scrape-moneycontrol (concurrency: 1)");

  // Finnhub scraping worker
  workers.push(createFinnhubScrapeWorker());
  console.log("[Workers] Registered: scrape-finnhub (concurrency: 1)");

  // Yahoo Finance analyst scraping worker
  workers.push(createYahooAnalystScrapeWorker());
  console.log("[Workers] Registered: scrape-yahoo-analyst (concurrency: 1)");

  // StockTwits scraping worker
  workers.push(createStockTwitsScrapeWorker());
  console.log("[Workers] Registered: scrape-stocktwits (concurrency: 1)");

  // Telegram scraping worker
  if (process.env.ENABLE_TELEGRAM_SCRAPER !== "false") {
    workers.push(createTelegramScrapeWorker());
    console.log("[Workers] Registered: scrape-telegram (concurrency: 2)");
  } else {
    console.log("[Workers] Skipped: scrape-telegram (disabled via ENABLE_TELEGRAM_SCRAPER)");
  }

  // NLP parsing worker
  workers.push(createParseTipWorker());
  console.log("[Workers] Registered: parse-tip (concurrency: 10)");

  // Price monitoring worker
  workers.push(createPriceWorker());
  console.log("[Workers] Registered: update-prices (concurrency: 5)");

  // Score calculation worker
  workers.push(createScoreWorker());
  console.log("[Workers] Registered: calculate-scores (concurrency: 10)");

  // Tip status/expiration worker
  workers.push(createCheckExpirationsWorker());
  console.log("[Workers] Registered: check-expirations (concurrency: 5)");

  // Daily snapshot worker
  workers.push(createDailySnapshotWorker());
  console.log("[Workers] Registered: daily-snapshot (concurrency: 10)");

  // Notification worker
  workers.push(createNotificationWorker());
  console.log("[Workers] Registered: notifications (concurrency: 5)");

  // Portfolio worker
  workers.push(createPortfolioWorker());
  console.log("[Workers] Registered: portfolio (concurrency: 5)");

  // Recommendation worker
  workers.push(createRecommendationWorker());
  console.log("[Workers] Registered: recommendations (concurrency: 3)");

  console.log(`[Workers] All ${workers.length} workers registered`);
}

// ──── Cron schedule setup ────

async function setupCronSchedules(): Promise<void> {
  console.log("[Workers] Setting up cron schedules...");

  // Twitter scraping: daily at 6 AM IST = 0:30 UTC
  await scrapeTwitterQueue.upsertJobScheduler(
    "cron-scrape-twitter",
    { pattern: "30 0 * * *" },
    {
      name: "scheduled-twitter-scrape",
      data: { type: "full-scrape", triggeredAt: new Date().toISOString() },
    }
  );
  console.log("[Workers] Cron: scrape-twitter — daily at 6 AM IST");

  // YouTube scraping: twice daily at 2 AM and 2 PM IST
  // 2 AM IST = 20:30 UTC (previous day), 2 PM IST = 8:30 UTC
  await scrapeYoutubeQueue.upsertJobScheduler(
    "cron-scrape-youtube",
    { pattern: "30 20 * * *" },
    {
      name: "scheduled-youtube-scrape-morning",
      data: { type: "full-scrape", triggeredAt: new Date().toISOString() },
    }
  );
  await scrapeYoutubeQueue.upsertJobScheduler(
    "cron-scrape-youtube-afternoon",
    { pattern: "30 8 * * *" },
    {
      name: "scheduled-youtube-scrape-afternoon",
      data: { type: "full-scrape", triggeredAt: new Date().toISOString() },
    }
  );
  console.log("[Workers] Cron: scrape-youtube — 2 AM & 2 PM IST");

  // Remove old 5-minute price check scheduler if it exists
  try {
    await updatePricesQueue.removeJobScheduler("cron-update-prices");
  } catch { /* ignore if doesn't exist */ }

  // Price check at 10:00 AM IST = 4:30 UTC, Mon-Fri
  await updatePricesQueue.upsertJobScheduler(
    "cron-update-prices-morning",
    { pattern: "30 4 * * 1-5" },
    {
      name: "scheduled-price-update-morning",
      data: { triggeredAt: new Date().toISOString(), checkId: "morning-10am" },
    }
  );
  console.log("[Workers] Cron: update-prices — 10:00 AM IST Mon-Fri");

  // Price check at 2:00 PM IST = 8:30 UTC, Mon-Fri
  await updatePricesQueue.upsertJobScheduler(
    "cron-update-prices-afternoon",
    { pattern: "30 8 * * 1-5" },
    {
      name: "scheduled-price-update-afternoon",
      data: { triggeredAt: new Date().toISOString(), checkId: "afternoon-2pm" },
    }
  );
  console.log("[Workers] Cron: update-prices — 2:00 PM IST Mon-Fri");

  // Score calculation is now chained from the price worker
  // Remove standalone cron if it exists
  try {
    await calculateScoresQueue.removeJobScheduler("cron-calculate-scores");
  } catch { /* ignore */ }
  console.log("[Workers] Cron: calculate-scores — chained after price updates");

  // MoneyControl scraping: daily at 8 AM IST = 2:30 UTC
  await scrapeMoneycontrolQueue.upsertJobScheduler(
    "cron-scrape-moneycontrol",
    { pattern: "30 2 * * *" },
    {
      name: "scheduled-moneycontrol-scrape",
      data: { type: "full-scrape", triggeredAt: new Date().toISOString() },
    }
  );
  console.log("[Workers] Cron: scrape-moneycontrol — daily at 8 AM IST");

  // Finnhub scraping: twice daily at 6 AM and 6 PM UTC
  await scrapeFinnhubQueue.upsertJobScheduler(
    "cron-scrape-finnhub-morning",
    { pattern: "0 6 * * *" },
    {
      name: "scheduled-finnhub-scrape-morning",
      data: { type: "full-scrape", triggeredAt: new Date().toISOString() },
    }
  );
  await scrapeFinnhubQueue.upsertJobScheduler(
    "cron-scrape-finnhub-evening",
    { pattern: "0 18 * * *" },
    {
      name: "scheduled-finnhub-scrape-evening",
      data: { type: "full-scrape", triggeredAt: new Date().toISOString() },
    }
  );
  console.log("[Workers] Cron: scrape-finnhub — 6 AM & 6 PM UTC");

  // Yahoo Finance analyst scraping: daily at midnight UTC
  await scrapeYahooAnalystQueue.upsertJobScheduler(
    "cron-scrape-yahoo-analyst",
    { pattern: "0 0 * * *" },
    {
      name: "scheduled-yahoo-analyst-scrape",
      data: { type: "full-scrape", triggeredAt: new Date().toISOString() },
    }
  );
  console.log("[Workers] Cron: scrape-yahoo-analyst — daily at midnight UTC");

  // StockTwits scraping: every 4 hours during US market hours (14:30-21:00 UTC, Mon-Fri)
  await scrapeStocktwitsQueue.upsertJobScheduler(
    "cron-scrape-stocktwits",
    { pattern: "30 14,18 * * 1-5" },
    {
      name: "scheduled-stocktwits-scrape",
      data: { type: "full-scrape", triggeredAt: new Date().toISOString() },
    }
  );
  console.log("[Workers] Cron: scrape-stocktwits — 2:30 PM & 6:30 PM UTC Mon-Fri");

  // Telegram scraping: daily at 10 AM IST = 4:30 UTC
  if (process.env.ENABLE_TELEGRAM_SCRAPER !== "false") {
    await scrapeTelegramQueue.upsertJobScheduler(
      "cron-scrape-telegram",
      { pattern: "30 4 * * *" },
      {
        name: "scheduled-telegram-scrape",
        data: { type: "full-scrape", triggeredAt: new Date().toISOString() },
      }
    );
    console.log("[Workers] Cron: scrape-telegram — daily at 10 AM IST");
  }

  // Expiration checks: every hour
  await checkExpirationsQueue.upsertJobScheduler(
    "cron-check-expirations",
    { pattern: "0 * * * *" },
    {
      name: "scheduled-expiration-check",
      data: { triggeredAt: new Date().toISOString() },
    }
  );
  console.log("[Workers] Cron: check-expirations — every hour");

  // Daily snapshots are now chained from the price worker
  // Remove standalone cron if it exists
  try {
    await dailySnapshotQueue.removeJobScheduler("cron-daily-snapshot");
  } catch { /* ignore */ }
  console.log("[Workers] Cron: daily-snapshot — chained after score calculation");

  // Portfolio recalculation: chains after price updates (same times)
  await portfolioQueue.upsertJobScheduler(
    "cron-portfolio-recalculate",
    { pattern: "35 4,8 * * 1-5" }, // 5 min after price updates
    {
      name: "scheduled-portfolio-recalculate",
      data: { type: "recalculate-all", triggeredAt: new Date().toISOString() },
    }
  );
  console.log("[Workers] Cron: portfolio recalculate — after price updates Mon-Fri");

  // Portfolio snapshots: daily at 4:30 PM IST = 11:00 UTC
  await portfolioQueue.upsertJobScheduler(
    "cron-portfolio-snapshot",
    { pattern: "0 11 * * 1-5" },
    {
      name: "scheduled-portfolio-snapshot",
      data: { type: "snapshot", triggeredAt: new Date().toISOString() },
    }
  );
  console.log("[Workers] Cron: portfolio snapshot — daily at 4:30 PM IST");

  // Recommendation pre-computation: daily after score calculation
  await recommendationQueue.upsertJobScheduler(
    "cron-compute-recommendations",
    { pattern: "0 12 * * *" }, // noon UTC
    {
      name: "scheduled-recommendation-compute",
      data: { triggeredAt: new Date().toISOString() },
    }
  );
  console.log("[Workers] Cron: recommendations — daily at noon UTC");

  console.log("[Workers] All cron schedules configured");
}

// ──── Graceful shutdown ────

async function shutdown(signal: string): Promise<void> {
  console.log(`[Workers] Received ${signal}, shutting down gracefully...`);

  // Close all workers (wait for current jobs to complete)
  const closePromises = workers.map(async (worker) => {
    try {
      await worker.close();
    } catch (error) {
      console.error(
        `[Workers] Error closing worker ${worker.name}:`,
        error instanceof Error ? error.message : String(error)
      );
    }
  });

  await Promise.all(closePromises);
  console.log("[Workers] All workers closed. Exiting.");
  process.exit(0);
}

// Register shutdown handlers
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

// Handle unhandled rejections
process.on("unhandledRejection", (reason) => {
  console.error("[Workers] Unhandled rejection:", reason);
});

// ──── Main startup ────

async function main(): Promise<void> {
  console.log("[Workers] ===== RateMyTip Worker Process Starting =====");
  console.log(
    `[Workers] Environment: ${process.env.NODE_ENV ?? "development"}`
  );
  console.log(
    `[Workers] Redis: ${process.env.REDIS_URL ?? "redis://localhost:6379"}`
  );

  registerWorkers();
  await setupCronSchedules();

  console.log("[Workers] ===== All workers running. Waiting for jobs... =====");
}

main().catch((error) => {
  console.error("[Workers] Fatal startup error:", error);
  process.exit(1);
});
