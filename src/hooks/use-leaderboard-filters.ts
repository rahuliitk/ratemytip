"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface LeaderboardFilters {
  readonly category: string;
  readonly timeRange: string;
  readonly minTips: number;
  readonly sortBy: string;
  readonly sortOrder: "asc" | "desc";
  readonly page: number;
}

const DEFAULTS: LeaderboardFilters = {
  category: "all",
  timeRange: "all",
  minTips: 20,
  sortBy: "rmt_score",
  sortOrder: "desc",
  page: 1,
};

interface UseLeaderboardFiltersReturn {
  readonly filters: LeaderboardFilters;
  readonly setCategory: (category: string) => void;
  readonly setTimeRange: (timeRange: string) => void;
  readonly setMinTips: (minTips: number) => void;
  readonly setSortBy: (sortBy: string) => void;
  readonly toggleSortOrder: () => void;
  readonly setPage: (page: number) => void;
  readonly resetFilters: () => void;
  readonly queryString: string;
}

export function useLeaderboardFilters(): UseLeaderboardFiltersReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<LeaderboardFilters>(() => ({
    category: searchParams.get("category") ?? DEFAULTS.category,
    timeRange: searchParams.get("timeRange") ?? DEFAULTS.timeRange,
    minTips: Number(searchParams.get("minTips")) || DEFAULTS.minTips,
    sortBy: searchParams.get("sortBy") ?? DEFAULTS.sortBy,
    sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") ?? DEFAULTS.sortOrder,
    page: Number(searchParams.get("page")) || DEFAULTS.page,
  }));

  const updateUrl = useCallback(
    (newFilters: LeaderboardFilters) => {
      const params = new URLSearchParams();
      if (newFilters.category !== DEFAULTS.category) params.set("category", newFilters.category);
      if (newFilters.timeRange !== DEFAULTS.timeRange) params.set("timeRange", newFilters.timeRange);
      if (newFilters.minTips !== DEFAULTS.minTips) params.set("minTips", String(newFilters.minTips));
      if (newFilters.sortBy !== DEFAULTS.sortBy) params.set("sortBy", newFilters.sortBy);
      if (newFilters.sortOrder !== DEFAULTS.sortOrder) params.set("sortOrder", newFilters.sortOrder);
      if (newFilters.page !== 1) params.set("page", String(newFilters.page));

      const qs = params.toString();
      router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, pathname]
  );

  const update = useCallback(
    (partial: Partial<LeaderboardFilters>) => {
      setFilters((prev) => {
        const next = { ...prev, ...partial, page: partial.page ?? 1 };
        updateUrl(next);
        return next;
      });
    },
    [updateUrl]
  );

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("category", filters.category);
    params.set("timeRange", filters.timeRange);
    params.set("minTips", String(filters.minTips));
    params.set("sortBy", filters.sortBy);
    params.set("sortOrder", filters.sortOrder);
    params.set("page", String(filters.page));
    return params.toString();
  }, [filters]);

  return {
    filters,
    setCategory: (category: string) => update({ category }),
    setTimeRange: (timeRange: string) => update({ timeRange }),
    setMinTips: (minTips: number) => update({ minTips }),
    setSortBy: (sortBy: string) => update({ sortBy }),
    toggleSortOrder: () =>
      update({ sortOrder: filters.sortOrder === "asc" ? "desc" : "asc" }),
    setPage: (page: number) => update({ page }),
    resetFilters: () => {
      setFilters(DEFAULTS);
      updateUrl(DEFAULTS);
    },
    queryString,
  };
}
