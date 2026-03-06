import { CreatorProfileSkeleton } from "@/components/shared/loading-skeleton";

export default function CreatorLoading(): React.ReactElement {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <CreatorProfileSkeleton />
    </div>
  );
}
