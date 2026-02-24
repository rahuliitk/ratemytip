// GET /api/v1/portfolio/history — Portfolio value history for charting
import { NextResponse } from "next/server";
import { requireUser, isAuthError } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function GET(request: Request): Promise<NextResponse> {
  const result = await requireUser();
  if (isAuthError(result)) return result;

  const { searchParams } = new URL(request.url);
  const days = Math.min(parseInt(searchParams.get("days") ?? "90", 10), 365);

  const portfolio = await db.portfolio.findFirst({
    where: { userId: result.userId },
    select: { id: true },
  });

  if (!portfolio) {
    return NextResponse.json({ success: true, data: [] });
  }

  const since = new Date();
  since.setDate(since.getDate() - days);

  const snapshots = await db.portfolioSnapshot.findMany({
    where: { portfolioId: portfolio.id, date: { gte: since } },
    orderBy: { date: "asc" },
    select: { date: true, totalValue: true, totalPnl: true, openCount: true },
  });

  return NextResponse.json({ success: true, data: snapshots });
}
