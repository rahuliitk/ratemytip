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
      <div className="rounded-2xl bg-white shadow-[0_1px_3px_0_rgba(26,54,93,0.06),0_1px_2px_-1px_rgba(26,54,93,0.06)] py-16 text-center">
        <p className="text-sm text-muted">
          No tips pending review. All caught up!
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
