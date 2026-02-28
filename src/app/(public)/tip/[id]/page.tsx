import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { TipStatusBadge } from "@/components/tip/tip-status-badge";
import { TipPriceChart } from "@/components/tip/tip-price-chart";
import { ScoreBadge } from "@/components/shared/score-badge";
import { ShareButton } from "@/components/shared/share-button";
import { StarRating } from "@/components/tip/star-rating";
import { BookmarkButton } from "@/components/tip/bookmark-button";
import { CommentSection } from "@/components/tip/comment-section";
import { TipExplanation } from "@/components/tip/tip-explanation";
import { formatPrice, formatPercent } from "@/lib/utils/format";
import { subDays } from "date-fns";

export const revalidate = 600; // 10 minutes

interface TipPageProps {
  params: Promise<{ id: string }>;
}

async function getTip(id: string) {
  try {
    const tip = await db.tip.findUnique({
      where: { id },
      include: {
        creator: { include: { currentScore: true } },
        stock: true,
        amendments: { orderBy: { amendedAt: "desc" } },
        explanation: true,
      },
    });

    if (!tip || tip.status === "REJECTED") return null;

    // Fetch price history for the stock (last 90 days)
    const ninetyDaysAgo = subDays(new Date(), 90);
    const priceHistory = await db.stockPrice.findMany({
      where: {
        stockId: tip.stockId,
        date: { gte: ninetyDaysAgo },
      },
      orderBy: { date: "desc" },
    });

    const priceData = priceHistory.map((p) => ({
      id: p.id,
      stockId: p.stockId,
      date: p.date.toISOString(),
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
      volume: p.volume !== null ? Number(p.volume) : null,
      source: p.source,
    }));

    return { ...tip, priceData };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: TipPageProps): Promise<Metadata> {
  const { id } = await params;
  const tip = await getTip(id);

  if (!tip) {
    return { title: "Tip Not Found" };
  }

  return {
    title: `${tip.direction} ${tip.stock.symbol} — ${tip.creator.displayName}`,
    description: `${tip.direction} tip for ${tip.stock.name} by ${tip.creator.displayName}. Entry: ${formatPrice(tip.entryPrice)}, Target: ${formatPrice(tip.target1)}, SL: ${formatPrice(tip.stopLoss)}. Status: ${tip.status}.`,
    openGraph: {
      title: `${tip.direction} ${tip.stock.symbol} | ${tip.creator.displayName} | RateMyTip`,
      description: `Entry: ${formatPrice(tip.entryPrice)} | Target: ${formatPrice(tip.target1)} | SL: ${formatPrice(tip.stopLoss)}`,
    },
  };
}

export default async function TipPage({
  params,
}: TipPageProps): Promise<React.ReactElement> {
  const { id } = await params;
  const tip = await getTip(id);

  if (!tip) notFound();

  const isBuy = tip.direction === "BUY";

  // Check if current user saved this tip
  const session = await auth();
  let isSaved = false;
  if (session?.user?.userId) {
    const saved = await db.savedTip.findUnique({
      where: { tipId_userId: { tipId: tip.id, userId: session.user.userId } },
    });
    isSaved = !!saved;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-center justify-between">
        <StarRating tipId={tip.id} avgRating={tip.avgRating} ratingCount={tip.ratingCount} />
        <div className="flex items-center gap-1">
          <BookmarkButton tipId={tip.id} initialSaved={isSaved} />
          <ShareButton title={`${tip.direction} ${tip.stock.symbol} by ${tip.creator.displayName} | RateMyTip`} />
        </div>
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white shadow-[0_1px_2px_0_rgba(26,54,93,0.04)] p-6">
        {/* Tip header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href={`/stock/${tip.stock.symbol}`}
                className="text-2xl font-bold text-gradient-primary hover:underline"
              >
                {tip.stock.symbol}
              </Link>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold text-white ${
                  isBuy
                    ? "bg-gradient-to-r from-green-500 to-emerald-400"
                    : "bg-gradient-to-r from-red-500 to-rose-400"
                }`}
              >
                {tip.direction}
              </span>
              <TipStatusBadge status={tip.status} />
            </div>
            <p className="mt-1 text-sm text-muted">{tip.stock.name}</p>
          </div>

          {tip.returnPct !== null && (
            <div className={`rounded-xl px-4 py-2 text-right ${
              tip.returnPct >= 0 ? "bg-green-50" : "bg-red-50"
            }`}>
              <p className="text-xs text-muted">Return</p>
              <p
                className={`text-2xl font-bold tabular-nums ${
                  tip.returnPct >= 0 ? "text-success" : "text-danger"
                }`}
              >
                {formatPercent(tip.returnPct)}
              </p>
            </div>
          )}
        </div>

        {/* Price details */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-gradient-to-b from-gray-50 to-white border border-gray-100 p-3">
            <p className="text-xs text-muted">Entry Price</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-text">
              {formatPrice(tip.entryPrice)}
            </p>
          </div>
          <div className="rounded-xl bg-gradient-to-b from-gray-50 to-white border border-gray-100 p-3">
            <p className="text-xs text-muted">Target 1</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-success">
              {formatPrice(tip.target1)}
            </p>
          </div>
          {tip.target2 !== null && (
            <div className="rounded-xl bg-gradient-to-b from-gray-50 to-white border border-gray-100 p-3">
              <p className="text-xs text-muted">Target 2</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-success">
                {formatPrice(tip.target2)}
              </p>
            </div>
          )}
          {tip.target3 !== null && (
            <div className="rounded-xl bg-gradient-to-b from-gray-50 to-white border border-gray-100 p-3">
              <p className="text-xs text-muted">Target 3</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-success">
                {formatPrice(tip.target3)}
              </p>
            </div>
          )}
          <div className="rounded-xl bg-gradient-to-b from-gray-50 to-white border border-gray-100 p-3">
            <p className="text-xs text-muted">Stop Loss</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-danger">
              {formatPrice(tip.stopLoss)}
            </p>
          </div>
        </div>

        {/* Price chart with entry/target/SL lines */}
        {tip.priceData.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-medium text-muted">Price Chart</p>
            <div className="mt-2">
              <TipPriceChart
                priceHistory={tip.priceData}
                entryPrice={tip.entryPrice}
                target1={tip.target1}
                target2={tip.target2}
                target3={tip.target3}
                stopLoss={tip.stopLoss}
                symbol={tip.stock.symbol}
              />
            </div>
          </div>
        )}

        {/* Details grid */}
        <div className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted">Timeframe</p>
            <p className="mt-0.5 font-medium text-text">{tip.timeframe}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Conviction</p>
            <p className="mt-0.5 font-medium text-text">{tip.conviction}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Asset Class</p>
            <p className="mt-0.5 font-medium text-text">{tip.assetClass}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Tip Date</p>
            <p className="mt-0.5 font-medium text-text">
              {new Date(tip.tipTimestamp).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Expires</p>
            <p className="mt-0.5 font-medium text-text">
              {new Date(tip.expiresAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          {tip.priceAtTip !== null && (
            <div>
              <p className="text-xs text-muted">CMP at Tip</p>
              <p className="mt-0.5 font-medium tabular-nums text-text">
                {formatPrice(tip.priceAtTip)}
              </p>
            </div>
          )}
          {tip.closedPrice !== null && (
            <div>
              <p className="text-xs text-muted">Closed Price</p>
              <p className="mt-0.5 font-medium tabular-nums text-text">
                {formatPrice(tip.closedPrice)}
              </p>
            </div>
          )}
          {tip.riskRewardRatio !== null && (
            <div>
              <p className="text-xs text-muted">Risk/Reward</p>
              <p className="mt-0.5 font-medium tabular-nums text-text">
                {tip.riskRewardRatio.toFixed(2)}
              </p>
            </div>
          )}
        </div>

        {/* Rationale */}
        {tip.rationale && (
          <div className="mt-6">
            <p className="text-xs font-medium text-muted">Rationale</p>
            <p className="mt-1 text-sm text-text">{tip.rationale}</p>
          </div>
        )}

        {/* Source */}
        {tip.sourceUrl && (
          <div className="mt-4">
            <a
              href={tip.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-accent hover:underline"
            >
              View original post
            </a>
          </div>
        )}

        {/* Content hash */}
        <div className="mt-6 border-t border-gray-200 pt-4">
          <p className="text-xs text-muted/60">
            Integrity hash: <code className="text-xs text-muted/60">{tip.contentHash}</code>
          </p>
        </div>
      </div>

      {/* Creator's Explanation */}
      {tip.explanation && (
        <div className="mt-6">
          <TipExplanation
            content={tip.explanation.content}
            imageUrls={tip.explanation.imageUrls}
            version={tip.explanation.version}
            updatedAt={tip.explanation.updatedAt.toISOString()}
          />
        </div>
      )}

      {/* Creator Mini Profile */}
      <div className="mt-6 rounded-2xl border border-gray-100 bg-white shadow-[0_1px_2px_0_rgba(26,54,93,0.04)] p-4">
        <Link
          href={`/creator/${tip.creator.slug}`}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            {tip.creator.profileImageUrl ? (
              <Image
                src={tip.creator.profileImageUrl}
                alt={tip.creator.displayName}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                {tip.creator.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-text">
                {tip.creator.displayName}
              </p>
              <p className="text-xs text-muted">
                {tip.creator.tier} &middot; {tip.creator.totalTips} tips
              </p>
            </div>
          </div>
          {tip.creator.currentScore && (
            <ScoreBadge score={tip.creator.currentScore.rmtScore} />
          )}
        </Link>
      </div>

      {/* Comments */}
      <div className="mt-6">
        <CommentSection tipId={tip.id} />
      </div>

      {/* Amendment history */}
      {tip.amendments.length > 0 && (
        <div className="mt-6 rounded-2xl border border-gray-100 bg-white shadow-[0_1px_2px_0_rgba(26,54,93,0.04)] p-4">
          <h3 className="text-sm font-semibold text-gradient-primary">
            Amendment History
          </h3>
          <div className="mt-3 space-y-2">
            {tip.amendments.map((amendment) => (
              <div
                key={amendment.id}
                className="rounded-xl bg-gray-50 p-2 text-xs text-muted"
              >
                <span className="font-medium">{amendment.field}</span> changed
                from <code>{amendment.oldValue}</code> to{" "}
                <code>{amendment.newValue}</code>
                {amendment.reason && ` — ${amendment.reason}`}
                <span className="ml-2">
                  {new Date(amendment.amendedAt).toLocaleDateString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
