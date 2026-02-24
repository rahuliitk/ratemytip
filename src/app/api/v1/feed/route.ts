import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, isAuthError } from "@/lib/auth-helpers";
import { PAGINATION } from "@/lib/constants";

/**
 * GET /api/v1/feed
 * Get tips from creators the authenticated user follows.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const userResult = await requireUser();
  if (isAuthError(userResult)) return userResult;

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(
    PAGINATION.MAX_PAGE_SIZE,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? String(PAGINATION.DEFAULT_PAGE_SIZE), 10))
  );

  // Get creator IDs the user follows
  const follows = await db.follow.findMany({
    where: { userId: userResult.userId },
    select: { creatorId: true },
  });

  const creatorIds = follows.map((f) => f.creatorId);

  if (creatorIds.length === 0) {
    return NextResponse.json({
      success: true,
      data: [],
      meta: { page, pageSize, total: 0, hasMore: false },
    });
  }

  const where = {
    creatorId: { in: creatorIds },
    status: { not: "REJECTED" as const },
    reviewStatus: { in: ["AUTO_APPROVED" as const, "MANUALLY_APPROVED" as const] },
  };

  const [tips, total] = await Promise.all([
    db.tip.findMany({
      where,
      orderBy: [
        { feedScore: { sort: "desc", nulls: "last" } },
        { tipTimestamp: "desc" },
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        direction: true,
        entryPrice: true,
        target1: true,
        stopLoss: true,
        status: true,
        timeframe: true,
        tipTimestamp: true,
        returnPct: true,
        commentCount: true,
        avgRating: true,
        source: true,
        stock: { select: { symbol: true, name: true, lastPrice: true } },
        creator: {
          select: {
            id: true,
            slug: true,
            displayName: true,
            tier: true,
            profileImageUrl: true,
            currentScore: { select: { rmtScore: true } },
          },
        },
      },
    }),
    db.tip.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: tips.map((t) => ({
      id: t.id,
      direction: t.direction,
      stockSymbol: t.stock.symbol,
      stockName: t.stock.name,
      currentPrice: t.stock.lastPrice,
      entryPrice: t.entryPrice,
      target1: t.target1,
      stopLoss: t.stopLoss,
      status: t.status,
      timeframe: t.timeframe,
      tipTimestamp: t.tipTimestamp.toISOString(),
      returnPct: t.returnPct,
      commentCount: t.commentCount,
      avgRating: t.avgRating,
      source: t.source,
      creator: {
        id: t.creator.id,
        slug: t.creator.slug,
        displayName: t.creator.displayName,
        tier: t.creator.tier,
        profileImageUrl: t.creator.profileImageUrl,
        rmtScore: t.creator.currentScore?.rmtScore ?? null,
      },
    })),
    meta: { page, pageSize, total, hasMore: page * pageSize < total },
  });
}
