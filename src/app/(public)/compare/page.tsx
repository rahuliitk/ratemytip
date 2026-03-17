import type { Metadata } from "next";
import { CompareSelector } from "@/components/comparison/compare-selector";
import { CompareTable } from "@/components/comparison/compare-table";

export const metadata: Metadata = {
  title: "Compare Creators | RateMyTip",
  description:
    "Compare stock tip creators side by side. Analyze RMT Scores, accuracy rates, total tips, and more to find the best creators for your portfolio.",
  openGraph: {
    title: "Compare Creators | RateMyTip",
    description:
      "Side-by-side comparison of stock tip creators by accuracy, score, and track record.",
  },
};

interface ComparePageProps {
  searchParams: Promise<{
    creators?: string;
  }>;
}

export default async function ComparePage({
  searchParams,
}: ComparePageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const creatorIds = params.creators
    ? params.creators
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
        .slice(0, 3)
    : [];

  const hasSelection = creatorIds.length >= 2;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-bold text-text">Compare Creators</h1>
        <p className="mt-2 text-sm text-muted">
          Select 2-3 creators to compare their performance side by side.
        </p>
      </div>

      {/* Always show selector so users can change/add */}
      <div className="mt-6">
        <CompareSelector initialIds={creatorIds} />
      </div>

      {/* Show comparison table if valid selection */}
      {hasSelection && (
        <div className="mt-8">
          <CompareTable creatorIds={creatorIds} />
        </div>
      )}

      {!hasSelection && (
        <div className="mt-12 flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-bg-alt/30 py-16 text-center">
          <p className="text-sm font-medium text-muted">
            Select at least 2 creators above to start comparing.
          </p>
          <p className="mt-1 text-xs text-muted/70">
            You can compare up to 3 creators at once.
          </p>
        </div>
      )}
    </div>
  );
}
