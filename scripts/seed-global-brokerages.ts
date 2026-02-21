// scripts/seed-global-brokerages.ts
//
// Seeds major global brokerage firms as Creator records with creatorType=BROKERAGE.
// Each brokerage gets a CreatorPlatform with platform=FINNHUB (primary data source).
// Idempotent — upserts existing slugs to add creatorType and FINNHUB platform.
//
// Usage: npx tsx scripts/seed-global-brokerages.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface BrokerageSeedEntry {
  readonly slug: string;
  readonly displayName: string;
  readonly bio: string;
}

const GLOBAL_BROKERAGES: readonly BrokerageSeedEntry[] = [
  // ──── US Bulge Bracket ────
  { slug: "goldman-sachs",    displayName: "Goldman Sachs",      bio: "Goldman Sachs — Global investment bank. Equity research covers US, Europe, and Asia." },
  { slug: "morgan-stanley",   displayName: "Morgan Stanley",     bio: "Morgan Stanley — Global financial services. Institutional equity research worldwide." },
  { slug: "jp-morgan",        displayName: "JP Morgan",          bio: "JP Morgan — Global bank with equity research covering all major markets." },
  { slug: "bank-of-america",  displayName: "Bank of America",    bio: "Bank of America / BofA Securities — Full-service global equity research." },
  { slug: "citigroup",        displayName: "Citigroup",          bio: "Citigroup / Citi Research — Global bank with equity research and advisory." },
  { slug: "wells-fargo",      displayName: "Wells Fargo",        bio: "Wells Fargo Securities — US-focused equity research and stock ratings." },

  // ──── European ────
  { slug: "barclays",         displayName: "Barclays",           bio: "Barclays — UK bank with global equity research coverage." },
  { slug: "deutsche-bank",    displayName: "Deutsche Bank",      bio: "Deutsche Bank — German bank with global equity research." },
  { slug: "ubs",              displayName: "UBS",                bio: "UBS — Swiss bank with global equity research and wealth management." },
  { slug: "credit-suisse",    displayName: "Credit Suisse",      bio: "Credit Suisse (now part of UBS) — Equity research legacy coverage." },
  { slug: "hsbc",             displayName: "HSBC",               bio: "HSBC — Global bank with research desk covering Asia, Europe, and Americas." },

  // ──── Asia-Pacific ────
  { slug: "nomura",           displayName: "Nomura",             bio: "Nomura — Japanese bank with significant global equity research." },
  { slug: "macquarie",        displayName: "Macquarie",          bio: "Macquarie Group — Australian bank with global equity research." },
  { slug: "clsa",             displayName: "CLSA",               bio: "CLSA — Asia-focused brokerage with deep regional equity coverage." },
  { slug: "daiwa",            displayName: "Daiwa",              bio: "Daiwa Securities — Japanese brokerage with Asia-Pacific research." },

  // ──── US Mid-Market / Specialty ────
  { slug: "jefferies",        displayName: "Jefferies",          bio: "Jefferies — Global investment bank with broad equity research coverage." },
  { slug: "piper-sandler",    displayName: "Piper Sandler",      bio: "Piper Sandler — US investment bank focused on technology and healthcare research." },
  { slug: "raymond-james",    displayName: "Raymond James",      bio: "Raymond James — US financial services with equity research coverage." },
  { slug: "stifel",           displayName: "Stifel",             bio: "Stifel Financial — US brokerage with mid-cap focused equity research." },
  { slug: "needham",          displayName: "Needham",            bio: "Needham & Company — Boutique investment bank focused on growth companies." },
  { slug: "wedbush",          displayName: "Wedbush",            bio: "Wedbush Securities — US brokerage with technology sector research focus." },
  { slug: "bernstein",        displayName: "Bernstein",          bio: "Bernstein (Alliance Bernstein) — Institutional equity research and advisory." },
  { slug: "oppenheimer",      displayName: "Oppenheimer",        bio: "Oppenheimer — US investment bank with equity research services." },
  { slug: "keybanc",          displayName: "KeyBanc",            bio: "KeyBanc Capital Markets — US mid-cap focused equity research." },

  // ──── Canadian ────
  { slug: "rbc-capital",      displayName: "RBC Capital",        bio: "RBC Capital Markets — Canadian bank with North American equity research." },
  { slug: "bmo-capital",      displayName: "BMO Capital",        bio: "BMO Capital Markets — Canadian bank with North American research coverage." },
  { slug: "td-cowen",         displayName: "TD Cowen",           bio: "TD Cowen — Canadian bank with US-focused equity research (formerly Cowen)." },

  // ──── Other ────
  { slug: "wolfe-research",   displayName: "Wolfe Research",     bio: "Wolfe Research — Boutique equity research firm with sector-specific coverage." },
  { slug: "bofa-securities",  displayName: "BofA Securities",    bio: "BofA Securities — Bank of America's institutional equities arm." },
];

async function main(): Promise<void> {
  console.log(`Seeding ${GLOBAL_BROKERAGES.length} global brokerages...`);
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const entry of GLOBAL_BROKERAGES) {
    const existing = await prisma.creator.findUnique({
      where: { slug: entry.slug },
      include: { platforms: { where: { platform: "FINNHUB" } } },
    });

    if (existing) {
      // Update creatorType to BROKERAGE if not already set
      await prisma.creator.update({
        where: { id: existing.id },
        data: { creatorType: "BROKERAGE" },
      });

      // Add FINNHUB platform if missing
      if (existing.platforms.length === 0) {
        await prisma.creatorPlatform.create({
          data: {
            creatorId: existing.id,
            platform: "FINNHUB",
            platformUserId: `finnhub-${entry.slug}`,
            platformHandle: entry.displayName,
            platformUrl: `https://finnhub.io`,
          },
        });
        updated++;
      } else {
        skipped++;
      }
      continue;
    }

    // Create new brokerage creator
    const creator = await prisma.creator.create({
      data: {
        slug: entry.slug,
        displayName: entry.displayName,
        bio: entry.bio,
        creatorType: "BROKERAGE",
        specializations: ["LONG_TERM", "LARGE_CAP"],
        isVerified: true,
      },
    });

    // Create FINNHUB platform record
    await prisma.creatorPlatform.create({
      data: {
        creatorId: creator.id,
        platform: "FINNHUB",
        platformUserId: `finnhub-${entry.slug}`,
        platformHandle: entry.displayName,
        platformUrl: `https://finnhub.io`,
      },
    });

    created++;
  }

  console.log(`\nGlobal brokerage seed complete:`);
  console.log(`  Created: ${created}`);
  console.log(`  Updated (added FINNHUB platform): ${updated}`);
  console.log(`  Skipped (already complete): ${skipped}`);
  console.log(`  Total in seed list: ${GLOBAL_BROKERAGES.length}`);
}

main()
  .catch((error: unknown) => {
    console.error("Global brokerage seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
