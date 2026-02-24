import type { Metadata } from "next";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { PAGINATION, SCORING } from "@/lib/constants";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { LeaderboardFilters } from "@/components/leaderboard/leaderboard-filters";
import { CategoryTabs } from "@/components/leaderboard/category-tabs";
import { ShareButton } from "@/components/shared/share-button";
import { ScoreRing } from "@/components/shared/score-ring";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/types";

export const revalidate = 300; // 5 minutes

export const metadata: Metadata = {
  title: "Leaderboard — Top Stock Tip Creators Ranked",
  description:
    "See the top-ranked stock and crypto tip creators worldwide. Ranked by RMT Score — a composite of accuracy, risk-adjusted returns, consistency, and volume. Updated daily.",
  openGraph: {
    title: "Stock Tip Leaderboard | RateMyTip",
    description:
      "Top stock tip creators ranked by verified performance. See who delivers real results.",
  },
};

interface LeaderboardPageProps {
  searchParams: Promise<{
    timeRange?: string;
    sortBy?: string;
    minTips?: string;
    page?: string;
  }>;
}

async function getLeaderboardData(params: {
  sortBy: string;
  minTips: number;
  page: number;
  pageSize: number;
}): Promise<{ entries: LeaderboardEntry[]; total: number }> {
  try {
    const orderBy =
      params.sortBy === "accuracy"
        ? { currentScore: { accuracyRate: "desc" as const } }
        : params.sortBy === "return"
          ? { currentScore: { avgReturnPct: "desc" as const } }
          : params.sortBy === "total_tips"
            ? { totalTips: "desc" as const }
            : { currentScore: { rmtScore: "desc" as const } };

    const where = {
      isActive: true,
      totalTips: { gte: params.minTips },
      currentScore: { isNot: null },
    };

    const [creators, total] = await Promise.all([
      db.creator.findMany({
        where,
        include: { currentScore: true },
        orderBy,
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      db.creator.count({ where }),
    ]);

    const entries: LeaderboardEntry[] = creators.map((creator, index) => ({
      rank: (params.page - 1) * params.pageSize + index + 1,
      creator: {
        id: creator.id,
        slug: creator.slug,
        displayName: creator.displayName,
        profileImageUrl: creator.profileImageUrl,
        tier: creator.tier,
        isVerified: creator.isVerified,
        totalTips: creator.totalTips,
        specializations: creator.specializations,
      },
      score: {
        rmtScore: creator.currentScore?.rmtScore ?? 0,
        accuracyRate: creator.currentScore?.accuracyRate ?? 0,
        avgReturnPct: creator.currentScore?.avgReturnPct ?? 0,
        confidenceInterval: creator.currentScore?.confidenceInterval ?? 0,
      },
      totalTips: creator.totalTips,
      tier: creator.tier,
    }));

    return { entries, total };
  } catch {
    return { entries: [], total: 0 };
  }
}

const PODIUM_STYLES = [
  { ring: "ring-2 ring-yellow-300/50", medal: "bg-gradient-to-br from-yellow-400 to-yellow-500", label: "1st" },
  { ring: "ring-2 ring-gray-300/50", medal: "bg-gradient-to-br from-gray-300 to-gray-400", label: "2nd" },
  { ring: "ring-2 ring-orange-300/50", medal: "bg-gradient-to-br from-orange-300 to-orange-400", label: "3rd" },
] as const;

export default async function LeaderboardPage({
  searchParams,
}: LeaderboardPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const sortBy = params.sortBy ?? "rmt_score";
  const minTips = parseInt(params.minTips ?? String(SCORING.MIN_TIPS_FOR_DISPLAY), 10);
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const pageSize = PAGINATION.LEADERBOARD_PAGE_SIZE;

  const { entries, total } = await getLeaderboardData({
    sortBy,
    minTips,
    page,
    pageSize,
  });

  const totalPages = Math.ceil(total / pageSize);
  const top3 = page === 1 ? entries.slice(0, 3) : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Leaderboard</h1>
          <p className="mt-2 text-sm text-muted">
            Top stock tip creators ranked by verified performance
          </p>
        </div>
        <ShareButton title="Top Stock Tip Creators Leaderboard | RateMyTip" />
      </div>

      <div className="mt-6">
        <CategoryTabs />
      </div>

      <div className="mt-4">
        <Suspense fallback={null}>
          <LeaderboardFilters />
        </Suspense>
      </div>

      {/* Top 3 Podium */}
      {top3.length >= 3 && (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[top3[1], top3[0], top3[2]].map((entry, i) => {
            if (!entry) return null;
            const podiumIndex = i === 0 ? 1 : i === 1 ? 0 : 2;
            const style = PODIUM_STYLES[podiumIndex];
            if (!style) return null;
            return (
              <a
                key={entry.creator.id}
                href={`/creator/${entry.creator.slug}`}
                className={cn(
                  "flex flex-col items-center rounded-2xl bg-white p-6 shadow-md transition-all duration-200 hover:shadow-lg",
                  style.ring,
                  i === 1 && "sm:-mt-4 sm:pb-8",
                )}
              >
                <span
                  className={cn(
                    "mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm",
                    style.medal,
                  )}
                >
                  {style.label}
                </span>
                {entry.creator.profileImageUrl ? (
                  <img
                    src={entry.creator.profileImageUrl}
                    alt={entry.creator.displayName}
                    className="h-14 w-14 rounded-full object-cover ring-2 ring-gray-100"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#1A365D]/10 to-[#2B6CB0]/10 text-lg font-bold text-accent ring-2 ring-gray-100">
                    {entry.creator.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <p className="mt-3 text-sm font-semibold text-text">{entry.creator.displayName}</p>
                <div className="mt-3">
                  <ScoreRing score={entry.score.rmtScore} size="sm" />
                </div>
                <p className="mt-2 text-xs text-muted">
                  {(entry.score.accuracyRate * 100).toFixed(1)}% accuracy
                </p>
              </a>
            );
          })}
        </div>
      )}

      <div className="mt-6">
        <LeaderboardTable entries={entries} />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {page > 1 && (
            <a
              href={`?page=${page - 1}&sortBy=${sortBy}&minTips=${minTips}`}
              className="rounded-full border border-gray-200 px-4 py-1.5 text-sm font-medium text-muted transition-all duration-200 hover:bg-gray-50 hover:text-text"
            >
              Previous
            </a>
          )}
          <span className="text-sm text-muted tabular-nums">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <a
              href={`?page=${page + 1}&sortBy=${sortBy}&minTips=${minTips}`}
              className="rounded-full border border-gray-200 px-4 py-1.5 text-sm font-medium text-muted transition-all duration-200 hover:bg-gray-50 hover:text-text"
            >
              Next
            </a>
          )}
        </div>
      )}
    </div>
  );
}
