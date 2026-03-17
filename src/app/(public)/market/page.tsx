import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { SectorHeatmap } from "@/components/market-context/sector-heatmap";

export const revalidate = 300; // 5 minutes

export const metadata: Metadata = {
  title: "Market Overview — Sector Sentiment & Tip Activity | RateMyTip",
  description:
    "See which sectors are seeing the most bullish and bearish activity from tracked creators. Sector heatmap powered by real tip data from verified analysts.",
  openGraph: {
    title: "Market Overview | RateMyTip",
    description:
      "Sector sentiment heatmap based on active tips from tracked creators and analysts.",
  },
};

async function getMarketStats() {
  const [activeTipCount, totalCreators, totalStocks] = await Promise.all([
    db.tip.count({ where: { status: "ACTIVE" } }),
    db.creator.count({ where: { isActive: true } }),
    db.stock.count({ where: { isActive: true } }),
  ]);

  // Get top active stocks by tip count
  const topStocks = await db.tip.groupBy({
    by: ["stockId"],
    where: { status: "ACTIVE" },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 5,
  });

  const stockIds = topStocks.map((s) => s.stockId);
  const stocks = await db.stock.findMany({
    where: { id: { in: stockIds } },
    select: { id: true, symbol: true, name: true, sector: true, lastPrice: true },
  });

  const stockMap = new Map(stocks.map((s) => [s.id, s]));

  const topActiveStocks = topStocks
    .map((s) => {
      const stock = stockMap.get(s.stockId);
      if (!stock) return null;
      return {
        symbol: stock.symbol,
        name: stock.name,
        sector: stock.sector,
        lastPrice: stock.lastPrice,
        activeTips: s._count.id,
      };
    })
    .filter(Boolean) as {
      symbol: string;
      name: string;
      sector: string | null;
      lastPrice: number | null;
      activeTips: number;
    }[];

  return {
    activeTipCount,
    totalCreators,
    totalStocks,
    topActiveStocks,
  };
}

export default async function MarketPage(): Promise<React.ReactElement> {
  const stats = await getMarketStats();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-text sm:text-3xl">Market Overview</h1>
        <p className="mt-2 text-sm text-muted">
          Sector sentiment and tip activity across the market, powered by real data from tracked creators.
        </p>
      </div>

      {/* Quick stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border/60 bg-surface p-4 shadow-sm">
          <p className="text-xs font-medium text-muted">Active Tips</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-text">
            {stats.activeTipCount.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-surface p-4 shadow-sm">
          <p className="text-xs font-medium text-muted">Tracked Creators</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-text">
            {stats.totalCreators.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-surface p-4 shadow-sm">
          <p className="text-xs font-medium text-muted">Tracked Stocks</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-text">
            {stats.totalStocks.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Sector Heatmap */}
      <div className="mt-8 rounded-xl border border-border/60 bg-surface p-6 shadow-sm">
        <SectorHeatmap />
      </div>

      {/* Most active stocks */}
      {stats.topActiveStocks.length > 0 && (
        <div className="mt-8 rounded-xl border border-border/60 bg-surface p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-text">Most Active Stocks</h2>
          <p className="mt-1 text-sm text-muted">
            Stocks with the highest number of active tips right now
          </p>

          <div className="mt-4 space-y-1">
            {stats.topActiveStocks.map((stock) => (
              <Link
                key={stock.symbol}
                href={`/stock/${stock.symbol}`}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors duration-150 hover:bg-bg-alt"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-text">{stock.symbol}</span>
                  <span className="hidden text-xs text-muted sm:inline">{stock.name}</span>
                  {stock.sector && (
                    <span className="hidden rounded-md bg-bg-alt px-2 py-0.5 text-[10px] text-muted lg:inline">
                      {stock.sector}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {stock.lastPrice !== null && (
                    <span className="text-xs tabular-nums text-muted">
                      {new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                        maximumFractionDigits: 2,
                      }).format(stock.lastPrice)}
                    </span>
                  )}
                  <span className="rounded-md bg-accent/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-accent">
                    {stock.activeTips} tip{stock.activeTips !== 1 ? "s" : ""}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Market context disclaimer */}
      <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
        <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-200">
          This data reflects active tips from tracked creators and does not constitute financial advice. Sector sentiment is based on the direction of active tips and may not reflect actual market conditions. Always do your own research before making investment decisions.
        </p>
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Market Overview - RateMyTip",
            description:
              "Sector sentiment and tip activity across the Indian stock market.",
            url: "https://ratemytip.com/market",
          }),
        }}
      />
    </div>
  );
}
