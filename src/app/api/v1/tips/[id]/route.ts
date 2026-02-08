import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { id } = await context.params;

    const tip = await db.tip.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            slug: true,
            displayName: true,
            profileImageUrl: true,
            tier: true,
            isVerified: true,
            totalTips: true,
            specializations: true,
          },
        },
        stock: {
          select: {
            id: true,
            symbol: true,
            exchange: true,
            name: true,
            sector: true,
            marketCap: true,
            isIndex: true,
            lastPrice: true,
            lastPriceAt: true,
          },
        },
        amendments: {
          orderBy: { amendedAt: "desc" },
        },
      },
    });

    if (!tip) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "TIP_NOT_FOUND",
            message: `Tip not found: ${id}`,
          },
        },
        { status: 404 }
      );
    }

    const data = {
      id: tip.id,
      creatorId: tip.creatorId,
      stockId: tip.stockId,
      rawPostId: tip.rawPostId,

      // Immutable tip data
      direction: tip.direction,
      assetClass: tip.assetClass,
      entryPrice: tip.entryPrice,
      target1: tip.target1,
      target2: tip.target2,
      target3: tip.target3,
      stopLoss: tip.stopLoss,
      timeframe: tip.timeframe,
      conviction: tip.conviction,
      rationale: tip.rationale,
      sourceUrl: tip.sourceUrl,

      // Integrity
      contentHash: tip.contentHash,
      tipTimestamp: tip.tipTimestamp.toISOString(),
      priceAtTip: tip.priceAtTip,

      // Mutable status
      status: tip.status,
      statusUpdatedAt: tip.statusUpdatedAt?.toISOString() ?? null,
      target1HitAt: tip.target1HitAt?.toISOString() ?? null,
      target2HitAt: tip.target2HitAt?.toISOString() ?? null,
      target3HitAt: tip.target3HitAt?.toISOString() ?? null,
      stopLossHitAt: tip.stopLossHitAt?.toISOString() ?? null,
      expiresAt: tip.expiresAt.toISOString(),
      closedPrice: tip.closedPrice,
      closedAt: tip.closedAt?.toISOString() ?? null,

      // Computed performance
      returnPct: tip.returnPct,
      riskRewardRatio: tip.riskRewardRatio,
      maxDrawdownPct: tip.maxDrawdownPct,

      // Review
      reviewStatus: tip.reviewStatus,
      reviewedAt: tip.reviewedAt?.toISOString() ?? null,
      reviewNote: tip.reviewNote,
      parseConfidence: tip.parseConfidence,

      // Timestamps
      createdAt: tip.createdAt.toISOString(),
      updatedAt: tip.updatedAt.toISOString(),

      // Relations
      creator: tip.creator,
      stock: {
        ...tip.stock,
        lastPriceAt: tip.stock.lastPriceAt?.toISOString() ?? null,
      },
      amendments: tip.amendments.map((a) => ({
        id: a.id,
        field: a.field,
        oldValue: a.oldValue,
        newValue: a.newValue,
        reason: a.reason,
        amendedAt: a.amendedAt.toISOString(),
      })),

      // Live context
      currentPrice: tip.stock.lastPrice,
    };

    return NextResponse.json({ success: true, data });
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
