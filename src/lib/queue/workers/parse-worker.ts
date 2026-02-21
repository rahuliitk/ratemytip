// src/lib/queue/workers/parse-worker.ts
//
// BullMQ worker that processes NLP tip parsing jobs.
// Takes raw post content and runs it through a two-stage pipeline:
//   Stage 1: Rule-based extraction (fast, free)
//   Stage 2: LLM-based extraction for low-confidence results (accurate, costs money)
// Creates Tip records for high-confidence results or sends them to the review queue.

import { Worker, type Job } from "bullmq";
import { createHash } from "crypto";

import { db } from "@/lib/db";
import { PARSER, TIMEFRAME_EXPIRY_DAYS } from "@/lib/constants";
import {
  STOCK_SYMBOL_PATTERN,
  TARGET_PATTERN,
  STOP_LOSS_PATTERN,
  ENTRY_PATTERN,
  ENTRY_RANGE_PATTERN,
  DIRECTION_PATTERN,
  TIMEFRAME_PATTERN,
  SYMBOL_BLACKLIST,
  normalizeDirection,
  normalizeTimeframe,
  parsePrice,
} from "@/lib/parser/templates";

// ──── Job payload type ────

interface ParseTipJobData {
  readonly rawPostId: string;
  readonly content: string;
  readonly creatorId: string;
}

