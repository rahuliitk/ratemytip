import { Skeleton } from "@/components/ui/skeleton";
import { TipFeedSkeleton } from "@/components/shared/loading-skeleton";

export default function StockLoading(): React.ReactElement {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-lg shimmer" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-40 rounded shimmer" />
          <Skeleton className="h-4 w-24 rounded shimmer" />
        </div>
      </div>
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-xl border border-border/60 bg-surface p-5 shadow-sm">
            <Skeleton className="mb-2 h-4 w-20 rounded shimmer" />
            <Skeleton className="h-7 w-16 rounded shimmer" />
          </div>
        ))}
      </div>
      <TipFeedSkeleton />
    </div>
  );
}
