import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CreatorHeader } from "@/components/creator/creator-header";
import { CreatorStats } from "@/components/creator/creator-stats";
import { CreatorTipFeed } from "@/components/creator/creator-tip-feed";
import type { CreatorDetail, TipSummary } from "@/types";

export const revalidate = 600; // 10 minutes

interface CreatorPageProps {
  params: Promise<{ slug: string }>;
}

async function getCreator(slug: string): Promise<CreatorDetail | null> {
  try {
    const creator = await db.creator.findUnique({
      where: { slug },
      include: {
        platforms: true,
        currentScore: true,
        scoreSnapshots: {
          orderBy: { date: "desc" },
          take: 90,
        },
        tips: {
          where: { status: { not: "REJECTED" } },
          include: { stock: true },
          orderBy: { tipTimestamp: "desc" },
          take: 50,
        },
      },
    });

    if (!creator || !creator.isActive) return null;

    const recentTips: TipSummary[] = creator.tips.map((tip) => ({
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
    }));

    return {
      id: creator.id,
      slug: creator.slug,
      displayName: creator.displayName,
      bio: creator.bio,
      profileImageUrl: creator.profileImageUrl,
      isVerified: creator.isVerified,
      isClaimed: creator.isClaimed,
      isActive: creator.isActive,
      tier: creator.tier,
      specializations: creator.specializations,
      followerCount: creator.followerCount,
      firstTipAt: creator.firstTipAt?.toISOString() ?? null,
      lastTipAt: creator.lastTipAt?.toISOString() ?? null,
      createdAt: creator.createdAt.toISOString(),
      platforms: creator.platforms.map((p) => ({
        id: p.id,
        platform: p.platform,
        platformHandle: p.platformHandle,
        platformUrl: p.platformUrl,
        followerCount: p.followerCount,
      })),
      score: creator.currentScore
        ? {
            id: creator.currentScore.id,
            creatorId: creator.currentScore.creatorId,
            accuracyScore: creator.currentScore.accuracyScore,
            riskAdjustedScore: creator.currentScore.riskAdjustedScore,
            consistencyScore: creator.currentScore.consistencyScore,
            volumeFactorScore: creator.currentScore.volumeFactorScore,
            rmtScore: creator.currentScore.rmtScore,
            confidenceInterval: creator.currentScore.confidenceInterval,
            accuracyRate: creator.currentScore.accuracyRate,
            avgReturnPct: creator.currentScore.avgReturnPct,
            avgRiskRewardRatio: creator.currentScore.avgRiskRewardRatio,
            winStreak: creator.currentScore.winStreak,
            lossStreak: creator.currentScore.lossStreak,
            bestTipReturnPct: creator.currentScore.bestTipReturnPct,
            worstTipReturnPct: creator.currentScore.worstTipReturnPct,
            intradayAccuracy: creator.currentScore.intradayAccuracy,
            swingAccuracy: creator.currentScore.swingAccuracy,
            positionalAccuracy: creator.currentScore.positionalAccuracy,
            longTermAccuracy: creator.currentScore.longTermAccuracy,
            totalScoredTips: creator.currentScore.totalScoredTips,
            scorePeriodStart: creator.currentScore.scorePeriodStart.toISOString(),
            scorePeriodEnd: creator.currentScore.scorePeriodEnd.toISOString(),
            calculatedAt: creator.currentScore.calculatedAt.toISOString(),
          }
        : null,
      stats: {
        totalTips: creator.totalTips,
        activeTips: creator.activeTips,
        completedTips: creator.completedTips,
        winStreak: creator.currentScore?.winStreak ?? 0,
        lossStreak: creator.currentScore?.lossStreak ?? 0,
      },
      recentTips,
      scoreHistory: creator.scoreSnapshots.map((s) => ({
        id: s.id,
        creatorId: s.creatorId,
        date: s.date.toISOString(),
        rmtScore: s.rmtScore,
        accuracyRate: s.accuracyRate,
        totalScoredTips: s.totalScoredTips,
      })),
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: CreatorPageProps): Promise<Metadata> {
  const { slug } = await params;
  const creator = await getCreator(slug);
  if (!creator) {
    return { title: "Creator Not Found" };
  }

  const scoreText = creator.score
    ? `RMT Score: ${creator.score.rmtScore.toFixed(1)}/100`
    : "Unrated";
  const accuracyText = creator.score
    ? `${(creator.score.accuracyRate * 100).toFixed(1)}% accuracy`
    : "";

  return {
    title: `${creator.displayName} Stock Tips Track Record | ${scoreText}`,
    description: `${creator.displayName} has ${accuracyText ? `a ${accuracyText} rate across` : ""} ${creator.stats.totalTips} stock tips. Track record verified by RateMyTip. View detailed performance analytics.`,
    openGraph: {
      title: `${creator.displayName} — ${scoreText}`,
      description: `Verified track record: ${accuracyText}, ${creator.stats.totalTips} tips tracked`,
      images: [`/api/og/creator/${creator.slug}`],
    },
  };
}

export default async function CreatorPage({
  params,
}: CreatorPageProps): Promise<React.ReactElement> {
  const { slug } = await params;
  const creator = await getCreator(slug);

  if (!creator) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <CreatorHeader creator={creator} />

      <div className="mt-8">
        <CreatorStats stats={creator.stats} score={creator.score} />
      </div>

      {/* Score History Chart Placeholder */}
      {creator.scoreHistory.length > 0 && (
        <div className="mt-8 rounded-lg border border-gray-200 bg-surface p-6">
          <h2 className="text-lg font-bold text-primary">Score History</h2>
          <p className="mt-2 text-sm text-muted">
            RMT Score trend over the last {creator.scoreHistory.length} days.
            Chart visualization powered by Recharts.
          </p>
          <div className="mt-4 flex h-48 items-center justify-center rounded bg-bg text-sm text-muted">
            Score history chart will render here (Recharts)
          </div>
        </div>
      )}

      <div className="mt-8">
        <CreatorTipFeed
          initialTips={creator.recentTips}
          creatorSlug={creator.slug}
        />
      </div>

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: creator.displayName,
            url: `https://ratemytip.com/creator/${creator.slug}`,
            image: creator.profileImageUrl,
            description: creator.score
              ? `Financial analyst with ${(creator.score.accuracyRate * 100).toFixed(1)}% accuracy`
              : `Financial analyst tracked by RateMyTip`,
            sameAs: creator.platforms.map((p) => p.platformUrl),
          }),
        }}
      />
    </div>
  );
}
