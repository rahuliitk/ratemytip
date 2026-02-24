import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCreator, isAuthError } from "@/lib/auth-helpers";

/**
 * GET /api/v1/creator-dashboard/analytics
 * Returns performance metrics for the authenticated creator.
 */
export async function GET(): Promise<NextResponse> {
  const creatorResult = await requireCreator();
  if (isAuthError(creatorResult)) return creatorResult;

  try {
    const [creator, scoreHistory, tipsByTimeframe, tipsByStatus] = await Promise.all([
      db.creator.findUnique({
        where: { id: creatorResult.creatorId },
        include: { currentScore: true },
      }),
      db.scoreSnapshot.findMany({
        where: { creatorId: creatorResult.creatorId },
        orderBy: { date: "desc" },
        take: 90,
      }),
      db.tip.groupBy({
        by: ["timeframe"],
        where: { creatorId: creatorResult.creatorId, status: { not: "REJECTED" } },
        _count: true,
      }),
      db.tip.groupBy({
        by: ["status"],
        where: { creatorId: creatorResult.creatorId },
        _count: true,
      }),
    ]);

    if (!creator) {
      return NextResponse.json(
        { success: false, error: { code: "CREATOR_NOT_FOUND", message: "Creator not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        score: creator.currentScore
          ? {
              rmtScore: creator.currentScore.rmtScore,
              accuracyScore: creator.currentScore.accuracyScore,
              riskAdjustedScore: creator.currentScore.riskAdjustedScore,
              consistencyScore: creator.currentScore.consistencyScore,
              volumeFactorScore: creator.currentScore.volumeFactorScore,
              accuracyRate: creator.currentScore.accuracyRate,
              avgReturnPct: creator.currentScore.avgReturnPct,
              winStreak: creator.currentScore.winStreak,
              lossStreak: creator.currentScore.lossStreak,
              intradayAccuracy: creator.currentScore.intradayAccuracy,
              swingAccuracy: creator.currentScore.swingAccuracy,
              positionalAccuracy: creator.currentScore.positionalAccuracy,
              longTermAccuracy: creator.currentScore.longTermAccuracy,
            }
          : null,
        scoreHistory: scoreHistory.map((s) => ({
          date: s.date.toISOString(),
          rmtScore: s.rmtScore,
          accuracyRate: s.accuracyRate,
          totalScoredTips: s.totalScoredTips,
        })),
        tipsByTimeframe: tipsByTimeframe.map((t) => ({
          timeframe: t.timeframe,
          count: t._count,
        })),
        tipsByStatus: tipsByStatus.map((t) => ({
          status: t.status,
          count: t._count,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch analytics" } },
      { status: 500 }
    );
  }
}
