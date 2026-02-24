"use client";

import { useState, useEffect } from "react";
import { SubscriptionGate } from "@/components/shared/subscription-gate";
import { PortfolioSummary } from "@/components/portfolio/portfolio-summary";
import { PortfolioAllocation } from "@/components/portfolio/portfolio-allocation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/portfolio" className="text-muted hover:text-primary">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-primary">Portfolio Analytics</h1>
          <p className="text-sm text-muted">Detailed breakdown of your portfolio performance</p>
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
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 rounded bg-gray-200" />)}
        </div>
        <div className="h-64 rounded bg-gray-200" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-muted">No portfolio data available.</p>;
  }

  return (
    <div className="space-y-6">
      <PortfolioSummary summary={data.summary} />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Sector Allocation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sector Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <PortfolioAllocation sectors={data.sectorAllocation} />
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Key Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Avg Holding Period</span>
              <span className="font-medium tabular-nums">{data.avgHoldingDays} days</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Asset Classes</span>
              <span className="font-medium">
                {data.assetClassAllocation.map((a) => a.assetClass).join(", ") || "—"}
              </span>
            </div>
            {data.bestPosition && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-sm text-muted">
                  <Trophy className="h-3.5 w-3.5 text-success" />
                  Best Position
                </span>
                <span className="font-medium tabular-nums text-success">
                  +{data.bestPosition.pnlPct.toFixed(1)}%
                </span>
              </div>
            )}
            {data.worstPosition && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-sm text-muted">
                  <TrendingDown className="h-3.5 w-3.5 text-danger" />
                  Worst Position
                </span>
                <span className="font-medium tabular-nums text-danger">
                  {data.worstPosition.pnlPct.toFixed(1)}%
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
