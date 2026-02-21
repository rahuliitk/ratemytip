import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { paginationSchema } from "@/lib/validators/query";
import { buildPaginationMeta, getPrismaSkipTake } from "@/lib/utils/pagination";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const reviewQueueQuerySchema = paginationSchema.extend({
  status: z
    .enum(["PENDING", "AUTO_APPROVED", "MANUALLY_APPROVED", "REJECTED", "NEEDS_EDIT"])
    .default("PENDING"),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Unauthorized" },
        },
        { status: 401 }
      );
    }

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = reviewQueueQuerySchema.safeParse(searchParams);

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

    const { status, page, pageSize } = parsed.data;
    const { skip, take } = getPrismaSkipTake({ page, pageSize });

    const where: Prisma.TipWhereInput = {
      reviewStatus: status,
    };

    const [total, tips] = await Promise.all([
      db.tip.count({ where }),
      db.tip.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
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
          rawPost: {
            select: {
              id: true,
              content: true,
              postedAt: true,
              platformPostId: true,
            },
          },
        },
      }),
    ]);

    const data = tips.map((tip) => ({
      id: tip.id,
      creatorId: tip.creatorId,
      stockId: tip.stockId,
      rawPostId: tip.rawPostId,

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

      contentHash: tip.contentHash,
      tipTimestamp: tip.tipTimestamp.toISOString(),
      priceAtTip: tip.priceAtTip,

      status: tip.status,
      reviewStatus: tip.reviewStatus,
      parseConfidence: tip.parseConfidence,
      expiresAt: tip.expiresAt.toISOString(),
      createdAt: tip.createdAt.toISOString(),

      creator: tip.creator,
      stock: {
        ...tip.stock,
        lastPriceAt: tip.stock.lastPriceAt?.toISOString() ?? null,
      },
      rawPost: tip.rawPost
        ? {
            id: tip.rawPost.id,
            content: tip.rawPost.content,
            postedAt: tip.rawPost.postedAt.toISOString(),
            platformPostId: tip.rawPost.platformPostId,
          }
        : null,
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
