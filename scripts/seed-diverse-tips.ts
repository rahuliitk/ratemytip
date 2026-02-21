/**
 * scripts/seed-diverse-tips.ts
 *
 * Creates diverse creators and tips across ALL categories so that category
 * browsing (Intraday, Swing, Positional, Long Term, Options) works.
 *
 * This script:
 *   1. Creates 40 creators with varied specializations
 *   2. Creates 8-12 pre-resolved tips per creator (320+ total)
 *   3. Runs score calculation for each creator
 *   4. Updates existing brokerage creators with diverse specializations
 *
 * Usage:  npx tsx scripts/seed-diverse-tips.ts
 *
 * Idempotent: checks slug existence before creating. Safe to run multiple times.
 */

import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";
import { addDays, subDays } from "date-fns";

const db = new PrismaClient({ log: ["warn", "error"] });

// ──── Stock symbols available in the DB ────

const STOCKS = [
  "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK",
  "HINDUNILVR", "ITC", "SBIN", "BHARTIARTL", "KOTAKBANK",
  "LT", "AXISBANK", "WIPRO", "ASIANPAINT", "MARUTI",
  "TATAMOTORS", "TATASTEEL", "SUNPHARMA", "BAJFINANCE", "HCLTECH",
  "ADANIENT", "ADANIPORTS", "POWERGRID", "NTPC", "TECHM",
  "TITAN", "ULTRACEMCO", "NESTLEIND", "JSWSTEEL", "M&M",
] as const;

// Approximate prices for realistic tip generation
const STOCK_PRICES: Record<string, number> = {
  RELIANCE: 1300, TCS: 4100, HDFCBANK: 1750, INFY: 1900, ICICIBANK: 1320,
  HINDUNILVR: 2350, ITC: 470, SBIN: 800, BHARTIARTL: 1740, KOTAKBANK: 1870,
  LT: 3580, AXISBANK: 1180, WIPRO: 310, ASIANPAINT: 2400, MARUTI: 12400,
  TATAMOTORS: 730, TATASTEEL: 158, SUNPHARMA: 1870, BAJFINANCE: 7000, HCLTECH: 1970,
  ADANIENT: 3150, ADANIPORTS: 1400, POWERGRID: 315, NTPC: 370, TECHM: 1700,
  TITAN: 3450, ULTRACEMCO: 11200, NESTLEIND: 2400, JSWSTEEL: 940, "M&M": 2900,
};

// ──── Creator definitions ────

interface CreatorDef {
  slug: string;
  displayName: string;
  bio: string;
  specializations: string[];
  tipTimeframe: string; // Which timeframe their tips use
  tipCount: number; // How many tips to generate
  accuracyBias: number; // 0.0-1.0, higher = more targets hit
}

const INTRADAY_CREATORS: CreatorDef[] = [
  { slug: "quick-scalper-pro", displayName: "Quick Scalper Pro", bio: "Intraday scalping expert. 5+ years of live trading in NSE F&O segment.", specializations: ["INTRADAY", "OPTIONS"], tipTimeframe: "INTRADAY", tipCount: 10, accuracyBias: 0.65 },
  { slug: "nifty-day-trader", displayName: "Nifty Day Trader", bio: "Full-time Nifty and BankNifty intraday trader. Price action specialist.", specializations: ["INTRADAY"], tipTimeframe: "INTRADAY", tipCount: 12, accuracyBias: 0.70 },
  { slug: "intraday-king-101", displayName: "Intraday King", bio: "SEBI registered RA. Daily market analysis with clear entry/exit levels.", specializations: ["INTRADAY", "SWING"], tipTimeframe: "INTRADAY", tipCount: 10, accuracyBias: 0.55 },
  { slug: "morning-momentum", displayName: "Morning Momentum", bio: "Gap-up/gap-down momentum trades. First 30 min specialist.", specializations: ["INTRADAY"], tipTimeframe: "INTRADAY", tipCount: 8, accuracyBias: 0.60 },
  { slug: "tape-reader-india", displayName: "Tape Reader India", bio: "Order flow analysis and tape reading for intraday setups.", specializations: ["INTRADAY"], tipTimeframe: "INTRADAY", tipCount: 10, accuracyBias: 0.72 },
  { slug: "day-trade-signals", displayName: "Day Trade Signals", bio: "Automated signal generator using RSI and VWAP strategies.", specializations: ["INTRADAY"], tipTimeframe: "INTRADAY", tipCount: 10, accuracyBias: 0.58 },
  { slug: "scalp-master-nse", displayName: "Scalp Master NSE", bio: "Small profit, high frequency intraday trades on Nifty 50 stocks.", specializations: ["INTRADAY"], tipTimeframe: "INTRADAY", tipCount: 12, accuracyBias: 0.75 },
  { slug: "breakout-day-calls", displayName: "Breakout Day Calls", bio: "15-min chart breakout strategies for intraday.", specializations: ["INTRADAY", "SWING"], tipTimeframe: "INTRADAY", tipCount: 8, accuracyBias: 0.50 },
];

