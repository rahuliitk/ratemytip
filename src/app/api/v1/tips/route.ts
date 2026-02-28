import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tipsQuerySchema } from "@/lib/validators/query";
import { buildPaginationMeta, getPrismaSkipTake } from "@/lib/utils/pagination";
import type { Prisma } from "@prisma/client";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = tipsQuerySchema.safeParse(searchParams);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const {
      creatorId,
      stockSymbol,
      status,
      direction,
      timeframe,
      dateFrom,
      dateTo,
      page,
      pageSize,
    } = parsed.data;
    const { skip, take } = getPrismaSkipTake({ page, pageSize });

    const where: Prisma.TipWhereInput = {
      // Only show approved tips in the public API
      reviewStatus: { in: ["AUTO_APPROVED", "MANUALLY_APPROVED"] },
    };

    if (creatorId) {
      where.creatorId = creatorId;
    }

    if (stockSymbol) {
      where.stock = { symbol: stockSymbol.toUpperCase() };
    }

    if (status) {
      where.status = status;
    }

    if (direction) {
      where.direction = direction;
    }

    if (timeframe) {
      where.timeframe = timeframe;
    }

    if (dateFrom || dateTo) {
      where.tipTimestamp = {};
      if (dateFrom) {
        where.tipTimestamp.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.tipTimestamp.lte = new Date(dateTo);
      }
    }

    const [total, tips] = await Promise.all([
      db.tip.count({ where }),
      db.tip.findMany({
        where,
        orderBy: { tipTimestamp: "desc" },
        skip,
        take,
        include: {
          stock: { select: { symbol: true, name: true } },
        },
      }),
    ]);

    const data = tips.map((tip) => ({
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
    }));

    return NextResponse.json({
      success: true,
      data,
      meta: buildPaginationMeta(page, pageSize, total),
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
