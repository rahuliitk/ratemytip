import * as React from "react";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/lib/risk/risk-scorer";

// ──── Props ────

interface RiskBadgeProps {
  readonly riskLevel: RiskLevel;
  readonly riskScore?: number;
  readonly size?: "sm" | "lg";
  readonly className?: string;
}

// ──── Color Mappings ────

const LEVEL_STYLES: Record<
  RiskLevel,
  { bg: string; text: string; border: string; ring: string }
> = {
  LOW: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    ring: "ring-green-500/20",
  },
  MEDIUM: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
    ring: "ring-yellow-500/20",
  },
  HIGH: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    ring: "ring-orange-500/20",
  },
  VERY_HIGH: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    ring: "ring-red-500/20",
  },
};

const LEVEL_LABELS: Record<RiskLevel, string> = {
  LOW: "Low Risk",
  MEDIUM: "Medium Risk",
  HIGH: "High Risk",
  VERY_HIGH: "Very High Risk",
};

const LEVEL_DOT_COLORS: Record<RiskLevel, string> = {
  LOW: "bg-green-500",
  MEDIUM: "bg-yellow-500",
  HIGH: "bg-orange-500",
  VERY_HIGH: "bg-red-500",
};

// ──── Component ────

/**
 * Renders a color-coded risk level badge.
 *
 * - `size="sm"` is compact for tip cards and lists.
 * - `size="lg"` is larger for tip detail pages.
 * - When `riskScore` is provided, it is shown as a tooltip-like
 *   detail alongside the label.
 */
export function RiskBadge({
  riskLevel,
  riskScore,
  size = "sm",
  className,
}: RiskBadgeProps): React.ReactElement {
  const styles = LEVEL_STYLES[riskLevel];
  const label = LEVEL_LABELS[riskLevel];
  const dotColor = LEVEL_DOT_COLORS[riskLevel];

  if (size === "sm") {
    return (
      <span
        title={
          riskScore !== undefined
            ? `Risk score: ${riskScore}/100`
            : undefined
        }
        className={cn(
          "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium leading-tight",
          styles.bg,
          styles.text,
          styles.border,
          className
        )}
      >
        <span
          className={cn("inline-block h-1.5 w-1.5 rounded-full", dotColor)}
          aria-hidden="true"
        />
        {label}
      </span>
    );
  }

  // Large variant
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5",
        styles.bg,
        styles.text,
        styles.border,
        className
      )}
    >
      <span
        className={cn("inline-block h-2.5 w-2.5 rounded-full", dotColor)}
        aria-hidden="true"
      />
      <div className="flex flex-col">
        <span className="text-sm font-semibold leading-tight">{label}</span>
        {riskScore !== undefined && (
          <span className="text-xs opacity-75 tabular-nums leading-tight">
            Score: {riskScore}/100
          </span>
        )}
      </div>
    </div>
  );
}
