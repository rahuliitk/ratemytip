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
      <div className="flex h-48 items-center justify-center rounded-2xl bg-white shadow-[0_1px_2px_0_rgba(26,54,93,0.04)] text-sm text-[#718096]">
        No positions yet. Add tips to your portfolio to start tracking.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-[0_1px_3px_0_rgba(26,54,93,0.06),0_1px_2px_-1px_rgba(26,54,93,0.06)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-[#F7FAFC] text-left text-xs font-medium text-[#718096]">
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
                className="border-b border-gray-100 transition-colors hover:bg-[#F7FAFC]"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/stock/${entry.tip.stock.symbol}`}
                    className="font-medium text-[#2B6CB0] hover:underline"
                  >
                    {entry.tip.stock.symbol}
                  </Link>
                  <p className="text-xs text-[#718096] truncate max-w-[140px]">
                    {entry.tip.stock.name}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/creator/${entry.tip.creator.slug}`}
                    className="text-[#2B6CB0] hover:underline"
                  >
                    {entry.tip.creator.displayName}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    className={cn(
                      "text-xs",
                      entry.tip.direction === "BUY"
                        ? "border-transparent bg-[#C6F6D5] text-[#276749]"
                        : "border-transparent bg-[#FED7D7] text-[#C53030]"
                    )}
                  >
                    {entry.tip.direction}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatPrice(entry.entryPrice)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {currentPrice !== null ? formatPrice(currentPrice) : "-"}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {entry.quantity}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={cn(
                      "font-medium tabular-nums",
                      pnl > 0 && "text-[#276749]",
                      pnl < 0 && "text-[#C53030]",
                      pnl === 0 && "text-[#718096]"
                    )}
                  >
                    {pnl >= 0 ? "+" : ""}{formatPrice(pnl)}
                  </span>
                  {pnlPct !== null && (
                    <p
                      className={cn(
                        "text-xs tabular-nums",
                        pnlPct > 0 && "text-[#276749]",
                        pnlPct < 0 && "text-[#C53030]",
                        pnlPct === 0 && "text-[#718096]"
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
                        ? "border-transparent bg-[#BEE3F8] text-[#2B6CB0]"
                        : "border-transparent bg-gray-100 text-[#718096]"
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
