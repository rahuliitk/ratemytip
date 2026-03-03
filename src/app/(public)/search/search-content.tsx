"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearch } from "@/hooks/use-search";
import { TipStatusBadge } from "@/components/tip/tip-status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatPrice } from "@/lib/utils/format";
import { useSearchParams } from "next/navigation";
import { Search, Loader2, Users, BarChart3, Lightbulb } from "lucide-react";

type TabType = "all" | "creators" | "stocks" | "tips";

export default function SearchPageContent(): React.ReactElement {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const { results, isLoading } = useSearch(query);

  const tabs: { value: TabType; label: string; icon: React.ReactNode }[] = [
    { value: "all", label: "All", icon: <Search className="h-3.5 w-3.5" /> },
    { value: "creators", label: "Creators", icon: <Users className="h-3.5 w-3.5" /> },
    { value: "stocks", label: "Stocks", icon: <BarChart3 className="h-3.5 w-3.5" /> },
    { value: "tips", label: "Tips", icon: <Lightbulb className="h-3.5 w-3.5" /> },
  ];

  const showCreators =
    (activeTab === "all" || activeTab === "creators") &&
    results?.creators &&
    results.creators.length > 0;

  const showStocks =
    (activeTab === "all" || activeTab === "stocks") &&
    results?.stocks &&
    results.stocks.length > 0;

  const showTips =
    (activeTab === "all" || activeTab === "tips") &&
    results?.tips &&
    results.tips.length > 0;

  const hasNoResults =
    results &&
    results.creators.length === 0 &&
    results.stocks.length === 0 &&
    results.tips.length === 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-text">Search</h1>
        <p className="mt-2 text-muted">
          Find creators, stocks, and tips across the platform
        </p>
      </div>

      {/* Search Input */}
      <div className="relative mx-auto mt-8 max-w-2xl">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search creators, stocks, or tips..."
          autoFocus
          className="h-12 w-full rounded-xl border border-border bg-surface px-5 pl-12 pr-12 text-base text-text shadow-sm placeholder:text-muted transition-all duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
        {isLoading && (
          <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-muted" />
        )}
      </div>

      {/* Tabs */}
      <div className="mt-8 flex justify-center">
        <div className="inline-flex gap-1 rounded-xl border border-border/60 bg-bg-alt p-1">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                activeTab === tab.value
                  ? "bg-surface text-text shadow-sm"
                  : "text-muted hover:text-text"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="mt-8">
        {isLoading && (
          <div className="flex flex-col items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="mt-3 text-sm text-muted">Searching...</p>
          </div>
        )}

        {!isLoading && query.trim().length < 2 && (
          <EmptyState
            icon={<Search className="h-7 w-7" />}
            title="Start searching"
            description="Type at least 2 characters to search across creators, stocks, and tips."
          />
        )}

        {!isLoading && results && (
          <div className="space-y-8">
            {/* Creators */}
            {showCreators && (
              <section>
                <h2 className="text-lg font-semibold text-text">
                  Creators{" "}
                  <span className="text-sm font-normal text-muted">
                    ({results.creators.length})
                  </span>
                </h2>
                <div className="mt-3 space-y-2">
                  {results.creators.map((creator) => (
                    <Link
                      key={creator.id}
                      href={`/creator/${creator.slug}`}
                      className="flex items-center justify-between rounded-xl border border-border/60 bg-surface px-4 py-3 shadow-sm transition-all duration-200 hover:border-accent/30 hover:shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        {creator.profileImageUrl ? (
                          <Image
                            src={creator.profileImageUrl}
                            alt={creator.displayName}
                            width={36}
                            height={36}
                            className="h-9 w-9 rounded-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                            {creator.displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-text">
                            {creator.displayName}
                          </p>
                          <p className="text-xs text-muted">
                            {creator.tier} &middot; {creator.totalTips} tips
                          </p>
                        </div>
                      </div>
                      <span className="rounded-md bg-bg-alt px-2 py-0.5 text-xs font-medium text-text-secondary">
                        {creator.tier}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Stocks */}
            {showStocks && (
              <section>
                <h2 className="text-lg font-semibold text-text">
                  Stocks{" "}
                  <span className="text-sm font-normal text-muted">
                    ({results.stocks.length})
                  </span>
                </h2>
                <div className="mt-3 space-y-2">
                  {results.stocks.map((stock) => (
                    <Link
                      key={stock.id}
                      href={`/stock/${stock.symbol}`}
                      className="flex items-center justify-between rounded-xl border border-border/60 bg-surface px-4 py-3 shadow-sm transition-all duration-200 hover:border-accent/30 hover:shadow-md"
                    >
                      <div>
                        <p className="text-sm font-bold text-text">
                          {stock.symbol}
                        </p>
                        <p className="text-xs text-muted">{stock.name}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-md bg-bg-alt px-2 py-0.5 text-xs font-medium text-text-secondary">
                          {stock.exchange}
                        </span>
                        {stock.lastPrice !== null && (
                          <p className="text-sm font-semibold tabular-nums text-text">
                            {formatPrice(stock.lastPrice)}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Tips */}
            {showTips && (
              <section>
                <h2 className="text-lg font-semibold text-text">
                  Tips{" "}
                  <span className="text-sm font-normal text-muted">
                    ({results.tips.length})
                  </span>
                </h2>
                <div className="mt-3 space-y-2">
                  {results.tips.map((tip) => (
                    <Link
                      key={tip.id}
                      href={`/tip/${tip.id}`}
                      className="flex items-center justify-between rounded-xl border border-border/60 bg-surface px-4 py-3 shadow-sm transition-all duration-200 hover:border-accent/30 hover:shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-text">
                          {tip.stockSymbol}
                        </span>
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-xs font-semibold ${
                            tip.direction === "BUY"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {tip.direction}
                        </span>
                        <TipStatusBadge status={tip.status} />
                      </div>
                      <span className="text-sm tabular-nums text-text-secondary">
                        {formatPrice(tip.entryPrice)}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* No results */}
            {hasNoResults && (
              <EmptyState
                title="No results found"
                description={`No matches for "${query}". Try a different search term.`}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
