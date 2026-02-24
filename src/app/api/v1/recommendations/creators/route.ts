// GET /api/v1/recommendations/creators — Recommended creators (PRO+)
import { NextResponse } from "next/server";
import { requireSubscription, isAuthError } from "@/lib/auth-helpers";
import { computeCreatorRecommendations } from "@/lib/recommendations";
import { db } from "@/lib/db";

export async function GET(): Promise<NextResponse> {
  const result = await requireSubscription("PRO");
  if (isAuthError(result)) return result;

  const recs = await computeCreatorRecommendations(result.userId);

  // Hydrate creator data
  const creatorIds = recs.map((r) => r.creatorId);
  const creators = await db.creator.findMany({
    where: { id: { in: creatorIds } },
    select: {
      id: true,
      slug: true,
      displayName: true,
      profileImageUrl: true,
      tier: true,
      specializations: true,
      totalTips: true,
      currentScore: { select: { rmtScore: true, accuracyRate: true } },
    },
  });

  const creatorMap = new Map(creators.map((c) => [c.id, c]));
  const data = recs.map((r) => ({
    ...r,
    creator: creatorMap.get(r.creatorId) ?? null,
  }));

  return NextResponse.json({ success: true, data });
}
