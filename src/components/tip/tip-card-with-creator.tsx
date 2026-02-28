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
    <div className={`rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_1px_2px_0_rgba(26,54,93,0.04)] card-hover gradient-border-hover ${
      isBuy ? "border-l-4 border-l-green-400" : "border-l-4 border-l-red-400"
    }`}>
      {/* Creator row */}
      <div className="flex items-center gap-2">
        <Link
          href={`/creator/${creator.slug}`}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1A365D]/10 to-[#2B6CB0]/10 text-xs font-bold text-accent ring-1 ring-gray-100"
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
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-muted">
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
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${
                  isBuy
                    ? "bg-gradient-to-r from-green-500 to-emerald-400"
                    : "bg-gradient-to-r from-red-500 to-rose-400"
                }`}
              >
                {tip.direction}
              </span>
              <TipStatusBadge status={tip.status} />
            </div>

            <p className="mt-1 text-xs text-muted">{tip.stockName}</p>

            <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted tabular-nums">
              <span>Entry: {formatPrice(tip.entryPrice)}</span>
              <span>T1: {formatPrice(tip.target1)}</span>
              {tip.target2 !== null && (
                <span>T2: {formatPrice(tip.target2)}</span>
              )}
              <span>SL: {formatPrice(tip.stopLoss)}</span>
            </div>

            <div className="mt-2 flex items-center gap-3 text-xs text-muted">
              <span className="rounded-full bg-gray-100 px-2 py-0.5">{tip.timeframe.replace("_", " ")}</span>
              <span>{new Date(tip.tipTimestamp).toLocaleDateString("en-IN")}</span>
            </div>
          </div>

          {tip.returnPct !== null && (
            <div className="text-right">
              <span
                className={`inline-block rounded-xl px-2.5 py-1 text-lg font-bold tabular-nums ${
                  tip.returnPct >= 0
                    ? "bg-green-50 text-success"
                    : "bg-red-50 text-danger"
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
