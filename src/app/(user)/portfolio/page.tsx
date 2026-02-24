"use client";

import { useState, useEffect } from "react";
import { PortfolioSummary } from "@/components/portfolio/portfolio-summary";
import { PortfolioPositions } from "@/components/portfolio/portfolio-positions";
import { PortfolioPnlChart } from "@/components/portfolio/portfolio-pnl-chart";
import { SubscriptionGate } from "@/components/shared/subscription-gate";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BarChart3, Briefcase } from "lucide-react";

interface PortfolioEntryData {
  readonly id: string;
  readonly status: "OPEN" | "CLOSED";
  readonly entryPrice: number;
  readonly quantity: number;
  readonly closedPrice: number | null;
  readonly unrealizedPnl: number | null;
  readonly realizedPnl: number | null;
  readonly notes: string | null;
  readonly tip: {
    readonly id: string;
    readonly direction: string;
    readonly status: string;
    readonly timeframe: string;
    readonly stock: {
      readonly symbol: string;
      readonly name: string;
      readonly lastPrice: number | null;
    };
    readonly creator: {
      readonly slug: string;
      readonly displayName: string;
    };
  };
}

interface PortfolioData {
  summary: {
    totalValue: number;
    totalInvested: number;
    totalPnl: number;
    totalPnlPct: number;
    openPositions: number;
    closedPositions: number;
    winRate: number;
  };
  entries: PortfolioEntryData[];
}

export default function PortfolioPage(): React.ReactElement {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [history, setHistory] = useState<{ date: string; totalValue: number; totalPnl: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/v1/portfolio").then((r) => r.json()),
      fetch("/api/v1/portfolio/history?days=90").then((r) => r.json()),
    ]).then(([portfolioRes, historyRes]) => {
      if (portfolioRes.success) setData(portfolioRes.data);
      if (historyRes.success) setHistory(historyRes.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded-2xl shimmer" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 rounded-2xl shimmer" />)}
          </div>
          <div className="h-64 rounded-2xl shimmer" />
        </div>
      </div>
    );
  }

  const hasEntries = data && data.entries.length > 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gradient-primary">Portfolio</h1>
          <p className="text-sm text-muted">Track your positions and P&L across saved tips</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/portfolio/analytics">
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </Link>
        </Button>
      </div>

      {!hasEntries ? (
        <div className="flex flex-col items-center py-20 text-center">
          <Briefcase className="mb-4 h-12 w-12 text-gray-300" />
          <h2 className="mb-2 text-lg font-bold text-[#1A365D]">No positions yet</h2>
          <p className="mb-6 max-w-md text-sm text-muted">
            Add tips to your portfolio to track their performance. Use the &quot;Add to Portfolio&quot; button on any tip card.
          </p>
          <Button asChild>
            <Link href="/leaderboard">Browse Tips</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <PortfolioSummary summary={data!.summary} />

          {history.length > 0 && <PortfolioPnlChart data={history} />}

          <div>
            <h2 className="mb-3 text-lg font-bold text-gradient-primary">Positions</h2>
            <PortfolioPositions entries={data!.entries} />
          </div>

          <SubscriptionGate minTier="PRO" feature="Advanced Analytics">
            <div className="text-center text-sm text-muted">
              <Link href="/portfolio/analytics" className="text-accent hover:underline">
                View detailed analytics
              </Link>
            </div>
          </SubscriptionGate>
        </div>
      )}
    </div>
  );
}
