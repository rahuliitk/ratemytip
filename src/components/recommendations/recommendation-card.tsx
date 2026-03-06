"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AddToPortfolioButton } from "@/components/portfolio/add-to-portfolio-button";
import { TrendingUp, TrendingDown, Sparkles } from "lucide-react";

interface TipData {
  id: string;
  direction: string;
  entryPrice: number;
  target1: number;
  stopLoss: number;
  status: string;
  timeframe: string;
  tipTimestamp: string;
  stock: { symbol: string; name: string; lastPrice: number | null };
  creator: { slug: string; displayName: string; currentScore: { rmtScore: number } | null };
}

interface RecommendationCardProps {
  readonly recommendation: {
    tipId: string;
    score: number;
    reason: string;
    tip: TipData | null;
  };
}

export function RecommendationCard({ recommendation }: RecommendationCardProps): React.ReactElement | null {
  const { tip, reason, score } = recommendation;
  if (!tip) return null;

  const isBuy = tip.direction === "BUY";

  return (
    <div className="rounded-xl border border-border/60 bg-surface p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <Link href={`/stock/${tip.stock.symbol}`} className="font-semibold text-text hover:text-accent hover:underline">
            {tip.stock.symbol}
          </Link>
          <span className="ml-2 text-xs text-muted">{tip.stock.name}</span>
        </div>
        <Badge
          className={`text-xs ${
            isBuy
              ? "border-transparent bg-success-light text-success"
              : "border-transparent bg-danger-light text-danger"
          }`}
        >
          {isBuy ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
          {tip.direction}
        </Badge>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
        <div>
          <span className="text-muted">Entry</span>
          <p className="font-medium tabular-nums text-text">{tip.entryPrice.toFixed(2)}</p>
        </div>
        <div>
          <span className="text-muted">Target</span>
          <p className="font-medium tabular-nums text-emerald-600">{tip.target1.toFixed(2)}</p>
        </div>
        <div>
          <span className="text-muted">Stop Loss</span>
          <p className="font-medium tabular-nums text-red-600">{tip.stopLoss.toFixed(2)}</p>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between text-xs">
        <Link href={`/creator/${tip.creator.slug}`} className="text-muted hover:text-accent">
          {tip.creator.displayName}
          {tip.creator.currentScore && (
            <span className="ml-1 font-medium text-accent">
              ({tip.creator.currentScore.rmtScore.toFixed(0)} RMT)
            </span>
          )}
        </Link>
        <Badge variant="outline" className="text-[10px]">{tip.timeframe}</Badge>
      </div>

      {/* Match score + reason */}
      <div className="mb-3 flex items-center gap-1.5 rounded-md bg-accent/10 px-2.5 py-1.5 text-xs text-accent">
        <Sparkles className="h-3 w-3 flex-shrink-0" />
        <span>{reason}</span>
      </div>

      <div className="flex items-center justify-between">
        <span className="rounded-md bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent tabular-nums">
          Match: {(score * 100).toFixed(0)}%
        </span>
        <AddToPortfolioButton tipId={tip.id} />
      </div>
    </div>
  );
}
