import type { Metadata } from "next";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { PAGINATION, SCORING } from "@/lib/constants";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { LeaderboardFilters } from "@/components/leaderboard/leaderboard-filters";
import { CategoryTabs } from "@/components/leaderboard/category-tabs";
import type { LeaderboardEntry } from "@/types";

export const revalidate = 300; // 5 minutes

export const metadata: Metadata = {
  title: "Leaderboard — Top Stock Tip Creators Ranked",
  description:
    "See the top-ranked stock tip creators in India. Ranked by RMT Score — a composite of accuracy, risk-adjusted returns, consistency, and volume. Updated daily.",
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-primary">Leaderboard</h1>
      <p className="mt-2 text-sm text-muted">
        Top stock tip creators ranked by verified performance
      </p>

      <div className="mt-6">
        <CategoryTabs />
      </div>

      <div className="mt-4">
        <Suspense fallback={null}>
          <LeaderboardFilters />
        </Suspense>
      </div>

      <div className="mt-6">
        <LeaderboardTable entries={entries} />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {page > 1 && (
            <a
              href={`?page=${page - 1}&sortBy=${sortBy}&minTips=${minTips}`}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-muted hover:bg-bg"
            >
              Previous
            </a>
          )}
          <span className="text-sm text-muted">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <a
              href={`?page=${page + 1}&sortBy=${sortBy}&minTips=${minTips}`}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-muted hover:bg-bg"
            >
              Next
            </a>
          )}
        </div>
      )}
    </div>
  );
}
