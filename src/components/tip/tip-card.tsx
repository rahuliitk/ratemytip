import Link from "next/link";
import { TipStatusBadge } from "./tip-status-badge";
import { formatPrice, formatPercent } from "@/lib/utils/format";
import type { TipSummary } from "@/types";

interface TipCardProps {
  readonly tip: TipSummary;
  readonly showCreator?: boolean;
}

export function TipCard({ tip, showCreator = false }: TipCardProps): React.ReactElement {
  const isBuy = tip.direction === "BUY";

  return (
    <Link
      href={`/tip/${tip.id}`}
      data-tour="tip-card"
      className={`block rounded-xl border border-border/60 bg-surface p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
        isBuy ? "border-l-4 border-l-emerald-400" : "border-l-4 border-l-red-400"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-text">
              {tip.stockSymbol}
            </span>
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white ${
                isBuy
                  ? "bg-emerald-500"
                  : "bg-red-500"
              }`}
            >
              {tip.direction}
            </span>
            <TipStatusBadge status={tip.status} />
          </div>

          {showCreator && (
            <p className="mt-1 text-xs text-muted">
              {tip.stockName}
            </p>
          )}

          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted tabular-nums">
            <span>Entry: {formatPrice(tip.entryPrice)}</span>
            <span>T1: {formatPrice(tip.target1)}</span>
            {tip.target2 !== null && (
              <span>T2: {formatPrice(tip.target2)}</span>
            )}
            <span>SL: {formatPrice(tip.stopLoss)}</span>
          </div>

          <div className="mt-2 flex items-center gap-3 text-xs text-muted">
            <span className="rounded-md bg-bg-alt px-2 py-0.5 font-medium">{tip.timeframe}</span>
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
  );
}
