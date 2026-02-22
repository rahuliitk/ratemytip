// scripts/backfill-prices.ts
//
// Backfill historical OHLCV price data from Yahoo Finance for all
// active stocks in the database. Fetches 1 year of daily data.
//
// Usage: npx tsx scripts/backfill-prices.ts [--symbol RELIANCE] [--days 365]

import { PrismaClient } from "@prisma/client";
import { YahooFinanceService } from "../src/lib/market-data/yahoo-finance";

const db = new PrismaClient();
const yahoo = new YahooFinanceService();

interface BackfillOptions {
  symbol?: string;
  days: number;
}

function parseArgs(): BackfillOptions {
  const args = process.argv.slice(2);
  const options: BackfillOptions = { days: 365 };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--symbol" && args[i + 1]) {
      options.symbol = args[i + 1];
      i++;
    } else if (args[i] === "--days" && args[i + 1]) {
      options.days = parseInt(args[i + 1]!, 10);
      i++;
    }
  }

  return options;
}

async function backfillStock(
  symbol: string,
  exchange: string,
  stockId: string,
  days: number
): Promise<{ inserted: number; skipped: number }> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const prices = await yahoo.getHistoricalPrices(
    { symbol, startDate, endDate },
    exchange
  );

  let inserted = 0;
  let skipped = 0;

  for (const price of prices) {
    try {
      // Normalize date to midnight UTC for the unique constraint
      const dateOnly = new Date(price.date);
      dateOnly.setUTCHours(0, 0, 0, 0);

      await db.stockPrice.upsert({
        where: {
          stockId_date: { stockId, date: dateOnly },
        },
        update: {
          open: price.open,
          high: price.high,
          low: price.low,
          close: price.close,
          volume: BigInt(Math.round(price.volume)),
          source: "YAHOO",
        },
        create: {
          stockId,
          date: dateOnly,
          open: price.open,
          high: price.high,
          low: price.low,
          close: price.close,
          volume: BigInt(Math.round(price.volume)),
          source: "YAHOO",
        },
      });
      inserted++;
    } catch {
      skipped++;
    }
  }

  // Update the stock's last known price
  if (prices.length > 0) {
    const latest = prices[prices.length - 1]!;
    await db.stock.update({
      where: { id: stockId },
      data: {
        lastPrice: latest.close,
        lastPriceAt: latest.date,
      },
    });
  }

  return { inserted, skipped };
}

async function main(): Promise<void> {
  const options = parseArgs();
  console.log(`[backfill-prices] Starting backfill (${options.days} days)`);

  let stocks;
  if (options.symbol) {
    stocks = await db.stock.findMany({
      where: { symbol: options.symbol, isActive: true },
    });
    if (stocks.length === 0) {
      console.error(`Stock ${options.symbol} not found`);
      process.exit(1);
    }
  } else {
    stocks = await db.stock.findMany({
      where: { isActive: true },
      orderBy: { symbol: "asc" },
    });
  }

  console.log(`[backfill-prices] Processing ${stocks.length} stocks`);

  let totalInserted = 0;
  let totalSkipped = 0;
  let failures = 0;

  // Process in batches of 5 to respect rate limits
  const batchSize = 5;
  for (let i = 0; i < stocks.length; i += batchSize) {
    const batch = stocks.slice(i, i + batchSize);

    const results = await Promise.allSettled(
      batch.map(async (stock) => {
        const exchange = stock.exchange === "BSE" ? "BSE" : stock.exchange;
        console.log(
          `  [${i + 1}-${Math.min(i + batchSize, stocks.length)}/${stocks.length}] ${stock.symbol} (${exchange})`
        );
        return backfillStock(stock.symbol, exchange, stock.id, options.days);
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        totalInserted += result.value.inserted;
        totalSkipped += result.value.skipped;
      } else {
        failures++;
        console.error(`  Failed:`, result.reason);
      }
    }

    // Small delay between batches
    if (i + batchSize < stocks.length) {
      await new Promise<void>((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.log(`\n[backfill-prices] Complete!`);
  console.log(`  Inserted: ${totalInserted} price records`);
  console.log(`  Skipped:  ${totalSkipped} (duplicates or errors)`);
  console.log(`  Failures: ${failures} stocks failed`);
}

main()
  .catch((error) => {
    console.error("[backfill-prices] Fatal error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
