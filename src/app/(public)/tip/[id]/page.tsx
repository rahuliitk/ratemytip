import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { TipStatusBadge } from "@/components/tip/tip-status-badge";
import { ScoreBadge } from "@/components/shared/score-badge";
import { formatPrice, formatPercent } from "@/lib/utils/format";

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
      },
    });

    if (!tip || tip.status === "REJECTED") return null;
    return tip;
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-lg border border-gray-200 bg-surface p-6">
        {/* Tip header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href={`/stock/${tip.stock.symbol}`}
                className="text-2xl font-bold text-primary hover:underline"
              >
                {tip.stock.symbol}
              </Link>
              <span
                className={`rounded px-2 py-1 text-sm font-bold ${
                  isBuy
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {tip.direction}
              </span>
              <TipStatusBadge status={tip.status} />
            </div>
            <p className="mt-1 text-sm text-muted">{tip.stock.name}</p>
          </div>

          {tip.returnPct !== null && (
            <div className="text-right">
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
          <div className="rounded-md bg-bg p-3">
            <p className="text-xs text-muted">Entry Price</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-text">
              {formatPrice(tip.entryPrice)}
            </p>
          </div>
          <div className="rounded-md bg-bg p-3">
            <p className="text-xs text-muted">Target 1</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-success">
              {formatPrice(tip.target1)}
            </p>
          </div>
          {tip.target2 !== null && (
            <div className="rounded-md bg-bg p-3">
              <p className="text-xs text-muted">Target 2</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-success">
                {formatPrice(tip.target2)}
              </p>
            </div>
          )}
          {tip.target3 !== null && (
            <div className="rounded-md bg-bg p-3">
              <p className="text-xs text-muted">Target 3</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-success">
                {formatPrice(tip.target3)}
              </p>
            </div>
          )}
          <div className="rounded-md bg-bg p-3">
            <p className="text-xs text-muted">Stop Loss</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-danger">
              {formatPrice(tip.stopLoss)}
            </p>
          </div>
        </div>

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
          <p className="text-xs text-muted">
            Integrity hash: <code className="text-xs">{tip.contentHash}</code>
          </p>
        </div>
      </div>

      {/* Creator Mini Profile */}
      <div className="mt-6 rounded-lg border border-gray-200 bg-surface p-4">
        <Link
          href={`/creator/${tip.creator.slug}`}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            {tip.creator.profileImageUrl ? (
              <img
                src={tip.creator.profileImageUrl}
                alt={tip.creator.displayName}
                className="h-10 w-10 rounded-full object-cover"
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

      {/* Amendment history */}
      {tip.amendments.length > 0 && (
        <div className="mt-6 rounded-lg border border-gray-200 bg-surface p-4">
          <h3 className="text-sm font-semibold text-primary">
            Amendment History
          </h3>
          <div className="mt-3 space-y-2">
            {tip.amendments.map((amendment) => (
              <div
                key={amendment.id}
                className="rounded bg-bg p-2 text-xs text-muted"
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
