// prisma/seed.ts
//
// Main seed script for RateMyTip Phase 1.
// Seeds admin users, stock indices, top NSE stocks, and sample creators.
//
// Usage: npx tsx prisma/seed.ts
// Or:    npm run db:seed

import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

// ────────────────────────────────────────
// Admin Users
// ────────────────────────────────────────

async function seedAdminUsers(): Promise<void> {
  const passwordHash = await hash("admin123", 12);

  await prisma.adminUser.upsert({
    where: { email: "admin@ratemytip.com" },
    update: {},
    create: {
      email: "admin@ratemytip.com",
      passwordHash,
      name: "Admin",
      role: "SUPER_ADMIN",
    },
  });

  console.log("Admin user seeded");
}

// ────────────────────────────────────────
// Stock Indices
// ────────────────────────────────────────

async function seedIndices(): Promise<void> {
  const indices = [
    { symbol: "NIFTY 50", exchange: "INDEX" as const, name: "Nifty 50", isIndex: true },
    { symbol: "NIFTY BANK", exchange: "INDEX" as const, name: "Nifty Bank", isIndex: true },
    { symbol: "NIFTY IT", exchange: "INDEX" as const, name: "Nifty IT", isIndex: true },
    { symbol: "NIFTY PHARMA", exchange: "INDEX" as const, name: "Nifty Pharma", isIndex: true },
    { symbol: "NIFTY MIDCAP 50", exchange: "INDEX" as const, name: "Nifty Midcap 50", isIndex: true },
    { symbol: "SENSEX", exchange: "BSE" as const, name: "BSE Sensex", isIndex: true },
  ] as const;

  for (const index of indices) {
    await prisma.stock.upsert({
      where: { symbol: index.symbol },
      update: {},
      create: {
        symbol: index.symbol,
        exchange: index.exchange,
        name: index.name,
        isIndex: index.isIndex,
      },
    });
  }

  console.log(`${indices.length} indices seeded`);
}

// ────────────────────────────────────────
// Top NSE Stocks
// ────────────────────────────────────────

