// scripts/recalculate-scores.ts
//
// Force recalculates RMT scores for all active creators.
// This script is useful for:
//   - Initial score calculation after bulk importing tips
//   - Fixing scores after a bug in the scoring algorithm
//   - Verifying score integrity after migrations
//
// Usage: npx tsx scripts/recalculate-scores.ts
//        npx tsx scripts/recalculate-scores.ts --creator=stock-guru-india
//        npx tsx scripts/recalculate-scores.ts --dry-run

import { PrismaClient, TipStatus } from "@prisma/client";
import { COMPLETED_TIP_STATUSES, SCORING } from "../src/lib/constants";
import { calculateCompositeScore } from "../src/lib/scoring/composite";
import type { CompletedTip, TipStatusType, TipDirectionType, TipTimeframeType } from "../src/lib/scoring/types";

const prisma = new PrismaClient();

/**
 * Maps a raw Prisma tip record to the CompletedTip interface.
 */
function mapToCompletedTip(tip: {
  id: string;
  creatorId: string;
  status: string;
  direction: string;
  timeframe: string;
  entryPrice: number;
  target1: number;
  target2: number | null;
  target3: number | null;
  stopLoss: number;
  closedPrice: number | null;
  closedAt: Date | null;
  tipTimestamp: Date;
  returnPct: number | null;
  riskRewardRatio: number | null;
}): CompletedTip | null {
  if (tip.closedAt === null) {
    return null;
  }

  return {
    id: tip.id,
    creatorId: tip.creatorId,
    status: tip.status as TipStatusType,
    direction: tip.direction as TipDirectionType,
    timeframe: tip.timeframe as TipTimeframeType,
    entryPrice: tip.entryPrice,
    target1: tip.target1,
    target2: tip.target2,
    target3: tip.target3,
    stopLoss: tip.stopLoss,
    closedPrice: tip.closedPrice,
    closedAt: tip.closedAt,
    tipTimestamp: tip.tipTimestamp,
    returnPct: tip.returnPct,
    riskRewardRatio: tip.riskRewardRatio,
  };
}

