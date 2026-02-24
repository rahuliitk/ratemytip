import Link from "next/link";
import { TipStatusBadge } from "./tip-status-badge";
import { ScoreBadge } from "@/components/shared/score-badge";
import { formatPrice, formatPercent } from "@/lib/utils/format";
import type { TipWithCreator } from "@/types";

interface TipCardWithCreatorProps {
  readonly tip: TipWithCreator;
}

export function TipCardWithCreator({ tip }: TipCardWithCreatorProps): React.ReactElement {
  const isBuy = tip.direction === "BUY";
  const { creator } = tip;

  return (
    <div className="rounded-lg border border-gray-200 bg-surface p-4 transition-shadow hover:shadow-md">
      {/* Creator row */}
      <div className="flex items-center gap-2">
        <Link
          href={`/creator/${creator.slug}`}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent"
        >
          {creator.profileImageUrl ? (
            <img
              src={creator.profileImageUrl}
              alt={creator.displayName}
              className="h-7 w-7 rounded-full object-cover"
            />
          ) : (
            creator.displayName.charAt(0).toUpperCase()
          )}
        </Link>
        <Link
          href={`/creator/${creator.slug}`}
          className="truncate text-sm font-medium text-text hover:underline"
        >
          {creator.displayName}
        </Link>
        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-muted">
          {creator.tier}
        </span>
        {creator.rmtScore !== null && (
          <ScoreBadge score={creator.rmtScore} size="sm" />
        )}
      </div>

      {/* Tip content — links to tip detail */}
      <Link href={`/tip/${tip.id}`} className="mt-3 block">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-primary">
                {tip.stockSymbol}
              </span>
              <span
                className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                  isBuy
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {tip.direction}
              </span>
              <TipStatusBadge status={tip.status} />
            </div>

            <p className="mt-1 text-xs text-muted">{tip.stockName}</p>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted tabular-nums">
              <span>Entry: {formatPrice(tip.entryPrice)}</span>
              <span>T1: {formatPrice(tip.target1)}</span>
              {tip.target2 !== null && (
                <span>T2: {formatPrice(tip.target2)}</span>
              )}
              <span>SL: {formatPrice(tip.stopLoss)}</span>
            </div>

            <div className="mt-1.5 flex items-center gap-3 text-xs text-muted">
              <span>{tip.timeframe.replace("_", " ")}</span>
              <span>{new Date(tip.tipTimestamp).toLocaleDateString("en-IN")}</span>
            </div>
          </div>

          {tip.returnPct !== null && (
            <div className="text-right">
              <span
                className={`text-sm font-semibold tabular-nums ${
                  tip.returnPct >= 0 ? "text-success" : "text-danger"
                }`}
              >
                {formatPercent(tip.returnPct)}
              </span>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