const SWING_CREATORS: CreatorDef[] = [
  { slug: "swing-beast-india", displayName: "Swing Beast India", bio: "Swing trading using technical analysis. 2-10 day holds. Consistent performer.", specializations: ["SWING"], tipTimeframe: "SWING", tipCount: 10, accuracyBias: 0.68 },
  { slug: "chart-patterns-pro", displayName: "Chart Patterns Pro", bio: "Technical analyst specializing in classical chart patterns for swing setups.", specializations: ["SWING", "POSITIONAL"], tipTimeframe: "SWING", tipCount: 10, accuracyBias: 0.62 },
  { slug: "momentum-rider-in", displayName: "Momentum Rider", bio: "Momentum-based swing trades. Sector rotation specialist.", specializations: ["SWING"], tipTimeframe: "SWING", tipCount: 8, accuracyBias: 0.70 },
  { slug: "weekly-breakouts", displayName: "Weekly Breakouts", bio: "Weekly chart breakout picks. Holding period 5-15 trading days.", specializations: ["SWING", "POSITIONAL"], tipTimeframe: "SWING", tipCount: 10, accuracyBias: 0.65 },
  { slug: "swing-trade-zone", displayName: "Swing Trade Zone", bio: "Systematic swing trading with defined risk management.", specializations: ["SWING"], tipTimeframe: "SWING", tipCount: 10, accuracyBias: 0.58 },
  { slug: "fibonacci-trader", displayName: "Fibonacci Trader", bio: "Fibonacci retracement and extension levels for swing entries.", specializations: ["SWING"], tipTimeframe: "SWING", tipCount: 8, accuracyBias: 0.72 },
  { slug: "gap-swing-alerts", displayName: "Gap Swing Alerts", bio: "Gap analysis for multi-day swing opportunities.", specializations: ["SWING", "INTRADAY"], tipTimeframe: "SWING", tipCount: 10, accuracyBias: 0.55 },
  { slug: "ema-crossover-pro", displayName: "EMA Crossover Pro", bio: "EMA crossover strategy for 3-7 day swing trades.", specializations: ["SWING"], tipTimeframe: "SWING", tipCount: 10, accuracyBias: 0.63 },
];

