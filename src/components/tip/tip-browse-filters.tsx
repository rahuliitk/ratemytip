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

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "target_hit", label: "Target Hit" },
  { value: "stoploss_hit", label: "Stop Loss Hit" },
  { value: "expired", label: "Expired" },
] as const;

const TIMEFRAME_OPTIONS = [
  { value: "all", label: "All Timeframes" },
  { value: "INTRADAY", label: "Intraday" },
  { value: "SWING", label: "Swing" },
  { value: "POSITIONAL", label: "Positional" },
  { value: "LONG_TERM", label: "Long Term" },
] as const;

const DIRECTION_OPTIONS = [
  { value: "all", label: "All Directions" },
  { value: "BUY", label: "Buy" },
  { value: "SELL", label: "Sell" },
] as const;

const DATE_RANGE_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
] as const;

interface FilterSelectProps {
  readonly label: string;
  readonly paramKey: string;
  readonly options: ReadonlyArray<{ readonly value: string; readonly label: string }>;
  readonly currentValue: string;
  readonly onSelect: (key: string, value: string) => void;
}

function FilterSelect({ label, paramKey, options, currentValue, onSelect }: FilterSelectProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted">{label}</span>
      <Select value={currentValue} onValueChange={(v) => onSelect(paramKey, v)}>
        <SelectTrigger className="w-[160px]">
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

export function TipBrowseFilters(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get("status") ?? "all";
  const currentTimeframe = searchParams.get("timeframe") ?? "all";
  const currentDirection = searchParams.get("direction") ?? "all";
  const currentDateRange = searchParams.get("dateRange") ?? "all";

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      params.delete("page");
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="rounded-xl border border-border/60 bg-surface p-4 shadow-sm">
      <div className="flex flex-wrap items-start gap-5">
        <FilterSelect
          label="Status"
          paramKey="status"
          options={STATUS_OPTIONS}
          currentValue={currentStatus}
          onSelect={updateParam}
        />

        <FilterSelect
          label="Timeframe"
          paramKey="timeframe"
          options={TIMEFRAME_OPTIONS}
          currentValue={currentTimeframe}
          onSelect={updateParam}
        />

        <FilterSelect
          label="Direction"
          paramKey="direction"
          options={DIRECTION_OPTIONS}
          currentValue={currentDirection}
          onSelect={updateParam}
        />

        <FilterSelect
          label="Date Range"
          paramKey="dateRange"
          options={DATE_RANGE_OPTIONS}
          currentValue={currentDateRange}
          onSelect={updateParam}
        />
      </div>
    </div>
  );
}
