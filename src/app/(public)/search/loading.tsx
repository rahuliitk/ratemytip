import { Skeleton } from "@/components/ui/skeleton";

export default function SearchLoading(): React.ReactElement {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="mx-auto mb-8 h-12 w-full max-w-xl rounded-xl shimmer" />
      <div className="space-y-4">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-xl border border-border/60 bg-surface p-4 shadow-sm">
            <Skeleton className="h-10 w-10 rounded-full shimmer" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40 rounded shimmer" />
              <Skeleton className="h-3 w-24 rounded shimmer" />
            </div>
            <Skeleton className="h-6 w-14 rounded-md shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}
