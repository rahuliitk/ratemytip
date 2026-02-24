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
              isHero ? "text-white/50" : "text-muted",
              isLarge ? "h-5 w-5" : "h-4 w-4",
            )}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className={cn(
              "w-full pl-11 pr-10 transition-all duration-200",
              isHero
                ? "rounded-2xl border border-white/20 bg-white/10 text-white placeholder:text-white/50 shadow-lg backdrop-blur-sm focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                : "rounded-2xl border border-gray-200 bg-white text-text placeholder:text-muted shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 focus:shadow-[0_0_0_4px_rgba(43,108,176,0.1)]",
              isLarge ? "py-3.5 text-base" : "py-2 text-sm",
            )}
          />
          {isLoading && (
            <Loader2 className={cn(
              "absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin",
              isHero ? "text-white/50" : "text-muted",
            )} />
          )}
        </div>
      </form>

      {/* Dropdown suggestions */}
      {query.trim().length >= 2 && results && !isLoading && (
        <div className="absolute z-50 mt-2 w-full rounded-2xl border border-gray-100 bg-white/95 backdrop-blur-xl shadow-xl">
          {results.creators.length === 0 &&
          results.stocks.length === 0 &&
          results.tips.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted">No results found</p>
          ) : (
            <div className="max-h-80 overflow-y-auto py-2">
              {results.creators.length > 0 && (
                <div>
                  <p className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Creators
                  </p>
                  {results.creators.slice(0, 5).map((creator) => (
                    <button
                      key={creator.id}
                      type="button"
                      className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm transition-colors duration-150 hover:bg-[#2B6CB0]/5"
                      onClick={() => {
                        setQuery("");
                        router.push(`/creator/${creator.slug}`);
                      }}
                    >
                      <span className="font-medium text-text">
                        {creator.displayName}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-muted">
                        {creator.tier}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {results.stocks.length > 0 && (
                <div>
                  <p className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Stocks
                  </p>
                  {results.stocks.slice(0, 5).map((stock) => (
                    <button
                      key={stock.id}
                      type="button"
                      className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm transition-colors duration-150 hover:bg-[#2B6CB0]/5"
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