async function seedStocks(): Promise<void> {
  const stocks = [
    { symbol: "RELIANCE", name: "Reliance Industries Limited", sector: "Oil & Gas", marketCap: "LARGE" as const },
    { symbol: "TCS", name: "Tata Consultancy Services", sector: "IT", marketCap: "LARGE" as const },
    { symbol: "HDFCBANK", name: "HDFC Bank Limited", sector: "Banking", marketCap: "LARGE" as const },
    { symbol: "INFY", name: "Infosys Limited", sector: "IT", marketCap: "LARGE" as const },
    { symbol: "ICICIBANK", name: "ICICI Bank Limited", sector: "Banking", marketCap: "LARGE" as const },
    { symbol: "HINDUNILVR", name: "Hindustan Unilever Limited", sector: "FMCG", marketCap: "LARGE" as const },
    { symbol: "ITC", name: "ITC Limited", sector: "FMCG", marketCap: "LARGE" as const },
    { symbol: "SBIN", name: "State Bank of India", sector: "Banking", marketCap: "LARGE" as const },
    { symbol: "BHARTIARTL", name: "Bharti Airtel Limited", sector: "Telecom", marketCap: "LARGE" as const },
    { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank", sector: "Banking", marketCap: "LARGE" as const },
    { symbol: "LT", name: "Larsen & Toubro Limited", sector: "Infrastructure", marketCap: "LARGE" as const },
    { symbol: "AXISBANK", name: "Axis Bank Limited", sector: "Banking", marketCap: "LARGE" as const },
    { symbol: "WIPRO", name: "Wipro Limited", sector: "IT", marketCap: "LARGE" as const },
    { symbol: "ASIANPAINT", name: "Asian Paints Limited", sector: "Paints", marketCap: "LARGE" as const },
    { symbol: "MARUTI", name: "Maruti Suzuki India", sector: "Automobile", marketCap: "LARGE" as const },
    { symbol: "TATAMOTORS", name: "Tata Motors Limited", sector: "Automobile", marketCap: "LARGE" as const },
    { symbol: "TATASTEEL", name: "Tata Steel Limited", sector: "Metals", marketCap: "LARGE" as const },
    { symbol: "SUNPHARMA", name: "Sun Pharmaceutical", sector: "Pharma", marketCap: "LARGE" as const },
    { symbol: "BAJFINANCE", name: "Bajaj Finance Limited", sector: "Finance", marketCap: "LARGE" as const },
    { symbol: "HCLTECH", name: "HCL Technologies Limited", sector: "IT", marketCap: "LARGE" as const },
    { symbol: "ADANIENT", name: "Adani Enterprises Limited", sector: "Diversified", marketCap: "LARGE" as const },
    { symbol: "ADANIPORTS", name: "Adani Ports and SEZ", sector: "Infrastructure", marketCap: "LARGE" as const },
    { symbol: "POWERGRID", name: "Power Grid Corporation", sector: "Power", marketCap: "LARGE" as const },
    { symbol: "NTPC", name: "NTPC Limited", sector: "Power", marketCap: "LARGE" as const },
    { symbol: "TECHM", name: "Tech Mahindra Limited", sector: "IT", marketCap: "LARGE" as const },
    { symbol: "M&M", name: "Mahindra & Mahindra", sector: "Automobile", marketCap: "LARGE" as const },
    { symbol: "TITAN", name: "Titan Company Limited", sector: "Consumer", marketCap: "LARGE" as const },
    { symbol: "ULTRACEMCO", name: "UltraTech Cement", sector: "Cement", marketCap: "LARGE" as const },
    { symbol: "NESTLEIND", name: "Nestle India Limited", sector: "FMCG", marketCap: "LARGE" as const },
    { symbol: "JSWSTEEL", name: "JSW Steel Limited", sector: "Metals", marketCap: "LARGE" as const },
  ];

  for (const stock of stocks) {
    await prisma.stock.upsert({
      where: { symbol: stock.symbol },
      update: {},
      create: {
        symbol: stock.symbol,
        exchange: "NSE",
        name: stock.name,
        sector: stock.sector,
        marketCap: stock.marketCap,
      },
    });
  }

  console.log(`${stocks.length} NSE stocks seeded`);
}

// ────────────────────────────────────────
// Sample Creators
// ────────────────────────────────────────

interface CreatorSeedData {
  readonly slug: string;
  readonly displayName: string;
  readonly bio: string;
  readonly specializations: string[];
  readonly twitterHandle?: string;
  readonly youtubeChannelId?: string;
}

async function seedCreators(): Promise<void> {
  const creators: readonly CreatorSeedData[] = [
    {
      slug: "stock-guru-india",
      displayName: "Stock Guru India",
      bio: "Daily intraday and swing trade ideas",
      specializations: ["INTRADAY", "SWING"],
      twitterHandle: "stockguruindia",
    },
    {
      slug: "market-master-raj",
      displayName: "Market Master Raj",
      bio: "Positional and long term stock picks",
      specializations: ["POSITIONAL", "LONG_TERM"],
      twitterHandle: "marketmasterraj",
    },
    {
      slug: "nifty-trader-pro",
      displayName: "Nifty Trader Pro",
      bio: "Nifty and BankNifty specialist",
      specializations: ["INTRADAY", "INDEX"],
      twitterHandle: "niftytraderpro",
    },
    {
      slug: "equity-expert-delhi",
      displayName: "Equity Expert Delhi",
      bio: "SEBI registered analyst",
      specializations: ["SWING", "LARGE_CAP"],
      twitterHandle: "equityexpertdel",
    },
    {
      slug: "trade-with-arun",
      displayName: "Trade With Arun",
      bio: "Technical analysis and chart patterns",
      specializations: ["SWING", "POSITIONAL"],
      youtubeChannelId: "UCarun123",
    },
  ];

  for (const creator of creators) {
    const existing = await prisma.creator.findUnique({
      where: { slug: creator.slug },
    });

    if (!existing) {
      const created = await prisma.creator.create({
        data: {
          slug: creator.slug,
          displayName: creator.displayName,
          bio: creator.bio,
          specializations: creator.specializations,
        },
      });

      // Create platform entries
      if (creator.twitterHandle) {
        await prisma.creatorPlatform.create({
          data: {
            creatorId: created.id,
            platform: "TWITTER",
            platformUserId: creator.twitterHandle,
            platformHandle: `@${creator.twitterHandle}`,
            platformUrl: `https://twitter.com/${creator.twitterHandle}`,
          },
        });
      }

      if (creator.youtubeChannelId) {
        await prisma.creatorPlatform.create({
          data: {
            creatorId: created.id,
            platform: "YOUTUBE",
            platformUserId: creator.youtubeChannelId,
            platformHandle: creator.displayName,
            platformUrl: `https://youtube.com/channel/${creator.youtubeChannelId}`,
          },
        });
      }
    }
  }

  console.log(`${creators.length} creators seeded`);
}

// ────────────────────────────────────────
// Main entry point
// ────────────────────────────────────────

async function main(): Promise<void> {
  console.log("Starting RateMyTip database seed...\n");

  await seedAdminUsers();
  await seedIndices();
  await seedStocks();
  await seedCreators();

  console.log("\nSeed completed successfully.");
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
