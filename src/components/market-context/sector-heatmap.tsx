import Link from "next/link";
import { db } from "@/lib/db";

const SECTORS = [
  "IT",
  "Banking",
  "Pharma",
  "Auto",
  "FMCG",
  "Oil & Gas",
  "Metals",
  "Realty",
  "Infra",
  "Telecom",
] as const;

interface SectorData {
  sector: string;
  totalActive: number;
  buyCount: number;
  sellCount: number;
  buyPct: number;
}

async function getSectorData(): Promise<SectorData[]> {
  // Query all active tips joined with their stock's sector
  const activeTips = await db.tip.findMany({
    where: {
      status: "ACTIVE",
      stock: {
        sector: { not: null },
      },
    },
    select: {
      direction: true,
      stock: {
        select: {
          sector: true,
        },
      },
    },
  });

  // Group tips by sector
  const sectorMap = new Map<string, { buy: number; sell: number }>();

  // Initialize all tracked sectors
  for (const sector of SECTORS) {
    sectorMap.set(sector, { buy: 0, sell: 0 });
  }

  for (const tip of activeTips) {
    const sector = tip.stock.sector;
    if (!sector) continue;

    // Match the tip's stock sector to our predefined sector list
    const matchedSector = SECTORS.find(
      (s) => sector.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(sector.toLowerCase())
    );

    if (matchedSector) {
      const data = sectorMap.get(matchedSector) ?? { buy: 0, sell: 0 };
      if (tip.direction === "BUY") {
        data.buy++;
      } else {
        data.sell++;
      }
      sectorMap.set(matchedSector, data);
    }
  }

  const results: SectorData[] = [];
  for (const [sector, data] of sectorMap) {
    const total = data.buy + data.sell;
    results.push({
      sector,
      totalActive: total,
      buyCount: data.buy,
      sellCount: data.sell,
      buyPct: total > 0 ? (data.buy / total) * 100 : 50,
    });
  }

  // Sort by total active tips descending
  results.sort((a, b) => b.totalActive - a.totalActive);

  return results;
}

function getSectorSentiment(buyPct: number, totalActive: number): "bullish" | "bearish" | "neutral" {
  if (totalActive === 0) return "neutral";
  if (buyPct > 65) return "bullish";
  if (buyPct < 35) return "bearish";
  return "neutral";
}

function getSectorCardClasses(sentiment: "bullish" | "bearish" | "neutral"): string {
  switch (sentiment) {
    case "bullish":
      return "border-emerald-200 bg-emerald-50 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50";
    case "bearish":
      return "border-red-200 bg-red-50 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/30 dark:hover:bg-red-950/50";
    case "neutral":
      return "border-border/60 bg-surface hover:bg-bg-alt";
  }
}

function getSectorTextClasses(sentiment: "bullish" | "bearish" | "neutral"): string {
  switch (sentiment) {
    case "bullish":
      return "text-emerald-700 dark:text-emerald-400";
    case "bearish":
      return "text-red-700 dark:text-red-400";
    case "neutral":
      return "text-muted";
  }
}

export async function SectorHeatmap(): Promise<React.ReactElement> {
  const sectors = await getSectorData();

  const activeSectors = sectors.filter((s) => s.totalActive > 0);
  const inactiveSectors = sectors.filter((s) => s.totalActive === 0);

  return (
    <div>
      <h2 className="text-lg font-semibold text-text">Sector Sentiment Heatmap</h2>
      <p className="mt-1 text-sm text-muted">
        Active tips across market sectors, colored by bullish/bearish sentiment
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {sectors.map((sector) => {
          const sentiment = getSectorSentiment(sector.buyPct, sector.totalActive);
          const cardClasses = getSectorCardClasses(sentiment);
          const textClasses = getSectorTextClasses(sentiment);

          return (
            <Link
              key={sector.sector}
              href={`/tips?sector=${encodeURIComponent(sector.sector)}`}
              className={`group rounded-xl border p-4 shadow-sm transition-all duration-200 ${cardClasses}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text">{sector.sector}</h3>
                {sector.totalActive > 0 && (
                  <span className={`text-xs font-bold ${textClasses}`}>
                    {sentiment === "bullish"
                      ? "BULLISH"
                      : sentiment === "bearish"
                        ? "BEARISH"
                        : "MIXED"}
                  </span>
                )}
              </div>

              {sector.totalActive > 0 ? (
                <>
                  <p className="mt-1.5 text-xs text-muted">
                    {sector.totalActive} active tip{sector.totalActive !== 1 ? "s" : ""}
                  </p>

                  {/* Mini sentiment bar */}
                  <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-bg-alt">
                    {sector.buyCount > 0 && (
                      <div
                        className="bg-emerald-500 transition-all duration-300"
                        style={{ width: `${sector.buyPct}%` }}
                      />
                    )}
                    {sector.sellCount > 0 && (
                      <div
                        className="bg-red-500 transition-all duration-300"
                        style={{ width: `${100 - sector.buyPct}%` }}
                      />
                    )}
                  </div>

                  <div className="mt-1 flex justify-between text-[10px] tabular-nums text-muted">
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {sector.buyCount} BUY
                    </span>
                    <span className="text-red-600 dark:text-red-400">
                      {sector.sellCount} SELL
                    </span>
                  </div>
                </>
              ) : (
                <p className="mt-1.5 text-xs text-muted">No active tips</p>
              )}
            </Link>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-emerald-100 border border-emerald-300 dark:bg-emerald-900 dark:border-emerald-700" />
          <span>Bullish (&gt;65% BUY)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-red-100 border border-red-300 dark:bg-red-900 dark:border-red-700" />
          <span>Bearish (&gt;65% SELL)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-surface border border-border/60" />
          <span>Mixed / Neutral</span>
        </div>
      </div>
    </div>
  );
}
