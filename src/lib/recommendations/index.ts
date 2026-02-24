// src/lib/recommendations/index.ts
//
// Rule-based recommendation engine.
// Scores tips and creators based on user preferences and engagement signals.

import { db } from "@/lib/db";
import { RECOMMENDATION } from "@/lib/constants";
import type { RecommendedTip, RecommendedCreator } from "./types";
import { differenceInDays } from "date-fns";

/**
 * Compute personalized tip recommendations for a user.
 */
export async function computeTipRecommendations(userId: string): Promise<RecommendedTip[]> {
  const prefs = await db.userPreference.findUnique({ where: { userId } });

  // Fetch recent active/completed tips with creator scores
  const tips = await db.tip.findMany({
    where: {
      status: { in: ["ACTIVE", "TARGET_1_HIT", "TARGET_2_HIT"] },
      reviewStatus: { in: ["AUTO_APPROVED", "MANUALLY_APPROVED"] },
    },
    include: {
      creator: {
        include: { currentScore: { select: { rmtScore: true } } },
      },
      stock: { select: { sector: true } },
    },
    orderBy: { tipTimestamp: "desc" },
    take: 200,
  });

  const now = new Date();
  const lambda = Math.LN2 / RECOMMENDATION.RECENCY_HALFLIFE_DAYS;
  const w = RECOMMENDATION.TIP_WEIGHTS;

  const scored: RecommendedTip[] = [];

  for (const tip of tips) {
    // 1. Creator score component
    const rmtScore = tip.creator.currentScore?.rmtScore ?? 0;
    const creatorComponent = rmtScore / 100;

    // 2. Preference match
    let prefMatch = 0.5; // neutral default
    if (prefs) {
      let matches = 0;
      let checks = 0;

      if (prefs.preferredTimeframes.length > 0) {
        checks++;
        if (prefs.preferredTimeframes.includes(tip.timeframe)) matches++;
      }
      if (prefs.preferredAssetClasses.length > 0) {
        checks++;
        if (prefs.preferredAssetClasses.includes(tip.assetClass)) matches++;
      }
      if (prefs.preferredSectors.length > 0 && tip.stock.sector) {
        checks++;
        if (prefs.preferredSectors.includes(tip.stock.sector)) matches++;
      }
      if (prefs.minCreatorScore !== null && prefs.minCreatorScore !== undefined) {
        checks++;
        if (rmtScore >= prefs.minCreatorScore) matches++;
      }

      prefMatch = checks > 0 ? matches / checks : 0.5;
    }

    // 3. Recency score (exponential decay)
    const daysAgo = differenceInDays(now, tip.tipTimestamp);
    const recencyScore = Math.exp(-lambda * daysAgo);

    // 4. Engagement score (normalized)
    const maxRating = 5;
    const ratingNorm = (tip.avgRating ?? 0) / maxRating;
    const commentNorm = Math.min((tip.commentCount ?? 0) / 50, 1);
    const saveNorm = Math.min((tip.saveCount ?? 0) / 100, 1);
    const engagementScore = (ratingNorm + commentNorm + saveNorm) / 3;

    // Composite
    const score =
      w.CREATOR_SCORE * creatorComponent +
      w.PREFERENCE_MATCH * prefMatch +
      w.RECENCY * recencyScore +
      w.ENGAGEMENT * engagementScore;

    // Generate reason
    const reasons: string[] = [];
    if (creatorComponent > 0.7) reasons.push("Top-rated creator");
    if (prefMatch > 0.6) reasons.push("Matches your preferences");
    if (recencyScore > 0.7) reasons.push("Recent tip");
    if (engagementScore > 0.5) reasons.push("Highly engaged");
    const reason = reasons.length > 0 ? reasons.join(", ") : "Good match";

    scored.push({ tipId: tip.id, score, reason });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, RECOMMENDATION.MAX_TIPS);
}

/**
 * Compute personalized creator recommendations for a user.
 */
export async function computeCreatorRecommendations(userId: string): Promise<RecommendedCreator[]> {
  const prefs = await db.userPreference.findUnique({ where: { userId } });

  // Get already-followed creators to exclude
  const followed = await db.follow.findMany({
    where: { userId },
    select: { creatorId: true },
  });
  const followedIds = new Set(followed.map((f) => f.creatorId));

  const creators = await db.creator.findMany({
    where: {
      isActive: true,
      totalTips: { gte: 20 },
    },
    include: {
      currentScore: { select: { rmtScore: true } },
    },
    orderBy: { totalTips: "desc" },
    take: 100,
  });

  const now = new Date();
  const w = RECOMMENDATION.CREATOR_WEIGHTS;
  const scored: RecommendedCreator[] = [];

  for (const creator of creators) {
    if (followedIds.has(creator.id)) continue;

    // 1. RMT Score
    const rmtScore = creator.currentScore?.rmtScore ?? 0;
    const rmtComponent = rmtScore / 100;

    // 2. Specialization match
    let specMatch = 0.5;
    if (prefs && prefs.preferredTimeframes.length > 0) {
      const overlap = creator.specializations.filter((s) =>
        prefs.preferredTimeframes.includes(s)
      ).length;
      specMatch = prefs.preferredTimeframes.length > 0
        ? overlap / prefs.preferredTimeframes.length
        : 0.5;
    }

    // 3. Activity recency
    const daysSinceLastTip = creator.lastTipAt
      ? differenceInDays(now, creator.lastTipAt)
      : 365;
    const activityRecency = Math.exp(-Math.LN2 / 30 * daysSinceLastTip);

    // 4. Community review score
    const communityScore = creator.avgCommunityRating
      ? creator.avgCommunityRating / 5
      : 0.5;

    const score =
      w.RMT_SCORE * rmtComponent +
      w.SPECIALIZATION_MATCH * specMatch +
      w.ACTIVITY_RECENCY * activityRecency +
      w.COMMUNITY_REVIEW * communityScore;

    const reasons: string[] = [];
    if (rmtComponent > 0.7) reasons.push("High RMT Score");
    if (specMatch > 0.6) reasons.push("Matches your style");
    if (activityRecency > 0.7) reasons.push("Recently active");
    if (communityScore > 0.7) reasons.push("Well-reviewed");

    scored.push({
      creatorId: creator.id,
      score,
      reason: reasons.length > 0 ? reasons.join(", ") : "Good match",
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, RECOMMENDATION.MAX_CREATORS);
}
