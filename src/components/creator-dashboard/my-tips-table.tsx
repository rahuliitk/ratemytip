"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TipStatusBadge } from "@/components/tip/tip-status-badge";
import { formatPrice } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import type { TipStatus } from "@/types";

interface Tip {
  id: string;
  stockSymbol: string;
  direction: string;
  entryPrice: number;
  target1: number;
  stopLoss: number;
  status: TipStatus;
  timeframe: string;
  tipTimestamp: string;
  returnPct: number | null;
}

interface MyTipsTableProps {
  readonly initialTips?: Tip[];
}

export function MyTipsTable({ initialTips }: MyTipsTableProps): React.ReactElement {
  const [tips, setTips] = useState<Tip[]>(initialTips ?? []);
  const [loading, setLoading] = useState(!initialTips);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  async function fetchTips(statusFilter: string, pageNum: number): Promise<void> {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pageNum.toString(), pageSize: "20" });
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/v1/creator-dashboard/tips?${params}`);
      const data = await res.json();

      if (data.success) {
        setTips(data.data);
        setHasMore(data.meta?.hasMore ?? false);
      }
    } catch {
      // silently fail, keep existing tips
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTips(filter, page);
  }, [filter, page]);

  return (
    <div>
      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap gap-2">
        {["all", "PENDING_REVIEW", "ACTIVE", "TARGET_1_HIT", "STOPLOSS_HIT", "EXPIRED"].map(
          (status) => (
            <button
              key={status}
              onClick={() => { setFilter(status); setPage(1); }}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                filter === status
                  ? "bg-accent text-white"
                  : "bg-bg text-muted hover:bg-gray-200"
              }`}
            >
              {status === "all" ? "All" : status.replace(/_/g, " ")}
            </button>
          )
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-bg" />
          ))}
        </div>
      ) : tips.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-surface p-8 text-center">
          <p className="text-sm text-muted">No tips found</p>
          <Link href="/creator-dashboard/new-tip">
            <Button size="sm" className="mt-3">Post your first tip</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {tips.map((tip) => (
            <Link
              key={tip.id}
              href={`/creator-dashboard/my-tips/${tip.id}`}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-surface p-3 transition-colors hover:bg-bg"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`rounded px-1.5 py-0.5 text-xs font-bold ${
                    tip.direction === "BUY"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {tip.direction}
                </span>
                <div>
                  <p className="text-sm font-semibold text-text">{tip.stockSymbol}</p>
                  <p className="text-xs text-muted">
                    {formatPrice(tip.entryPrice)} &rarr; {formatPrice(tip.target1)} &middot;{" "}
                    {tip.timeframe}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {tip.returnPct !== null && (
                  <span
                    className={`text-sm font-semibold tabular-nums ${
                      tip.returnPct >= 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    {tip.returnPct >= 0 ? "+" : ""}
                    {tip.returnPct.toFixed(2)}%
                  </span>
                )}
                <TipStatusBadge status={tip.status} />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && tips.length > 0 && (
        <div className="mt-4 flex justify-between">
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
      )}
    </div>
  );
}
