import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { PAGINATION } from "@/lib/constants";
import { mapTipRow } from "@/lib/utils/map-tip";
import { TipCardWithCreator } from "@/components/tip/tip-card-with-creator";
import { TipBrowseFilters } from "@/components/tip/tip-browse-filters";
import { ShareButton } from "@/components/shared/share-button";
import type { TipStatus } from "@/types";

export const revalidate = 300; // 5 minutes

export const metadata: Metadata = {
  title: "Browse Tips — Latest Stock Tips from Top Creators | RateMyTip",
  description:
    "Browse the latest stock and crypto tips from verified creators. Filter by status, timeframe, and direction. Every tip tracked with real market data.",
  openGraph: {
    title: "Browse Stock Tips | RateMyTip",
    description:
      "Latest stock tips from top-ranked creators. See who's calling what — with verified track records.",
  },
};

interface TipsPageProps {
  searchParams: Promise<{
    status?: string;
    timeframe?: string;
    direction?: string;
    dateRange?: string;
    page?: string;
  }>;
}

const STATUS_MAP: Record<string, TipStatus[]> = {
  active: ["ACTIVE"],
  target_hit: ["TARGET_1_HIT", "TARGET_2_HIT", "TARGET_3_HIT", "ALL_TARGETS_HIT"],
  stoploss_hit: ["STOPLOSS_HIT"],
  expired: ["EXPIRED"],
};

function getDateCutoff(dateRange: string): Date | null {
  const now = new Date();
  switch (dateRange) {
    case "today": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    case "week": {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      return start;
    }
    case "month": {
      const start = new Date(now);
      start.setMonth(start.getMonth() - 1);
      return start;
    }
    default:
      return null;
  }
}

/** Shared Prisma include shape for tips with creator + stock */
const TIP_INCLUDE = {
  stock: { select: { symbol: true, name: true } },
  creator: {
    select: {
      id: true,
      slug: true,
      displayName: true,
      profileImageUrl: true,
      tier: true,
      isVerified: true,
      currentScore: { select: { rmtScore: true } },
    },
  },
} as const;

async function getTipsData(params: {
  status: string;
  timeframe: string;
  direction: string;
  dateRange: string;
  page: number;
  pageSize: number;
}): Promise<{ tips: ReturnType<typeof mapTipRow>[]; total: number }> {
  try {
    // Build where clause
    const where: Record<string, unknown> = {
      reviewStatus: { in: ["AUTO_APPROVED", "MANUALLY_APPROVED"] },
      status: { not: "REJECTED" as const },
    };

    if (params.status !== "all") {
      const statuses = STATUS_MAP[params.status];
      if (statuses) {
        where.status = { in: statuses };
      }
    }

    if (params.timeframe !== "all") {
      where.timeframe = params.timeframe;
    }

    if (params.direction !== "all") {
      where.direction = params.direction;
    }

    const dateCutoff = getDateCutoff(params.dateRange);
    if (dateCutoff) {
      where.tipTimestamp = { gte: dateCutoff };
    }

    const [rows, total] = await Promise.all([
      db.tip.findMany({
        where,
        orderBy: { tipTimestamp: "desc" },
        include: TIP_INCLUDE,
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      db.tip.count({ where }),
    ]);

    return { tips: rows.map(mapTipRow), total };
  } catch {
    return { tips: [], total: 0 };
  }
}

export default async function TipsPage({
  searchParams,
}: TipsPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const status = params.status ?? "all";
  const timeframe = params.timeframe ?? "all";
  const direction = params.direction ?? "all";
  const dateRange = params.dateRange ?? "all";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const pageSize = PAGINATION.DEFAULT_PAGE_SIZE;

  const { tips, total } = await getTipsData({
    status,
    timeframe,
    direction,
    dateRange,
    page,
    pageSize,
  });

  const totalPages = Math.ceil(total / pageSize);

  // Build query string for pagination links (preserve current filters)
  function paginationHref(targetPage: number): string {
    const qs = new URLSearchParams();
    if (status !== "all") qs.set("status", status);
    if (timeframe !== "all") qs.set("timeframe", timeframe);
    if (direction !== "all") qs.set("direction", direction);
    if (dateRange !== "all") qs.set("dateRange", dateRange);
    qs.set("page", String(targetPage));
    return `?${qs.toString()}`;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Browse Tips</h1>
          <p className="mt-2 text-sm text-muted">
            {total.toLocaleString("en-IN")} tips from verified creators
          </p>
        </div>
        <ShareButton title="Browse Stock Tips | RateMyTip" />
      </div>

      <div className="mt-6">
        <Suspense fallback={null}>
          <TipBrowseFilters />
        </Suspense>
      </div>

      {/* Tip cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tips.map((tip) => (
          <TipCardWithCreator key={tip.id} tip={tip} />
        ))}
      </div>

      {tips.length === 0 && (
        <div className="py-16 text-center text-sm text-muted">
          No tips match your filters. Try adjusting the criteria above.
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={paginationHref(page - 1)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-muted hover:bg-bg"
            >
              Previous
            </Link>
          )}
          <span className="text-sm text-muted">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={paginationHref(page + 1)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-muted hover:bg-bg"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
