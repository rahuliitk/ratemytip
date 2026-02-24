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

const selectClass =
  "rounded-md border border-gray-300 bg-surface px-3 py-1.5 text-sm text-text focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

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
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={currentStatus}
        onChange={(e) => updateParam("status", e.target.value)}
        className={selectClass}
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      <select
        value={currentTimeframe}
        onChange={(e) => updateParam("timeframe", e.target.value)}
        className={selectClass}
      >
        {TIMEFRAME_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      <select
        value={currentDirection}
        onChange={(e) => updateParam("direction", e.target.value)}
        className={selectClass}
      >
        {DIRECTION_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      <select
        value={currentDateRange}
        onChange={(e) => updateParam("dateRange", e.target.value)}
        className={selectClass}
      >
        {DATE_RANGE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
