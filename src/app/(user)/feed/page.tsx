"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { TipStatusBadge } from "@/components/tip/tip-status-badge";
import { ScoreBadge } from "@/components/shared/score-badge";
import { formatPrice } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { Rss } from "lucide-react";
import type { TipStatus } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface FeedTip {
  id: string;
  direction: string;
  stockSymbol: string;
  stockName: string;
  entryPrice: number;
  target1: number;
  stopLoss: number;
  status: TipStatus;
  timeframe: string;
  tipTimestamp: string;
  returnPct: number | null;
  creator: {
    slug: string;
    displayName: string;
    tier: string;
    rmtScore: number | null;
  };
}

export default function FeedPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useSWR(
    `/api/v1/feed?page=${page}&pageSize=20`,
    fetcher
  );

  const tips: FeedTip[] = data?.data ?? [];
  const hasMore = data?.meta?.hasMore ?? false;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gradient-primary">My Feed</h1>
      <p className="mt-1 text-sm text-muted">
        Tips from creators you follow
      </p>

      {isLoading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl shimmer" />
          ))}
        </div>
      ) : tips.length === 0 ? (
        <div className="mt-12 flex flex-col items-center text-center">
          <Rss className="h-12 w-12 text-muted/40" />
          <p className="mt-4 text-sm text-muted">Your feed is empty</p>
          <p className="mt-1 text-xs text-muted">
            Follow creators on the leaderboard to see their tips here
          </p>
          <Button asChild size="sm" className="mt-4">
            <Link href="/leaderboard">Browse leaderboard</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-6 space-y-3">
            {tips.map((tip) => (
              <Link
                key={tip.id}
                href={`/tip/${tip.id}`}
                className="block rounded-2xl bg-white p-4 shadow-[0_1px_2px_0_rgba(26,54,93,0.04)] card-hover"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/creator/${tip.creator.slug}`}
                      className="text-sm font-medium text-accent hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {tip.creator.displayName}
                    </Link>
                    {tip.creator.rmtScore !== null && (
                      <ScoreBadge score={tip.creator.rmtScore} size="sm" />
                    )}
                  </div>
                  <TipStatusBadge status={tip.status} />
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      tip.direction === "BUY"
                        ? "bg-[#276749]/10 text-[#276749]"
                        : "bg-[#C53030]/10 text-[#C53030]"
                    }`}
                  >
                    {tip.direction}
                  </span>
                  <span className="text-sm font-semibold text-text">
                    {tip.stockSymbol}
                  </span>
                  <span className="text-xs text-muted">
                    {formatPrice(tip.entryPrice)} &rarr; {formatPrice(tip.target1)}
                  </span>
                  <span className="text-xs text-muted">{tip.timeframe}</span>
                  {tip.returnPct !== null && (
                    <span
                      className={`ml-auto text-sm font-semibold tabular-nums ${
                        tip.returnPct >= 0 ? "text-success" : "text-danger"
                      }`}
                    >
                      {tip.returnPct >= 0 ? "+" : ""}
                      {tip.returnPct.toFixed(2)}%
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-muted">
                  {new Date(tip.tipTimestamp).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>

          <div className="mt-6 flex justify-between">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-xs text-muted">Page {page}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasMore}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
