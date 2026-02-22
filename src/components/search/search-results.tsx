import Link from "next/link";
import { ScoreBadge } from "@/components/shared/score-badge";
import { TipCard } from "@/components/tip/tip-card";
import type { CreatorSummary, StockSummary, TipSummary } from "@/types";

interface SearchResultsProps {
  readonly creators: readonly CreatorSummary[];
  readonly stocks: readonly StockSummary[];
  readonly tips: readonly TipSummary[];
  readonly query: string;
}

export function SearchResults({
  creators,
  stocks,
  tips,
  query,
}: SearchResultsProps): React.ReactElement {
  const hasResults = creators.length > 0 || stocks.length > 0 || tips.length > 0;

  if (!hasResults) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-medium text-text">No results found</p>
        <p className="mt-1 text-sm text-muted">
          No matches for &quot;{query}&quot;. Try a different search term.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Creators */}
      {creators.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase text-muted">
            Creators ({creators.length})
          </h2>
          <div className="mt-3 space-y-2">
            {creators.map((creator) => (
              <Link
                key={creator.id}
                href={`/creator/${creator.slug}`}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-surface p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  {creator.profileImageUrl ? (
                    <img
                      src={creator.profileImageUrl}
                      alt={creator.displayName}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
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
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-muted">
                  {creator.tier}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Stocks */}
      {stocks.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase text-muted">
            Stocks ({stocks.length})
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stocks.map((stock) => (
              <Link
                key={stock.id}
                href={`/stock/${stock.symbol}`}
                className="rounded-lg border border-gray-200 bg-surface p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-primary">
                    {stock.symbol}
                  </span>
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-muted">
                    {stock.exchange}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-muted">{stock.name}</p>
                {stock.lastPrice !== null && (
                  <p className="mt-2 text-sm font-semibold tabular-nums text-text">
                    {new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: "INR",
                    }).format(stock.lastPrice)}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Tips */}
      {tips.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase text-muted">
            Tips ({tips.length})
          </h2>
          <div className="mt-3 space-y-3">
            {tips.map((tip) => (
              <TipCard key={tip.id} tip={tip} showCreator />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