async function recalculateForCreator(
  creatorId: string,
  creatorSlug: string,
  dryRun: boolean,
): Promise<{ success: boolean; score: number | null }> {
  // Fetch all completed tips
  const rawTips = await prisma.tip.findMany({
    where: {
      creatorId,
      status: { in: [...COMPLETED_TIP_STATUSES] as TipStatus[] },
    },
    select: {
      id: true,
      creatorId: true,
      status: true,
      direction: true,
      timeframe: true,
      entryPrice: true,
      target1: true,
      target2: true,
      target3: true,
      stopLoss: true,
      closedPrice: true,
      closedAt: true,
      tipTimestamp: true,
      returnPct: true,
      riskRewardRatio: true,
    },
    orderBy: { tipTimestamp: "asc" },
  });

  const completedTips = rawTips
    .map(mapToCompletedTip)
    .filter((tip): tip is CompletedTip => tip !== null);

  if (completedTips.length === 0) {
    console.log(`  ${creatorSlug}: No completed tips, skipping.`);
    return { success: true, score: null };
  }

  const score = calculateCompositeScore({
    tips: completedTips,
    halfLifeDays: SCORING.RECENCY_DECAY_HALFLIFE_DAYS,
  });

  console.log(
    `  ${creatorSlug}: ${completedTips.length} tips, ` +
    `RMT Score: ${score.rmtScore.toFixed(1)}, ` +
    `Accuracy: ${(score.accuracyRate * 100).toFixed(1)}%, ` +
    `Tier: ${score.tier}`,
  );

  if (dryRun) {
    console.log(`  (dry-run: score not saved)`);
    return { success: true, score: score.rmtScore };
  }

  // Persist the score
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  await prisma.$transaction([
    prisma.creatorScore.upsert({
      where: { creatorId },
      create: {
        creatorId,
        accuracyScore: score.accuracyScore,
        riskAdjustedScore: score.riskAdjustedScore,
        consistencyScore: score.consistencyScore,
        volumeFactorScore: score.volumeFactorScore,
        rmtScore: score.rmtScore,
        confidenceInterval: score.confidenceInterval,
        accuracyRate: score.accuracyRate,
        avgReturnPct: score.avgReturnPct,
        avgRiskRewardRatio: score.avgRiskRewardRatio,
        winStreak: score.winStreak,
        lossStreak: score.lossStreak,
        bestTipReturnPct: score.bestTipReturnPct,
        worstTipReturnPct: score.worstTipReturnPct,
        intradayAccuracy: score.timeframeAccuracy.intradayAccuracy,
        swingAccuracy: score.timeframeAccuracy.swingAccuracy,
        positionalAccuracy: score.timeframeAccuracy.positionalAccuracy,
        longTermAccuracy: score.timeframeAccuracy.longTermAccuracy,
        totalScoredTips: score.totalScoredTips,
        scorePeriodStart: score.scorePeriodStart,
        scorePeriodEnd: score.scorePeriodEnd,
        calculatedAt: now,
      },
      update: {
        accuracyScore: score.accuracyScore,
        riskAdjustedScore: score.riskAdjustedScore,
        consistencyScore: score.consistencyScore,
        volumeFactorScore: score.volumeFactorScore,
        rmtScore: score.rmtScore,
        confidenceInterval: score.confidenceInterval,
        accuracyRate: score.accuracyRate,
        avgReturnPct: score.avgReturnPct,
        avgRiskRewardRatio: score.avgRiskRewardRatio,
        winStreak: score.winStreak,
        lossStreak: score.lossStreak,
        bestTipReturnPct: score.bestTipReturnPct,
        worstTipReturnPct: score.worstTipReturnPct,
        intradayAccuracy: score.timeframeAccuracy.intradayAccuracy,
        swingAccuracy: score.timeframeAccuracy.swingAccuracy,
        positionalAccuracy: score.timeframeAccuracy.positionalAccuracy,
        longTermAccuracy: score.timeframeAccuracy.longTermAccuracy,
        totalScoredTips: score.totalScoredTips,
        scorePeriodStart: score.scorePeriodStart,
        scorePeriodEnd: score.scorePeriodEnd,
        calculatedAt: now,
      },
    }),
    prisma.scoreSnapshot.upsert({
      where: { creatorId_date: { creatorId, date: today } },
      create: {
        creatorId,
        date: today,
        rmtScore: score.rmtScore,
        accuracyRate: score.accuracyRate,
        totalScoredTips: score.totalScoredTips,
      },
      update: {
        rmtScore: score.rmtScore,
        accuracyRate: score.accuracyRate,
        totalScoredTips: score.totalScoredTips,
      },
    }),
    prisma.creator.update({
      where: { id: creatorId },
      data: {
        tier: score.tier,
        completedTips: score.totalScoredTips,
      },
    }),
  ]);

  return { success: true, score: score.rmtScore };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const creatorArg = args.find((a) => a.startsWith("--creator="));
  const creatorSlugFilter = creatorArg?.split("=")[1];

  if (dryRun) {
    console.log("DRY RUN MODE: Scores will be calculated but not saved.\n");
  }

  // Build query filter
  const where: Record<string, unknown> = { isActive: true };
  if (creatorSlugFilter) {
    where.slug = creatorSlugFilter;
  }

  const creators = await prisma.creator.findMany({
    where,
    select: { id: true, slug: true },
    orderBy: { slug: "asc" },
  });

  if (creators.length === 0) {
    console.log("No creators found matching the filter.");
    return;
  }

  console.log(`Recalculating scores for ${creators.length} creator(s)...\n`);

  let successCount = 0;
  let failCount = 0;
  const startTime = Date.now();

  for (const creator of creators) {
    try {
      const result = await recalculateForCreator(creator.id, creator.slug, dryRun);
      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }
    } catch (error: unknown) {
      console.error(`  ${creator.slug}: ERROR -`, error);
      failCount++;
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nDone in ${elapsed}s. Success: ${successCount}, Failed: ${failCount}`);
}

main()
  .catch((error: unknown) => {
    console.error("Score recalculation failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
