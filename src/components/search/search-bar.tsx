"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { useSearch } from "@/hooks/use-search";

interface SearchBarProps {
  readonly placeholder?: string;
  readonly autoFocus?: boolean;
  readonly size?: "sm" | "lg";
}

export function SearchBar({
  placeholder = "Search creators, stocks...",
  autoFocus = false,
  size = "sm",
}: SearchBarProps): React.ReactElement {
  const [query, setQuery] = useState("");
  const { results, isLoading } = useSearch(query);
  const router = useRouter();

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim().length >= 2) {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    },
    [query, router]
  );

  const isLarge = size === "lg";

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search
            className={`absolute left-3 top-1/2 -translate-y-1/2 text-muted ${
              isLarge ? "h-5 w-5" : "h-4 w-4"
            }`}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className={`w-full rounded-lg border border-gray-300 bg-surface pl-10 pr-10 text-text placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 ${
              isLarge ? "py-3 text-base" : "py-2 text-sm"
            }`}
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted" />
          )}
        </div>
      </form>

      {/* Dropdown suggestions */}
      {query.trim().length >= 2 && results && !isLoading && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-surface shadow-lg">
          {results.creators.length === 0 &&
          results.stocks.length === 0 &&
          results.tips.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted">No results found</p>
          ) : (
            <div className="max-h-80 overflow-y-auto py-2">
              {results.creators.length > 0 && (
                <div>
                  <p className="px-4 py-1 text-xs font-semibold uppercase text-muted">
                    Creators
                  </p>
                  {results.creators.slice(0, 5).map((creator) => (
                    <button
                      key={creator.id}
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-bg"
                      onClick={() => {
                        setQuery("");
                        router.push(`/creator/${creator.slug}`);
                      }}
                    >
                      <span className="font-medium text-text">
                        {creator.displayName}
                      </span>
                      <span className="text-xs text-muted">
                        {creator.tier}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {results.stocks.length > 0 && (
                <div>
                  <p className="px-4 py-1 text-xs font-semibold uppercase text-muted">
                    Stocks
                  </p>
                  {results.stocks.slice(0, 5).map((stock) => (
                    <button
                      key={stock.id}
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-bg"
                      onClick={() => {
                        setQuery("");
                        router.push(`/stock/${stock.symbol}`);
                      }}
                    >
                      <span className="font-bold text-primary">
                        {stock.symbol}
                      </span>
                      <span className="text-xs text-muted">{stock.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
