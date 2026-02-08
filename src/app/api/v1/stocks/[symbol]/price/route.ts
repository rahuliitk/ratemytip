import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { subDays } from "date-fns";

interface RouteContext {
  params: Promise<{ symbol: string }>;
}

const priceQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(90),
});

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { symbol } = await context.params;
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = priceQuerySchema.safeParse(searchParams);

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

    const { days } = parsed.data;

    const stock = await db.stock.findUnique({
      where: { symbol: symbol.toUpperCase() },
      select: { id: true },
    });

    if (!stock) {
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

    const startDate = subDays(new Date(), days);
    const prices = await db.stockPrice.findMany({
      where: {
        stockId: stock.id,
        date: { gte: startDate },
      },
      orderBy: { date: "asc" },
    });

    const data = prices.map((p) => ({
      id: p.id,
      stockId: p.stockId,
      date: p.date.toISOString(),
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
      volume: p.volume !== null ? Number(p.volume) : null,
      source: p.source,
    }));

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
