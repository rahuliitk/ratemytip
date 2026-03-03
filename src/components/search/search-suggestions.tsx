"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import type { CreatorSummary, StockSummary } from "@/types";

interface SearchSuggestionsProps {
  readonly creators: readonly CreatorSummary[];
  readonly stocks: readonly StockSummary[];
  readonly onSelect: () => void;
}

export function SearchSuggestions({
  creators,
  stocks,
  onSelect,
}: SearchSuggestionsProps): React.ReactElement {
  const router = useRouter();

  const hasResults = creators.length > 0 || stocks.length > 0;

  if (!hasResults) {
    return (
      <div className="absolute z-50 mt-1 w-full rounded-xl border border-border/60 bg-surface shadow-xl">
        <p className="px-4 py-3 text-sm text-muted">No suggestions found</p>
      </div>
    );
  }

  return (
    <div className="absolute z-50 mt-1 w-full rounded-xl border border-border/60 bg-surface shadow-xl">
      <div className="max-h-80 overflow-y-auto py-1.5">
        {creators.length > 0 && (
          <div>
            <p className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
              Creators
            </p>
            {creators.slice(0, 5).map((creator) => (
              <button
                key={creator.id}
                type="button"
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-bg-alt"
                onClick={() => {
                  onSelect();
                  router.push(`/creator/${creator.slug}`);
                }}
              >
                {creator.profileImageUrl ? (
                  <Image
                    src={creator.profileImageUrl}
                    alt=""
                    width={24}
                    height={24}
                    className="h-6 w-6 rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                    {creator.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-medium text-text">
                  {creator.displayName}
                </span>
                <span className="rounded-md bg-bg-alt px-1.5 py-0.5 text-xs text-muted">
                  {creator.tier}
                </span>
              </button>
            ))}
          </div>
        )}

        {stocks.length > 0 && (
          <div>
            <p className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
              Stocks
            </p>
            {stocks.slice(0, 5).map((stock) => (
              <button
                key={stock.id}
                type="button"
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-bg-alt"
                onClick={() => {
                  onSelect();
                  router.push(`/stock/${stock.symbol}`);
                }}
              >
                <span className="font-bold text-text">{stock.symbol}</span>
                <span className="truncate text-xs text-muted">
                  {stock.name}
                </span>
                <span className="ml-auto rounded-md bg-bg-alt px-1.5 py-0.5 text-xs text-muted">
                  {stock.exchange}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
