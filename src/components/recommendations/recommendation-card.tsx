"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
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
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <Link href={`/stock/${tip.stock.symbol}`} className="font-semibold text-primary hover:underline">
              {tip.stock.symbol}
            </Link>
            <span className="ml-2 text-xs text-muted">{tip.stock.name}</span>
          </div>
          <Badge variant={isBuy ? "default" : "destructive"} className="text-xs">
            {isBuy ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
            {tip.direction}
          </Badge>
        </div>

        <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-muted">Entry</span>
            <p className="font-medium tabular-nums">{tip.entryPrice.toFixed(2)}</p>
          </div>
          <div>
            <span className="text-muted">Target</span>
            <p className="font-medium tabular-nums text-success">{tip.target1.toFixed(2)}</p>
          </div>
          <div>
            <span className="text-muted">Stop Loss</span>
            <p className="font-medium tabular-nums text-danger">{tip.stopLoss.toFixed(2)}</p>
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

        {/* Reason badge */}
        <div className="mb-3 flex items-center gap-1.5 rounded-md bg-accent/5 px-2 py-1 text-xs text-accent">
          <Sparkles className="h-3 w-3" />
          {reason}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted">
            Match: {(score * 100).toFixed(0)}%
          </span>
          <AddToPortfolioButton tipId={tip.id} />
        </div>
      </CardContent>
    </Card>
  );
}