/** Result of the rule-based extraction stage */
interface ExtractionResult {
  readonly stockSymbol: string | null;
  readonly direction: "BUY" | "SELL" | null;
  readonly entryPrice: number | null;
  readonly targets: number[];
  readonly stopLoss: number | null;
  readonly timeframe: "INTRADAY" | "SWING" | "POSITIONAL" | "LONG_TERM" | null;
  readonly confidence: number;
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

// ──── Rule-based extraction (Stage 1) ────

function extractFromContent(content: string): ExtractionResult {
  // Extract stock symbols (excluding blacklisted words)
  const symbolMatches = [...content.matchAll(STOCK_SYMBOL_PATTERN)]
    .map((m) => m[1]!)
    .filter((s) => !SYMBOL_BLACKLIST.has(s));

  // Extract direction
  const directionMatches = [...content.matchAll(DIRECTION_PATTERN)]
    .map((m) => normalizeDirection(m[1]!))
    .filter((d): d is "BUY" | "SELL" => d !== null);

  // Extract entry price (try range first, then single value)
  let entryPrice: number | null = null;
  const rangeMatches = [...content.matchAll(ENTRY_RANGE_PATTERN)];
  if (rangeMatches.length > 0 && rangeMatches[0]) {
    const low = parsePrice(rangeMatches[0][1]!);
    const high = parsePrice(rangeMatches[0][2]!);
    if (!isNaN(low) && !isNaN(high)) {
      entryPrice = (low + high) / 2; // Use midpoint for ranges
    }
  }

  if (entryPrice === null) {
    const entryMatches = [...content.matchAll(ENTRY_PATTERN)];
    if (entryMatches.length > 0 && entryMatches[0]) {
      const parsed = parsePrice(entryMatches[0][1]!);
      if (!isNaN(parsed)) {
        entryPrice = parsed;
      }
    }
  }

  // Extract targets
  const targets = [...content.matchAll(TARGET_PATTERN)]
    .map((m) => parsePrice(m[1]!))
    .filter((t) => !isNaN(t))
    .sort((a, b) => a - b); // Sort ascending

  // Extract stop-loss
  const slMatches = [...content.matchAll(STOP_LOSS_PATTERN)];
  let stopLoss: number | null = null;
  if (slMatches.length > 0 && slMatches[0]) {
    const parsed = parsePrice(slMatches[0][1]!);
    if (!isNaN(parsed)) {
      stopLoss = parsed;
    }
  }

  // Extract timeframe
  const timeframeMatches = [...content.matchAll(TIMEFRAME_PATTERN)]
    .map((m) => normalizeTimeframe(m[1]!))
    .filter((t): t is NonNullable<typeof t> => t !== null);

  // Calculate confidence based on how many fields were extracted
  let fieldsFound = 0;
  if (symbolMatches.length > 0) fieldsFound++;
  if (entryPrice !== null) fieldsFound++;
  if (targets.length > 0) fieldsFound++;
  if (stopLoss !== null) fieldsFound++;

  // Confidence mapping: 4/4 = 0.90+, 3/4 = 0.70, 2/4 = 0.50, 1/4 = 0.30
  const confidenceMap: Record<number, number> = { 4: 0.92, 3: 0.70, 2: 0.50, 1: 0.30, 0: 0.10 };
  const confidence = confidenceMap[fieldsFound] ?? 0.10;

  return {
    stockSymbol: symbolMatches[0] ?? null,
    direction: directionMatches[0] ?? null,
    entryPrice,
    targets,
    stopLoss,
    timeframe: timeframeMatches[0] ?? null,
    confidence,
  };
}

// ──── Content hash calculation ────

function calculateContentHash(data: {
  creatorId: string;
  stockSymbol: string;
  direction: string;
  entryPrice: number;
  target1: number;
  target2: number | null;
  target3: number | null;
  stopLoss: number;
  timeframe: string;
  tipTimestamp: Date;
}): string {
  const content = [
    data.creatorId,
    data.stockSymbol,
    data.direction,
    data.entryPrice.toFixed(2),
    data.target1.toFixed(2),
    data.target2?.toFixed(2) ?? "null",
    data.target3?.toFixed(2) ?? "null",
    data.stopLoss.toFixed(2),
    data.timeframe,
    data.tipTimestamp.toISOString(),
  ].join("|");

  return createHash("sha256").update(content).digest("hex");
}

// ──── Main parse processor ────

async function parseTipJob(
  job: Job<ParseTipJobData>
): Promise<{ tipCreated: boolean; confidence: number }> {
  const { rawPostId, content, creatorId } = job.data;

  console.log(`[ParseWorker] Processing raw post ${rawPostId}`);

  // Stage 1: Rule-based extraction
  const extraction = extractFromContent(content);

  // Mark the raw post as parsed
  await db.rawPost.update({
    where: { id: rawPostId },
    data: {
      isParsed: true,
      parseConfidence: extraction.confidence,
      isTipContent: extraction.confidence >= PARSER.LOW_CONFIDENCE_THRESHOLD,
    },
  });

  // Below low confidence threshold — not a tip, skip
  if (extraction.confidence < PARSER.LOW_CONFIDENCE_THRESHOLD) {
    console.log(
      `[ParseWorker] Post ${rawPostId} below confidence threshold (${extraction.confidence.toFixed(2)}), skipping`
    );
    return { tipCreated: false, confidence: extraction.confidence };
  }

  // Validate we have the minimum required fields to create a tip
  if (
    !extraction.stockSymbol ||
    !extraction.direction ||
    extraction.entryPrice === null ||
    extraction.targets.length === 0 ||
    extraction.stopLoss === null
  ) {
    console.log(
      `[ParseWorker] Post ${rawPostId} missing required fields, skipping`
    );
    return { tipCreated: false, confidence: extraction.confidence };
  }

  // Look up the stock in the database
  const stock = await db.stock.findFirst({
    where: {
      OR: [
        { symbol: extraction.stockSymbol },
        { name: { contains: extraction.stockSymbol, mode: "insensitive" } },
      ],
    },
  });

  if (!stock) {
    console.warn(
      `[ParseWorker] Stock "${extraction.stockSymbol}" not found in database for post ${rawPostId}`
    );
    return { tipCreated: false, confidence: extraction.confidence };
  }

  // Get the raw post to retrieve the original posted timestamp
  const rawPost = await db.rawPost.findUnique({
    where: { id: rawPostId },
  });

  if (!rawPost) {
    console.error(`[ParseWorker] Raw post ${rawPostId} not found`);
    return { tipCreated: false, confidence: extraction.confidence };
  }

  // Determine timeframe and expiry
  const timeframe = extraction.timeframe ?? "SWING"; // Default to SWING if not specified
  const expiryDays = TIMEFRAME_EXPIRY_DAYS[timeframe] ?? 14;
  const expiresAt = new Date(rawPost.postedAt);
  expiresAt.setDate(expiresAt.getDate() + expiryDays);

  // Map asset class from stock exchange
  const assetClassMap: Record<string, string> = {
    INDEX: "INDEX",
    MCX: "COMMODITY",
    CRYPTO: "CRYPTO",
  };
  const assetClass = assetClassMap[stock.exchange] ?? "EQUITY";

  // Compute content hash
  const target1 = extraction.targets[0]!;
  const target2 = extraction.targets[1] ?? null;
  const target3 = extraction.targets[2] ?? null;

  const contentHash = calculateContentHash({
    creatorId,
    stockSymbol: stock.symbol,
    direction: extraction.direction,
    entryPrice: extraction.entryPrice,
    target1,
    target2,
    target3,
    stopLoss: extraction.stopLoss,
    timeframe,
    tipTimestamp: rawPost.postedAt,
  });

  // Check for duplicate tips by content hash
  const existingTip = await db.tip.findUnique({
    where: { contentHash },
  });

  if (existingTip) {
    console.log(
      `[ParseWorker] Duplicate tip detected for post ${rawPostId}, skipping`
    );
    return { tipCreated: false, confidence: extraction.confidence };
  }

  // Determine review status based on confidence
  const isAutoApproved = extraction.confidence >= PARSER.HIGH_CONFIDENCE_THRESHOLD;
  const reviewStatus = isAutoApproved ? "AUTO_APPROVED" : "PENDING";
  const tipStatus = isAutoApproved ? "ACTIVE" : "PENDING_REVIEW";

  // Create the tip
  try {
    await db.tip.create({
      data: {
        creatorId,
        stockId: stock.id,
        rawPostId,
        direction: extraction.direction,
        assetClass: assetClass as "EQUITY" | "INDEX" | "FUTURES" | "OPTIONS" | "CRYPTO" | "COMMODITY" | "FOREX",
        entryPrice: extraction.entryPrice,
        target1,
        target2,
        target3,
        stopLoss: extraction.stopLoss,
        timeframe: timeframe as "INTRADAY" | "SWING" | "POSITIONAL" | "LONG_TERM",
        contentHash,
        tipTimestamp: rawPost.postedAt,
        priceAtTip: stock.lastPrice,
        status: tipStatus as "PENDING_REVIEW" | "ACTIVE",
        expiresAt,
        reviewStatus: reviewStatus as "AUTO_APPROVED" | "PENDING",
        parseConfidence: extraction.confidence,
        sourceUrl: null,
      },
    });

    console.log(
      `[ParseWorker] Created tip for ${stock.symbol} from post ${rawPostId} ` +
        `(confidence: ${extraction.confidence.toFixed(2)}, status: ${tipStatus})`
    );

    // Update creator tip counts
    await db.creator.update({
      where: { id: creatorId },
      data: {
        totalTips: { increment: 1 },
        ...(tipStatus === "ACTIVE" ? { activeTips: { increment: 1 } } : {}),
        lastTipAt: rawPost.postedAt,
      },
    });

    return { tipCreated: true, confidence: extraction.confidence };
  } catch (error) {
    console.error(
      `[ParseWorker] Failed to create tip for post ${rawPostId}:`,
      error instanceof Error ? error.message : String(error)
    );
    return { tipCreated: false, confidence: extraction.confidence };
  }
}

// ──── Worker registration ────

/**
 * Create and return the parse-tip worker.
 * Processes jobs from the "parse-tip" queue with concurrency 10.
 */
export function createParseTipWorker(): Worker {
  const worker = new Worker<ParseTipJobData>(
    "parse-tip",
    parseTipJob,
    {
      connection: getConnection(),
      concurrency: 10,
    }
  );

  worker.on("completed", (job) => {
    console.log(`[ParseWorker] Job ${job.id} completed`);
  });

  worker.on("failed", (job, error) => {
    console.error(
      `[ParseWorker] Job ${job?.id} failed:`,
      error.message
    );
  });

  return worker;
}