const POSITIONAL_CREATORS: CreatorDef[] = [
  { slug: "trendlyne-picks", displayName: "Trendlyne Screener Picks", bio: "Systematic stock selection using Trendlyne screener data and fundamentals.", specializations: ["POSITIONAL", "LARGE_CAP"], tipTimeframe: "POSITIONAL", tipCount: 10, accuracyBias: 0.70 },
  { slug: "et-markets-recos", displayName: "ET Markets Analyst", bio: "Curated picks from Economic Times market analysis.", specializations: ["POSITIONAL", "LARGE_CAP"], tipTimeframe: "POSITIONAL", tipCount: 10, accuracyBias: 0.65 },
  { slug: "livemint-stock-picks", displayName: "LiveMint Stock Picks", bio: "Research-backed positional picks with 1-3 month targets.", specializations: ["POSITIONAL"], tipTimeframe: "POSITIONAL", tipCount: 8, accuracyBias: 0.60 },
  { slug: "biz-standard-analyst", displayName: "Business Standard Picks", bio: "Fundamental analysis-driven positional recommendations.", specializations: ["POSITIONAL", "LARGE_CAP"], tipTimeframe: "POSITIONAL", tipCount: 10, accuracyBias: 0.68 },
  { slug: "sector-rotator-pro", displayName: "Sector Rotator Pro", bio: "Macro-driven positional trades based on sector rotation.", specializations: ["POSITIONAL"], tipTimeframe: "POSITIONAL", tipCount: 8, accuracyBias: 0.62 },
  { slug: "value-discovery-in", displayName: "Value Discovery India", bio: "Undervalued stock picks with margin of safety analysis.", specializations: ["POSITIONAL", "LONG_TERM"], tipTimeframe: "POSITIONAL", tipCount: 10, accuracyBias: 0.73 },
  { slug: "quarterly-catalyst", displayName: "Quarterly Catalyst", bio: "Picks based on upcoming earnings catalysts and result expectations.", specializations: ["POSITIONAL"], tipTimeframe: "POSITIONAL", tipCount: 8, accuracyBias: 0.55 },
  { slug: "mid-cap-hunter", displayName: "Mid Cap Hunter", bio: "Mid-cap positional picks with high growth potential.", specializations: ["POSITIONAL", "MID_CAP"], tipTimeframe: "POSITIONAL", tipCount: 10, accuracyBias: 0.60 },
];

const LONGTERM_CREATORS: CreatorDef[] = [
  { slug: "wealth-builder-in", displayName: "Wealth Builder India", bio: "Long-term wealth creation through quality stocks. 1-3 year horizon.", specializations: ["LONG_TERM", "LARGE_CAP"], tipTimeframe: "LONG_TERM", tipCount: 8, accuracyBias: 0.75 },
  { slug: "compounding-capital", displayName: "Compounding Capital", bio: "Buy and hold investor. Focus on compounding returns.", specializations: ["LONG_TERM"], tipTimeframe: "LONG_TERM", tipCount: 8, accuracyBias: 0.70 },
  { slug: "moat-investor-in", displayName: "Moat Investor India", bio: "Investing in companies with sustainable competitive advantages.", specializations: ["LONG_TERM", "LARGE_CAP"], tipTimeframe: "LONG_TERM", tipCount: 8, accuracyBias: 0.68 },
  { slug: "dividend-growth-in", displayName: "Dividend Growth India", bio: "Dividend-paying stocks with consistent growth. Long-term focus.", specializations: ["LONG_TERM"], tipTimeframe: "LONG_TERM", tipCount: 8, accuracyBias: 0.72 },
  { slug: "decadal-returns", displayName: "Decadal Returns", bio: "Patient capital allocation for 5-10 year wealth creation.", specializations: ["LONG_TERM", "POSITIONAL"], tipTimeframe: "LONG_TERM", tipCount: 8, accuracyBias: 0.65 },
];

const OPTIONS_CREATORS: CreatorDef[] = [
  { slug: "options-arena-pro", displayName: "Options Arena Pro", bio: "Nifty and BankNifty options with defined risk strategies.", specializations: ["OPTIONS", "INTRADAY"], tipTimeframe: "INTRADAY", tipCount: 10, accuracyBias: 0.60 },
  { slug: "straddle-master", displayName: "Straddle Master", bio: "Options selling strategies. Iron condors and straddles on indices.", specializations: ["OPTIONS"], tipTimeframe: "SWING", tipCount: 10, accuracyBias: 0.65 },
  { slug: "options-flow-trader", displayName: "Options Flow Trader", bio: "Unusual options activity scanner. Large OI build-up trades.", specializations: ["OPTIONS", "SWING"], tipTimeframe: "SWING", tipCount: 8, accuracyBias: 0.58 },
  { slug: "weekly-expiry-king", displayName: "Weekly Expiry King", bio: "Nifty weekly expiry options. Thursday special strategies.", specializations: ["OPTIONS", "INTRADAY"], tipTimeframe: "INTRADAY", tipCount: 12, accuracyBias: 0.52 },
  { slug: "put-call-analyst", displayName: "Put Call Analyst", bio: "PCR analysis and options chain interpretation for directional trades.", specializations: ["OPTIONS"], tipTimeframe: "SWING", tipCount: 8, accuracyBias: 0.62 },
];

