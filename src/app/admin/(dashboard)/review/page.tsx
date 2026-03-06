"use client";

import { useState, useEffect, useCallback } from "react";
import { formatPrice } from "@/lib/utils/format";
import { Check, X, ChevronDown, ChevronRight, Loader2, Keyboard } from "lucide-react";

interface ReviewTip {
  id: string;
  direction: string;
  entryPrice: number;
  target1: number;
  target2: number | null;
  target3: number | null;
  stopLoss: number;
  timeframe: string;
  parseConfidence: number | null;
  tipTimestamp: string;
  stock: { symbol: string; name: string };
  creator: { displayName: string; slug: string };
  rawPost: { content: string } | null;
}

export default function ReviewQueuePage(): React.ReactElement {
  const [tips, setTips] = useState<ReviewTip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchReviewQueue();
  }, []);

  async function fetchReviewQueue(): Promise<void> {
    try {
      const res = await fetch("/api/admin/review");
      const data = await res.json();
      if (data.success) {
        setTips(data.data);
      }
    } catch {
      // Silently handle
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAction(
    tipId: string,
    action: "approve" | "reject"
  ): Promise<void> {
    setActionLoading(tipId);
    try {
      const res = await fetch(`/api/admin/review/${tipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setTips((prev) => prev.filter((t) => t.id !== tipId));
      }
    } catch {
      // Silently handle
    } finally {
      setActionLoading(null);
    }
  }

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't fire shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      if (tips.length === 0 || actionLoading) return;

      const currentTip = tips[selectedIndex];
      if (!currentTip) return;

      switch (e.key.toLowerCase()) {
        case "a":
          e.preventDefault();
          handleAction(currentTip.id, "approve");
          break;
        case "r":
          e.preventDefault();
          handleAction(currentTip.id, "reject");
          break;
        case "n":
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, tips.length - 1));
          setExpandedId(tips[Math.min(selectedIndex + 1, tips.length - 1)]?.id ?? null);
          break;
        case "p":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          setExpandedId(tips[Math.max(selectedIndex - 1, 0)]?.id ?? null);
          break;
      }
    },
    [tips, selectedIndex, actionLoading]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Keep selectedIndex in bounds when tips are removed
  useEffect(() => {
    if (selectedIndex >= tips.length && tips.length > 0) {
      setSelectedIndex(tips.length - 1);
    }
  }, [tips.length, selectedIndex]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Review Queue</h1>
          <p className="mt-1 text-sm text-muted">
            {tips.length} tips pending review
          </p>
        </div>
        <div className="hidden items-center gap-3 rounded-lg border border-border/60 bg-surface px-4 py-2 shadow-sm md:flex">
          <Keyboard className="h-4 w-4 text-muted" />
          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <kbd className="rounded border border-border bg-bg-alt px-1.5 py-0.5 font-mono text-[10px] font-medium text-text">A</kbd>
              Approve
            </span>
            <span className="inline-flex items-center gap-1.5">
              <kbd className="rounded border border-border bg-bg-alt px-1.5 py-0.5 font-mono text-[10px] font-medium text-text">R</kbd>
              Reject
            </span>
            <span className="inline-flex items-center gap-1.5">
              <kbd className="rounded border border-border bg-bg-alt px-1.5 py-0.5 font-mono text-[10px] font-medium text-text">N</kbd>
              Next
            </span>
            <span className="inline-flex items-center gap-1.5">
              <kbd className="rounded border border-border bg-bg-alt px-1.5 py-0.5 font-mono text-[10px] font-medium text-text">P</kbd>
              Prev
            </span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted" />
        </div>
      ) : tips.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-surface py-20 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <Check className="h-7 w-7 text-emerald-500" />
          </div>
          <p className="mt-4 text-sm font-medium text-text">
            All caught up!
          </p>
          <p className="mt-1 text-xs text-muted">
            No tips pending review.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tips.map((tip, index) => {
            const isExpanded = expandedId === tip.id;
            const isSelected = selectedIndex === index;
            return (
              <div
                key={tip.id}
                className={`rounded-xl border bg-surface shadow-sm transition-all ${
                  isSelected
                    ? "border-blue-300 ring-2 ring-blue-100"
                    : "border-border/60"
                }`}
              >
                {/* Summary row */}
                <div className="flex items-center justify-between px-5 py-3.5">
                  <button
                    type="button"
                    className="flex flex-1 items-center gap-3 text-left"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : tip.id)
                    }
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted" />
                    )}
                    <span className="text-sm font-bold text-text">
                      {tip.stock.symbol}
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                        tip.direction === "BUY"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {tip.direction}
                    </span>
                    <span className="text-xs text-muted">
                      by {tip.creator.displayName}
                    </span>
                    {tip.parseConfidence !== null && (
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                          tip.parseConfidence >= 0.85
                            ? "bg-emerald-50 text-emerald-700"
                            : tip.parseConfidence >= 0.5
                              ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-700"
                        }`}
                      >
                        {(tip.parseConfidence * 100).toFixed(0)}% conf
                      </span>
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAction(tip.id, "approve")}
                      disabled={actionLoading === tip.id}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
                    >
                      {actionLoading === tip.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction(tip.id, "reject")}
                      disabled={actionLoading === tip.id}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                    >
                      <X className="h-3 w-3" />
                      Reject
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-border/60 px-5 py-4">
                    <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                      <div>
                        <p className="text-xs font-medium text-muted">Entry</p>
                        <p className="mt-0.5 font-semibold tabular-nums text-text">
                          {formatPrice(tip.entryPrice)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted">Target 1</p>
                        <p className="mt-0.5 font-semibold tabular-nums text-emerald-600">
                          {formatPrice(tip.target1)}
                        </p>
                      </div>
                      {tip.target2 !== null && (
                        <div>
                          <p className="text-xs font-medium text-muted">Target 2</p>
                          <p className="mt-0.5 font-semibold tabular-nums text-emerald-600">
                            {formatPrice(tip.target2)}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-medium text-muted">Stop Loss</p>
                        <p className="mt-0.5 font-semibold tabular-nums text-red-600">
                          {formatPrice(tip.stopLoss)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted">Timeframe</p>
                        <p className="mt-0.5 font-medium text-text">{tip.timeframe}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted">Tip Date</p>
                        <p className="mt-0.5 font-medium text-text">
                          {new Date(tip.tipTimestamp).toLocaleDateString(
                            "en-IN"
                          )}
                        </p>
                      </div>
                    </div>

                    {tip.rawPost && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold text-muted">
                          Original Post
                        </p>
                        <div className="mt-1.5 rounded-lg border border-border/40 bg-bg-alt p-3 text-sm leading-relaxed text-text">
                          {tip.rawPost.content}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
