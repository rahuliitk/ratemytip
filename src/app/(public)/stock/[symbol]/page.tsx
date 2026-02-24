import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { StockHeader } from "@/components/stock/stock-header";
import { StockConsensus } from "@/components/stock/stock-consensus";
import { StockPriceChart } from "@/components/stock/stock-price-chart";
import { StockTipFeed } from "@/components/stock/stock-tip-feed";
import { ScoreBadge } from "@/components/shared/score-badge";
import { ShareButton } from "@/components/shared/share-button";
import { subDays } from "date-fns";

export const revalidate = 300; // 5 minutes

interface StockPageProps {
  params: Promise<{ symbol: string }>;
}

async function getStockData(symbol: string) {
  try {
    const stock = await db.stock.findUnique({
      where: { symbol: symbol.toUpperCase() },
      include: {
        tips: {
          where: { status: { not: "REJECTED" } },
          include: {
            stock: true,
            creator: { include: { currentScore: true } },
          },
          orderBy: { tipTimestamp: "desc" },
          take: 30,
        },
      },
    });

    if (!stock || !stock.isActive) return null;

    // Calculate consensus
    const bullish = stock.tips.filter((t) => t.direction === "BUY").length;
    const bearish = stock.tips.filter((t) => t.direction === "SELL").length;

    // Find top creators by accuracy on this stock
    const creatorMap = new Map<string, { creator: typeof stock.tips[0]["creator"]; hits: number; total: number }>();
    for (const tip of stock.tips) {
      const existing = creatorMap.get(tip.creatorId) ?? { creator: tip.creator, hits: 0, total: 0 };
      existing.total++;
      if (
        tip.status === "TARGET_1_HIT" ||
        tip.status === "TARGET_2_HIT" ||
        tip.status === "TARGET_3_HIT" ||
        tip.status === "ALL_TARGETS_HIT"
      ) {
        existing.hits++;
      }
      creatorMap.set(tip.creatorId, existing);
    }

    const topCreators = Array.from(creatorMap.values())
      .filter((c) => c.total >= 3)
      .sort((a, b) => b.hits / b.total - a.hits / a.total)
      .slice(0, 5);

    // Fetch price history for chart
    const ninetyDaysAgo = subDays(new Date(), 90);
    const priceHistory = await db.stockPrice.findMany({
      where: {
        stockId: stock.id,
        date: { gte: ninetyDaysAgo },
      },
      orderBy: { date: "desc" },
    });

    const priceData = priceHistory.map((p) => ({
      id: p.id,
      stockId: p.stockId,
      date: p.date.toISOString(),
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
      volume: p.volume !== null ? Number(p.volume) : null,
      source: p.source,
    }));

    return { stock, bullish, bearish, topCreators, priceData };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: StockPageProps): Promise<Metadata> {
  const { symbol } = await params;
  const data = await getStockData(symbol);

  if (!data) {
    return { title: "Stock Not Found" };
  }

  const { stock, bullish, bearish } = data;
  const totalTips = stock.tips.length;

  return {
    title: `${stock.symbol} Stock Tips — ${totalTips} Tips Tracked`,
    description: `See all stock tips for ${stock.name} (${stock.symbol}) across multiple analysts. ${bullish} bullish, ${bearish} bearish tips. Verified by RateMyTip.`,
    openGraph: {
      title: `${stock.symbol} Stock Tips | RateMyTip`,
      description: `${totalTips} tips tracked for ${stock.name}. ${bullish} bullish, ${bearish} bearish.`,
    },
  };
}

export default async function StockPage({
  params,
}: StockPageProps): Promise<React.ReactElement> {
  const { symbol } = await params;
  const data = await getStockData(symbol);

  if (!data) notFound();

  const { stock, bullish, bearish, topCreators, priceData } = data;

  const tipSummaries = stock.tips.map((tip) => ({
    id: tip.id,
    creatorId: tip.creatorId,
    stockId: tip.stockId,
    stockSymbol: tip.stock.symbol,
    stockName: tip.stock.name,
    direction: tip.direction,
    assetClass: tip.assetClass,
    entryPrice: tip.entryPrice,
    target1: tip.target1,
    target2: tip.target2,
    target3: tip.target3,
    stopLoss: tip.stopLoss,
    timeframe: tip.timeframe,
    conviction: tip.conviction,
    status: tip.status,
    tipTimestamp: tip.tipTimestamp.toISOString(),
    expiresAt: tip.expiresAt.toISOString(),
    returnPct: tip.returnPct,
    sourceUrl: tip.sourceUrl,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <StockHeader
        symbol={stock.symbol}
        name={stock.name}
        exchange={stock.exchange}
        sector={stock.sector}
        marketCap={stock.marketCap}
        lastPrice={stock.lastPrice}
      />
        </div>
        <ShareButton title={`${stock.symbol} Stock Tips | RateMyTip`} />
      </div>

      {/* Price Chart */}
      {priceData.length > 0 && (
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-[0_1px_3px_0_rgba(26,54,93,0.06),0_1px_2px_-1px_rgba(26,54,93,0.06)]">
          <h2 className="text-lg font-bold text-gradient-primary">Price History</h2>
          <p className="mt-1 text-sm text-muted">Last 90 days</p>
          <div className="mt-4">
            <StockPriceChart priceHistory={priceData} symbol={stock.symbol} />
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2">
          <StockTipFeed initialTips={tipSummaries} stockSymbol={stock.symbol} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <StockConsensus bullish={bullish} bearish={bearish} />

          {/* Top Creators for this stock */}
          {topCreators.length > 0 && (
            <div className="rounded-2xl bg-white p-4 shadow-[0_1px_3px_0_rgba(26,54,93,0.06),0_1px_2px_-1px_rgba(26,54,93,0.06)]">
              <h3 className="text-sm font-bold text-gradient-primary">
                Top Creators for {stock.symbol}
              </h3>
              <div className="mt-3 space-y-1">
                {topCreators.map(({ creator, hits, total }) => (
                  <Link
                    key={creator.id}
                    href={`/creator/${creator.slug}`}
                    className="flex items-center justify-between rounded-xl px-2.5 py-2 transition-colors duration-200 hover:bg-[#2B6CB0]/5"
                  >
                    <span className="text-sm font-medium text-text">
                      {creator.displayName}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs tabular-nums text-muted">
                        {hits}/{total} hits
                      </span>
                      {creator.currentScore && (
                        <ScoreBadge
                          score={creator.currentScore.rmtScore}
                          size="sm"
                        />
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FinancialProduct",
            name: stock.name,
            identifier: stock.symbol,
          }),
        }}
      />
    </div>
  );
}
