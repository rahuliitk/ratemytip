"use client";

import { useState, useEffect } from "react";
import { SubscriptionGate } from "@/components/shared/subscription-gate";
import { PortfolioSummary } from "@/components/portfolio/portfolio-summary";
import { PortfolioAllocation } from "@/components/portfolio/portfolio-allocation";
import { ArrowLeft, Trophy, TrendingDown } from "lucide-react";
import Link from "next/link";

interface AnalyticsData {
  summary: {
    totalValue: number;
    totalInvested: number;
    totalPnl: number;
    totalPnlPct: number;
    openPositions: number;
    closedPositions: number;
    winRate: number;
  };
  sectorAllocation: { sector: string; count: number; value: number }[];
  assetClassAllocation: { assetClass: string; count: number }[];
  avgHoldingDays: number;
  bestPosition: { tipId: string; pnlPct: number } | null;
  worstPosition: { tipId: string; pnlPct: number } | null;
}

export default function PortfolioAnalyticsPage(): React.ReactElement {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-3">
        <Link href="/portfolio" className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted transition-colors hover:bg-bg-alt hover:text-text">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text">Portfolio Analytics</h1>
          <p className="mt-1 text-sm text-muted">Detailed breakdown of your portfolio performance</p>
        </div>
      </div>

      <SubscriptionGate minTier="PRO" feature="Portfolio Analytics">
        <AnalyticsContent />
      </SubscriptionGate>
    </div>
  );
}

function AnalyticsContent(): React.ReactElement {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/portfolio/analytics")
      .then((r) => r.json())
      .then((res) => { if (res.success) setData(res.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 rounded-xl shimmer" />)}
        </div>
        <div className="h-64 rounded-xl shimmer" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface py-12 text-center">
        <p className="text-sm text-muted">No portfolio data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PortfolioSummary summary={data.summary} />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Sector Allocation */}
        <div className="rounded-xl border border-border/60 bg-surface shadow-sm">
          <div className="border-b border-border/60 px-5 py-4">
            <h3 className="text-sm font-semibold text-text">Sector Allocation</h3>
          </div>
          <div className="p-5">
            <PortfolioAllocation sectors={data.sectorAllocation} />
          </div>
        </div>

        {/* Key Metrics */}
        <div className="rounded-xl border border-border/60 bg-surface shadow-sm">
          <div className="border-b border-border/60 px-5 py-4">
            <h3 className="text-sm font-semibold text-text">Key Metrics</h3>
          </div>
          <div className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Avg Holding Period</span>
              <span className="font-medium tabular-nums text-text">{data.avgHoldingDays} days</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Asset Classes</span>
              <span className="font-medium text-text">
                {data.assetClassAllocation.map((a) => a.assetClass).join(", ") || "—"}
              </span>
            </div>
            {data.bestPosition && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm text-muted">
                  <Trophy className="h-3.5 w-3.5 text-success" />
                  Best Position
                </span>
                <span className="font-medium tabular-nums text-emerald-600">
                  +{data.bestPosition.pnlPct.toFixed(1)}%
                </span>
              </div>
            )}
            {data.worstPosition && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm text-muted">
                  <TrendingDown className="h-3.5 w-3.5 text-danger" />
                  Worst Position
                </span>
                <span className="font-medium tabular-nums text-red-600">
                  {data.worstPosition.pnlPct.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