const ALL_CREATORS = [
  ...INTRADAY_CREATORS,
  ...SWING_CREATORS,
  ...POSITIONAL_CREATORS,
  ...LONGTERM_CREATORS,
  ...OPTIONS_CREATORS,
];

// ──── Existing brokerage specialization updates ────

const BROKERAGE_SPECIALIZATION_MAP: Record<string, string[]> = {
  "icici-direct": ["SWING", "POSITIONAL", "LARGE_CAP"],
  "hdfc-securities": ["POSITIONAL", "LONG_TERM", "LARGE_CAP"],
  "motilal-oswal": ["INTRADAY", "SWING", "POSITIONAL"],
  "kotak-securities": ["SWING", "POSITIONAL"],
  "axis-securities": ["INTRADAY", "SWING"],
  "goldman-sachs": ["POSITIONAL", "LONG_TERM", "LARGE_CAP"],
  "morgan-stanley": ["POSITIONAL", "LONG_TERM", "LARGE_CAP"],
  "jp-morgan": ["POSITIONAL", "LONG_TERM"],
  "nomura": ["SWING", "POSITIONAL"],
  "clsa": ["POSITIONAL", "LONG_TERM"],
  "jefferies": ["SWING", "POSITIONAL"],
  "ubs": ["POSITIONAL", "LONG_TERM"],
  "citi": ["SWING", "POSITIONAL"],
  "bnp-paribas": ["POSITIONAL", "LONG_TERM"],
};

// ──── Utility functions ────

function calculateContentHash(tip: {
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
    tip.creatorId,
    tip.stockSymbol,
    tip.direction,
    tip.entryPrice.toFixed(2),
    tip.target1.toFixed(2),
    tip.target2?.toFixed(2) ?? "null",
    tip.target3?.toFixed(2) ?? "null",
    tip.stopLoss.toFixed(2),
    tip.timeframe,
    tip.tipTimestamp.toISOString(),
  ].join("|");
  return createHash("sha256").update(content).digest("hex");
}

