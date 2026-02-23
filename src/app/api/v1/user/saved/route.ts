import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.userId) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "20");
  const offset = Number(request.nextUrl.searchParams.get("offset") ?? "0");

  const saved = await db.savedTip.findMany({
    where: { userId: session.user.userId },
    orderBy: { createdAt: "desc" },
    skip: offset,
    take: Math.min(limit, 100),
    include: {
      tip: {
        include: {
          stock: { select: { symbol: true, name: true } },
          creator: { select: { displayName: true, slug: true } },
        },
      },
    },
  });

  return NextResponse.json({
    success: true,
    data: saved.map((s) => ({
      id: s.id,
      createdAt: s.createdAt.toISOString(),
      tip: {
        id: s.tip.id,
        direction: s.tip.direction,
        entryPrice: s.tip.entryPrice,
        target1: s.tip.target1,
        stopLoss: s.tip.stopLoss,
        status: s.tip.status,
        tipTimestamp: s.tip.tipTimestamp.toISOString(),
        returnPct: s.tip.returnPct,
        stock: s.tip.stock,
        creator: s.tip.creator,
      },
    })),
  });
}
