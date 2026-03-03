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
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === status
                  ? "bg-accent text-white"
                  : "bg-bg-alt text-muted hover:text-text hover:bg-bg-alt/80"
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
            <div key={i} className="h-16 animate-pulse rounded-xl bg-bg-alt" />
          ))}
        </div>
      ) : tips.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-surface p-8 text-center shadow-sm">
          <p className="text-sm text-muted">No tips found</p>
          <Link href="/creator-dashboard/new-tip">
            <Button variant="glow" size="sm" className="mt-3">Post your first tip</Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 bg-surface shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="hidden sm:grid sm:grid-cols-12 gap-3 bg-bg-alt/80 px-4 py-2.5">
            <span className="col-span-1 text-xs font-semibold uppercase tracking-wider text-muted">Dir</span>
            <span className="col-span-2 text-xs font-semibold uppercase tracking-wider text-muted">Stock</span>
            <span className="col-span-2 text-xs font-semibold uppercase tracking-wider text-muted">Entry</span>
            <span className="col-span-2 text-xs font-semibold uppercase tracking-wider text-muted">Target</span>
            <span className="col-span-2 text-xs font-semibold uppercase tracking-wider text-muted">Timeframe</span>
            <span className="col-span-1 text-xs font-semibold uppercase tracking-wider text-muted text-right">Return</span>
            <span className="col-span-2 text-xs font-semibold uppercase tracking-wider text-muted text-right">Status</span>
          </div>

          {/* Table Rows */}
          {tips.map((tip) => (
            <Link
              key={tip.id}
              href={`/creator-dashboard/my-tips/${tip.id}`}
              className="flex flex-col sm:grid sm:grid-cols-12 gap-2 sm:gap-3 items-start sm:items-center px-4 py-3 text-sm transition-colors hover:bg-bg-alt/50 border-t border-border/40"
            >
              <div className="col-span-1">
                <span
                  className={`rounded-md px-1.5 py-0.5 text-xs font-bold ${
                    tip.direction === "BUY"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {tip.direction}
                </span>
              </div>
              <div className="col-span-2">
                <p className="font-semibold text-text">{tip.stockSymbol}</p>
              </div>
              <div className="col-span-2">
                <p className="tabular-nums text-text">{formatPrice(tip.entryPrice)}</p>
              </div>
              <div className="col-span-2">
                <p className="tabular-nums text-text">{formatPrice(tip.target1)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted">{tip.timeframe}</p>
              </div>
              <div className="col-span-1 text-right">
                {tip.returnPct !== null ? (
                  <span
                    className={`text-sm font-semibold tabular-nums ${
                      tip.returnPct >= 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    {tip.returnPct >= 0 ? "+" : ""}
                    {tip.returnPct.toFixed(2)}%
                  </span>
                ) : (
                  <span className="text-xs text-muted">--</span>
                )}
              </div>
              <div className="col-span-2 flex justify-end">
                <TipStatusBadge status={tip.status} />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && tips.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
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
