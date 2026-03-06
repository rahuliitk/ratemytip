"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatPercent } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface PositionTip {
  readonly id: string;
  readonly direction: string;
  readonly status: string;
  readonly timeframe: string;
  readonly stock: {
    readonly symbol: string;
    readonly name: string;
    readonly lastPrice: number | null;
  };
  readonly creator: {
    readonly slug: string;
    readonly displayName: string;
  };
}

interface PortfolioEntry {
  readonly id: string;
  readonly status: "OPEN" | "CLOSED";
  readonly entryPrice: number;
  readonly quantity: number;
  readonly closedPrice: number | null;
  readonly unrealizedPnl: number | null;
  readonly realizedPnl: number | null;
  readonly notes: string | null;
  readonly tip: PositionTip;
}

interface PortfolioPositionsProps {
  readonly entries: readonly PortfolioEntry[];
}

function getPnlValue(entry: PortfolioEntry): number {
  if (entry.status === "CLOSED") {
    return entry.realizedPnl ?? 0;
  }
  return entry.unrealizedPnl ?? 0;
}

function getCurrentPrice(entry: PortfolioEntry): number | null {
  if (entry.status === "CLOSED") {
    return entry.closedPrice;
  }
  return entry.tip.stock.lastPrice;
}

export function PortfolioPositions({ entries }: PortfolioPositionsProps): React.ReactElement {
  if (entries.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border bg-surface text-sm text-muted">
        No positions yet. Add tips to your portfolio to start tracking.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border/60 bg-surface shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/60 bg-bg-alt text-left text-xs font-medium text-muted">
            <th className="px-4 py-3">Stock</th>
            <th className="px-4 py-3">Creator</th>
            <th className="px-4 py-3">Direction</th>
            <th className="px-4 py-3 text-right">Entry Price</th>
            <th className="px-4 py-3 text-right">Current / Close</th>
            <th className="px-4 py-3 text-right">Qty</th>
            <th className="px-4 py-3 text-right">P&L</th>
            <th className="px-4 py-3 text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const pnl = getPnlValue(entry);
            const currentPrice = getCurrentPrice(entry);
            const pnlPct = entry.entryPrice > 0 && currentPrice !== null
              ? ((currentPrice - entry.entryPrice) / entry.entryPrice) * 100 * (entry.tip.direction === "BUY" ? 1 : -1)
              : null;

            return (
              <tr
                key={entry.id}
                className="border-b border-border/40 transition-colors hover:bg-bg"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/stock/${entry.tip.stock.symbol}`}
                    className="font-medium text-accent hover:underline"
                  >
                    {entry.tip.stock.symbol}
                  </Link>
                  <p className="text-xs text-muted truncate max-w-[140px]">
                    {entry.tip.stock.name}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/creator/${entry.tip.creator.slug}`}
                    className="text-accent hover:underline"
                  >
                    {entry.tip.creator.displayName}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    className={cn(
                      "text-xs",
                      entry.tip.direction === "BUY"
                        ? "border-transparent bg-success-light text-success"
                        : "border-transparent bg-danger-light text-danger"
                    )}
                  >
                    {entry.tip.direction}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-text">
                  {formatPrice(entry.entryPrice)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-text">
                  {currentPrice !== null ? formatPrice(currentPrice) : "-"}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-text">
                  {entry.quantity}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={cn(
                      "font-medium tabular-nums",
                      pnl > 0 && "text-emerald-600",
                      pnl < 0 && "text-red-600",
                      pnl === 0 && "text-muted"
                    )}
                  >
                    {pnl >= 0 ? "+" : ""}{formatPrice(pnl)}
                  </span>
                  {pnlPct !== null && (
                    <p
                      className={cn(
                        "text-xs tabular-nums",
                        pnlPct > 0 && "text-emerald-600",
                        pnlPct < 0 && "text-red-600",
                        pnlPct === 0 && "text-muted"
                      )}
                    >
                      {formatPercent(pnlPct, 1)}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge
                    className={cn(
                      "text-xs",
                      entry.status === "OPEN"
                        ? "border-transparent bg-accent-light text-accent"
                        : "border-transparent bg-bg-alt text-muted"
                    )}
                  >
                    {entry.status}
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
