"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearch } from "@/hooks/use-search";
import { TipStatusBadge } from "@/components/tip/tip-status-badge";
import { formatPrice } from "@/lib/utils/format";
import { useSearchParams } from "next/navigation";

type TabType = "all" | "creators" | "stocks" | "tips";

export default function SearchPageContent(): React.ReactElement {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const { results, isLoading } = useSearch(query);

  const tabs: { value: TabType; label: string }[] = [
    { value: "all", label: "All" },
    { value: "creators", label: "Creators" },
    { value: "stocks", label: "Stocks" },
    { value: "tips", label: "Tips" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-primary">Search</h1>
      <p className="mt-2 text-sm text-muted">
        Find creators, stocks, and tips
      </p>

      <div className="mt-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search creators, stocks, or tips..."
          autoFocus
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-text placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </div>

      {/* Tabs */}
      <div className="mt-6 inline-flex rounded-xl bg-gray-100 p-1 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
              activeTab === tab.value
                ? "bg-white text-primary shadow-sm"
                : "text-muted hover:text-text"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="mt-6">
        {isLoading && (
          <div className="py-12 text-center text-sm text-muted">
            Searching...
          </div>
        )}

        {!isLoading && query.trim().length < 2 && (
          <div className="py-12 text-center text-sm text-muted">
            Type at least 2 characters to search
          </div>
        )}

        {!isLoading && results && (
          <div className="space-y-8">
            {/* Creators */}
            {(activeTab === "all" || activeTab === "creators") &&
              results.creators.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold uppercase text-muted">
                    Creators
                  </h2>
                  <div className="mt-3 space-y-2">
                    {results.creators.map((creator) => (
                      <Link
                        key={creator.id}
                        href={`/creator/${creator.slug}`}
                        className="card-hover flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3 hover:bg-[#2B6CB0]/5 hover:shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          {creator.profileImageUrl ? (
                            <Image
                              src={creator.profileImageUrl}
                              alt={creator.displayName}
                              width={32}
                              height={32}
                              className="h-8 w-8 rounded-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
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
                      </Link>
                    ))}
                  </div>
                </div>
              )}

            {/* Stocks */}
            {(activeTab === "all" || activeTab === "stocks") &&
              results.stocks.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold uppercase text-muted">
                    Stocks
                  </h2>
                  <div className="mt-3 space-y-2">
                    {results.stocks.map((stock) => (
                      <Link
                        key={stock.id}
                        href={`/stock/${stock.symbol}`}
                        className="card-hover flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3 hover:bg-[#2B6CB0]/5 hover:shadow-sm"
                      >
                        <div>
                          <p className="text-sm font-bold text-primary">
                            {stock.symbol}
                          </p>
                          <p className="text-xs text-muted">{stock.name}</p>
                        </div>
                        <div className="text-right">
                          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-muted">
                            {stock.exchange}
                          </span>
                          {stock.lastPrice !== null && (
                            <p className="mt-0.5 text-sm tabular-nums text-text">
                              {formatPrice(stock.lastPrice)}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

            {/* Tips */}
            {(activeTab === "all" || activeTab === "tips") &&
              results.tips.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold uppercase text-muted">
                    Tips
                  </h2>
                  <div className="mt-3 space-y-2">
                    {results.tips.map((tip) => (
                      <Link
                        key={tip.id}
                        href={`/tip/${tip.id}`}
                        className="card-hover flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3 hover:bg-[#2B6CB0]/5 hover:shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-primary">
                            {tip.stockSymbol}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                              tip.direction === "BUY"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {tip.direction}
                          </span>
                          <TipStatusBadge status={tip.status} />
                        </div>
                        <span className="text-xs text-muted">
                          {formatPrice(tip.entryPrice)}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

            {/* No results */}
            {results.creators.length === 0 &&
              results.stocks.length === 0 &&
              results.tips.length === 0 && (
                <div className="py-12 text-center text-sm text-muted">
                  No results found for &quot;{query}&quot;
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
