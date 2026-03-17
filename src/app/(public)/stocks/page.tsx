import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils/format";
import { ShareButton } from "@/components/shared/share-button";

export const revalidate = 300; // 5 minutes

export const metadata: Metadata = {
  title: "Stocks — All Tracked Stocks with Analyst Tips | RateMyTip",
  description:
    "Browse all stocks tracked by RateMyTip. See analyst tips, consensus ratings, and target prices for NSE, BSE, and other exchanges.",
};

interface StocksPageProps {
  searchParams: Promise<{
    search?: string;
    exchange?: string;
    sort?: string;
    page?: string;
  }>;
}

const PAGE_SIZE = 30;

async function getStocksData(params: {
  search?: string;
  exchange?: string;
  sort?: string;
  page?: string;
}) {
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  // Build where clause
  const where: Record<string, unknown> = { isActive: true };

  if (params.search) {
    where.OR = [
      { symbol: { contains: params.search.toUpperCase(), mode: "insensitive" } },
      { name: { contains: params.search, mode: "insensitive" } },
    ];
  }

  if (params.exchange) {
    where.exchange = params.exchange.toUpperCase();
  }

  // Build orderBy
  type OrderBy = Record<string, "asc" | "desc">;
  let orderBy: OrderBy[];
  switch (params.sort) {
    case "name":
      orderBy = [{ name: "asc" }];
      break;
    case "price_desc":
      orderBy = [{ lastPrice: "desc" }];
      break;
    case "price_asc":
      orderBy = [{ lastPrice: "asc" }];
      break;
    case "symbol":
      orderBy = [{ symbol: "asc" }];
      break;
    default:
      // Default: most tips first
      orderBy = [{ symbol: "asc" }];
      break;
  }

  const [stocks, total] = await Promise.all([
    db.stock.findMany({
      where,
      orderBy,
      skip,
      take: PAGE_SIZE,
      include: {
        _count: { select: { tips: true } },
        tips: {
          where: { status: { not: "REJECTED" } },
          select: { direction: true, status: true },
        },
      },
    }),
    db.stock.count({ where }),
  ]);

  const stocksWithStats = stocks.map((stock) => {
    const bullish = stock.tips.filter((t) => t.direction === "BUY").length;
    const bearish = stock.tips.filter((t) => t.direction === "SELL").length;
    const activeTips = stock.tips.filter(
      (t) =>
        t.status === "ACTIVE" ||
        t.status === "TARGET_1_HIT" ||
        t.status === "TARGET_2_HIT"
    ).length;

    return {
      id: stock.id,
      symbol: stock.symbol,
      name: stock.name,
      exchange: stock.exchange,
      sector: stock.sector,
      marketCap: stock.marketCap,
      lastPrice: stock.lastPrice,
      totalTips: stock._count.tips,
      activeTips,
      bullish,
      bearish,
    };
  });

  return {
    stocks: stocksWithStats,
    total,
    page,
    totalPages: Math.ceil(total / PAGE_SIZE),
  };
}

