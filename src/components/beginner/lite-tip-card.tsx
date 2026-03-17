"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/utils/format";
import type { TipWithCreator } from "@/types";

// ──── Risk Level helpers ────

type SimpleRiskLevel = "LOW" | "MEDIUM" | "HIGH";

function computeSimpleRisk(tip: TipWithCreator): SimpleRiskLevel {
  const riskPct =
    Math.abs(tip.entryPrice - tip.stopLoss) / tip.entryPrice;

  if (riskPct <= 0.03) return "LOW";
  if (riskPct <= 0.07) return "MEDIUM";
  return "HIGH";
}

const RISK_CONFIG: Record<
  SimpleRiskLevel,
  { label: string; bg: string; text: string; dot: string }
> = {
  LOW: {
    label: "Low risk",
    bg: "bg-green-50",
    text: "text-green-700",
    dot: "bg-green-500",
  },
  MEDIUM: {
    label: "Medium risk",
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    dot: "bg-yellow-500",
  },
  HIGH: {
    label: "High risk",
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
  },
};

// ──── Summary generator ────

function generateSummary(
  tip: TipWithCreator,
  riskLevel: SimpleRiskLevel
): string {
  const creatorName = tip.creator.displayName;
  const riskLabel = RISK_CONFIG[riskLevel].label.toLowerCase();
  const direction = tip.direction === "BUY" ? "buy" : "sell";
  return `${
    tip.creator.rmtScore !== null && tip.creator.rmtScore >= 60
      ? "Highly-rated"
      : "Tracked"
  } analyst says ${direction} ${tip.stockSymbol} around ${formatPrice(
    tip.entryPrice
  )}. ${riskLabel.charAt(0).toUpperCase() + riskLabel.slice(1)}.`;
}

// ──── Props ────

interface LiteTipCardProps {
  readonly tip: TipWithCreator;
}

// ──── Component ────

export function LiteTipCard({ tip }: LiteTipCardProps): React.ReactElement {
  const isBuy = tip.direction === "BUY";
  const riskLevel = computeSimpleRisk(tip);
  const riskCfg = RISK_CONFIG[riskLevel];
  const summary = generateSummary(tip, riskLevel);

  return (
    <Link
      href={`/tip/${tip.id}`}
      className="block rounded-xl border border-border/60 bg-surface p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
    >
      {/* Creator name */}
      <p className="text-xs font-medium text-muted">
        {tip.creator.displayName}
      </p>

      {/* Stock name + direction */}
      <div className="mt-2 flex items-center gap-2.5">
        <span className="text-lg font-bold text-text">
          {tip.stockSymbol}
        </span>
        <span
          className={`rounded-md px-2.5 py-1 text-xs font-bold text-white ${
            isBuy ? "bg-emerald-500" : "bg-red-500"
          }`}
        >
          {tip.direction}
        </span>
      </div>

      {/* Stock full name */}
      {tip.stockName && (
        <p className="mt-0.5 text-sm text-muted">{tip.stockName}</p>
      )}

      {/* Key prices — large and spaced */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-bg-alt p-3 text-center">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
            Entry
          </p>
          <p className="mt-1 text-base font-bold tabular-nums text-text">
            {formatPrice(tip.entryPrice)}
          </p>
        </div>
        <div className="rounded-lg bg-emerald-50 p-3 text-center">
          <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-600">
            Target
          </p>
          <p className="mt-1 text-base font-bold tabular-nums text-emerald-700">
            {formatPrice(tip.target1)}
          </p>
        </div>
        <div className="rounded-lg bg-red-50 p-3 text-center">
          <p className="text-[11px] font-medium uppercase tracking-wide text-red-600">
            Stop Loss
          </p>
          <p className="mt-1 text-base font-bold tabular-nums text-red-700">
            {formatPrice(tip.stopLoss)}
          </p>
        </div>
      </div>

      {/* Risk badge */}
      <div className="mt-4">
        <span
          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${riskCfg.bg} ${riskCfg.text}`}
        >
          <span
            className={`inline-block h-2 w-2 rounded-full ${riskCfg.dot}`}
            aria-hidden="true"
          />
          {riskCfg.label}
        </span>
      </div>

      {/* One-sentence summary */}
      <p className="mt-3 text-sm leading-relaxed text-muted">
        {summary}
      </p>
    </Link>
  );
}
