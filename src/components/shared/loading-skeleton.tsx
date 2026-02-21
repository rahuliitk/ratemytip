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
      <Skeleton className="h-6 w-8" />
      {/* Avatar */}
      <Skeleton className="h-10 w-10 rounded-full" />
      {/* Name and tier */}
      <div className="flex flex-1 flex-col gap-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      {/* Score */}
      <Skeleton className="h-8 w-16 rounded-md" />
      {/* Accuracy */}
      <Skeleton className="h-4 w-14" />
      {/* Return */}
      <Skeleton className="h-4 w-14" />
      {/* Tips count */}
      <Skeleton className="h-4 w-10" />
    </div>
  );
}

export function LeaderboardSkeleton(): React.ReactElement {
  return (
    <div className="space-y-1">
      {Array.from({ length: 10 }, (_, i) => (
        <LeaderboardRowSkeleton key={i} />
      ))}
    </div>
  );
}

export function CreatorProfileSkeleton(): React.ReactElement {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-6">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
          <div className="mt-2 flex gap-2">
            <Skeleton className="h-6 w-20 rounded-md" />
            <Skeleton className="h-6 w-20 rounded-md" />
          </div>
        </div>
        {/* Score ring */}
        <Skeleton className="h-24 w-24 rounded-full" />
      </div>
      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 p-4">
            <Skeleton className="mb-2 h-4 w-20" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>
      {/* Chart */}
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export function TipCardSkeleton(): React.ReactElement {
  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-20 rounded-md" />
          <Skeleton className="h-5 w-12 rounded-md" />
        </div>
        <Skeleton className="h-5 w-24 rounded-md" />
      </div>
      <div className="mt-3 grid grid-cols-4 gap-4">
        <div>
          <Skeleton className="mb-1 h-3 w-10" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div>
          <Skeleton className="mb-1 h-3 w-10" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div>
          <Skeleton className="mb-1 h-3 w-10" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div>
          <Skeleton className="mb-1 h-3 w-10" />
          <Skeleton className="h-5 w-16" />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-20" />
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
