"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const TIME_RANGE_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "1y", label: "1 Year" },
  { value: "90d", label: "90 Days" },
  { value: "30d", label: "30 Days" },
] as const;

const SORT_OPTIONS = [
  { value: "rmt_score", label: "RMT Score" },
  { value: "accuracy", label: "Accuracy" },
  { value: "return", label: "Avg Return" },
  { value: "total_tips", label: "Total Tips" },
] as const;

const MIN_TIPS_OPTIONS = [
  { value: "5", label: "5+ tips" },
  { value: "20", label: "20+ tips" },
  { value: "50", label: "50+ tips" },
  { value: "100", label: "100+ tips" },
] as const;

export function LeaderboardFilters(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentTimeRange = searchParams.get("timeRange") ?? "all";
  const currentSortBy = searchParams.get("sortBy") ?? "rmt_score";
  const currentMinTips = searchParams.get("minTips") ?? "20";

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(key, value);
      params.delete("page");
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={currentTimeRange}
        onChange={(e) => updateParam("timeRange", e.target.value)}
        className="rounded-md border border-gray-300 bg-surface px-3 py-1.5 text-sm text-text focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      >
        {TIME_RANGE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <select
        value={currentSortBy}
        onChange={(e) => updateParam("sortBy", e.target.value)}
        className="rounded-md border border-gray-300 bg-surface px-3 py-1.5 text-sm text-text focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <select
        value={currentMinTips}
        onChange={(e) => updateParam("minTips", e.target.value)}
        className="rounded-md border border-gray-300 bg-surface px-3 py-1.5 text-sm text-text focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      >
        {MIN_TIPS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
