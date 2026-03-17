"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ──── Types ────

interface TipData {
  readonly entryPrice: number;
  readonly target1: number;
  readonly stopLoss: number;
  readonly tipTimestamp: string | Date;
  readonly direction: "BUY" | "SELL";
  readonly status: string;
  readonly priceAtTip: number | null;
}

interface EntryTimingCardProps {
  readonly tip: TipData;
}

// ──── Constants ────

const GOOD_TIMING_THRESHOLD = 0.5;
const CAUTION_BELOW_THRESHOLD = 1.0;
const PASSED_ABOVE_THRESHOLD = 1.5;

// ──── Status Types ────

type TimingStatus = "good" | "caution" | "passed";

interface TimingAnalysis {
  readonly movePct: number;
  readonly status: TimingStatus;
  readonly guidance: string;
  readonly originalRR: string;
  readonly currentRR: string;
}

// ──── Status Styles ────

const STATUS_STYLES: Record<
  TimingStatus,
  { bg: string; border: string; text: string; dot: string; label: string }
> = {
  good: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
    dot: "bg-green-500",
    label: "Good Timing",
  },
  caution: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    text: "text-yellow-700",
    dot: "bg-yellow-500",
    label: "Caution",
  },
  passed: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    dot: "bg-red-500",
    label: "May Have Passed",
  },
};

// ──── Helpers ────

function formatTimeAgo(timestamp: string | Date): string {
  const tipDate = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffMs = now.getTime() - tipDate.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  }
  if (diffHours > 0) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  }

  return "just now";
}

function calculateRiskRewardRatio(
  entryPrice: number,
  target: number,
  stopLoss: number,
  direction: "BUY" | "SELL"
): string {
  const reward =
    direction === "BUY"
      ? target - entryPrice
      : entryPrice - target;
  const risk =
    direction === "BUY"
      ? entryPrice - stopLoss
      : stopLoss - entryPrice;

  if (risk <= 0) return "N/A";

  const ratio = reward / risk;
  return ratio.toFixed(2);
}

function analyzeEntryTiming(tip: TipData): TimingAnalysis | null {
  if (tip.priceAtTip === null || tip.priceAtTip === 0) {
    return null;
  }

  const currentPrice = tip.priceAtTip;
  const entryPrice = tip.entryPrice;

  // Calculate the percentage move from entry price to current price
  const movePct = ((currentPrice - entryPrice) / entryPrice) * 100;

  // Direction-aware move percentage
  const directedMovePct =
    tip.direction === "BUY" ? movePct : -movePct;

  // Calculate original risk-reward (at entry price)
  const originalRR = calculateRiskRewardRatio(
    entryPrice,
    tip.target1,
    tip.stopLoss,
    tip.direction
  );

  // Calculate current risk-reward (at current price)
  const currentRR = calculateRiskRewardRatio(
    currentPrice,
    tip.target1,
    tip.stopLoss,
    tip.direction
  );

  // Determine timing status and guidance
  let status: TimingStatus;
  let guidance: string;

  if (directedMovePct > PASSED_ABOVE_THRESHOLD) {
    status = "passed";
    guidance =
      "Entry opportunity may have passed. The stock has moved significantly from the suggested entry.";
  } else if (directedMovePct < -CAUTION_BELOW_THRESHOLD) {
    status = "caution";
    guidance =
      "The stock is below the suggested entry. This could be a better entry or a sign of weakness.";
  } else if (Math.abs(directedMovePct) <= GOOD_TIMING_THRESHOLD) {
    status = "good";
    guidance = "The stock is near the suggested entry price. Good timing.";
  } else if (directedMovePct > GOOD_TIMING_THRESHOLD) {
    status = "caution";
    guidance =
      "The stock has moved moderately above entry. Consider whether the risk-reward still makes sense.";
  } else {
    status = "caution";
    guidance =
      "The stock is slightly below the suggested entry. Review the setup before acting.";
  }

  return {
    movePct,
    status,
    guidance,
    originalRR,
    currentRR,
  };
}

// ──── Component ────

export function EntryTimingCard({
  tip,
}: EntryTimingCardProps): React.ReactElement | null {
  // Only show for ACTIVE tips
  if (tip.status !== "ACTIVE") {
    return null;
  }

  const analysis = analyzeEntryTiming(tip);

  if (!analysis) {
    return null;
  }

  const styles = STATUS_STYLES[analysis.status];
  const timeAgo = formatTimeAgo(tip.tipTimestamp);
  const absMoveStr = Math.abs(analysis.movePct).toFixed(2);
  const moveDirection = analysis.movePct >= 0 ? "up" : "down";

  return (
    <div className="rounded-xl border border-border/60 bg-surface shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-0">
        <div className="flex items-center gap-2">
          <svg
            className="h-5 w-5 text-accent"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
          <span className="text-sm font-semibold text-text">
            Entry Timing Insight
          </span>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium",
            styles.bg,
            styles.border,
            styles.text
          )}
        >
          <span
            className={cn("inline-block h-1.5 w-1.5 rounded-full", styles.dot)}
            aria-hidden="true"
          />
          {styles.label}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Time since posting */}
        <div className="rounded-lg bg-bg-alt/60 p-3">
          <p className="text-sm text-text">
            This tip was posted{" "}
            <span className="font-semibold">{timeAgo}</span>
          </p>
        </div>

        {/* Price movement */}
        <div className="rounded-lg bg-bg-alt/60 p-3">
          <p className="text-sm text-text">
            The stock has moved{" "}
            <span
              className={cn(
                "font-semibold tabular-nums",
                analysis.movePct >= 0 ? "text-green-600" : "text-red-600"
              )}
            >
              {absMoveStr}% {moveDirection}
            </span>{" "}
            from the suggested entry price
          </p>
        </div>

        {/* Risk-reward recalculation */}
        <div className="rounded-lg bg-bg-alt/60 p-3">
          <p className="text-sm text-text">
            At the current price, the risk-reward ratio has changed from{" "}
            <span className="font-semibold tabular-nums">
              1:{analysis.originalRR}
            </span>{" "}
            to{" "}
            <span className="font-semibold tabular-nums">
              1:{analysis.currentRR}
            </span>
          </p>
        </div>

        {/* Guidance */}
        <div
          className={cn(
            "flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs",
            styles.bg,
            styles.border,
            styles.text
          )}
        >
          <svg
            className="h-4 w-4 shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
            />
          </svg>
          <span>{analysis.guidance}</span>
        </div>
      </div>
    </div>
  );
}
