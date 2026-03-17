import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generatePostMortem } from "@/lib/post-mortem/generator";

// ──── Resolved statuses ────

const RESOLVED_STATUSES = new Set([
  "TARGET_1_HIT",
  "TARGET_2_HIT",
  "TARGET_3_HIT",
  "ALL_TARGETS_HIT",
  "STOPLOSS_HIT",
  "EXPIRED",
]);

// ──── Route context ────

interface RouteContext {
  params: Promise<{ tipId: string }>;
}

// ──── GET handler ────

export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { tipId } = await context.params;

    const tip = await db.tip.findUnique({
      where: { id: tipId },
      include: {
        stock: {
          select: {
            symbol: true,
            name: true,
          },
        },
      },
    });

    if (!tip) {
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

    if (!RESOLVED_STATUSES.has(tip.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "TIP_NOT_RESOLVED",
            message: "Post-mortem analysis is only available for completed tips.",
          },
        },
        { status: 400 }
      );
    }

    const postMortem = generatePostMortem({
      status: tip.status,
      entryPrice: tip.entryPrice,
      target1: tip.target1,
      stopLoss: tip.stopLoss,
      closedPrice: tip.closedPrice,
      closedAt: tip.closedAt?.toISOString() ?? null,
      tipTimestamp: tip.tipTimestamp.toISOString(),
      direction: tip.direction,
      timeframe: tip.timeframe,
      conviction: tip.conviction,
      stockSymbol: tip.stock.symbol,
    });

    if (!postMortem) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "GENERATION_FAILED",
            message: "Could not generate post-mortem for this tip.",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        tipId: tip.id,
        stockSymbol: tip.stock.symbol,
        stockName: tip.stock.name,
        status: tip.status,
        ...postMortem,
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
