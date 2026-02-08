import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paginationSchema } from "@/lib/validators/query";
import { buildPaginationMeta, getPrismaSkipTake } from "@/lib/utils/pagination";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const stocksQuerySchema = paginationSchema.extend({
  search: z.string().max(200).optional(),
  exchange: z.enum(["NSE", "BSE", "MCX", "CRYPTO", "INDEX"]).optional(),
  sector: z.string().max(100).optional(),
  marketCap: z.enum(["LARGE", "MID", "SMALL", "MICRO"]).optional(),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = stocksQuerySchema.safeParse(searchParams);

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

    const { search, exchange, sector, marketCap, page, pageSize } = parsed.data;
    const { skip, take } = getPrismaSkipTake({ page, pageSize });

    const where: Prisma.StockWhereInput = { isActive: true };

    if (search) {
      where.OR = [
        { symbol: { contains: search.toUpperCase(), mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    if (exchange) {
      where.exchange = exchange;
    }

    if (sector) {
      where.sector = { contains: sector, mode: "insensitive" };
    }

    if (marketCap) {
      where.marketCap = marketCap;
    }

    const [total, stocks] = await Promise.all([
      db.stock.count({ where }),
      db.stock.findMany({
        where,
        orderBy: { symbol: "asc" },
        skip,
        take,
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
      }),
    ]);

    const data = stocks.map((stock) => ({
      ...stock,
      lastPriceAt: stock.lastPriceAt?.toISOString() ?? null,
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
