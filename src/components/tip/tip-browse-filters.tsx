"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

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

const activePillClass =
  "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium bg-white text-primary shadow-sm ring-1 ring-gray-200/50";
const inactivePillClass =
  "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium text-muted hover:text-text";

interface PillGroupProps {
  readonly label: string;
  readonly paramKey: string;
  readonly options: ReadonlyArray<{ readonly value: string; readonly label: string }>;
  readonly currentValue: string;
  readonly onSelect: (key: string, value: string) => void;
}

function PillGroup({ label, paramKey, options, currentValue, onSelect }: PillGroupProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted">{label}</span>
      <div className="inline-flex rounded-xl bg-gray-50 p-0.5 gap-0.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(paramKey, opt.value)}
            className={currentValue === opt.value ? activePillClass : inactivePillClass}
          >
            {opt.label}
          </button>
        ))}
      </div>
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
    <div className="flex flex-wrap items-start gap-4">
      <PillGroup
        label="Status"
        paramKey="status"
        options={STATUS_OPTIONS}
        currentValue={currentStatus}
        onSelect={updateParam}
      />

      <PillGroup
        label="Timeframe"
        paramKey="timeframe"
        options={TIMEFRAME_OPTIONS}
        currentValue={currentTimeframe}
        onSelect={updateParam}
      />

      <PillGroup
        label="Direction"
        paramKey="direction"
        options={DIRECTION_OPTIONS}
        currentValue={currentDirection}
        onSelect={updateParam}
      />

      <PillGroup
        label="Date Range"
        paramKey="dateRange"
        options={DATE_RANGE_OPTIONS}
        currentValue={currentDateRange}
        onSelect={updateParam}
      />
    </div>
  );
}
