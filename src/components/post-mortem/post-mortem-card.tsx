// src/components/post-mortem/post-mortem-card.tsx
// Server component that shows auto-generated analysis for resolved tips.

import { cn } from "@/lib/utils";
import {
  generatePostMortem,
  type PostMortemTip,
} from "@/lib/post-mortem/generator";

// ──── Types ────

interface PostMortemCardProps {
  readonly tip: PostMortemTip;
}

// ──── Resolved status set ────

const RESOLVED_STATUSES = new Set([
  "TARGET_1_HIT",
  "TARGET_2_HIT",
  "TARGET_3_HIT",
  "ALL_TARGETS_HIT",
  "STOPLOSS_HIT",
  "EXPIRED",
]);

// ──── Helpers ────

function getBorderColor(returnPct: number, status: string): string {
  if (status === "EXPIRED") return "border-gray-300";
  if (returnPct > 0) return "border-emerald-400";
  return "border-red-400";
}

function getReturnBg(returnPct: number, status: string): string {
  if (status === "EXPIRED") return "bg-gray-50";
  if (returnPct > 0) return "bg-emerald-50";
  return "bg-red-50";
}

function getReturnTextColor(returnPct: number, status: string): string {
  if (status === "EXPIRED") return "text-gray-600";
  if (returnPct > 0) return "text-emerald-700";
  return "text-red-700";
}

function getStatusIcon(returnPct: number, status: string): React.ReactElement {
  if (status === "EXPIRED") {
    return (
      <svg
        className="h-5 w-5 text-gray-400"
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
    );
  }
  if (returnPct > 0) {
    return (
      <svg
        className="h-5 w-5 text-emerald-500"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      </svg>
    );
  }
  return (
    <svg
      className="h-5 w-5 text-red-500"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}

// ──── Component ────

export function PostMortemCard({ tip }: PostMortemCardProps): React.ReactElement | null {
  // Only render for resolved tips
  if (!RESOLVED_STATUSES.has(tip.status)) {
    return null;
  }

  const postMortem = generatePostMortem(tip);
  if (!postMortem) {
    return null;
  }

  const borderColor = getBorderColor(postMortem.returnPct, tip.status);
  const returnBg = getReturnBg(postMortem.returnPct, tip.status);
  const returnTextColor = getReturnTextColor(postMortem.returnPct, tip.status);

  return (
    <div
      className={cn(
        "rounded-xl border-2 bg-surface p-6 shadow-sm",
        borderColor
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon(postMortem.returnPct, tip.status)}
          <h3 className="text-base font-semibold text-text">What Happened?</h3>
        </div>

        {/* Return badge */}
        <div
          className={cn(
            "rounded-lg px-3 py-1.5",
            returnBg
          )}
        >
          <span
            className={cn(
              "text-lg font-bold tabular-nums",
              returnTextColor
            )}
          >
            {postMortem.returnPct >= 0 ? "+" : ""}
            {postMortem.returnPct.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Summary */}
      <p className="mt-4 text-sm leading-relaxed text-text">
        {postMortem.summary}
      </p>

      {/* Details */}
      <div className="mt-4 rounded-lg bg-bg-alt/50 p-3">
        <p className="text-xs font-medium text-muted uppercase tracking-wide">
          Details
        </p>
        <p className="mt-1 text-sm tabular-nums text-text">
          {postMortem.details}
        </p>
      </div>

      {/* Days held */}
      <div className="mt-3 flex items-center gap-4 text-xs text-muted">
        <div className="flex items-center gap-1">
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
            />
          </svg>
          <span>Held for {postMortem.daysHeld} day{postMortem.daysHeld !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-1">
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5-13.5L16.5 7.5m0 0L12 3m4.5 4.5V21"
            />
          </svg>
          <span>{tip.timeframe}</span>
        </div>
      </div>

      {/* Lesson */}
      <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
        <div className="flex items-start gap-2">
          <svg
            className="h-4 w-4 shrink-0 mt-0.5 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
            />
          </svg>
          <div>
            <p className="text-xs font-semibold text-blue-800">Takeaway</p>
            <p className="mt-0.5 text-xs leading-relaxed text-blue-700">
              {postMortem.lesson}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
