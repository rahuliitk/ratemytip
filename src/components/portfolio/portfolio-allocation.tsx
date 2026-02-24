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
  "bg-[#2B6CB0]",
  "bg-[#276749]",
  "bg-[#C05621]",
  "bg-[#1A365D]",
  "bg-[#9B2C2C]",
  "bg-[#6B46C1]",
  "bg-[#2C7A7B]",
  "bg-[#975A16]",
  "bg-[#4A5568]",
  "bg-[#702459]",
] as const;

export function PortfolioAllocation({ sectors }: PortfolioAllocationProps): React.ReactElement {
  if (sectors.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-gray-200 bg-white text-sm text-[#718096]">
        No allocation data available.
      </div>
    );
  }

  const totalValue = sectors.reduce((sum, s) => sum + s.value, 0);

  const sorted = [...sectors].sort((a, b) => b.value - a.value);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-4 text-sm font-semibold text-[#1A202C]">Sector Allocation</h3>
      <div className="space-y-3">
        {sorted.map((sector, index) => {
          const pct = totalValue > 0 ? (sector.value / totalValue) * 100 : 0;
          const colorClass = SECTOR_COLORS[index % SECTOR_COLORS.length];

          return (
            <div key={sector.sector}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={cn("h-3 w-3 rounded-sm", colorClass)} />
                  <span className="font-medium text-[#1A202C]">
                    {sector.sector || "Unknown"}
                  </span>
                  <span className="text-xs text-[#718096]">
                    {sector.count} {sector.count === 1 ? "position" : "positions"}
                  </span>
                </div>
                <div className="flex items-center gap-3 tabular-nums">
                  <span className="text-xs text-[#718096]">
                    {pct.toFixed(1)}%
                  </span>
                  <span className="text-sm font-medium text-[#1A202C]">
                    {formatPrice(sector.value)}
                  </span>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className={cn("h-full rounded-full transition-all", colorClass)}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
