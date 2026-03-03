import { Suspense } from "react";
import SearchPageContent from "./search-content";

export default function SearchPage(): React.ReactElement {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-text">Search</h1>
          <p className="mt-2 text-sm text-muted">
            Find creators, stocks, and tips
          </p>
          <div className="mt-8">
            <div className="h-12 w-full animate-pulse rounded-xl border border-border bg-surface shadow-sm" />
          </div>
          <div className="mt-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl border border-border/60 bg-surface shadow-sm"
              />
            ))}
          </div>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
