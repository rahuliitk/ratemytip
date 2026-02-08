import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { searchQuerySchema } from "@/lib/validators/query";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = searchQuerySchema.safeParse(searchParams);

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

    const { q, type, limit } = parsed.data;
    const searchTerm = q.trim();

    const includeCreators = type === "all" || type === "creator";
    const includeStocks = type === "all" || type === "stock";
    const includeTips = type === "all" || type === "tip";

    // Search creators by display name
    const creatorsPromise = includeCreators
      ? db.creator.findMany({
          where: {
            isActive: true,
            displayName: { contains: searchTerm, mode: "insensitive" },
          },
          orderBy: { totalTips: "desc" },
          take: limit,
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
        })
      : Promise.resolve([]);

    // Search stocks by symbol or name
    const stocksPromise = includeStocks
      ? db.stock.findMany({
          where: {
            isActive: true,
            OR: [
              {
                symbol: {
                  contains: searchTerm.toUpperCase(),
                  mode: "insensitive",
                },
              },
              { name: { contains: searchTerm, mode: "insensitive" } },
            ],
          },
          orderBy: { symbol: "asc" },
          take: limit,
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
        })
      : Promise.resolve([]);

    // Search tips by matching stock symbol (search tips for a stock)
    const tipsPromise = includeTips
      ? db.tip.findMany({
          where: {
            reviewStatus: { in: ["AUTO_APPROVED", "MANUALLY_APPROVED"] },
            stock: {
              OR: [
                {
                  symbol: {
                    contains: searchTerm.toUpperCase(),
                    mode: "insensitive",
                  },
                },
                { name: { contains: searchTerm, mode: "insensitive" } },
              ],
            },
          },
          orderBy: { tipTimestamp: "desc" },
          take: limit,
          include: {
            stock: { select: { symbol: true, name: true } },
          },
        })
      : Promise.resolve([]);

    const [creators, stocks, tips] = await Promise.all([
      creatorsPromise,
      stocksPromise,
      tipsPromise,
    ]);

    const data = {
      creators,
      stocks: stocks.map((stock) => ({
        ...stock,
        lastPriceAt: stock.lastPriceAt?.toISOString() ?? null,
      })),
      tips: tips.map((tip) => ({
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
