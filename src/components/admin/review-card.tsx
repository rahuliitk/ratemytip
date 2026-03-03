"use client";

import { useState } from "react";
import { Check, X, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils/format";

interface ReviewTipData {
  readonly id: string;
  readonly direction: string;
  readonly entryPrice: number;
  readonly target1: number;
  readonly target2: number | null;
  readonly target3: number | null;
  readonly stopLoss: number;
  readonly timeframe: string;
  readonly parseConfidence: number | null;
  readonly tipTimestamp: string;
  readonly stock: { readonly symbol: string; readonly name: string };
  readonly creator: { readonly displayName: string; readonly slug: string };
  readonly rawPost: { readonly content: string } | null;
}

interface ReviewCardProps {
  readonly tip: ReviewTipData;
  readonly onApprove: (id: string) => Promise<void>;
  readonly onReject: (id: string) => Promise<void>;
  readonly isActionLoading: boolean;
}

export function ReviewCard({
  tip,
  onApprove,
  onReject,
  isActionLoading,
}: ReviewCardProps): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-border/60 bg-surface shadow-sm">
      {/* Summary row */}
      <div className="flex items-center justify-between px-5 py-3.5">
        <button
          type="button"
          className="flex flex-1 items-center gap-3 text-left"
          onClick={() => setIsExpanded((prev) => !prev)}
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
            onClick={() => onApprove(tip.id)}
            disabled={isActionLoading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
          >
            {isActionLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Check className="h-3 w-3" />
            )}
            Approve
          </button>
          <button
            type="button"
            onClick={() => onReject(tip.id)}
            disabled={isActionLoading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
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
                {new Date(tip.tipTimestamp).toLocaleDateString("en-IN")}
              </p>
            </div>
          </div>

          {tip.rawPost && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-muted">Original Post</p>
              <div className="mt-1.5 rounded-lg border border-border/40 bg-bg-alt p-3 text-sm leading-relaxed text-text">
                {tip.rawPost.content}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