function randomElement<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function generateTipData(
  creatorId: string,
  stockSymbol: string,
  basePrice: number,
  timeframe: string,
  shouldHitTarget: boolean,
  tipAge: number // days ago the tip was created
): {
  direction: "BUY" | "SELL";
  entryPrice: number;
  target1: number;
  stopLoss: number;
  tipTimestamp: Date;
  expiresAt: Date;
  status: string;
  closedPrice: number | null;
  closedAt: Date | null;
  returnPct: number | null;
  riskRewardRatio: number | null;
  target1HitAt: Date | null;
  stopLossHitAt: Date | null;
} {
  const direction: "BUY" | "SELL" = Math.random() > 0.2 ? "BUY" : "SELL";
  const isBuy = direction === "BUY";

  // Vary entry price slightly around base
  const entryPrice = Math.round(basePrice * randomBetween(0.97, 1.03) * 100) / 100;

  // Target and SL percentages based on timeframe
  let targetPct: number;
  let slPct: number;
  let expiryDays: number;

  switch (timeframe) {
    case "INTRADAY":
      targetPct = randomBetween(0.008, 0.025); // 0.8-2.5%
      slPct = randomBetween(0.005, 0.015); // 0.5-1.5%
      expiryDays = 1;
      break;
    case "SWING":
      targetPct = randomBetween(0.03, 0.08); // 3-8%
      slPct = randomBetween(0.02, 0.04); // 2-4%
      expiryDays = Math.floor(randomBetween(3, 14));
      break;
    case "POSITIONAL":
      targetPct = randomBetween(0.08, 0.20); // 8-20%
      slPct = randomBetween(0.04, 0.08); // 4-8%
      expiryDays = Math.floor(randomBetween(30, 90));
      break;
    case "LONG_TERM":
      targetPct = randomBetween(0.15, 0.40); // 15-40%
      slPct = randomBetween(0.08, 0.15); // 8-15%
      expiryDays = Math.floor(randomBetween(90, 365));
      break;
    default:
      targetPct = 0.05;
      slPct = 0.03;
      expiryDays = 14;
  }

  const target1 = isBuy
    ? Math.round(entryPrice * (1 + targetPct) * 100) / 100
    : Math.round(entryPrice * (1 - targetPct) * 100) / 100;

  const stopLoss = isBuy
    ? Math.round(entryPrice * (1 - slPct) * 100) / 100
    : Math.round(entryPrice * (1 + slPct) * 100) / 100;

  const tipTimestamp = subDays(new Date(), tipAge);
  const expiresAt = addDays(tipTimestamp, expiryDays);

  // Determine outcome
  const isExpired = new Date() > expiresAt;

  let status: string;
  let closedPrice: number | null = null;
  let closedAt: Date | null = null;
  let returnPct: number | null = null;
  let riskRewardRatio: number | null = null;
  let target1HitAt: Date | null = null;
  let stopLossHitAt: Date | null = null;

  if (shouldHitTarget) {
    // Target hit
    status = "ALL_TARGETS_HIT";
    closedPrice = target1;
    const daysToHit = Math.floor(randomBetween(1, Math.min(tipAge, expiryDays)));
    closedAt = addDays(tipTimestamp, daysToHit);
    target1HitAt = closedAt;
    returnPct = isBuy
      ? ((target1 - entryPrice) / entryPrice) * 100
      : ((entryPrice - target1) / entryPrice) * 100;
    const riskPct = Math.abs(entryPrice - stopLoss) / entryPrice;
    riskRewardRatio = riskPct > 0 ? (returnPct / 100) / riskPct : 0;
  } else if (Math.random() < 0.6) {
    // Stop loss hit (60% of failures)
    status = "STOPLOSS_HIT";
    closedPrice = stopLoss;
    const daysToHit = Math.floor(randomBetween(1, Math.min(tipAge, expiryDays)));
    closedAt = addDays(tipTimestamp, daysToHit);
    stopLossHitAt = closedAt;
    returnPct = isBuy
      ? ((stopLoss - entryPrice) / entryPrice) * 100
      : ((entryPrice - stopLoss) / entryPrice) * 100;
    riskRewardRatio = -1;
  } else if (isExpired) {
    // Expired without hitting target or SL
    status = "EXPIRED";
    const exitPrice = entryPrice * randomBetween(0.97, 1.03);
    closedPrice = Math.round(exitPrice * 100) / 100;
    closedAt = expiresAt;
    returnPct = isBuy
      ? ((exitPrice - entryPrice) / entryPrice) * 100
      : ((entryPrice - exitPrice) / entryPrice) * 100;
    const riskPct = Math.abs(entryPrice - stopLoss) / entryPrice;
    riskRewardRatio = riskPct > 0 ? (returnPct / 100) / riskPct : 0;
  } else {
    // Still active
    status = "ACTIVE";
  }

  return {
    direction,
    entryPrice,
    target1,
    stopLoss,
    tipTimestamp,
    expiresAt,
    status,
    closedPrice,
    closedAt,
    returnPct,
    riskRewardRatio,
    target1HitAt,
    stopLossHitAt,
  };
}

// ──── Main ────

