// scripts/seed-creators.ts
//
// Extended creator seeder for RateMyTip Phase 1.
// Seeds additional finfluencer profiles beyond the 5 sample creators
// in prisma/seed.ts. In production this would be populated from
// a curated CSV of 500 Indian finfluencers.
//
// Usage: npx tsx scripts/seed-creators.ts
// Or:    npm run seed:creators

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface CreatorSeedData {
  readonly slug: string;
  readonly displayName: string;
  readonly bio: string;
  readonly specializations: string[];
  readonly twitterHandle?: string;
  readonly youtubeChannelId?: string;
}

// Additional creators beyond the 5 in prisma/seed.ts
const ADDITIONAL_CREATORS: readonly CreatorSeedData[] = [
  {
    slug: "chart-wizard-mumbai",
    displayName: "Chart Wizard Mumbai",
    bio: "Price action and candlestick pattern specialist",
    specializations: ["INTRADAY", "SWING", "TECHNICAL_ANALYSIS"],
    twitterHandle: "chartwizardmum",
  },
  {
    slug: "value-investor-ravi",
    displayName: "Value Investor Ravi",
    bio: "Fundamental analysis, long-term wealth creation",
    specializations: ["LONG_TERM", "LARGE_CAP", "FUNDAMENTAL"],
    twitterHandle: "valueinvravi",
    youtubeChannelId: "UCravi456",
  },
  {
    slug: "options-queen-priya",
    displayName: "Options Queen Priya",
    bio: "Nifty and BankNifty options strategies",
    specializations: ["INTRADAY", "OPTIONS", "INDEX"],
    twitterHandle: "optionsqueenp",
  },
  {
    slug: "midcap-hunter-suresh",
    displayName: "Midcap Hunter Suresh",
    bio: "Finding hidden gems in mid and small cap space",
    specializations: ["POSITIONAL", "MID_CAP", "SMALL_CAP"],
    twitterHandle: "midcaphunters",
  },
  {
    slug: "momentum-trades-ankit",
    displayName: "Momentum Trades Ankit",
    bio: "Breakout and momentum trading strategies",
    specializations: ["SWING", "MOMENTUM", "TECHNICAL_ANALYSIS"],
    twitterHandle: "momentumankit",
  },
  {
    slug: "pharma-analyst-deepa",
    displayName: "Pharma Analyst Deepa",
    bio: "Pharma and healthcare sector specialist",
    specializations: ["POSITIONAL", "PHARMA", "SECTOR_SPECIALIST"],
    twitterHandle: "pharmaanalystd",
  },
  {
    slug: "banking-bull-vikram",
    displayName: "Banking Bull Vikram",
    bio: "Banking and financial sector calls",
    specializations: ["SWING", "BANKING", "SECTOR_SPECIALIST"],
    twitterHandle: "bankingbullvik",
  },
  {
    slug: "it-sector-insights",
    displayName: "IT Sector Insights",
    bio: "IT sector analysis and stock picks",
    specializations: ["POSITIONAL", "IT", "LARGE_CAP"],
    youtubeChannelId: "UCitsector789",
  },
  {
    slug: "auto-sector-guru",
    displayName: "Auto Sector Guru",
    bio: "Automobile sector research and stock tips",
    specializations: ["SWING", "AUTOMOBILE", "SECTOR_SPECIALIST"],
    twitterHandle: "autosectorguru",
  },
  {
    slug: "fmcg-finder-neha",
    displayName: "FMCG Finder Neha",
    bio: "FMCG and consumer goods stock analysis",
    specializations: ["LONG_TERM", "FMCG", "DEFENSIVE"],
    twitterHandle: "fmcgfinderneha",
    youtubeChannelId: "UCneha321",
  },
];

async function main(): Promise<void> {
  console.log("Seeding additional creators...\n");

  let created = 0;
  let skipped = 0;

  for (const creator of ADDITIONAL_CREATORS) {
    const existing = await prisma.creator.findUnique({
      where: { slug: creator.slug },
    });

    if (existing) {
      skipped++;
      continue;
    }

    const record = await prisma.creator.create({
      data: {
        slug: creator.slug,
        displayName: creator.displayName,
        bio: creator.bio,
        specializations: creator.specializations,
      },
    });

    // Create Twitter platform entry
    if (creator.twitterHandle) {
      await prisma.creatorPlatform.create({
        data: {
          creatorId: record.id,
          platform: "TWITTER",
          platformUserId: creator.twitterHandle,
          platformHandle: `@${creator.twitterHandle}`,
          platformUrl: `https://twitter.com/${creator.twitterHandle}`,
        },
      });
    }

    // Create YouTube platform entry
    if (creator.youtubeChannelId) {
      await prisma.creatorPlatform.create({
        data: {
          creatorId: record.id,
          platform: "YOUTUBE",
          platformUserId: creator.youtubeChannelId,
          platformHandle: creator.displayName,
          platformUrl: `https://youtube.com/channel/${creator.youtubeChannelId}`,
        },
      });
    }

    created++;
  }

  console.log(`Creators seeded: ${created} created, ${skipped} already existed.`);
}

main()
  .catch((error: unknown) => {
    console.error("Creator seeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
