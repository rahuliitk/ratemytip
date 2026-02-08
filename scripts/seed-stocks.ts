// scripts/seed-stocks.ts
//
// Extended stock seeder for RateMyTip.
// In production, this would fetch the full list from the NSE CSV download:
//   https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv
//
// For development, uses inline data. The main prisma/seed.ts already covers
// the top 30 stocks and indices. This script can be extended to import
// hundreds of additional stocks from CSV files.
//
// Usage: npx tsx scripts/seed-stocks.ts
// Or:    npm run seed:stocks

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Additional mid-cap and small-cap stocks beyond the top 30 in seed.ts
const ADDITIONAL_STOCKS = [
  { symbol: "BAJAJFINSV", name: "Bajaj Finserv Limited", sector: "Finance", marketCap: "LARGE" as const },
  { symbol: "COALINDIA", name: "Coal India Limited", sector: "Mining", marketCap: "LARGE" as const },
  { symbol: "ONGC", name: "Oil & Natural Gas Corporation", sector: "Oil & Gas", marketCap: "LARGE" as const },
  { symbol: "BPCL", name: "Bharat Petroleum Corporation", sector: "Oil & Gas", marketCap: "LARGE" as const },
  { symbol: "GRASIM", name: "Grasim Industries Limited", sector: "Diversified", marketCap: "LARGE" as const },
  { symbol: "EICHERMOT", name: "Eicher Motors Limited", sector: "Automobile", marketCap: "LARGE" as const },
  { symbol: "DIVISLAB", name: "Divi's Laboratories", sector: "Pharma", marketCap: "LARGE" as const },
  { symbol: "DRREDDY", name: "Dr. Reddy's Laboratories", sector: "Pharma", marketCap: "LARGE" as const },
  { symbol: "CIPLA", name: "Cipla Limited", sector: "Pharma", marketCap: "LARGE" as const },
  { symbol: "APOLLOHOSP", name: "Apollo Hospitals Enterprise", sector: "Healthcare", marketCap: "LARGE" as const },
  { symbol: "HEROMOTOCO", name: "Hero MotoCorp Limited", sector: "Automobile", marketCap: "LARGE" as const },
  { symbol: "BRITANNIA", name: "Britannia Industries", sector: "FMCG", marketCap: "LARGE" as const },
  { symbol: "SBILIFE", name: "SBI Life Insurance", sector: "Insurance", marketCap: "LARGE" as const },
  { symbol: "HDFCLIFE", name: "HDFC Life Insurance", sector: "Insurance", marketCap: "LARGE" as const },
  { symbol: "TATACONSUM", name: "Tata Consumer Products", sector: "FMCG", marketCap: "LARGE" as const },
  { symbol: "INDUSINDBK", name: "IndusInd Bank Limited", sector: "Banking", marketCap: "LARGE" as const },
  { symbol: "PIDILITIND", name: "Pidilite Industries", sector: "Chemicals", marketCap: "MID" as const },
  { symbol: "HAVELLS", name: "Havells India Limited", sector: "Electronics", marketCap: "MID" as const },
  { symbol: "DABUR", name: "Dabur India Limited", sector: "FMCG", marketCap: "MID" as const },
  { symbol: "GODREJCP", name: "Godrej Consumer Products", sector: "FMCG", marketCap: "MID" as const },
];

async function main(): Promise<void> {
  console.log("Seeding additional stocks...\n");
  console.log("NOTE: In production, this script would fetch from NSE CSV.");
  console.log("Using inline seed data for development.\n");

  let created = 0;
  let skipped = 0;

  for (const stock of ADDITIONAL_STOCKS) {
    const existing = await prisma.stock.findUnique({
      where: { symbol: stock.symbol },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.stock.create({
      data: {
        symbol: stock.symbol,
        exchange: "NSE",
        name: stock.name,
        sector: stock.sector,
        marketCap: stock.marketCap,
      },
    });
    created++;
  }

  console.log(`Stocks seeded: ${created} created, ${skipped} already existed.`);
}

main()
  .catch((error: unknown) => {
    console.error("Stock seeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
