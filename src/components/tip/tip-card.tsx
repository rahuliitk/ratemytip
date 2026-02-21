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
      className="block rounded-lg border border-gray-200 bg-surface p-4 transition-shadow hover:shadow-md"
    >
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

          {showCreator && (
            <p className="mt-1 text-xs text-muted">
              {tip.stockName}
            </p>
          )}

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted tabular-nums">
            <span>Entry: {formatPrice(tip.entryPrice)}</span>
            <span>T1: {formatPrice(tip.target1)}</span>
            {tip.target2 !== null && (
              <span>T2: {formatPrice(tip.target2)}</span>
            )}
            <span>SL: {formatPrice(tip.stopLoss)}</span>
          </div>

          <div className="mt-1.5 flex items-center gap-3 text-xs text-muted">
            <span>{tip.timeframe}</span>
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
  );
}
