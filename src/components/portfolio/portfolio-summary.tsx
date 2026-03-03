"use client";

import { TrendingUp, TrendingDown, Briefcase, Target } from "lucide-react";
import { formatPrice, formatPercent } from "@/lib/utils/format";

interface PortfolioSummaryData {
  readonly totalValue: number;
  readonly totalInvested: number;
  readonly totalPnl: number;
  readonly totalPnlPct: number;
  readonly openPositions: number;
  readonly closedPositions: number;
  readonly winRate: number;
}

interface PortfolioSummaryProps {
  readonly summary: PortfolioSummaryData;
}

export function PortfolioSummary({ summary }: PortfolioSummaryProps): React.ReactElement {
  const pnlPositive = summary.totalPnl >= 0;

  const cards = [
    {
      label: "Total Value",
      value: formatPrice(summary.totalValue),
      subtitle: `Invested: ${formatPrice(summary.totalInvested)}`,
      icon: Briefcase,
      iconColor: "text-accent",
      valueColor: "text-text",
    },
    {
      label: "Total P&L",
      value: `${pnlPositive ? "+" : ""}${formatPrice(summary.totalPnl)}`,
      subtitle: formatPercent(summary.totalPnlPct, 2),
      icon: pnlPositive ? TrendingUp : TrendingDown,
      iconColor: pnlPositive ? "text-emerald-600" : "text-red-600",
      valueColor: pnlPositive ? "text-emerald-600" : "text-red-600",
    },
    {
      label: "Open Positions",
      value: summary.openPositions.toString(),
      subtitle: `${summary.closedPositions} closed`,
      icon: Target,
      iconColor: "text-warning",
      valueColor: "text-text",
    },
    {
      label: "Win Rate",
      value: `${summary.winRate.toFixed(1)}%`,
      subtitle: `of ${summary.closedPositions} closed`,
      icon: Target,
      iconColor: summary.winRate >= 50 ? "text-emerald-600" : "text-red-600",
      valueColor: summary.winRate >= 50 ? "text-emerald-600" : "text-red-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="rounded-xl border border-border/60 bg-surface p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${card.iconColor}`} />
              <span className="text-xs text-muted">
                {card.label}
              </span>
            </div>
            <p className={`mt-2 text-2xl font-bold tabular-nums ${card.valueColor}`}>
              {card.value}
            </p>
            <p className="mt-0.5 text-xs text-muted tabular-nums">
              {card.subtitle}
            </p>
          </div>
        );
      })}
    </div>
  );
}
