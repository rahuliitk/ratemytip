// scripts/test-moneycontrol-scrape.ts
//
// One-off manual test: scrape MoneyControl via JSON API and process
// recommendations into the database.
//
// Usage: npx tsx scripts/test-moneycontrol-scrape.ts

import { db } from "@/lib/db";
import { MoneyControlScraper, type MoneyControlStockInfo } from "@/lib/scraper/moneycontrol";
import { createMoneyControlRateLimiter } from "@/lib/scraper/rate-limiter";
import {
  parseMoneyControlRecommendation,
  brokerageSlug,
} from "@/lib/scraper/moneycontrol-parser";
import { calculateTipContentHash } from "@/lib/utils/crypto";
import { TIMEFRAME_EXPIRY_DAYS } from "@/lib/constants";
import { calculateCreatorScore, persistCreatorScore } from "@/lib/scoring";
import { addDays } from "date-fns";

async function main() {
  console.log("Starting MoneyControl API scrape...\n");

  const rateLimiter = createMoneyControlRateLimiter();
  const scraper = new MoneyControlScraper(rateLimiter);

  let postsStored = 0;
  let tipsCreated = 0;
  let stocksCreated = 0;
  let creatorsCreated = 0;
  let errors = 0;
  const updatedCreatorIds = new Set<string>();
  const stockInfoCache = new Map<string, MoneyControlStockInfo | null>();

  function classifyMarketCap(crores: number | null): "LARGE" | "MID" | "SMALL" | "MICRO" | null {
    if (crores == null) return null;
    if (crores >= 20_000) return "LARGE";
    if (crores >= 5_000) return "MID";
    if (crores >= 1_000) return "SMALL";
    return "MICRO";
  }

  // --full: First crawl = 20 pages (~1000 tips)
  // Default: 3 pages (~150 tips, for recurring 3-hour runs)
  const isFullScrape = process.argv.includes("--full");
  const maxPages = isFullScrape ? 20 : 3;
  console.log(`Mode: ${isFullScrape ? "FULL SCRAPE (20 pages, ~1000 tips)" : "INCREMENTAL (3 pages, ~150 latest tips)"}\n`);

  const { recommendations, totalApiItems, skippedItems } = await scraper.scrapeStockIdeas(maxPages);
  console.log(`API returned ${totalApiItems} items total, ${recommendations.length} valid recommendations, ${skippedItems} skipped\n`);

  if (recommendations.length === 0) {
    console.log("No recommendations found. The API may have changed.");
    await db.$disconnect();
    return;
  }

  // Show first 5 raw recommendations for debugging
  console.log("Sample raw recommendations:");
  for (const rec of recommendations.slice(0, 5)) {
    console.log(`  ${rec.recommendationType} ${rec.stockName} | Brokerage: ${rec.brokerageName} | CMP: ₹${rec.currentPrice} | Rec Price: ₹${rec.recommendedPrice} | Target: ₹${rec.targetPrice} | Upside: ${rec.upsidePct.toFixed(1)}% | Date: ${rec.reportDate}`);
  }
  console.log();

  // Create ScrapeJob record
  const scrapeJob = await db.scrapeJob.create({
    data: {
      platform: "WEBSITE",
      jobType: "FULL_SCRAPE",
      status: "RUNNING",
      startedAt: new Date(),
      postsFound: recommendations.length,
    },
  });

  const brokerageCache = new Map<string, { creatorId: string; platformId: string }>();

  for (let recIndex = 0; recIndex < recommendations.length; recIndex++) {
    const rec = recommendations[recIndex]!
    try {
      const parsedTip = parseMoneyControlRecommendation(rec);
      if (!parsedTip) continue;

      // Find or create brokerage creator
      const slug = brokerageSlug(rec.brokerageName);
      let brokerage = brokerageCache.get(slug);

      if (!brokerage) {
        let creator = await db.creator.findUnique({
          where: { slug },
          include: { platforms: { where: { platform: "WEBSITE" } } },
        });

        if (!creator) {
          creator = await db.creator.create({
            data: {
              slug,
              displayName: rec.brokerageName,
              bio: `${rec.brokerageName} — Brokerage stock recommendations tracked by RateMyTip`,
              specializations: ["POSITIONAL", "LARGE_CAP"],
              isVerified: false,
              isClaimed: false,
            },
            include: { platforms: { where: { platform: "WEBSITE" } } },
          });
          creatorsCreated++;
        }

        let platform = creator.platforms[0];
        if (!platform) {
          platform = await db.creatorPlatform.create({
            data: {
              creatorId: creator.id,
              platform: "WEBSITE",
              platformUserId: slug,
              platformHandle: rec.brokerageName,
              platformUrl: "https://www.moneycontrol.com/markets/stock-ideas/",
            },
          });
        }

        brokerage = { creatorId: creator.id, platformId: platform.id };
        brokerageCache.set(slug, brokerage);
      }

      const { creatorId, platformId } = brokerage;
      updatedCreatorIds.add(creatorId);

      // Generate unique platform post ID using the API's unique id
      const platformPostId = `mc-${rec.id}`;

      // Store as RawPost
      const content = [
        `${rec.recommendationType.toUpperCase()} ${rec.stockName}`,
        `Brokerage: ${rec.brokerageName}`,
        `Target: ₹${rec.targetPrice}`,
        `CMP: ₹${rec.currentPrice}`,
        `Rec Price: ₹${rec.recommendedPrice}`,
        `Upside: ${rec.upsidePct.toFixed(1)}%`,
      ].join(" | ");

      try {
        await db.rawPost.upsert({
          where: {
            creatorPlatformId_platformPostId: {
              creatorPlatformId: platformId,
              platformPostId,
            },
          },
          create: {
            creatorPlatformId: platformId,
            platformPostId,
            content,
            postedAt: new Date(rec.reportDate || Date.now()),
            isParsed: true,
            isTipContent: true,
            parseConfidence: 0.95,
            metadata: JSON.parse(JSON.stringify({
              brokerageName: rec.brokerageName,
              recommendationType: rec.recommendationType,
              targetPrice: rec.targetPrice,
              currentPrice: rec.currentPrice,
              recommendedPrice: rec.recommendedPrice,
              upsidePct: rec.upsidePct,
              reportDate: rec.reportDate,
            })),
          },
          update: {},
        });
        postsStored++;
      } catch (error) {
        if (error instanceof Error && error.message.includes("Unique constraint")) {
          continue;
        }
        throw error;
      }

      // Look up stock info from MoneyControl price API (cached per scid)
      let stockInfo: MoneyControlStockInfo | null | undefined = stockInfoCache.get(rec.scid);
      if (stockInfo === undefined) {
        stockInfo = await scraper.lookupStockByScid(rec.scid);
        stockInfoCache.set(rec.scid, stockInfo);
        if (stockInfo) {
          console.log(`  Stock lookup: ${rec.stockName} → NSE: ${stockInfo.nseSymbol} | Sector: ${stockInfo.sector} | MCap: ${stockInfo.marketCapCrores?.toFixed(0)}Cr`);
        }
      }

      // Determine NSE symbol: prefer API lookup, fallback to parser
      const nseSymbol = stockInfo?.nseSymbol ?? parsedTip.stockSymbol.toUpperCase();

      let stock = await db.stock.findFirst({
        where: {
          OR: [
            { symbol: nseSymbol },
            { name: { contains: rec.stockName, mode: "insensitive" } },
          ],
        },
      });

      if (!stock) {
        try {
          stock = await db.stock.upsert({
            where: { symbol: nseSymbol },
            create: {
              symbol: nseSymbol,
              name: stockInfo?.fullName || rec.stockName,
              exchange: rec.exchange === "BSE" ? "BSE" : "NSE",
              sector: stockInfo?.sector ?? null,
              industry: stockInfo?.industry ?? null,
              marketCap: classifyMarketCap(stockInfo?.marketCapCrores ?? null),
              lastPrice: stockInfo?.lastPrice ?? rec.currentPrice,
              lastPriceAt: new Date(),
              isActive: true,
            },
            update: {},
          });
          stocksCreated++;
        } catch (error) {
          console.error(`  Failed to create stock ${nseSymbol}:`, error);
          errors++;
          continue;
        }
      } else if (stockInfo && !stock.sector) {
        // Enrich existing stock with missing metadata
        await db.stock.update({
          where: { id: stock.id },
          data: {
            sector: stockInfo.sector ?? undefined,
            industry: stockInfo.industry ?? undefined,
            marketCap: classifyMarketCap(stockInfo.marketCapCrores ?? null) ?? undefined,
            lastPrice: stockInfo.lastPrice ?? undefined,
            lastPriceAt: stockInfo.lastPrice ? new Date() : undefined,
          },
        });
      }

      // Calculate content hash for deduplication
      const tipTimestamp = new Date(rec.reportDate || Date.now());
      const contentHash = calculateTipContentHash({
        creatorId,
        stockSymbol: stock.symbol,
        direction: parsedTip.direction,
        entryPrice: parsedTip.entryPrice,
        target1: parsedTip.target1,
        target2: null,
        target3: null,
        stopLoss: parsedTip.stopLoss,
        timeframe: parsedTip.timeframe,
        tipTimestamp,
      });

      // Skip duplicate tips
      const existingTip = await db.tip.findUnique({
        where: { contentHash },
      });
      if (existingTip) continue;

      // Calculate expiry
      const expiryDays = TIMEFRAME_EXPIRY_DAYS[parsedTip.timeframe] ?? 90;
      const expiresAt = addDays(tipTimestamp, expiryDays);

      // Create tip
      await db.tip.create({
        data: {
          creatorId,
          stockId: stock.id,
          direction: parsedTip.direction,
          assetClass: "EQUITY",
          entryPrice: parsedTip.entryPrice,
          target1: parsedTip.target1,
          target2: null,
          target3: null,
          stopLoss: parsedTip.stopLoss,
          timeframe: parsedTip.timeframe,
          conviction: parsedTip.conviction,
          rationale: `${rec.brokerageName} ${rec.recommendationType} recommendation`,
          sourceUrl: rec.sourceUrl,
          contentHash,
          tipTimestamp,
          priceAtTip: parsedTip.entryPrice,
          status: "ACTIVE",
          reviewStatus: "AUTO_APPROVED",
          parseConfidence: 0.95,
          expiresAt,
          sourcePosition: recIndex,
        },
      });
      tipsCreated++;

      // Update creator tip counts
      await db.creator.update({
        where: { id: creatorId },
        data: {
          totalTips: { increment: 1 },
          activeTips: { increment: 1 },
          lastTipAt: tipTimestamp,
        },
      });
    } catch (error) {
      errors++;
      console.error("Error processing recommendation:", error);
    }
  }

  // Update scrape job
  await db.scrapeJob.update({
    where: { id: scrapeJob.id },
    data: {
      status: errors > 0 && tipsCreated === 0 ? "FAILED" : "COMPLETED",
      completedAt: new Date(),
      tipsExtracted: tipsCreated,
      errorMessage: errors > 0 ? `${errors} errors during processing` : null,
    },
  });

  // Recalculate scores for creators whose data was updated
  if (updatedCreatorIds.size > 0) {
    console.log(`\nRecalculating scores for ${updatedCreatorIds.size} updated creator(s)...`);
    for (const creatorId of updatedCreatorIds) {
      try {
        const score = await calculateCreatorScore(creatorId);
        if (score) {
          await persistCreatorScore(creatorId, score);
          console.log(`  Recalculated score for creator ${creatorId}: RMT Score = ${score.rmtScore.toFixed(1)}`);
        } else {
          console.log(`  Creator ${creatorId}: no completed tips yet, skipping score`);
        }
      } catch (error) {
        console.error(`  Failed to recalculate score for creator ${creatorId}:`, error);
      }
    }
  }

  console.log("\n=== Results ===");
  console.log(`Recommendations found: ${recommendations.length}`);
  console.log(`Creators (brokerages) created: ${creatorsCreated}`);
  console.log(`Stocks auto-created: ${stocksCreated}`);
  console.log(`Raw posts stored: ${postsStored}`);
  console.log(`Tips created: ${tipsCreated}`);
  console.log(`Errors: ${errors}`);

  // Show what's in the DB now
  const [stockCount, creatorCount, tipCount, rawPostCount] = await Promise.all([
    db.stock.count(),
    db.creator.count(),
    db.tip.count(),
    db.rawPost.count(),
  ]);

  console.log(`\n=== Database State ===`);
  console.log(`Stocks: ${stockCount}`);
  console.log(`Creators: ${creatorCount}`);
  console.log(`Tips: ${tipCount}`);
  console.log(`Raw Posts: ${rawPostCount}`);

  // Show some created tips
  const recentTips = await db.tip.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      stock: { select: { symbol: true, name: true } },
      creator: { select: { displayName: true } },
    },
  });

  if (recentTips.length > 0) {
    console.log(`\n=== Sample Tips ===`);
    for (const tip of recentTips) {
      console.log(`  ${tip.direction} ${tip.stock.symbol} (${tip.stock.name}) | Entry: ₹${tip.entryPrice} | Target: ₹${tip.target1} | SL: ₹${tip.stopLoss} | By: ${tip.creator.displayName}`);
    }
  }

  await db.$disconnect();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
