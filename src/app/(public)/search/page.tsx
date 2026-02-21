import { Suspense } from "react";
import SearchPageContent from "./search-content";

export default function SearchPage(): React.ReactElement {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-primary">Search</h1>
          <p className="mt-2 text-sm text-muted">
            Find creators, stocks, and tips
          </p>
          <div className="mt-6">
            <div className="w-full rounded-lg border border-gray-300 bg-surface px-4 py-3 h-12 animate-pulse" />
          </div>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
