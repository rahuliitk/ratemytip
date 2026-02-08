import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PAGINATION, SCORING } from "@/lib/constants";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { LeaderboardFilters } from "@/components/leaderboard/leaderboard-filters";
import { CategoryTabs } from "@/components/leaderboard/category-tabs";
import type { LeaderboardEntry } from "@/types";

export const revalidate = 300;

const VALID_CATEGORIES: Record<string, { label: string; timeframe: string | null }> = {
  intraday: { label: "Intraday", timeframe: "INTRADAY" },
  swing: { label: "Swing", timeframe: "SWING" },
  positional: { label: "Positional", timeframe: "POSITIONAL" },
  long_term: { label: "Long Term", timeframe: "LONG_TERM" },
  options: { label: "Options", timeframe: "OPTIONS" },
};

interface CategoryLeaderboardPageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{
    sortBy?: string;
    minTips?: string;
    page?: string;
  }>;
}

export async function generateMetadata({
  params,
}: CategoryLeaderboardPageProps): Promise<Metadata> {
  const { category } = await params;
  const config = VALID_CATEGORIES[category];
  if (!config) return {};

  return {
    title: `${config.label} Leaderboard — Best ${config.label} Tip Creators`,
    description: `Top ${config.label.toLowerCase()} stock tip creators ranked by RMT Score. See who has the best accuracy for ${config.label.toLowerCase()} trading tips.`,
    openGraph: {
      title: `${config.label} Stock Tip Leaderboard | RateMyTip`,
      description: `Best ${config.label.toLowerCase()} tip creators ranked by verified performance.`,
    },
  };
}

async function getCategoryLeaderboard(params: {
  category: string;
  sortBy: string;
  minTips: number;
  page: number;
  pageSize: number;
}): Promise<{ entries: LeaderboardEntry[]; total: number }> {
  try {
    const categoryConfig = VALID_CATEGORIES[params.category];
    if (!categoryConfig) return { entries: [], total: 0 };

    const orderBy =
      params.sortBy === "accuracy"
        ? { currentScore: { accuracyRate: "desc" as const } }
        : params.sortBy === "total_tips"
          ? { totalTips: "desc" as const }
          : { currentScore: { rmtScore: "desc" as const } };

    const where = {
      isActive: true,
      totalTips: { gte: params.minTips },
      currentScore: { isNot: null },
      specializations: { has: categoryConfig.timeframe ?? undefined },
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

export default async function CategoryLeaderboardPage({
  params,
  searchParams,
}: CategoryLeaderboardPageProps): Promise<React.ReactElement> {
  const { category } = await params;
  const resolvedSearchParams = await searchParams;

  const config = VALID_CATEGORIES[category];
  if (!config) notFound();

  const sortBy = resolvedSearchParams.sortBy ?? "rmt_score";
  const minTips = parseInt(
    resolvedSearchParams.minTips ?? String(SCORING.MIN_TIPS_FOR_DISPLAY),
    10
  );
  const page = Math.max(1, parseInt(resolvedSearchParams.page ?? "1", 10));
  const pageSize = PAGINATION.LEADERBOARD_PAGE_SIZE;

  const { entries, total } = await getCategoryLeaderboard({
    category,
    sortBy,
    minTips,
    page,
    pageSize,
  });

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-primary">
        {config.label} Leaderboard
      </h1>
      <p className="mt-2 text-sm text-muted">
        Top {config.label.toLowerCase()} tip creators ranked by performance
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
