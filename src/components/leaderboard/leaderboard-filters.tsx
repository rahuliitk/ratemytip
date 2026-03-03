"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface FilterSelectProps {
  readonly label: string;
  readonly options: readonly { readonly value: string; readonly label: string }[];
  readonly currentValue: string;
  readonly onSelect: (value: string) => void;
}

function FilterSelect({ label, options, currentValue, onSelect }: FilterSelectProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted">{label}</span>
      <Select value={currentValue} onValueChange={onSelect}>
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
      <FilterSelect
        label="Time Range"
        options={TIME_RANGE_OPTIONS}
        currentValue={currentTimeRange}
        onSelect={(v) => updateParam("timeRange", v)}
      />
      <FilterSelect
        label="Sort By"
        options={SORT_OPTIONS}
        currentValue={currentSortBy}
        onSelect={(v) => updateParam("sortBy", v)}
      />
      <FilterSelect
        label="Min Tips"
        options={MIN_TIPS_OPTIONS}
        currentValue={currentMinTips}
        onSelect={(v) => updateParam("minTips", v)}
      />
    </div>
  );
}