export default async function StocksPage({
  searchParams,
}: StocksPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const { stocks, total, page, totalPages } = await getStocksData(params);

  const currentSearch = params.search ?? "";
  const currentExchange = params.exchange ?? "";
  const currentSort = params.sort ?? "";

  // Build query string helper
  function buildQuery(overrides: Record<string, string>): string {
    const p: Record<string, string> = {};
    if (currentSearch) p.search = currentSearch;
    if (currentExchange) p.exchange = currentExchange;
    if (currentSort) p.sort = currentSort;
    Object.assign(p, overrides);
    // Remove empty values
    for (const key of Object.keys(p)) {
      if (!p[key]) delete p[key];
    }
    const qs = new URLSearchParams(p).toString();
    return qs ? `?${qs}` : "";
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text sm:text-3xl">Stocks</h1>
          <p className="mt-1 text-sm text-muted">
            {total} stocks tracked across all exchanges
          </p>
        </div>
        <ShareButton title="Tracked Stocks | RateMyTip" />
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {/* Search */}
        <form className="flex-1 min-w-[200px]">
          {currentExchange && (
            <input type="hidden" name="exchange" value={currentExchange} />
          )}
          {currentSort && (
            <input type="hidden" name="sort" value={currentSort} />
          )}
          <input
            type="text"
            name="search"
            placeholder="Search by name or symbol..."
            defaultValue={currentSearch}
            className="w-full rounded-lg border border-border/60 bg-surface px-4 py-2 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </form>

        {/* Exchange filter */}
        <div className="flex gap-1 rounded-lg bg-bg-alt p-1">
          {["", "NSE", "BSE"].map((ex) => (
            <Link
              key={ex}
              href={`/stocks${buildQuery({ exchange: ex, page: "" })}`}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                currentExchange === ex
                  ? "bg-accent text-white shadow-sm"
                  : "text-muted hover:text-text"
              }`}
            >
              {ex || "All"}
            </Link>
          ))}
        </div>

        {/* Sort */}
        <div className="flex gap-1 rounded-lg bg-bg-alt p-1">
          {[
            { value: "", label: "A-Z" },
            { value: "price_desc", label: "Price ↓" },
            { value: "price_asc", label: "Price ↑" },
          ].map(({ value, label }) => (
            <Link
              key={value}
              href={`/stocks${buildQuery({ sort: value, page: "" })}`}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                currentSort === value
                  ? "bg-accent text-white shadow-sm"
                  : "text-muted hover:text-text"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Stocks Grid */}
      {stocks.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stocks.map((stock) => (
            <Link
              key={stock.id}
              href={`/stock/${stock.symbol}`}
              className="group rounded-xl border border-border/60 bg-surface p-5 shadow-sm transition-all duration-200 hover:border-accent/40 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-text group-hover:text-accent transition-colors">
                      {stock.symbol}
                    </h3>
                    <span className="rounded bg-bg-alt px-1.5 py-0.5 text-[10px] font-medium text-muted">
                      {stock.exchange}
                    </span>
                    {stock.marketCap && (
                      <span className="rounded bg-bg-alt px-1.5 py-0.5 text-[10px] text-muted">
                        {stock.marketCap}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted">
                    {stock.name}
                  </p>
                  {stock.sector && (
                    <p className="mt-0.5 text-xs text-muted-light">
                      {stock.sector}
                    </p>
                  )}
                </div>
                {stock.lastPrice !== null && (
                  <p className="text-lg font-bold tabular-nums text-text">
                    {formatPrice(stock.lastPrice)}
                  </p>
                )}
              </div>

              {/* Tip stats */}
              <div className="mt-4 flex items-center gap-4 text-xs">
                <span className="font-medium text-muted">
                  {stock.totalTips} tip{stock.totalTips !== 1 ? "s" : ""}
                </span>
                {stock.activeTips > 0 && (
                  <span className="text-accent">
                    {stock.activeTips} active
                  </span>
                )}
                {(stock.bullish > 0 || stock.bearish > 0) && (
                  <div className="ml-auto flex items-center gap-2">
                    {stock.bullish > 0 && (
                      <span className="font-medium text-emerald-600">
                        {stock.bullish} Buy
                      </span>
                    )}
                    {stock.bearish > 0 && (
                      <span className="font-medium text-red-600">
                        {stock.bearish} Sell
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Consensus bar */}
              {stock.bullish + stock.bearish > 0 && (
                <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-bg-alt">
                  <div
                    className="bg-emerald-500 transition-all"
                    style={{
                      width: `${(stock.bullish / (stock.bullish + stock.bearish)) * 100}%`,
                    }}
                  />
                  <div
                    className="bg-red-500 transition-all"
                    style={{
                      width: `${(stock.bearish / (stock.bullish + stock.bearish)) * 100}%`,
                    }}
                  />
                </div>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-12 text-center">
          <p className="text-muted">
            {currentSearch
              ? `No stocks found matching "${currentSearch}"`
              : "No stocks tracked yet"}
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/stocks${buildQuery({ page: String(page - 1) })}`}
              className="rounded-lg border border-border/60 bg-surface px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-bg-alt hover:text-text"
            >
              Previous
            </Link>
          )}
          <span className="px-4 py-2 text-sm text-muted">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/stocks${buildQuery({ page: String(page + 1) })}`}
              className="rounded-lg border border-border/60 bg-surface px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-bg-alt hover:text-text"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
