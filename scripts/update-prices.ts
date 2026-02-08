/**
 * scripts/update-prices.ts
 *
 * Fetches live prices from Yahoo Finance (v8 chart API) for all active tips,
 * evaluates targets/stop-losses, updates statuses, and calculates scores.
 *
 * Usage: npx tsx scripts/update-prices.ts
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient({ log: ["warn", "error"] });

// ──── Yahoo Finance v8 chart API (works without auth) ────

const EXCHANGE_SUFFIX: Record<string, string> = {
  NSE: ".NS",
  BSE: ".BO",
  INDEX: ".NS",
};

interface PriceResult {
  symbol: string;
  price: number;
  dayHigh: number;
  dayLow: number;
  change: number;
  changePct: number;
  timestamp: Date;
}

async function fetchPrice(symbol: string, exchange = "NSE"): Promise<PriceResult | null> {
  const suffix = EXCHANGE_SUFFIX[exchange] ?? ".NS";
  const yahooSymbol = `${symbol.replace(/\s+/g, "")}${suffix}`;

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=1d&interval=1d`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.warn(`  [Yahoo] HTTP ${response.status} for ${yahooSymbol}`);
      return null;
    }

    const data = await response.json() as {
      chart?: {
        result?: Array<{
          meta: {
            regularMarketPrice: number;
            regularMarketDayHigh: number;
            regularMarketDayLow: number;
            regularMarketTime: number;
            previousClose?: number;
          };
        }>;
        error?: { description: string };
      };
    };

    if (data.chart?.error) {
      console.warn(`  [Yahoo] API error for ${yahooSymbol}: ${data.chart.error.description}`);
      return null;
    }

    const result = data.chart?.result?.[0];
    if (!result) {
      console.warn(`  [Yahoo] No data for ${yahooSymbol}`);
      return null;
    }

    const meta = result.meta;
    const prevClose = meta.previousClose ?? meta.regularMarketPrice;
    const change = meta.regularMarketPrice - prevClose;
    const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;

    return {
      symbol,
      price: meta.regularMarketPrice,
      dayHigh: meta.regularMarketDayHigh,
      dayLow: meta.regularMarketDayLow,
      change,
      changePct,
      timestamp: new Date(meta.regularMarketTime * 1000),
    };
  } catch (error) {
    console.error(`  [Yahoo] Error for ${yahooSymbol}:`, error instanceof Error ? error.message : String(error));
    return null;
  }
}

// ──── Main ────

async function main(): Promise<void> {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║    RateMyTip — Price Update & Tip Evaluation    ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  const startTime = Date.now();

  // Fetch all active tips
  const activeTips = await db.tip.findMany({
    where: { status: { in: ["ACTIVE", "TARGET_1_HIT", "TARGET_2_HIT"] } },
    include: {
      stock: { select: { symbol: true, exchange: true } },
      creator: { select: { id: true, displayName: true } },
    },
  });

  if (activeTips.length === 0) {
    console.log("No active tips to check.");
    await db.$disconnect();
    return;
  }

  console.log(`Found ${activeTips.length} active tips to check\n`);

  // Get unique stock symbols
  const uniqueStocks = new Map<string, string>();
  for (const tip of activeTips) {
    uniqueStocks.set(tip.stock.symbol, tip.stock.exchange);
  }

  // Fetch prices
  console.log(`── Fetching prices for ${uniqueStocks.size} stocks ──\n`);
  const priceMap = new Map<string, PriceResult>();
  let fetched = 0;

  for (const [symbol, exchange] of uniqueStocks) {
    const price = await fetchPrice(symbol, exchange);
    if (price) {
      priceMap.set(symbol, price);
      fetched++;
      const arrow = price.changePct >= 0 ? "▲" : "▼";
      console.log(`  ${arrow} ${symbol.padEnd(15)} ₹${price.price.toFixed(2).padStart(10)} (${price.changePct >= 0 ? "+" : ""}${price.changePct.toFixed(2)}%)`);

      // Update stock lastPrice in DB
      await db.stock.update({
        where: { symbol },
        data: { lastPrice: price.price, lastPriceAt: price.timestamp },
      });
    }

    // Rate limit: ~4 requests per second
    await new Promise((resolve) => setTimeout(resolve, 280));
  }

  console.log(`\nFetched ${fetched}/${uniqueStocks.size} prices\n`);

  // Evaluate tips
  console.log("── Evaluating tips ──\n");

  let targetHits = 0;
  let stopLossHits = 0;
  let expired = 0;
  let unchanged = 0;

  for (const tip of activeTips) {
    const priceData = priceMap.get(tip.stock.symbol);
    if (!priceData) {
      unchanged++;
      continue;
    }

    const price = priceData.price;
    const isBuy = tip.direction === "BUY";
    const now = new Date();
    let newStatus: string | null = null;
    let emoji = "";

    // Check expiry
    if (now >= tip.expiresAt) {
      newStatus = "EXPIRED";
      emoji = "⏰";
      expired++;
    }
    // Check stop-loss
    else if ((isBuy && price <= tip.stopLoss) || (!isBuy && price >= tip.stopLoss)) {
      newStatus = "STOPLOSS_HIT";
      emoji = "🔴";
      stopLossHits++;
    }
    // Check target (single target for these tips)
    else if ((isBuy && price >= tip.target1) || (!isBuy && price <= tip.target1)) {
      newStatus = "ALL_TARGETS_HIT";
      emoji = "🟢";
      targetHits++;
    }

    if (!newStatus) {
      const pctToTarget = isBuy
        ? ((tip.target1 - price) / price * 100)
        : ((price - tip.target1) / price * 100);
      const pctToSL = isBuy
        ? ((price - tip.stopLoss) / price * 100)
        : ((tip.stopLoss - price) / price * 100);
      console.log(`  ⚪ ${tip.stock.symbol.padEnd(15)} ${tip.direction.padEnd(4)} Entry ₹${tip.entryPrice} | CMP ₹${price.toFixed(2)} | ${pctToTarget.toFixed(1)}% to target | ${pctToSL.toFixed(1)}% to SL (${tip.creator.displayName})`);
      unchanged++;
      continue;
    }

    // Calculate return and risk-reward
    const returnPct = isBuy
      ? ((price - tip.entryPrice) / tip.entryPrice) * 100
      : ((tip.entryPrice - price) / tip.entryPrice) * 100;

    const riskPct = Math.abs(tip.entryPrice - tip.stopLoss) / tip.entryPrice;
    const riskRewardRatio = riskPct > 0 ? (returnPct / 100) / riskPct : 0;

    // Update tip in DB
    const updateData: Record<string, unknown> = {
      status: newStatus,
      statusUpdatedAt: now,
      closedPrice: price,
      closedAt: now,
      returnPct,
      riskRewardRatio,
    };

    if (newStatus === "ALL_TARGETS_HIT") updateData.target1HitAt = now;
    if (newStatus === "STOPLOSS_HIT") updateData.stopLossHitAt = now;

    await db.tip.update({ where: { id: tip.id }, data: updateData });

    await db.creator.update({
      where: { id: tip.creator.id },
      data: {
        activeTips: { decrement: 1 },
        completedTips: { increment: 1 },
      },
    });

    console.log(`  ${emoji} ${tip.stock.symbol.padEnd(15)} ${tip.direction.padEnd(4)} Entry ₹${tip.entryPrice} → CMP ₹${price.toFixed(2)} (${returnPct >= 0 ? "+" : ""}${returnPct.toFixed(1)}%) — ${newStatus} (${tip.creator.displayName})`);
  }

  console.log(`\n── Results ──`);
  console.log(`  🟢 Target hits:    ${targetHits}`);
  console.log(`  🔴 Stop-loss hits: ${stopLossHits}`);
  console.log(`  ⏰ Expired:        ${expired}`);
  console.log(`  ⚪ Still active:   ${unchanged}`);

  // ──── Score calculation for creators with resolved tips ────

  const creatorsWithCompleted = await db.creator.findMany({
    where: { completedTips: { gte: 1 } },
    include: {
      tips: {
        where: {
          status: { in: ["ALL_TARGETS_HIT", "TARGET_1_HIT", "TARGET_2_HIT", "STOPLOSS_HIT", "EXPIRED"] },
        },
      },
    },
  });

  if (creatorsWithCompleted.length > 0) {
    console.log(`\n── Calculating scores for ${creatorsWithCompleted.length} creators ──\n`);

    for (const creator of creatorsWithCompleted) {
      const tips = creator.tips;
      if (tips.length === 0) continue;

      const totalScored = tips.length;
      const hits = tips.filter((t) => ["ALL_TARGETS_HIT", "TARGET_1_HIT", "TARGET_2_HIT"].includes(t.status)).length;
      const accuracyRate = hits / totalScored;
      const avgReturn = tips.reduce((sum, t) => sum + (t.returnPct ?? 0), 0) / totalScored;
      const avgRR = tips.reduce((sum, t) => sum + (t.riskRewardRatio ?? 0), 0) / totalScored;

      const accuracyScore = accuracyRate * 100;
      const riskAdjScore = Math.min(Math.max((avgRR + 2) / 7 * 100, 0), 100);
      const volumeScore = Math.min((Math.log10(totalScored) / Math.log10(2000)) * 100, 100);
      const consistencyScore = 50;

      const rmtScore = 0.40 * accuracyScore + 0.30 * riskAdjScore + 0.20 * consistencyScore + 0.10 * volumeScore;

      await db.creatorScore.upsert({
        where: { creatorId: creator.id },
        create: {
          creatorId: creator.id,
          accuracyScore,
          riskAdjustedScore: riskAdjScore,
          consistencyScore,
          volumeFactorScore: volumeScore,
          rmtScore,
          confidenceInterval: 1.96 * Math.sqrt(accuracyRate * (1 - accuracyRate) / totalScored) * 100,
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
          confidenceInterval: 1.96 * Math.sqrt(accuracyRate * (1 - accuracyRate) / totalScored) * 100,
          accuracyRate,
          avgReturnPct: avgReturn,
          avgRiskRewardRatio: avgRR,
          totalScoredTips: totalScored,
          scorePeriodEnd: new Date(),
          calculatedAt: new Date(),
        },
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await db.scoreSnapshot.upsert({
        where: { creatorId_date: { creatorId: creator.id, date: today } },
        create: { creatorId: creator.id, date: today, rmtScore, accuracyRate, totalScoredTips: totalScored },
        update: { rmtScore, accuracyRate, totalScoredTips: totalScored },
      });

      console.log(`  📈 ${creator.displayName.padEnd(20)} RMT: ${rmtScore.toFixed(1).padStart(5)} | Accuracy: ${(accuracyRate * 100).toFixed(0)}% | Avg Return: ${avgReturn >= 0 ? "+" : ""}${avgReturn.toFixed(1)}% | Tips: ${totalScored}`);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✅ Price update complete in ${elapsed}s\n`);

  await db.$disconnect();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
