import { TipFeedSkeleton } from "@/components/shared/loading-skeleton";

export default function TipsLoading(): React.ReactElement {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 space-y-2">
        <div className="h-8 w-36 animate-pulse rounded-lg bg-bg-alt" />
        <div className="h-4 w-64 animate-pulse rounded bg-bg-alt" />
      </div>
      <TipFeedSkeleton />
    </div>
  );
}
