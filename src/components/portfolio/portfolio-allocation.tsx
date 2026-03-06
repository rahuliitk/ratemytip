"use client";

import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils/format";

interface SectorAllocation {
  readonly sector: string;
  readonly count: number;
  readonly value: number;
}

interface PortfolioAllocationProps {
  readonly sectors: readonly SectorAllocation[];
}

const SECTOR_COLORS = [
  "bg-accent",
  "bg-success",
  "bg-warning",
  "bg-primary",
  "bg-danger",
  "bg-violet-600",
  "bg-teal-600",
  "bg-amber-600",
  "bg-muted",
  "bg-pink-700",
] as const;

export function PortfolioAllocation({ sectors }: PortfolioAllocationProps): React.ReactElement {
  if (sectors.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted">
        No allocation data available.
      </div>
    );
  }

  const totalValue = sectors.reduce((sum, s) => sum + s.value, 0);

  const sorted = [...sectors].sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-3">
      {sorted.map((sector, index) => {
        const pct = totalValue > 0 ? (sector.value / totalValue) * 100 : 0;
        const colorClass = SECTOR_COLORS[index % SECTOR_COLORS.length];

        return (
          <div key={sector.sector}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className={cn("h-3 w-3 rounded-sm", colorClass)} />
                <span className="font-medium text-text">
                  {sector.sector || "Unknown"}
                </span>
                <span className="text-xs text-muted">
                  {sector.count} {sector.count === 1 ? "position" : "positions"}
                </span>
              </div>
              <div className="flex items-center gap-3 tabular-nums">
                <span className="text-xs text-muted">
                  {pct.toFixed(1)}%
                </span>
                <span className="text-sm font-medium text-text">
                  {formatPrice(sector.value)}
                </span>
              </div>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-bg-alt">
              <div
                className={cn("h-full rounded-full transition-all duration-500", colorClass)}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
