// GET /api/v1/portfolio — Get portfolio summary
import { NextResponse } from "next/server";
import { requireUser, isAuthError } from "@/lib/auth-helpers";
import { calculatePortfolioPnl } from "@/lib/portfolio";
import { db } from "@/lib/db";

export async function GET(): Promise<NextResponse> {
  const result = await requireUser();
  if (isAuthError(result)) return result;

  const summary = await calculatePortfolioPnl(result.userId);

  const portfolio = await db.portfolio.findFirst({
    where: { userId: result.userId },
    include: {
      entries: {
        include: {
          tip: {
            select: {
              id: true,
              direction: true,
              entryPrice: true,
              target1: true,
              stopLoss: true,
              status: true,
              timeframe: true,
              tipTimestamp: true,
              stock: { select: { symbol: true, name: true, lastPrice: true } },
              creator: { select: { slug: true, displayName: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return NextResponse.json({
    success: true,
    data: { summary, entries: portfolio?.entries ?? [] },
  });
}
