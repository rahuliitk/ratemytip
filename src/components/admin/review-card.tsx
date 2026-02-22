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
    <div className="rounded-lg border border-gray-200 bg-surface">
      {/* Summary row */}
      <div className="flex items-center justify-between px-4 py-3">
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
            onClick={() => onApprove(tip.id)}
            disabled={isActionLoading}
            className="inline-flex items-center gap-1 rounded-md bg-success px-3 py-1.5 text-xs font-medium text-white hover:bg-success/90 disabled:opacity-50"
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
                {new Date(tip.tipTimestamp).toLocaleDateString("en-IN")}
              </p>
            </div>
          </div>

          {tip.rawPost && (
            <div className="mt-4">
              <p className="text-xs font-medium text-muted">Original Post</p>
              <div className="mt-1 rounded bg-bg p-3 text-sm text-text">
                {tip.rawPost.content}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
