import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  readonly className?: string;
}

export function LeaderboardRowSkeleton({
  className,
}: LoadingSkeletonProps): React.ReactElement {
  return (
    <div className={cn("flex items-center gap-4 px-4 py-3.5", className)}>
      <Skeleton className="h-6 w-6 rounded-md shimmer" />
      <Skeleton className="h-9 w-9 rounded-full shimmer" />
      <div className="flex flex-1 flex-col gap-1.5">
        <Skeleton className="h-4 w-32 rounded shimmer" />
        <Skeleton className="h-3 w-20 rounded shimmer" />
      </div>
      <Skeleton className="h-6 w-14 rounded-md shimmer" />
      <Skeleton className="h-4 w-12 rounded shimmer" />
      <Skeleton className="h-4 w-12 rounded shimmer" />
      <Skeleton className="h-4 w-10 rounded shimmer" />
    </div>
  );
}

export function LeaderboardSkeleton(): React.ReactElement {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-surface shadow-sm">
      <div className="divide-y divide-border/40">
        {Array.from({ length: 10 }, (_, i) => (
          <LeaderboardRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function CreatorProfileSkeleton(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl border border-border/60 bg-surface shadow-sm">
        <Skeleton className="h-28 w-full shimmer" />
        <div className="flex items-start gap-6 p-6">
          <Skeleton className="-mt-14 h-20 w-20 rounded-full ring-4 ring-surface shimmer" />
          <div className="flex flex-1 flex-col gap-2 pt-1">
            <Skeleton className="h-7 w-48 rounded shimmer" />
            <Skeleton className="h-4 w-32 rounded shimmer" />
            <div className="mt-2 flex gap-2">
              <Skeleton className="h-6 w-20 rounded-md shimmer" />
              <Skeleton className="h-6 w-20 rounded-md shimmer" />
            </div>
          </div>
          <Skeleton className="h-28 w-28 rounded-full shimmer" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-xl border border-border/60 bg-surface p-5 shadow-sm">
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-9 w-9 rounded-lg shimmer" />
              <Skeleton className="h-4 w-20 rounded shimmer" />
            </div>
            <Skeleton className="mt-3 h-8 w-16 rounded shimmer" />
          </div>
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-xl shimmer" />
    </div>
  );
}

export function TipCardSkeleton(): React.ReactElement {
  return (
    <div className="rounded-xl border-l-4 border-l-bg-alt border border-border/60 bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-20 rounded shimmer" />
          <Skeleton className="h-5 w-12 rounded-md shimmer" />
        </div>
        <Skeleton className="h-5 w-24 rounded-md shimmer" />
      </div>
      <div className="mt-3 grid grid-cols-4 gap-4">
        <div>
          <Skeleton className="mb-1 h-3 w-10 rounded shimmer" />
          <Skeleton className="h-5 w-16 rounded shimmer" />
        </div>
        <div>
          <Skeleton className="mb-1 h-3 w-10 rounded shimmer" />
          <Skeleton className="h-5 w-16 rounded shimmer" />
        </div>
        <div>
          <Skeleton className="mb-1 h-3 w-10 rounded shimmer" />
          <Skeleton className="h-5 w-16 rounded shimmer" />
        </div>
        <div>
          <Skeleton className="mb-1 h-3 w-10 rounded shimmer" />
          <Skeleton className="h-5 w-16 rounded shimmer" />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <Skeleton className="h-4 w-32 rounded shimmer" />
        <Skeleton className="h-4 w-20 rounded shimmer" />
      </div>
    </div>
  );
}

export function TipFeedSkeleton(): React.ReactElement {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }, (_, i) => (
        <TipCardSkeleton key={i} />
      ))}
    </div>
  );
}
