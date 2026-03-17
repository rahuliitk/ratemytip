"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { TransparencyBreakdown } from "@/lib/red-flags/detector";

// ═══════════════════════════════════════════════════════════
// TRANSPARENCY METER — A progress-bar style meter that
// visualizes a creator's transparency score (0-100) with an
// expandable breakdown of individual criteria.
// ═══════════════════════════════════════════════════════════

// ──── Score tier configuration ────

interface ScoreTier {
  readonly label: string;
  readonly barColor: string;
  readonly textColor: string;
  readonly bgColor: string;
}

function getScoreTier(score: number): ScoreTier {
  if (score >= 80) {
    return {
      label: "Excellent",
      barColor: "bg-emerald-500",
      textColor: "text-emerald-700 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
    };
  }
  if (score >= 60) {
    return {
      label: "Good",
      barColor: "bg-blue-500",
      textColor: "text-blue-700 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
    };
  }
  if (score >= 40) {
    return {
      label: "Fair",
      barColor: "bg-amber-500",
      textColor: "text-amber-700 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/20",
    };
  }
  return {
    label: "Poor",
    barColor: "bg-red-500",
    textColor: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/20",
  };
}

// ──── Breakdown criteria labels ────

const CRITERIA_LABELS: Record<keyof Omit<TransparencyBreakdown, "total">, { label: string; maxPoints: number }> = {
  stopLossScore: { label: "Provides stop loss", maxPoints: 25 },
  rationaleScore: { label: "Provides rationale", maxPoints: 20 },
  frequencyConsistencyScore: { label: "Consistent frequency", maxPoints: 20 },
  stockVarietyScore: { label: "Stock variety", maxPoints: 20 },
  cleanRecordScore: { label: "Clean record", maxPoints: 15 },
};

// ──── Props ────

interface TransparencyMeterProps {
  /** The overall transparency score (0-100) */
  readonly score: number;
  /** Optional detailed breakdown for expandable view */
  readonly breakdown?: TransparencyBreakdown;
  /** Size variant */
  readonly size?: "sm" | "md" | "lg";
  /** Additional class names */
  readonly className?: string;
}

// ──── Component ────

export function TransparencyMeter({
  score,
  breakdown,
  size = "md",
  className,
}: TransparencyMeterProps): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const tier = getScoreTier(score);

  // Close on outside click when expanded
  useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isExpanded]);

  // Close on Escape
  useEffect(() => {
    if (!isExpanded) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsExpanded(false);
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isExpanded]);

  const isSmall = size === "sm";
  const isLarge = size === "lg";

  return (
    <div ref={panelRef} className={cn("relative", className)}>
      {/* ── Main meter ── */}
      <button
        type="button"
        onClick={() => breakdown && setIsExpanded((prev) => !prev)}
        className={cn(
          "w-full rounded-lg border border-border/40 text-left transition-all duration-150",
          breakdown ? "cursor-pointer hover:border-border/80" : "cursor-default",
          isSmall ? "p-2" : isLarge ? "p-4" : "p-3"
        )}
        aria-expanded={breakdown ? isExpanded : undefined}
        aria-label={`Transparency score: ${score} out of 100 (${tier.label})`}
      >
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {/* Shield icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={cn(
                tier.textColor,
                isSmall ? "h-3.5 w-3.5" : "h-4 w-4"
              )}
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M9.661 2.237a.531.531 0 0 1 .678 0 11.947 11.947 0 0 0 7.078 2.749.5.5 0 0 1 .479.425c.069.52.104 1.05.104 1.59 0 5.162-3.26 9.563-7.834 11.256a.48.48 0 0 1-.332 0C5.26 16.564 2 12.163 2 7c0-.538.035-1.069.104-1.589a.5.5 0 0 1 .48-.425 11.947 11.947 0 0 0 7.077-2.75Z"
                clipRule="evenodd"
              />
            </svg>
            <span
              className={cn(
                "font-medium",
                isSmall ? "text-xs" : "text-sm",
                "text-text"
              )}
            >
              Transparency
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "font-bold tabular-nums",
                tier.textColor,
                isSmall ? "text-xs" : isLarge ? "text-lg" : "text-sm"
              )}
            >
              {score}
            </span>
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 font-medium",
                tier.bgColor,
                tier.textColor,
                isSmall ? "text-[10px]" : "text-xs"
              )}
            >
              {tier.label}
            </span>
            {breakdown && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className={cn(
                  "h-3 w-3 text-muted transition-transform duration-150",
                  isExpanded && "rotate-180"
                )}
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div
          className={cn(
            "w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800",
            isSmall ? "mt-1.5 h-1" : "mt-2 h-1.5"
          )}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700 ease-out",
              tier.barColor
            )}
            style={{ width: `${score}%` }}
          />
        </div>
      </button>

      {/* ── Expanded breakdown panel ── */}
      {isExpanded && breakdown && (
        <div
          className={cn(
            "mt-1 rounded-lg border border-border/60 bg-surface p-3 shadow-md",
            "animate-in fade-in-0 slide-in-from-top-1 duration-150"
          )}
        >
          <p className="mb-2.5 text-xs font-semibold text-text">
            Score Breakdown
          </p>

          <div className="space-y-2">
            {(Object.entries(CRITERIA_LABELS) as [keyof Omit<TransparencyBreakdown, "total">, { label: string; maxPoints: number }][]).map(
              ([key, { label, maxPoints }]) => {
                const value = breakdown[key];
                const pct = maxPoints > 0 ? (value / maxPoints) * 100 : 0;

                return (
                  <div key={key}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted">{label}</span>
                      <span className="tabular-nums text-text">
                        {value}/{maxPoints}
                      </span>
                    </div>
                    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          pct >= 80
                            ? "bg-emerald-500"
                            : pct >= 50
                              ? "bg-blue-500"
                              : pct >= 25
                                ? "bg-amber-500"
                                : "bg-red-500"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              },
            )}
          </div>

          <p className="mt-3 text-[11px] text-muted">
            Higher transparency indicates the creator provides complete, consistent, and responsible tip data.
          </p>
        </div>
      )}
    </div>
  );
}
