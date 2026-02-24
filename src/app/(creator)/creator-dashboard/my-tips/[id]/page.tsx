import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { TipStatusBadge } from "@/components/tip/tip-status-badge";
import { TipExplanation } from "@/components/tip/tip-explanation";
import { formatPrice } from "@/lib/utils/format";
import type { TipStatus } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CreatorTipDetailPage({
  params,
}: PageProps): Promise<React.ReactElement> {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.userId) {
    notFound();
  }

  // Get the creator ID for this user
  const user = await db.user.findUnique({
    where: { id: session.user.userId },
    select: { claimedCreatorId: true },
  });

  if (!user?.claimedCreatorId) {
    notFound();
  }

  const tip = await db.tip.findUnique({
    where: { id },
    include: {
      stock: { select: { symbol: true, name: true, lastPrice: true } },
      explanation: true,
    },
  });

  if (!tip || tip.creatorId !== user.claimedCreatorId) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/creator-dashboard/my-tips"
        className="text-sm text-accent hover:underline"
      >
        &larr; Back to My Tips
      </Link>

      {/* Tip header */}
      <div className="mt-4 rounded-2xl bg-white shadow-[0_1px_3px_0_rgba(26,54,93,0.06),0_1px_2px_-1px_rgba(26,54,93,0.06)] p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`rounded px-2 py-1 text-sm font-bold ${
                tip.direction === "BUY"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {tip.direction}
            </span>
            <div>
              <h1 className="text-xl font-bold text-text">
                {tip.stock.symbol}
              </h1>
              <p className="text-sm text-muted">{tip.stock.name}</p>
            </div>
          </div>
          <TipStatusBadge status={tip.status as TipStatus} />
        </div>

        {/* Price details */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted">Entry Price</p>
            <p className="text-sm font-semibold tabular-nums text-text">
              {formatPrice(tip.entryPrice)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Target 1</p>
            <p className="text-sm font-semibold tabular-nums text-success">
              {formatPrice(tip.target1)}
            </p>
          </div>
          {tip.target2 && (
            <div>
              <p className="text-xs text-muted">Target 2</p>
              <p className="text-sm font-semibold tabular-nums text-success">
                {formatPrice(tip.target2)}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted">Stop Loss</p>
            <p className="text-sm font-semibold tabular-nums text-danger">
              {formatPrice(tip.stopLoss)}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted">Timeframe</p>
            <p className="text-sm text-text">{tip.timeframe}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Conviction</p>
            <p className="text-sm text-text">{tip.conviction}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Current Price</p>
            <p className="text-sm font-semibold tabular-nums text-text">
              {tip.stock.lastPrice ? formatPrice(tip.stock.lastPrice) : "N/A"}
            </p>
          </div>
          {tip.returnPct !== null && (
            <div>
              <p className="text-xs text-muted">Return</p>
              <p
                className={`text-sm font-semibold tabular-nums ${
                  tip.returnPct >= 0 ? "text-success" : "text-danger"
                }`}
              >
                {tip.returnPct >= 0 ? "+" : ""}
                {tip.returnPct.toFixed(2)}%
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-4 border-t border-gray-100 pt-4 text-xs text-muted">
          <span>Posted: {new Date(tip.tipTimestamp).toLocaleDateString()}</span>
          <span>Expires: {new Date(tip.expiresAt).toLocaleDateString()}</span>
          <span>Source: {tip.source}</span>
        </div>
      </div>

      {/* Engagement stats */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white shadow-[0_1px_3px_0_rgba(26,54,93,0.06),0_1px_2px_-1px_rgba(26,54,93,0.06)] p-3 text-center">
          <p className="text-lg font-bold tabular-nums text-text">{tip.commentCount}</p>
          <p className="text-xs text-muted">Comments</p>
        </div>
        <div className="rounded-2xl bg-white shadow-[0_1px_3px_0_rgba(26,54,93,0.06),0_1px_2px_-1px_rgba(26,54,93,0.06)] p-3 text-center">
          <p className="text-lg font-bold tabular-nums text-text">{tip.ratingCount}</p>
          <p className="text-xs text-muted">Ratings</p>
        </div>
        <div className="rounded-2xl bg-white shadow-[0_1px_3px_0_rgba(26,54,93,0.06),0_1px_2px_-1px_rgba(26,54,93,0.06)] p-3 text-center">
          <p className="text-lg font-bold tabular-nums text-text">{tip.saveCount}</p>
          <p className="text-xs text-muted">Saves</p>
        </div>
      </div>

      {/* Explanation section */}
      <div className="mt-6">
        <h2 className="text-lg font-bold text-gradient-primary">Explanation</h2>
        {tip.explanation ? (
          <div className="mt-3">
            <TipExplanation
              content={tip.explanation.content}
              imageUrls={tip.explanation.imageUrls}
              version={tip.explanation.version}
              updatedAt={tip.explanation.updatedAt.toISOString()}
            />
            <Link
              href={`/api/v1/tips/${tip.id}/explanation`}
              className="mt-2 inline-block text-sm text-accent hover:underline"
            >
              Edit explanation
            </Link>
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-dashed border-gray-200 p-6 text-center">
            <p className="text-sm text-muted">
              No explanation yet. Add analysis to help your followers understand your rationale.
            </p>
          </div>
        )}
      </div>

      {tip.rationale && (
        <div className="mt-6">
          <h2 className="text-lg font-bold text-gradient-primary">Original Rationale</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-text">
            {tip.rationale}
          </p>
        </div>
      )}
    </div>
  );
}
