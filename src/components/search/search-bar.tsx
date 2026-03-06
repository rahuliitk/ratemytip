"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearch } from "@/hooks/use-search";

interface SearchBarProps {
  readonly placeholder?: string;
  readonly autoFocus?: boolean;
  readonly size?: "sm" | "lg";
  readonly variant?: "default" | "hero";
}

export function SearchBar({
  placeholder = "Search creators, stocks...",
  autoFocus = false,
  size = "sm",
  variant = "default",
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
  const isHero = variant === "hero";

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search
            className={cn(
              "absolute left-3.5 top-1/2 -translate-y-1/2",
              isHero ? "text-muted" : "text-muted",
              isLarge ? "h-5 w-5" : "h-4 w-4",
            )}
          />
          <input
            type="search"
            aria-label="Search creators, stocks, and tips"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className={cn(
              "w-full transition-all duration-200 focus:outline-none",
              isHero
                ? "border-0 bg-white/10 backdrop-blur-sm text-white placeholder:text-muted rounded-xl shadow-lg focus:ring-2 focus:ring-white/20"
                : "border border-border rounded-lg bg-surface text-text placeholder:text-muted shadow-xs focus:ring-2 focus:ring-accent/30 focus:border-accent",
              isLarge ? "h-12 text-base px-5 pl-12 pr-10" : "h-9 text-sm px-4 pl-10 pr-9",
            )}
          />
          {isLoading && (
            <Loader2
              className={cn(
                "absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin",
                isHero ? "text-muted" : "text-muted",
              )}
            />
          )}
        </div>
      </form>

      {/* Dropdown suggestions */}
      {query.trim().length >= 2 && results && !isLoading && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border/60 bg-surface shadow-lg">
          {results.creators.length === 0 &&
          results.stocks.length === 0 &&
          results.tips.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted">No results found</p>
          ) : (
            <div role="listbox" aria-label="Search suggestions" className="max-h-80 overflow-y-auto py-1.5">
              {results.creators.length > 0 && (
                <div>
                  <p className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                    Creators
                  </p>
                  {results.creators.slice(0, 5).map((creator) => (
                    <button
                      key={creator.id}
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-bg-alt"
                      onClick={() => {
                        setQuery("");
                        router.push(`/creator/${creator.slug}`);
                      }}
                    >
                      <span className="font-medium text-text">
                        {creator.displayName}
                      </span>
                      <span className="rounded-md bg-bg-alt px-1.5 py-0.5 text-[10px] font-medium text-muted">
                        {creator.tier}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {results.stocks.length > 0 && (
                <div>
                  <p className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                    Stocks
                  </p>
                  {results.stocks.slice(0, 5).map((stock) => (
                    <button
                      key={stock.id}
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-bg-alt"
                      onClick={() => {
                        setQuery("");
                        router.push(`/stock/${stock.symbol}`);
                      }}
                    >
                      <span className="font-bold text-text">
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
