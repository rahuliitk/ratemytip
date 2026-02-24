import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  readonly className?: string;
}

export function LeaderboardRowSkeleton({
  className,
}: LoadingSkeletonProps): React.ReactElement {
  return (
    <div className={cn("flex items-center gap-4 p-4", className)}>
      {/* Rank */}
      <Skeleton className="h-7 w-7 rounded-full shimmer" />
      {/* Avatar */}
      <Skeleton className="h-10 w-10 rounded-full shimmer" />
      {/* Name and tier */}
      <div className="flex flex-1 flex-col gap-1.5">
        <Skeleton className="h-4 w-32 rounded-lg shimmer" />
        <Skeleton className="h-3 w-20 rounded-full shimmer" />
      </div>
      {/* Score */}
      <Skeleton className="h-8 w-16 rounded-full shimmer" />
      {/* Accuracy */}
      <Skeleton className="h-4 w-14 rounded-lg shimmer" />
      {/* Return */}
      <Skeleton className="h-4 w-14 rounded-lg shimmer" />
      {/* Tips count */}
      <Skeleton className="h-4 w-10 rounded-lg shimmer" />
    </div>
  );
}

export function LeaderboardSkeleton(): React.ReactElement {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_1px_2px_0_rgba(26,54,93,0.04)]">
      <div className="space-y-0">
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
      {/* Header */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md">
        <Skeleton className="h-24 w-full shimmer" />
        <div className="flex items-start gap-6 p-6">
          <Skeleton className="-mt-14 h-20 w-20 rounded-full ring-4 ring-white shimmer" />
          <div className="flex flex-1 flex-col gap-2 pt-1">
            <Skeleton className="h-7 w-48 rounded-lg shimmer" />
            <Skeleton className="h-4 w-32 rounded-lg shimmer" />
            <div className="mt-2 flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full shimmer" />
              <Skeleton className="h-6 w-20 rounded-full shimmer" />
            </div>
          </div>
          {/* Score ring */}
          <Skeleton className="h-28 w-28 rounded-full shimmer" />
        </div>
      </div>
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_1px_2px_0_rgba(26,54,93,0.04)]">
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-9 w-9 rounded-xl shimmer" />
              <Skeleton className="h-4 w-20 rounded-lg shimmer" />
            </div>
            <Skeleton className="mt-3 h-8 w-16 rounded-lg shimmer" />
          </div>
        ))}
      </div>
      {/* Chart */}
      <Skeleton className="h-64 w-full rounded-2xl shimmer" />
    </div>
  );
}

export function TipCardSkeleton(): React.ReactElement {
  return (
    <div className="rounded-2xl border-l-4 border-l-gray-200 border border-gray-100 bg-white p-4 shadow-[0_1px_2px_0_rgba(26,54,93,0.04)]">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-20 rounded-lg shimmer" />
          <Skeleton className="h-5 w-12 rounded-full shimmer" />
        </div>
        <Skeleton className="h-5 w-24 rounded-full shimmer" />
      </div>
      <div className="mt-3 grid grid-cols-4 gap-4">
        <div>
          <Skeleton className="mb-1 h-3 w-10 rounded-lg shimmer" />
          <Skeleton className="h-5 w-16 rounded-lg shimmer" />
        </div>
        <div>
          <Skeleton className="mb-1 h-3 w-10 rounded-lg shimmer" />
          <Skeleton className="h-5 w-16 rounded-lg shimmer" />
        </div>
        <div>
          <Skeleton className="mb-1 h-3 w-10 rounded-lg shimmer" />
          <Skeleton className="h-5 w-16 rounded-lg shimmer" />
        </div>
        <div>
          <Skeleton className="mb-1 h-3 w-10 rounded-lg shimmer" />
          <Skeleton className="h-5 w-16 rounded-lg shimmer" />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <Skeleton className="h-4 w-32 rounded-lg shimmer" />
        <Skeleton className="h-4 w-20 rounded-lg shimmer" />
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
