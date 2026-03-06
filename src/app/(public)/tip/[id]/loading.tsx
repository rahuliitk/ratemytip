import { TipCardSkeleton } from "@/components/shared/loading-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function TipLoading(): React.ReactElement {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="mb-6 h-6 w-32 rounded shimmer" />
      <TipCardSkeleton />
      <div className="mt-6">
        <Skeleton className="h-64 w-full rounded-xl shimmer" />
      </div>
    </div>
  );
}
