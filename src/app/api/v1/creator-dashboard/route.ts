import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCreator, isAuthError } from "@/lib/auth-helpers";

/**
 * GET /api/v1/creator-dashboard
 * Returns dashboard stats for the authenticated creator.
 */
export async function GET(): Promise<NextResponse> {
  const creatorResult = await requireCreator();
  if (isAuthError(creatorResult)) return creatorResult;

  try {
    const [creator, pendingCount, scoreHistory] = await Promise.all([
      db.creator.findUnique({
        where: { id: creatorResult.creatorId },
        include: { currentScore: true },
      }),
      db.tip.count({
        where: {
          creatorId: creatorResult.creatorId,
          status: "PENDING_REVIEW",
        },
      }),
      db.scoreSnapshot.findMany({
        where: { creatorId: creatorResult.creatorId },
        orderBy: { date: "desc" },
        take: 90,
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
        totalTips: creator.totalTips,
        activeTips: creator.activeTips,
        completedTips: creator.completedTips,
        pendingTips: pendingCount,
        accuracyRate: creator.currentScore?.accuracyRate ?? null,
        rmtScore: creator.currentScore?.rmtScore ?? null,
        tier: creator.tier,
        scoreHistory: scoreHistory.map((s) => ({
          date: s.date.toISOString(),
          rmtScore: s.rmtScore,
          accuracyRate: s.accuracyRate,
          totalScoredTips: s.totalScoredTips,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching creator dashboard:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch dashboard data" } },
      { status: 500 }
    );
  }
}
