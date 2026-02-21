// scripts/seed-global-stocks.ts
//
// Seeds major S&P 500 large-cap stocks and global indices into the stocks table.
// Idempotent — skips symbols that already exist.
//
// Usage: npx tsx scripts/seed-global-stocks.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface StockSeedEntry {
  readonly symbol: string;
  readonly exchange: "NYSE" | "NASDAQ" | "INDEX" | "LSE";
  readonly name: string;
  readonly sector: string | null;
  readonly marketCap: "LARGE" | "MID" | null;
  readonly isIndex: boolean;
}

const GLOBAL_STOCKS: readonly StockSeedEntry[] = [
  // ──── Technology ────
  { symbol: "AAPL",  exchange: "NASDAQ", name: "Apple Inc.",                   sector: "Technology",       marketCap: "LARGE", isIndex: false },
  { symbol: "MSFT",  exchange: "NASDAQ", name: "Microsoft Corporation",        sector: "Technology",       marketCap: "LARGE", isIndex: false },
  { symbol: "GOOGL", exchange: "NASDAQ", name: "Alphabet Inc. (Class A)",      sector: "Technology",       marketCap: "LARGE", isIndex: false },
  { symbol: "AMZN",  exchange: "NASDAQ", name: "Amazon.com Inc.",              sector: "Consumer Cyclical", marketCap: "LARGE", isIndex: false },
  { symbol: "NVDA",  exchange: "NASDAQ", name: "NVIDIA Corporation",           sector: "Technology",       marketCap: "LARGE", isIndex: false },
  { symbol: "META",  exchange: "NASDAQ", name: "Meta Platforms Inc.",           sector: "Technology",       marketCap: "LARGE", isIndex: false },
  { symbol: "TSLA",  exchange: "NASDAQ", name: "Tesla Inc.",                   sector: "Consumer Cyclical", marketCap: "LARGE", isIndex: false },
  { symbol: "ADBE",  exchange: "NASDAQ", name: "Adobe Inc.",                   sector: "Technology",       marketCap: "LARGE", isIndex: false },
  { symbol: "CRM",   exchange: "NYSE",   name: "Salesforce Inc.",              sector: "Technology",       marketCap: "LARGE", isIndex: false },
  { symbol: "AMD",   exchange: "NASDAQ", name: "Advanced Micro Devices Inc.",  sector: "Technology",       marketCap: "LARGE", isIndex: false },
  { symbol: "INTC",  exchange: "NASDAQ", name: "Intel Corporation",            sector: "Technology",       marketCap: "LARGE", isIndex: false },
  { symbol: "CSCO",  exchange: "NASDAQ", name: "Cisco Systems Inc.",           sector: "Technology",       marketCap: "LARGE", isIndex: false },
  { symbol: "AVGO",  exchange: "NASDAQ", name: "Broadcom Inc.",                sector: "Technology",       marketCap: "LARGE", isIndex: false },
  { symbol: "ORCL",  exchange: "NYSE",   name: "Oracle Corporation",           sector: "Technology",       marketCap: "LARGE", isIndex: false },
  { symbol: "QCOM",  exchange: "NASDAQ", name: "Qualcomm Inc.",                sector: "Technology",       marketCap: "LARGE", isIndex: false },
  { symbol: "TXN",   exchange: "NASDAQ", name: "Texas Instruments Inc.",       sector: "Technology",       marketCap: "LARGE", isIndex: false },

  // ──── Financials ────
  { symbol: "JPM",   exchange: "NYSE",   name: "JPMorgan Chase & Co.",         sector: "Financial Services", marketCap: "LARGE", isIndex: false },
  { symbol: "V",     exchange: "NYSE",   name: "Visa Inc.",                    sector: "Financial Services", marketCap: "LARGE", isIndex: false },
  { symbol: "MA",    exchange: "NYSE",   name: "Mastercard Inc.",              sector: "Financial Services", marketCap: "LARGE", isIndex: false },
  { symbol: "BAC",   exchange: "NYSE",   name: "Bank of America Corp.",        sector: "Financial Services", marketCap: "LARGE", isIndex: false },
  { symbol: "MS",    exchange: "NYSE",   name: "Morgan Stanley",               sector: "Financial Services", marketCap: "LARGE", isIndex: false },
  { symbol: "GS",    exchange: "NYSE",   name: "Goldman Sachs Group Inc.",     sector: "Financial Services", marketCap: "LARGE", isIndex: false },
  { symbol: "PYPL",  exchange: "NASDAQ", name: "PayPal Holdings Inc.",         sector: "Financial Services", marketCap: "LARGE", isIndex: false },
  { symbol: "BRK.B", exchange: "NYSE",   name: "Berkshire Hathaway Inc. (B)", sector: "Financial Services", marketCap: "LARGE", isIndex: false },
  { symbol: "COIN",  exchange: "NASDAQ", name: "Coinbase Global Inc.",         sector: "Financial Services", marketCap: "LARGE", isIndex: false },
  { symbol: "SQ",    exchange: "NYSE",   name: "Block Inc.",                   sector: "Financial Services", marketCap: "LARGE", isIndex: false },

  // ──── Healthcare ────
  { symbol: "UNH",   exchange: "NYSE",   name: "UnitedHealth Group Inc.",      sector: "Healthcare",       marketCap: "LARGE", isIndex: false },
  { symbol: "JNJ",   exchange: "NYSE",   name: "Johnson & Johnson",            sector: "Healthcare",       marketCap: "LARGE", isIndex: false },
  { symbol: "PFE",   exchange: "NYSE",   name: "Pfizer Inc.",                  sector: "Healthcare",       marketCap: "LARGE", isIndex: false },
  { symbol: "MRK",   exchange: "NYSE",   name: "Merck & Co. Inc.",             sector: "Healthcare",       marketCap: "LARGE", isIndex: false },
  { symbol: "LLY",   exchange: "NYSE",   name: "Eli Lilly and Company",        sector: "Healthcare",       marketCap: "LARGE", isIndex: false },
  { symbol: "ABBV",  exchange: "NYSE",   name: "AbbVie Inc.",                  sector: "Healthcare",       marketCap: "LARGE", isIndex: false },
  { symbol: "AMGN",  exchange: "NASDAQ", name: "Amgen Inc.",                   sector: "Healthcare",       marketCap: "LARGE", isIndex: false },

  // ──── Consumer ────
  { symbol: "WMT",   exchange: "NYSE",   name: "Walmart Inc.",                 sector: "Consumer Defensive", marketCap: "LARGE", isIndex: false },
  { symbol: "PG",    exchange: "NYSE",   name: "Procter & Gamble Co.",         sector: "Consumer Defensive", marketCap: "LARGE", isIndex: false },
  { symbol: "HD",    exchange: "NYSE",   name: "The Home Depot Inc.",          sector: "Consumer Cyclical",  marketCap: "LARGE", isIndex: false },
  { symbol: "KO",    exchange: "NYSE",   name: "The Coca-Cola Company",        sector: "Consumer Defensive", marketCap: "LARGE", isIndex: false },
  { symbol: "PEP",   exchange: "NASDAQ", name: "PepsiCo Inc.",                 sector: "Consumer Defensive", marketCap: "LARGE", isIndex: false },
  { symbol: "COST",  exchange: "NASDAQ", name: "Costco Wholesale Corp.",       sector: "Consumer Defensive", marketCap: "LARGE", isIndex: false },
  { symbol: "NKE",   exchange: "NYSE",   name: "Nike Inc.",                    sector: "Consumer Cyclical",  marketCap: "LARGE", isIndex: false },
  { symbol: "MCD",   exchange: "NYSE",   name: "McDonald's Corporation",       sector: "Consumer Cyclical",  marketCap: "LARGE", isIndex: false },
  { symbol: "SBUX",  exchange: "NASDAQ", name: "Starbucks Corporation",        sector: "Consumer Cyclical",  marketCap: "LARGE", isIndex: false },
  { symbol: "DIS",   exchange: "NYSE",   name: "The Walt Disney Company",      sector: "Communication",     marketCap: "LARGE", isIndex: false },
  { symbol: "NFLX",  exchange: "NASDAQ", name: "Netflix Inc.",                 sector: "Communication",     marketCap: "LARGE", isIndex: false },
  { symbol: "LOW",   exchange: "NYSE",   name: "Lowe's Companies Inc.",        sector: "Consumer Cyclical",  marketCap: "LARGE", isIndex: false },

  // ──── Industrials / Energy ────
  { symbol: "CVX",   exchange: "NYSE",   name: "Chevron Corporation",          sector: "Energy",           marketCap: "LARGE", isIndex: false },
  { symbol: "XOM",   exchange: "NYSE",   name: "Exxon Mobil Corporation",      sector: "Energy",           marketCap: "LARGE", isIndex: false },
  { symbol: "BA",    exchange: "NYSE",   name: "The Boeing Company",           sector: "Industrials",      marketCap: "LARGE", isIndex: false },
  { symbol: "CAT",   exchange: "NYSE",   name: "Caterpillar Inc.",             sector: "Industrials",      marketCap: "LARGE", isIndex: false },
  { symbol: "DE",    exchange: "NYSE",   name: "Deere & Company",              sector: "Industrials",      marketCap: "LARGE", isIndex: false },

  // ──── Global Indices ────
  { symbol: "SPX",   exchange: "INDEX",  name: "S&P 500",                      sector: null, marketCap: null, isIndex: true },
  { symbol: "DJI",   exchange: "INDEX",  name: "Dow Jones Industrial Average", sector: null, marketCap: null, isIndex: true },
  { symbol: "IXIC",  exchange: "INDEX",  name: "NASDAQ Composite",             sector: null, marketCap: null, isIndex: true },
  { symbol: "UKX",   exchange: "INDEX",  name: "FTSE 100",                     sector: null, marketCap: null, isIndex: true },
  { symbol: "DAX",   exchange: "INDEX",  name: "DAX 40",                       sector: null, marketCap: null, isIndex: true },
  { symbol: "CAC",   exchange: "INDEX",  name: "CAC 40",                       sector: null, marketCap: null, isIndex: true },
  { symbol: "NI225", exchange: "INDEX",  name: "Nikkei 225",                   sector: null, marketCap: null, isIndex: true },
  { symbol: "HSI",   exchange: "INDEX",  name: "Hang Seng Index",              sector: null, marketCap: null, isIndex: true },
];

async function main(): Promise<void> {
  console.log(`Seeding ${GLOBAL_STOCKS.length} global stocks and indices...`);
  let created = 0;
  let skipped = 0;

  for (const entry of GLOBAL_STOCKS) {
    const existing = await prisma.stock.findUnique({
      where: { symbol: entry.symbol },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.stock.create({
      data: {
        symbol: entry.symbol,
        exchange: entry.exchange,
        name: entry.name,
        sector: entry.sector,
        marketCap: entry.marketCap,
        isIndex: entry.isIndex,
        isActive: true,
      },
    });

    created++;
  }

  console.log(`\nGlobal stock seed complete:`);
  console.log(`  Created: ${created}`);
  console.log(`  Skipped (already exist): ${skipped}`);
  console.log(`  Total in seed list: ${GLOBAL_STOCKS.length}`);
}

main()
  .catch((error: unknown) => {
    console.error("Global stock seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
