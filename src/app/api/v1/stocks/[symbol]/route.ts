import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subDays } from "date-fns";
import { TARGET_HIT_STATUSES, COMPLETED_TIP_STATUSES, CACHE_TTL } from "@/lib/constants";
import { cached } from "@/lib/cache";
import { rateLimit } from "@/lib/rate-limit";

interface RouteContext {
  params: Promise<{ symbol: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const rateLimited = await rateLimit(request);
    if (rateLimited) return rateLimited;

    const { symbol } = await context.params;
    const cacheKey = `stock:${symbol.toUpperCase()}`;

    const data = await cached(cacheKey, CACHE_TTL.STOCK_PAGE, async () => {
    const stock = await db.stock.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!stock) return null;

    // Count tips for this stock (only approved)
    const approvedReviewStatuses = ["AUTO_APPROVED", "MANUALLY_APPROVED"] as const;
    const approvedFilter = {
      stockId: stock.id,
      reviewStatus: {
        in: [...approvedReviewStatuses],
      },
    };

    const [tipCount, activeTipCount, buyCount, sellCount] = await Promise.all([
      db.tip.count({ where: approvedFilter }),
      db.tip.count({
        where: { ...approvedFilter, status: "ACTIVE" },
      }),
      db.tip.count({
        where: { ...approvedFilter, direction: "BUY" },
      }),
      db.tip.count({
        where: { ...approvedFilter, direction: "SELL" },
      }),
    ]);

    // Calculate average accuracy for tips on this stock
    const completedTips = await db.tip.count({
      where: {
        ...approvedFilter,
        status: { in: [...COMPLETED_TIP_STATUSES] },
      },
    });

    const hitTips = await db.tip.count({
      where: {
        ...approvedFilter,
        status: { in: [...TARGET_HIT_STATUSES] },
      },
    });

    const avgAccuracy = completedTips > 0 ? hitTips / completedTips : 0;

    // Top 5 creators by accuracy on this stock
    // We get creators who have tips on this stock and join their score
    const creatorsWithTips = await db.tip.groupBy({
      by: ["creatorId"],
      where: {
        ...approvedFilter,
        status: { in: [...COMPLETED_TIP_STATUSES] },
      },
      _count: { id: true },
      having: {
        id: { _count: { gte: 3 } },
      },
    });

    const creatorIds = creatorsWithTips.map((c) => c.creatorId);

    const topCreators = await db.creator.findMany({
      where: {
        id: { in: creatorIds },
        isActive: true,
        currentScore: { isNot: null },
      },
      orderBy: { currentScore: { accuracyRate: "desc" } },
      take: 5,
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
    });

    // Recent tips for this stock
    const recentTips = await db.tip.findMany({
      where: approvedFilter,
      orderBy: { tipTimestamp: "desc" },
      take: 20,
      include: {
        stock: { select: { symbol: true, name: true } },
        creator: {
          select: {
            id: true,
            slug: true,
            displayName: true,
            profileImageUrl: true,
            tier: true,
          },
        },
      },
    });

    // Price history (last 90 days)
    const ninetyDaysAgo = subDays(new Date(), 90);
    const priceHistory = await db.stockPrice.findMany({
      where: {
        stockId: stock.id,
        date: { gte: ninetyDaysAgo },
      },
      orderBy: { date: "asc" },
    });

    return {
      id: stock.id,
      symbol: stock.symbol,
      exchange: stock.exchange,
      name: stock.name,
      sector: stock.sector,
      industry: stock.industry,
      marketCap: stock.marketCap,
      isIndex: stock.isIndex,
      isActive: stock.isActive,
      lastPrice: stock.lastPrice,
      lastPriceAt: stock.lastPriceAt?.toISOString() ?? null,
      createdAt: stock.createdAt.toISOString(),

      tipCount,
      activeTipCount,
      consensus: {
        bullish: buyCount,
        bearish: sellCount,
      },
      avgAccuracy,

      topCreators,
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
      priceHistory: priceHistory.map((p) => ({
        id: p.id,
        stockId: p.stockId,
        date: p.date.toISOString(),
        open: p.open,
        high: p.high,
        low: p.low,
        close: p.close,
        volume: p.volume !== null ? Number(p.volume) : null,
        source: p.source,
      })),
    };
    }); // end cached()

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "STOCK_NOT_FOUND",
            message: `Stock not found: ${symbol}`,
          },
        },
        { status: 404 }
      );
    }

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
