// scripts/seed-brokerages.ts
//
// Seeds major Indian brokerage firms as Creator records with platform=WEBSITE.
// These brokerages appear on MoneyControl's stock ideas page.
// Idempotent — skips existing slugs.
//
// Usage: npx tsx scripts/seed-brokerages.ts
// Or:    npm run seed:brokerages

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface BrokerageSeedEntry {
  readonly slug: string;
  readonly displayName: string;
  readonly bio: string;
}

const BROKERAGES: readonly BrokerageSeedEntry[] = [
  { slug: "icici-direct", displayName: "ICICI Direct", bio: "ICICI Direct — Full-service brokerage by ICICI Bank. Research and advisory services." },
  { slug: "hdfc-securities", displayName: "HDFC Securities", bio: "HDFC Securities — Subsidiary of HDFC Bank. Equity research and recommendations." },
  { slug: "motilal-oswal", displayName: "Motilal Oswal", bio: "Motilal Oswal Financial Services — Research-driven broking and advisory." },
  { slug: "kotak-securities", displayName: "Kotak Securities", bio: "Kotak Securities — Part of Kotak Mahindra Group. Institutional and retail research." },
  { slug: "axis-securities", displayName: "Axis Securities", bio: "Axis Securities — Subsidiary of Axis Bank. Equity research and stock picks." },
  { slug: "angel-one", displayName: "Angel One", bio: "Angel One (formerly Angel Broking) — Discount broker with research desk." },
  { slug: "sharekhan", displayName: "Sharekhan", bio: "Sharekhan by BNP Paribas — Full-service broker with extensive research." },
  { slug: "jm-financial", displayName: "JM Financial", bio: "JM Financial — Investment banking and institutional research." },
  { slug: "iifl-securities", displayName: "IIFL Securities", bio: "IIFL Securities — India Infoline financial research and advisory." },
  { slug: "emkay-global", displayName: "Emkay Global", bio: "Emkay Global Financial Services — Institutional equity research." },
  { slug: "prabhudas-lilladher", displayName: "Prabhudas Lilladher", bio: "Prabhudas Lilladher — Legacy Indian brokerage with deep research." },
  { slug: "anand-rathi", displayName: "Anand Rathi", bio: "Anand Rathi Wealth — Financial advisory and research." },
  { slug: "nirmal-bang", displayName: "Nirmal Bang", bio: "Nirmal Bang Securities — Full-service broker with equity research." },
  { slug: "centrum-broking", displayName: "Centrum Broking", bio: "Centrum Broking — Institutional and retail equity research." },
  { slug: "religare-securities", displayName: "Religare Securities", bio: "Religare Securities — Financial services and equity research." },
  { slug: "clsa", displayName: "CLSA", bio: "CLSA — Asia-focused brokerage with India equity coverage." },
  { slug: "goldman-sachs", displayName: "Goldman Sachs", bio: "Goldman Sachs — Global investment bank with India research." },
  { slug: "morgan-stanley", displayName: "Morgan Stanley", bio: "Morgan Stanley — Global financial services with India equity research." },
  { slug: "jp-morgan", displayName: "JP Morgan", bio: "JP Morgan — Global bank with India market research and stock picks." },
  { slug: "nomura", displayName: "Nomura", bio: "Nomura — Japanese bank with significant India equity research." },
  { slug: "hsbc", displayName: "HSBC", bio: "HSBC — Global bank with India research desk." },
  { slug: "edelweiss", displayName: "Edelweiss", bio: "Edelweiss Financial Services — Full-service Indian financial conglomerate." },
  { slug: "yes-securities", displayName: "Yes Securities", bio: "Yes Securities — Subsidiary of Yes Bank with equity research." },
  { slug: "choice-broking", displayName: "Choice Broking", bio: "Choice International — Full-service broker with research calls." },
  { slug: "ventura-securities", displayName: "Ventura Securities", bio: "Ventura Securities — Research-focused Indian brokerage." },
  { slug: "smc-global", displayName: "SMC Global", bio: "SMC Global Securities — Multi-asset broker with research services." },
  { slug: "nuvama-wealth", displayName: "Nuvama Wealth", bio: "Nuvama Wealth (formerly Edelweiss Wealth) — Institutional equity research." },
  { slug: "jefferies", displayName: "Jefferies", bio: "Jefferies — Global investment bank with India coverage." },
  { slug: "citi", displayName: "Citi", bio: "Citi Research — Global bank with India equity research." },
  { slug: "ubs", displayName: "UBS", bio: "UBS — Swiss bank with India equity research and advisory." },
];

async function main(): Promise<void> {
  console.log(`Seeding ${BROKERAGES.length} brokerages...`);
  let created = 0;
  let skipped = 0;

  for (const entry of BROKERAGES) {
    const existing = await prisma.creator.findUnique({
      where: { slug: entry.slug },
    });

    if (existing) {
      skipped++;
      continue;
    }

    const creator = await prisma.creator.create({
      data: {
        slug: entry.slug,
        displayName: entry.displayName,
        bio: entry.bio,
        specializations: ["POSITIONAL", "LARGE_CAP"],
        isVerified: true, // Brokerages are verified entities
      },
    });

    await prisma.creatorPlatform.create({
      data: {
        creatorId: creator.id,
        platform: "WEBSITE",
        platformUserId: entry.slug,
        platformHandle: entry.displayName,
        platformUrl: "https://www.moneycontrol.com/markets/stock-ideas/",
      },
    });

    created++;
  }

  console.log(`\nBrokerage seed complete:`);
  console.log(`  Created: ${created}`);
  console.log(`  Skipped: ${skipped}`);
}

main()
  .catch((error: unknown) => {
    console.error("Brokerage seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
