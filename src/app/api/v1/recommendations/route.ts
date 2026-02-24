// GET /api/v1/recommendations — Personalized tip recommendations (PRO+)
import { NextResponse } from "next/server";
import { requireSubscription, isAuthError } from "@/lib/auth-helpers";
import { computeTipRecommendations } from "@/lib/recommendations";
import { db } from "@/lib/db";

export async function GET(): Promise<NextResponse> {
  const result = await requireSubscription("PRO");
  if (isAuthError(result)) return result;

  const recs = await computeTipRecommendations(result.userId);

  // Hydrate tip data
  const tipIds = recs.map((r) => r.tipId);
  const tips = await db.tip.findMany({
    where: { id: { in: tipIds } },
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
      creator: {
        select: {
          slug: true,
          displayName: true,
          currentScore: { select: { rmtScore: true } },
        },
      },
    },
  });

  const tipMap = new Map(tips.map((t) => [t.id, t]));
  const data = recs.map((r) => ({
    ...r,
    tip: tipMap.get(r.tipId) ?? null,
  }));

  return NextResponse.json({ success: true, data });
}
