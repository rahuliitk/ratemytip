"use client";

import { cn } from "@/lib/utils";
import useSWR from "swr";
import type { MarketContext } from "@/lib/market-context/market-mood";

// ──── Types ────

interface MarketContextResponse {
  readonly success: boolean;
  readonly data: MarketContext;
}

// ──── Fetcher ────

async function fetcher(url: string): Promise<MarketContextResponse> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch market context");
  }
  return res.json() as Promise<MarketContextResponse>;
}

// ──── VIX Badge Colors ────

const VIX_BADGE_STYLES = {
  LOW: "bg-emerald-100 text-emerald-700",
  MODERATE: "bg-amber-100 text-amber-700",
  HIGH: "bg-orange-100 text-orange-700",
  EXTREME: "bg-red-100 text-red-700",
} as const;

// ──── Mood Badge Styles ────

const MOOD_BADGE_STYLES = {
  BULLISH: "bg-emerald-100 text-emerald-700",
  NEUTRAL: "bg-slate-100 text-slate-700",
  BEARISH: "bg-red-100 text-red-700",
} as const;

const MOOD_LABELS = {
  BULLISH: "Bullish",
  NEUTRAL: "Neutral",
  BEARISH: "Bearish",
} as const;

// ──── Market Bar Component ────

export function MarketBar(): React.ReactElement {
  const { data, isLoading, error } = useSWR<MarketContextResponse>(
    "/api/v1/market-context",
    fetcher,
    {
      refreshInterval: 30_000, // Poll every 30 seconds
      revalidateOnFocus: false,
      dedupingInterval: 10_000,
    },
  );

  if (isLoading) {
    return (
      <div className="border-b border-border/40 bg-surface px-4 py-2">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-4">
          <div className="h-4 w-48 animate-pulse rounded bg-muted/20" />
          <div className="h-4 w-24 animate-pulse rounded bg-muted/20" />
          <div className="h-4 w-20 animate-pulse rounded bg-muted/20" />
        </div>
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="border-b border-border/40 bg-surface px-4 py-2">
        <div className="mx-auto flex max-w-7xl items-center justify-center">
          <span className="text-xs text-muted">
            Market data unavailable
          </span>
        </div>
      </div>
    );
  }

  const market = data.data;
  const isPositive = market.niftyChange >= 0;

  return (
    <div className="border-b border-border/40 bg-surface px-4 py-2">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-6">
        {/* NIFTY 50 Level + Change */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted">NIFTY 50</span>
          <span className="text-sm font-bold tabular-nums text-text">
            {market.niftyLevel.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span
            className={cn(
              "text-xs font-semibold tabular-nums",
              isPositive ? "text-emerald-600" : "text-red-600",
            )}
          >
            {isPositive ? "+" : ""}
            {market.niftyChange.toFixed(2)} ({isPositive ? "+" : ""}
            {market.niftyChangePct.toFixed(2)}%)
          </span>
        </div>

        {/* Divider (desktop only) */}
        <div className="hidden h-4 w-px bg-border/60 sm:block" />

        {/* VIX Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted">VIX</span>
          <span
            className={cn(
              "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums",
              VIX_BADGE_STYLES[market.vixCategory],
            )}
          >
            {market.vixLevel.toFixed(1)} ({market.vixCategory})
          </span>
        </div>

        {/* Divider (desktop only) */}
        <div className="hidden h-4 w-px bg-border/60 sm:block" />

        {/* Market Mood Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted">Mood</span>
          <span
            className={cn(
              "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
              MOOD_BADGE_STYLES[market.marketMood],
            )}
          >
            {MOOD_LABELS[market.marketMood]}
          </span>
        </div>

        {/* Market Status */}
        {!market.isMarketOpen && (
          <>
            <div className="hidden h-4 w-px bg-border/60 sm:block" />
            <span className="text-xs text-muted">Market Closed</span>
          </>
        )}
      </div>
    </div>
  );
}
