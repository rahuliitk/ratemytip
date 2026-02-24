"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/lib/utils";

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
  { value: "5", label: "5+" },
  { value: "20", label: "20+" },
  { value: "50", label: "50+" },
  { value: "100", label: "100+" },
] as const;

interface PillGroupProps {
  readonly label: string;
  readonly options: readonly { readonly value: string; readonly label: string }[];
  readonly currentValue: string;
  readonly onSelect: (value: string) => void;
}

function PillGroup({ label, options, currentValue, onSelect }: PillGroupProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted">{label}</span>
      <div className="inline-flex rounded-xl bg-gray-50 p-0.5 gap-0.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className={cn(
              "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200",
              currentValue === opt.value
                ? "bg-white text-primary shadow-sm ring-1 ring-gray-200/50"
                : "text-muted hover:text-text"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

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
    <div className="flex flex-wrap items-end gap-4">
      <PillGroup
        label="Time Range"
        options={TIME_RANGE_OPTIONS}
        currentValue={currentTimeRange}
        onSelect={(v) => updateParam("timeRange", v)}
      />
      <PillGroup
        label="Sort By"
        options={SORT_OPTIONS}
        currentValue={currentSortBy}
        onSelect={(v) => updateParam("sortBy", v)}
      />
      <PillGroup
        label="Min Tips"
        options={MIN_TIPS_OPTIONS}
        currentValue={currentMinTips}
        onSelect={(v) => updateParam("minTips", v)}
      />
    </div>
  );
}
