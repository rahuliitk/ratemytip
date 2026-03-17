import Link from "next/link";
import Image from "next/image";
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
    <div className="rounded-xl border border-border/60 bg-surface p-4 shadow-sm transition-shadow duration-150 hover:shadow-md">
      {/* Creator row */}
      <div className="flex items-center gap-2">
        <Link
          href={`/creator/${creator.slug}`}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent"
        >
          {creator.profileImageUrl ? (
            <Image
              src={creator.profileImageUrl}
              alt={creator.displayName}
              width={28}
              height={28}
              className="h-7 w-7 rounded-full object-cover"
              unoptimized
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
        <span className="rounded-md bg-bg-alt px-2 py-0.5 text-[10px] font-medium text-muted">
          {creator.tier}
        </span>
        {creator.rmtScore !== null && (
          <ScoreBadge score={creator.rmtScore} size="sm" />
        )}
      </div>

      {/* Tip content -- links to tip detail */}
      <Link href={`/tip/${tip.id}`} className="mt-3 block">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-text">
                {tip.stockSymbol}
              </span>
              <span
                className={`rounded-md px-2 py-0.5 text-[10px] font-bold text-white ${
                  isBuy ? "bg-emerald-500" : "bg-red-500"
                }`}
              >
                {tip.direction}
              </span>
              <TipStatusBadge status={tip.status} />
            </div>

            <p className="mt-1 text-xs text-muted">{tip.stockName}</p>

            <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs tabular-nums text-muted">
              <span>Entry: {formatPrice(tip.entryPrice)}</span>
              <span className="text-emerald-600">T1: {formatPrice(tip.target1)}</span>
              {tip.target2 !== null && (
                <span className="text-emerald-600">T2: {formatPrice(tip.target2)}</span>
              )}
              <span className="text-red-600">SL: {formatPrice(tip.stopLoss)}</span>
            </div>

            <div className="mt-2 flex items-center gap-3 text-xs text-muted">
              <span className="rounded-md bg-bg-alt px-2 py-0.5">{tip.timeframe.replace("_", " ")}</span>
              <span>{new Date(tip.tipTimestamp).toLocaleDateString("en-IN")}</span>
            </div>
          </div>

          {tip.returnPct !== null && (
            <div className="text-right">
              <span
                className={`inline-block rounded-lg px-2.5 py-1 text-lg font-bold tabular-nums ${
                  tip.returnPct >= 0
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-red-50 text-red-600"
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
