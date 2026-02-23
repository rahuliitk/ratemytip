import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subDays } from "date-fns";
import { cached } from "@/lib/cache";
import { CACHE_TTL } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const rateLimited = await rateLimit(request);
    if (rateLimited) return rateLimited;

    const { id } = await context.params;
    const cacheKey = `creator:${id}`;

    const creatorDetail = await cached(cacheKey, CACHE_TTL.CREATOR_PROFILE, async () => {
      // Find creator by id (cuid) or slug
      const isCuid = /^c[a-z0-9]{24,}$/i.test(id);
      const creator = await db.creator.findFirst({
        where: isCuid ? { id } : { slug: id },
        include: {
          platforms: {
            where: { isActive: true },
            select: {
              id: true,
              platform: true,
              platformHandle: true,
              platformUrl: true,
              followerCount: true,
            },
          },
          currentScore: true,
        },
      });

      if (!creator) return null;

      // Fetch recent 10 tips
      const recentTips = await db.tip.findMany({
        where: {
          creatorId: creator.id,
          reviewStatus: { in: ["AUTO_APPROVED", "MANUALLY_APPROVED"] },
        },
        orderBy: { tipTimestamp: "desc" },
        take: 10,
        include: {
          stock: {
            select: { symbol: true, name: true },
          },
        },
      });

      // Fetch score history (last 90 days)
      const ninetyDaysAgo = subDays(new Date(), 90);
      const scoreHistory = await db.scoreSnapshot.findMany({
        where: {
          creatorId: creator.id,
          date: { gte: ninetyDaysAgo },
        },
        orderBy: { date: "desc" },
      });

      const score = creator.currentScore;
      return {
        id: creator.id,
        slug: creator.slug,
        displayName: creator.displayName,
        bio: creator.bio,
        profileImageUrl: creator.profileImageUrl,
        isVerified: creator.isVerified,
        isClaimed: creator.isClaimed,
        isActive: creator.isActive,
        tier: creator.tier,
        specializations: creator.specializations,
        followerCount: creator.followerCount,
        firstTipAt: creator.firstTipAt?.toISOString() ?? null,
        lastTipAt: creator.lastTipAt?.toISOString() ?? null,
        createdAt: creator.createdAt.toISOString(),
        platforms: creator.platforms,
        score: score
          ? {
              id: score.id,
              creatorId: score.creatorId,
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
              intradayAccuracy: score.intradayAccuracy,
              swingAccuracy: score.swingAccuracy,
              positionalAccuracy: score.positionalAccuracy,
              longTermAccuracy: score.longTermAccuracy,
              totalScoredTips: score.totalScoredTips,
              scorePeriodStart: score.scorePeriodStart.toISOString(),
              scorePeriodEnd: score.scorePeriodEnd.toISOString(),
              calculatedAt: score.calculatedAt.toISOString(),
            }
          : null,
        stats: {
          totalTips: creator.totalTips,
          activeTips: creator.activeTips,
          completedTips: creator.completedTips,
          winStreak: score?.winStreak ?? 0,
          lossStreak: score?.lossStreak ?? 0,
        },
        recentTips: recentTips.map((tip) => ({
          id: tip.id,
          creatorId: tip.creatorId,
          stockId: tip.stockId,
          stockSymbol: tip.stock.symbol,
          stockName: tip.stock.name,
          direction: tip.direction,
          assetClass: tip.assetClass,
          entryPrice: tip.entryPrice,
          target1: tip.target1,
          target2: tip.target2,
          target3: tip.target3,
          stopLoss: tip.stopLoss,
          timeframe: tip.timeframe,
          conviction: tip.conviction,
          status: tip.status,
          tipTimestamp: tip.tipTimestamp.toISOString(),
          expiresAt: tip.expiresAt.toISOString(),
          returnPct: tip.returnPct,
          sourceUrl: tip.sourceUrl,
        })),
        scoreHistory: scoreHistory.map((snap) => ({
          id: snap.id,
          creatorId: snap.creatorId,
          date: snap.date.toISOString(),
          rmtScore: snap.rmtScore,
          accuracyRate: snap.accuracyRate,
          totalScoredTips: snap.totalScoredTips,
        })),
      };
    });

    if (!creatorDetail) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CREATOR_NOT_FOUND",
            message: `Creator not found: ${id}`,
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: creatorDetail });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}
