import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ──── Types ────

interface RouteContext {
  params: Promise<{ tipId: string }>;
}

interface SimilarTipSummary {
  total: number;
  hits: number;
  accuracy: number;
  avgReturn: number;
}

// ──── Helpers ────

function isTargetHit(status: string): boolean {
  return (
    status === "TARGET_1_HIT" ||
    status === "TARGET_2_HIT" ||
    status === "TARGET_3_HIT" ||
    status === "ALL_TARGETS_HIT"
  );
}

function isCompleted(status: string): boolean {
  return (
    isTargetHit(status) ||
    status === "STOPLOSS_HIT" ||
    status === "EXPIRED"
  );
}

// ──── Route Handler ────

export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { tipId } = await context.params;

    // Fetch the current tip to get creatorId and stockId
    const currentTip = await db.tip.findUnique({
      where: { id: tipId },
      select: {
        id: true,
        creatorId: true,
        stockId: true,
        direction: true,
        timeframe: true,
      },
    });

    if (!currentTip) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "TIP_NOT_FOUND",
            message: `Tip not found: ${tipId}`,
          },
        },
        { status: 404 }
      );
    }

    // Query similar tips: same creator + same stock, excluding current tip
    const similarTips = await db.tip.findMany({
      where: {
        creatorId: currentTip.creatorId,
        stockId: currentTip.stockId,
        id: { not: currentTip.id },
        reviewStatus: { in: ["AUTO_APPROVED", "MANUALLY_APPROVED"] },
      },
      orderBy: { tipTimestamp: "desc" },
      take: 10,
      select: {
        id: true,
        direction: true,
        entryPrice: true,
        target1: true,
        stopLoss: true,
        status: true,
        returnPct: true,
        tipTimestamp: true,
      },
    });

    // Calculate summary from completed tips
    const completedTips = similarTips.filter((tip) => isCompleted(tip.status));
    const hits = completedTips.filter((tip) => isTargetHit(tip.status));

    const totalCompleted = completedTips.length;
    const hitCount = hits.length;
    const accuracy = totalCompleted > 0 ? (hitCount / totalCompleted) * 100 : 0;

    const tipsWithReturn = completedTips.filter(
      (tip) => tip.returnPct !== null
    );
    const avgReturn =
      tipsWithReturn.length > 0
        ? tipsWithReturn.reduce((sum, tip) => sum + (tip.returnPct ?? 0), 0) /
          tipsWithReturn.length
        : 0;

    const summary: SimilarTipSummary = {
      total: similarTips.length,
      hits: hitCount,
      accuracy,
      avgReturn,
    };

    const data = similarTips.map((tip) => ({
      id: tip.id,
      direction: tip.direction,
      entryPrice: tip.entryPrice,
      target1: tip.target1,
      stopLoss: tip.stopLoss,
      status: tip.status,
      returnPct: tip.returnPct,
      tipTimestamp: tip.tipTimestamp.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        tips: data,
        summary,
      },
    });
  } catch {
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