async function main(): Promise<void> {
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║  RateMyTip — Diverse Tips Seeder                    ║");
  console.log("║  Creates creators and tips across ALL categories    ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  const startTime = Date.now();

  // ────────────────────────────────────
  // PHASE 1: Update existing brokerage specializations
  // ────────────────────────────────────
  console.log("── Phase 1: Updating existing brokerage specializations ──\n");

  let updatedBrokerages = 0;
  for (const [slug, specs] of Object.entries(BROKERAGE_SPECIALIZATION_MAP)) {
    const existing = await db.creator.findUnique({ where: { slug } });
    if (existing) {
      await db.creator.update({
        where: { slug },
        data: { specializations: specs },
      });
      updatedBrokerages++;
      console.log(`  ✓ ${slug} → [${specs.join(", ")}]`);
    }
  }
  console.log(`\n  Updated ${updatedBrokerages} existing brokerages\n`);

  // ────────────────────────────────────
  // PHASE 2: Create new creators
  // ────────────────────────────────────
  console.log("── Phase 2: Creating diverse creators ──\n");

  const creatorIds: Record<string, string> = {};
  let creatorsCreated = 0;
  let creatorsSkipped = 0;

  for (const def of ALL_CREATORS) {
    const existing = await db.creator.findUnique({ where: { slug: def.slug } });

    if (existing) {
      creatorIds[def.slug] = existing.id;
      creatorsSkipped++;
      continue;
    }

    const creator = await db.creator.create({
      data: {
        slug: def.slug,
        displayName: def.displayName,
        bio: def.bio,
        specializations: def.specializations,
        isActive: true,
        tier: "UNRATED",
        platforms: {
          create: {
            platform: "WEBSITE",
            platformUserId: `website-${def.slug}`,
            platformHandle: def.slug,
            platformUrl: `https://ratemytip.com/creator/${def.slug}`,
            isActive: true,
          },
        },
      },
    });

    creatorIds[def.slug] = creator.id;
    creatorsCreated++;

    const category = def.specializations[0] ?? "UNKNOWN";
    console.log(`  ✓ ${def.displayName.padEnd(28)} [${category}]`);
  }

  console.log(`\n  Created: ${creatorsCreated}, Skipped (existing): ${creatorsSkipped}\n`);

  // ────────────────────────────────────
  // PHASE 3: Create diverse tips
  // ────────────────────────────────────
  console.log("── Phase 3: Creating tips for each creator ──\n");

  // Verify stocks exist
  const stockRecords = await db.stock.findMany({
    where: { symbol: { in: [...STOCKS] } },
    select: { id: true, symbol: true },
  });
  const stockMap = new Map(stockRecords.map((s) => [s.symbol, s.id]));

  console.log(`  Found ${stockMap.size} stocks in database\n`);

  let totalTipsCreated = 0;
  let totalTipsSkipped = 0;

  for (const def of ALL_CREATORS) {
    const creatorId = creatorIds[def.slug];
    if (!creatorId) continue;

    // Check if creator already has tips
    const existingTipCount = await db.tip.count({ where: { creatorId } });
    if (existingTipCount >= def.tipCount) {
      console.log(`  ⏭ ${def.displayName}: already has ${existingTipCount} tips, skipping`);
      totalTipsSkipped += def.tipCount;
      continue;
    }

    let creatorTips = 0;
    let creatorTargetHits = 0;
    let creatorSLHits = 0;
    let creatorActive = 0;

    for (let i = 0; i < def.tipCount; i++) {
      const stockSymbol = randomElement(STOCKS);
      const stockId = stockMap.get(stockSymbol);
      if (!stockId) continue;

      const basePrice = STOCK_PRICES[stockSymbol] ?? 1000;

      // Determine if this tip should hit target based on accuracy bias
      const shouldHit = Math.random() < def.accuracyBias;

      // Tips created at various points in the past
      const tipAge = Math.floor(randomBetween(5, 60)); // 5-60 days ago

      const tipData = generateTipData(
        creatorId,
        stockSymbol,
        basePrice,
        def.tipTimeframe,
        shouldHit,
        tipAge
      );

      const contentHash = calculateContentHash({
        creatorId,
        stockSymbol,
        direction: tipData.direction,
        entryPrice: tipData.entryPrice,
        target1: tipData.target1,
        target2: null,
        target3: null,
        stopLoss: tipData.stopLoss,
        timeframe: def.tipTimeframe,
        tipTimestamp: tipData.tipTimestamp,
      });

      // Check for duplicates
      const existingTip = await db.tip.findUnique({ where: { contentHash } });
      if (existingTip) continue;

      const isResolved = tipData.status !== "ACTIVE";

      await db.tip.create({
        data: {
          creatorId,
          stockId,
          direction: tipData.direction,
          assetClass: "EQUITY_NSE",
          entryPrice: tipData.entryPrice,
          target1: tipData.target1,
          stopLoss: tipData.stopLoss,
          timeframe: def.tipTimeframe as "INTRADAY" | "SWING" | "POSITIONAL" | "LONG_TERM",
          conviction: "MEDIUM",
          contentHash,
          tipTimestamp: tipData.tipTimestamp,
          priceAtTip: tipData.entryPrice,
          status: tipData.status as "ACTIVE" | "ALL_TARGETS_HIT" | "STOPLOSS_HIT" | "EXPIRED",
          statusUpdatedAt: tipData.closedAt,
          target1HitAt: tipData.target1HitAt,
          stopLossHitAt: tipData.stopLossHitAt,
          expiresAt: tipData.expiresAt,
          closedPrice: tipData.closedPrice,
          closedAt: tipData.closedAt,
          returnPct: tipData.returnPct,
          riskRewardRatio: tipData.riskRewardRatio,
          reviewStatus: "AUTO_APPROVED",
          reviewedAt: tipData.tipTimestamp,
          parseConfidence: 0.95,
        },
      });

      creatorTips++;
      totalTipsCreated++;

      if (tipData.status === "ALL_TARGETS_HIT") creatorTargetHits++;
      else if (tipData.status === "STOPLOSS_HIT") creatorSLHits++;
      else if (tipData.status === "ACTIVE") creatorActive++;
    }

    // Update creator counts
    const completedCount = creatorTargetHits + creatorSLHits + (creatorTips - creatorTargetHits - creatorSLHits - creatorActive);
    await db.creator.update({
      where: { id: creatorId },
      data: {
        totalTips: { increment: creatorTips },
        activeTips: { increment: creatorActive },
        completedTips: { increment: completedCount },
        firstTipAt: subDays(new Date(), 60),
        lastTipAt: new Date(),
      },
    });

    const accuracy = creatorTips > 0 ? ((creatorTargetHits / creatorTips) * 100).toFixed(0) : "0";
    console.log(`  📊 ${def.displayName.padEnd(28)} ${creatorTips} tips (${accuracy}% hit, ${creatorSLHits} SL, ${creatorActive} active)`);
  }

  console.log(`\n  Total tips created: ${totalTipsCreated}, Skipped: ${totalTipsSkipped}\n`);

  // ────────────────────────────────────
  // PHASE 4: Calculate scores
  // ────────────────────────────────────
  console.log("── Phase 4: Calculating scores ──\n");

  const creatorsWithTips = await db.creator.findMany({
    where: {
      OR: [
        { slug: { in: ALL_CREATORS.map((c) => c.slug) } },
        { slug: { in: Object.keys(BROKERAGE_SPECIALIZATION_MAP) } },
      ],
      completedTips: { gte: 1 },
    },
    include: {
      tips: {
        where: {
          status: { in: ["ALL_TARGETS_HIT", "TARGET_1_HIT", "TARGET_2_HIT", "STOPLOSS_HIT", "EXPIRED"] },
        },
      },
    },
  });

  let scoresCalculated = 0;

  for (const creator of creatorsWithTips) {
    const tips = creator.tips;
    if (tips.length === 0) continue;

    const totalScored = tips.length;
    const hits = tips.filter((t) =>
      ["ALL_TARGETS_HIT", "TARGET_1_HIT", "TARGET_2_HIT"].includes(t.status)
    ).length;
    const accuracyRate = hits / totalScored;
    const avgReturn = tips.reduce((sum, t) => sum + (t.returnPct ?? 0), 0) / totalScored;
    const avgRR = tips.reduce((sum, t) => sum + (t.riskRewardRatio ?? 0), 0) / totalScored;

    // Component scores (0-100 each)
    const accuracyScore = accuracyRate * 100;
    const riskAdjScore = Math.min(Math.max((avgRR + 2) / 7 * 100, 0), 100);
    const volumeScore = Math.min((Math.log10(totalScored) / Math.log10(2000)) * 100, 100);

    // Consistency: simulate with some variance
    const consistencyScore = totalScored >= 3
      ? Math.min(Math.max(50 + (accuracyRate - 0.5) * 60 + randomBetween(-10, 10), 20), 90)
      : 50;

    const rmtScore =
      0.40 * accuracyScore +
      0.30 * riskAdjScore +
      0.20 * consistencyScore +
      0.10 * volumeScore;

    const confidenceInterval =
      1.96 * Math.sqrt((accuracyRate * (1 - accuracyRate)) / totalScored) * 100;

    // Determine tier
    let tier: "UNRATED" | "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND" = "UNRATED";
    if (totalScored >= 1000) tier = "DIAMOND";
    else if (totalScored >= 500) tier = "PLATINUM";
    else if (totalScored >= 200) tier = "GOLD";
    else if (totalScored >= 50) tier = "SILVER";
    else if (totalScored >= 20) tier = "BRONZE";

    await db.creatorScore.upsert({
      where: { creatorId: creator.id },
      create: {
        creatorId: creator.id,
        accuracyScore,
        riskAdjustedScore: riskAdjScore,
        consistencyScore,
        volumeFactorScore: volumeScore,
        rmtScore,
        confidenceInterval,
        accuracyRate,
        avgReturnPct: avgReturn,
        avgRiskRewardRatio: avgRR,
        totalScoredTips: totalScored,
        scorePeriodStart: new Date(Math.min(...tips.map((t) => t.tipTimestamp.getTime()))),
        scorePeriodEnd: new Date(),
        calculatedAt: new Date(),
      },
      update: {
        accuracyScore,
        riskAdjustedScore: riskAdjScore,
        consistencyScore,
        volumeFactorScore: volumeScore,
        rmtScore,
        confidenceInterval,
        accuracyRate,
        avgReturnPct: avgReturn,
        avgRiskRewardRatio: avgRR,
        totalScoredTips: totalScored,
        scorePeriodEnd: new Date(),
        calculatedAt: new Date(),
      },
    });

    // Update tier
    await db.creator.update({
      where: { id: creator.id },
      data: { tier },
    });

    // Store daily snapshot
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await db.scoreSnapshot.upsert({
      where: { creatorId_date: { creatorId: creator.id, date: today } },
      create: { creatorId: creator.id, date: today, rmtScore, accuracyRate, totalScoredTips: totalScored },
      update: { rmtScore, accuracyRate, totalScoredTips: totalScored },
    });

    scoresCalculated++;
    console.log(
      `  📈 ${creator.displayName.padEnd(28)} RMT: ${rmtScore.toFixed(1).padStart(5)} | ` +
      `Accuracy: ${(accuracyRate * 100).toFixed(0)}% | ` +
      `Tips: ${totalScored} | ` +
      `Tier: ${tier}`
    );
  }

  console.log(`\n  Scores calculated for ${scoresCalculated} creators\n`);

  // ────────────────────────────────────
  // Summary
  // ────────────────────────────────────
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // Count by category
  const categoryStats = {
    INTRADAY: 0,
    SWING: 0,
    POSITIONAL: 0,
    LONG_TERM: 0,
    OPTIONS: 0,
  };

  for (const def of ALL_CREATORS) {
    const spec = def.specializations[0] ?? "";
    if (spec in categoryStats) {
      categoryStats[spec as keyof typeof categoryStats]++;
    }
  }

  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║                    Summary                          ║");
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log(`║  Brokerages updated:  ${String(updatedBrokerages).padStart(4)}                         ║`);
  console.log(`║  Creators created:    ${String(creatorsCreated).padStart(4)}                         ║`);
  console.log(`║  Tips created:        ${String(totalTipsCreated).padStart(4)}                         ║`);
  console.log(`║  Scores calculated:   ${String(scoresCalculated).padStart(4)}                         ║`);
  console.log("║                                                      ║");
  console.log("║  By Category:                                        ║");
  console.log(`║    Intraday:   ${String(categoryStats.INTRADAY).padStart(3)} creators                     ║`);
  console.log(`║    Swing:      ${String(categoryStats.SWING).padStart(3)} creators                     ║`);
  console.log(`║    Positional: ${String(categoryStats.POSITIONAL).padStart(3)} creators                     ║`);
  console.log(`║    Long Term:  ${String(categoryStats.LONG_TERM).padStart(3)} creators                     ║`);
  console.log(`║    Options:    ${String(categoryStats.OPTIONS).padStart(3)} creators                     ║`);
  console.log("║                                                      ║");
  console.log(`║  Completed in ${elapsed}s                              ║`);
  console.log("╚══════════════════════════════════════════════════════╝");
}

main()
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
