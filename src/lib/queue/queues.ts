// src/lib/queue/queues.ts
//
// BullMQ queue definitions for all background job types.
// Each queue uses a shared Redis connection parsed from the REDIS_URL
// environment variable.

import { Queue } from "bullmq";

/**
 * Parse the REDIS_URL environment variable into a BullMQ-compatible
 * connection object with host, port, and optional password.
 */
function getConnection(): { host: string; port: number; password?: string } {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || "6379", 10),
    password: parsed.password || undefined,
  };
}

const connection = getConnection();

/** Queue for Twitter scraping jobs — scrapes tweets from tracked creators */
export const scrapeTwitterQueue = new Queue("scrape-twitter", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { age: 86400 }, // Keep completed jobs for 24h
    removeOnFail: { age: 604800 },    // Keep failed jobs for 7 days
  },
});

/** Queue for YouTube scraping jobs — scrapes videos from tracked channels */
export const scrapeYoutubeQueue = new Queue("scrape-youtube", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 604800 },
  },
});

/** Queue for NLP tip parsing — processes raw posts into structured tips */
export const parseTipQueue = new Queue("parse-tip", {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "exponential", delay: 3000 },
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 259200 }, // 3 days
  },
});

/** Queue for price updates — fetches current prices and checks active tips */
export const updatePricesQueue = new Queue("update-prices", {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { age: 3600 }, // 1 hour
    removeOnFail: { age: 86400 },
  },
});

/** Queue for score calculation — recalculates RMT scores for all creators */
export const calculateScoresQueue = new Queue("calculate-scores", {
  connection,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 604800 },
  },
});

/** Queue for expiration checks — marks expired tips */
export const checkExpirationsQueue = new Queue("check-expirations", {
  connection,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: { age: 3600 },
    removeOnFail: { age: 86400 },
  },
});

/** Queue for daily score snapshots — stores historical score data points */
export const dailySnapshotQueue = new Queue("daily-snapshot", {
  connection,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 604800 },
  },
});

/** Queue for MoneyControl scraping jobs — scrapes brokerage recommendations */
export const scrapeMoneycontrolQueue = new Queue("scrape-moneycontrol", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 604800 },
  },
});

/** Queue for Finnhub scraping jobs — global analyst upgrade/downgrade data */
export const scrapeFinnhubQueue = new Queue("scrape-finnhub", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 10000 },
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 604800 },
  },
});

/** Queue for Yahoo Finance analyst scraping — global analyst consensus data */
export const scrapeYahooAnalystQueue = new Queue("scrape-yahoo-analyst", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 10000 },
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 604800 },
  },
});

/** Queue for StockTwits scraping — community posts for NLP parsing */
export const scrapeStocktwitsQueue = new Queue("scrape-stocktwits", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 604800 },
  },
});
