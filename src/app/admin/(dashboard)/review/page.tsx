"use client";

import { useState, useEffect, useCallback } from "react";
import { TipStatusBadge } from "@/components/tip/tip-status-badge";
import { formatPrice } from "@/lib/utils/format";
import { Check, X, ChevronDown, ChevronRight, Loader2 } from "lucide-react";

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
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Review Queue</h1>
          <p className="mt-1 text-sm text-muted">
            {tips.length} tips pending review
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted">
          <span className="rounded border border-gray-300 px-1.5 py-0.5 font-mono">A</span> Approve
          <span className="rounded border border-gray-300 px-1.5 py-0.5 font-mono">R</span> Reject
          <span className="rounded border border-gray-300 px-1.5 py-0.5 font-mono">N</span> Next
          <span className="rounded border border-gray-300 px-1.5 py-0.5 font-mono">P</span> Prev
        </div>
      </div>

      {isLoading ? (
        <div className="mt-8 flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted" />
        </div>
      ) : tips.length === 0 ? (
        <div className="mt-8 rounded-lg border border-gray-200 bg-surface py-16 text-center">
          <p className="text-sm text-muted">
            No tips pending review. All caught up!
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {tips.map((tip, index) => {
            const isExpanded = expandedId === tip.id;
            const isSelected = selectedIndex === index;
            return (
              <div
                key={tip.id}
                className={`rounded-lg border bg-surface ${isSelected ? "border-accent ring-1 ring-accent/30" : "border-gray-200"}`}
              >
                {/* Summary row */}
                <div className="flex items-center justify-between px-4 py-3">
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
                    <span className="text-sm font-bold text-primary">
                      {tip.stock.symbol}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                        tip.direction === "BUY"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {tip.direction}
                    </span>
                    <span className="text-xs text-muted">
                      by {tip.creator.displayName}
                    </span>
                    {tip.parseConfidence !== null && (
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs ${
                          tip.parseConfidence >= 0.85
                            ? "bg-green-100 text-green-700"
                            : tip.parseConfidence >= 0.5
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
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
                      className="inline-flex items-center gap-1 rounded-md bg-success px-3 py-1.5 text-xs font-medium text-white hover:bg-success/90 disabled:opacity-50"
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
                      className="inline-flex items-center gap-1 rounded-md bg-danger px-3 py-1.5 text-xs font-medium text-white hover:bg-danger/90 disabled:opacity-50"
                    >
                      <X className="h-3 w-3" />
                      Reject
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-gray-200 px-4 py-4">
                    <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                      <div>
                        <p className="text-xs text-muted">Entry</p>
                        <p className="font-medium tabular-nums">
                          {formatPrice(tip.entryPrice)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Target 1</p>
                        <p className="font-medium tabular-nums text-success">
                          {formatPrice(tip.target1)}
                        </p>
                      </div>
                      {tip.target2 !== null && (
                        <div>
                          <p className="text-xs text-muted">Target 2</p>
                          <p className="font-medium tabular-nums text-success">
                            {formatPrice(tip.target2)}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-muted">Stop Loss</p>
                        <p className="font-medium tabular-nums text-danger">
                          {formatPrice(tip.stopLoss)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Timeframe</p>
                        <p className="font-medium">{tip.timeframe}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Tip Date</p>
                        <p className="font-medium">
                          {new Date(tip.tipTimestamp).toLocaleDateString(
                            "en-IN"
                          )}
                        </p>
                      </div>
                    </div>

                    {tip.rawPost && (
                      <div className="mt-4">
                        <p className="text-xs font-medium text-muted">
                          Original Post
                        </p>
                        <div className="mt-1 rounded bg-bg p-3 text-sm text-text">
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
