"use client";

import { ReviewCard } from "./review-card";

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

interface ReviewQueueTableProps {
  readonly tips: readonly ReviewTipData[];
  readonly onApprove: (id: string) => Promise<void>;
  readonly onReject: (id: string) => Promise<void>;
  readonly actionLoadingId: string | null;
}

export function ReviewQueueTable({
  tips,
  onApprove,
  onReject,
  actionLoadingId,
}: ReviewQueueTableProps): React.ReactElement {
  if (tips.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-surface py-16 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
          <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="mt-3 text-sm font-medium text-text">All caught up!</p>
        <p className="mt-1 text-xs text-muted">
          No tips pending review.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tips.map((tip) => (
        <ReviewCard
          key={tip.id}
          tip={tip}
          onApprove={onApprove}
          onReject={onReject}
          isActionLoading={actionLoadingId === tip.id}
        />
      ))}
    </div>
  );
}
