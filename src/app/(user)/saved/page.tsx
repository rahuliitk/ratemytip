"use client";

import useSWR from "swr";
import Link from "next/link";
import { TipStatusBadge } from "@/components/tip/tip-status-badge";
import { BookmarkButton } from "@/components/tip/bookmark-button";
import { formatPrice } from "@/lib/utils/format";
import { Bookmark } from "lucide-react";
import type { TipStatus } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface SavedTipEntry {
  id: string;
  createdAt: string;
  tip: {
    id: string;
    direction: string;
    entryPrice: number;
    target1: number;
    stopLoss: number;
    status: string;
    tipTimestamp: string;
    returnPct: number | null;
    stock: { symbol: string; name: string };
    creator: { displayName: string; slug: string };
  };
}

export default function SavedPage(): React.ReactElement {
  const { data, isLoading } = useSWR("/api/v1/user/saved", fetcher);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-2.5">
        <Bookmark className="h-6 w-6 text-accent" />
        <h1 className="text-2xl font-bold text-text">Saved Tips</h1>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl shimmer" />
          ))}
        </div>
      ) : data?.data?.length > 0 ? (
        <div className="space-y-3">
          {data.data.map((entry: SavedTipEntry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-xl border border-border/60 bg-surface p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            >
              <Link
                href={`/tip/${entry.tip.id}`}
                className="flex-1"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                      entry.tip.direction === "BUY"
                        ? "bg-success-light text-success"
                        : "bg-danger-light text-danger"
                    }`}
                  >
                    {entry.tip.direction}
                  </span>
                  <span className="font-medium text-text">
                    {entry.tip.stock.symbol}
                  </span>
                  <TipStatusBadge status={entry.tip.status as TipStatus} />
                </div>
                <div className="mt-1.5 flex items-center gap-3 text-xs text-muted">
                  <span>Entry: {formatPrice(entry.tip.entryPrice)}</span>
                  <span>Target: {formatPrice(entry.tip.target1)}</span>
                  <span>
                    by{" "}
                    <span className="font-medium text-accent">{entry.tip.creator.displayName}</span>
                  </span>
                </div>
              </Link>
              <BookmarkButton tipId={entry.tip.id} initialSaved={true} />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-surface py-12 text-center">
          <Bookmark className="mx-auto h-8 w-8 text-muted-light" />
          <p className="mt-3 text-sm text-muted">No saved tips yet.</p>
          <Link
            href="/leaderboard"
            className="mt-2 inline-block text-sm font-medium text-accent hover:underline"
          >
            Browse creators to find tips
          </Link>
        </div>
      )}
    </div>
  );
}
