"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface CreatorRec {
  creatorId: string;
  score: number;
  reason: string;
  creator: {
    id: string;
    slug: string;
    displayName: string;
    profileImageUrl: string | null;
    tier: string;
    specializations: string[];
    totalTips: number;
    currentScore: { rmtScore: number; accuracyRate: number } | null;
  } | null;
}

interface RecommendedCreatorsProps {
  readonly creators: readonly CreatorRec[];
}

export function RecommendedCreators({ creators }: RecommendedCreatorsProps): React.ReactElement {
  const validCreators = creators.filter((c) => c.creator !== null);

  if (validCreators.length === 0) {
    return <p className="text-sm text-muted">No creator recommendations yet.</p>;
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {validCreators.map((rec) => {
        const c = rec.creator!;
        return (
          <Link
            key={rec.creatorId}
            href={`/creator/${c.slug}`}
            className="flex min-w-[200px] flex-col rounded-xl border border-border/60 bg-surface p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="mb-2.5 flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                {c.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text">{c.displayName}</p>
                <Badge variant="outline" className="text-[10px]">{c.tier}</Badge>
              </div>
            </div>

            {c.currentScore && (
              <div className="mb-2 flex items-center gap-3 text-xs">
                <span className="font-semibold text-accent tabular-nums">
                  {c.currentScore.rmtScore.toFixed(0)} RMT
                </span>
                <span className="text-muted tabular-nums">
                  {(c.currentScore.accuracyRate * 100).toFixed(0)}% accuracy
                </span>
              </div>
            )}

            <p className="mb-2 text-[10px] text-muted tabular-nums">{c.totalTips} tips tracked</p>

            <p className="mt-auto text-xs font-medium text-accent">{rec.reason}</p>
          </Link>
        );
      })}
    </div>
  );
}
