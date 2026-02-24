import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCreator, isAuthError } from "@/lib/auth-helpers";
import { createDirectTipSchema } from "@/lib/validators/direct-tip";
import { calculateTipContentHash } from "@/lib/utils/crypto";
import { TIMEFRAME_EXPIRY_DAYS } from "@/lib/constants";
import { addDays } from "date-fns";

/**
 * GET /api/v1/creator-dashboard/tips
 * List the authenticated creator's tips with optional filters.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const creatorResult = await requireCreator();
  if (isAuthError(creatorResult)) return creatorResult;

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10)));

  try {
    const where: Record<string, unknown> = {
      creatorId: creatorResult.creatorId,
    };
    if (status && status !== "all") {
      where.status = status;
    }

    const [tips, total] = await Promise.all([
      db.tip.findMany({
        where,
        include: { stock: { select: { symbol: true, name: true } } },
        orderBy: { tipTimestamp: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.tip.count({ where }),
    ]);

    const data = tips.map((tip) => ({
      id: tip.id,
      stockSymbol: tip.stock.symbol,
      stockName: tip.stock.name,
      direction: tip.direction,
      entryPrice: tip.entryPrice,
      target1: tip.target1,
      target2: tip.target2,
      target3: tip.target3,
      stopLoss: tip.stopLoss,
      status: tip.status,
      timeframe: tip.timeframe,
      conviction: tip.conviction,
      rationale: tip.rationale,
      tipTimestamp: tip.tipTimestamp.toISOString(),
      returnPct: tip.returnPct,
      source: tip.source,
    }));

    return NextResponse.json({
      success: true,
      data,
      meta: { page, pageSize, total, hasMore: page * pageSize < total },
    });
  } catch (error) {
    console.error("Error fetching creator tips:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch tips" } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/creator-dashboard/tips
 * Create a new tip (direct posting by creator).
 */
export async function POST(request: Request): Promise<NextResponse> {
  const creatorResult = await requireCreator();
  if (isAuthError(creatorResult)) return creatorResult;

  try {
    const body: unknown = await request.json();
    const parsed = createDirectTipSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid tip data",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { stockSymbol, direction, entryPrice, target1, target2, target3, stopLoss, timeframe, conviction, rationale, sourceUrl } = parsed.data;

    // Look up stock
    const stock = await db.stock.findUnique({
      where: { symbol: stockSymbol.toUpperCase() },
      select: { id: true, symbol: true, lastPrice: true },
    });

    if (!stock) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "STOCK_NOT_FOUND", message: `Stock "${stockSymbol}" not found` },
        },
        { status: 404 }
      );
    }

    const tipTimestamp = new Date();
    const expiryDays = TIMEFRAME_EXPIRY_DAYS[timeframe] ?? 14;
    const expiresAt = addDays(tipTimestamp, expiryDays);

    // Determine asset class based on stock properties
    const assetClass = "EQUITY" as const;

    const contentHash = calculateTipContentHash({
      creatorId: creatorResult.creatorId,
      stockSymbol: stock.symbol,
      direction,
      entryPrice,
      target1,
      target2: target2 ?? null,
      target3: target3 ?? null,
      stopLoss,
      timeframe,
      tipTimestamp,
    });

    // Check for duplicate
    const existing = await db.tip.findUnique({
      where: { contentHash },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "DUPLICATE_TIP", message: "A tip with identical details already exists" },
        },
        { status: 409 }
      );
    }

    const tip = await db.tip.create({
      data: {
        creatorId: creatorResult.creatorId,
        stockId: stock.id,
        direction,
        assetClass,
        entryPrice,
        target1,
        target2: target2 ?? null,
        target3: target3 ?? null,
        stopLoss,
        timeframe,
        conviction,
        rationale: rationale ?? null,
        sourceUrl: sourceUrl ?? null,
        contentHash,
        tipTimestamp,
        priceAtTip: stock.lastPrice,
        expiresAt,
        status: "PENDING_REVIEW",
        reviewStatus: "PENDING",
        source: "DIRECT",
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: tip.id,
          status: tip.status,
          createdAt: tip.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating tip:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to create tip" } },
      { status: 500 }
    );
  }
}
