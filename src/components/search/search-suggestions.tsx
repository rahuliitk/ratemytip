"use client";

import { useRouter } from "next/navigation";
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
      <div className="absolute z-50 mt-1 w-full rounded-2xl bg-white shadow-[0_4px_24px_0_rgba(26,54,93,0.10)]">
        <p className="px-4 py-3 text-sm text-muted">No suggestions found</p>
      </div>
    );
  }

  return (
    <div className="absolute z-50 mt-1 w-full rounded-2xl bg-white shadow-[0_4px_24px_0_rgba(26,54,93,0.10)]">
      <div className="max-h-80 overflow-y-auto py-2">
        {creators.length > 0 && (
          <div>
            <p className="px-4 py-1 text-xs font-semibold uppercase text-muted">
              Creators
            </p>
            {creators.slice(0, 5).map((creator) => (
              <button
                key={creator.id}
                type="button"
                className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-[#F7FAFC]"
                onClick={() => {
                  onSelect();
                  router.push(`/creator/${creator.slug}`);
                }}
              >
                {creator.profileImageUrl ? (
                  <img
                    src={creator.profileImageUrl}
                    alt=""
                    className="h-6 w-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                    {creator.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-medium text-text">
                  {creator.displayName}
                </span>
                <span className="text-xs text-muted">{creator.tier}</span>
              </button>
            ))}
          </div>
        )}

        {stocks.length > 0 && (
          <div>
            <p className="px-4 py-1 text-xs font-semibold uppercase text-muted">
              Stocks
            </p>
            {stocks.slice(0, 5).map((stock) => (
              <button
                key={stock.id}
                type="button"
                className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-[#F7FAFC]"
                onClick={() => {
                  onSelect();
                  router.push(`/stock/${stock.symbol}`);
                }}
              >
                <span className="font-bold text-primary">{stock.symbol}</span>
                <span className="truncate text-xs text-muted">
                  {stock.name}
                </span>
                <span className="ml-auto text-xs text-muted">
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
