import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { creatorTipsQuerySchema } from "@/lib/validators/query";
import { buildPaginationMeta, getPrismaSkipTake } from "@/lib/utils/pagination";
import type { Prisma } from "@prisma/client";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = creatorTipsQuerySchema.safeParse(searchParams);

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

    const { status, timeframe, assetClass, sortBy, page, pageSize } =
      parsed.data;
    const { skip, take } = getPrismaSkipTake({ page, pageSize });

    // Resolve creator by id or slug
    const isCuid = /^c[a-z0-9]{24,}$/i.test(id);
    const creator = await db.creator.findFirst({
      where: isCuid ? { id } : { slug: id },
      select: { id: true },
    });

    if (!creator) {
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

    const where: Prisma.TipWhereInput = {
      creatorId: creator.id,
      reviewStatus: { in: ["AUTO_APPROVED", "MANUALLY_APPROVED"] },
    };

    if (status) {
      where.status = status;
    }
    if (timeframe) {
      where.timeframe = timeframe;
    }
    if (assetClass) {
      where.assetClass = assetClass;
    }

    const orderBy: Prisma.TipOrderByWithRelationInput =
      sortBy === "return_pct"
        ? { returnPct: "desc" }
        : { tipTimestamp: "desc" };

    const [total, tips] = await Promise.all([
      db.tip.count({ where }),
      db.tip.findMany({
        where,
        orderBy,
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
