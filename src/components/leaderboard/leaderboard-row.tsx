import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ScoreBadge } from "@/components/shared/score-badge";
import { formatPercent } from "@/lib/utils/format";
import type { LeaderboardEntry } from "@/types";

interface LeaderboardRowProps {
  readonly entry: LeaderboardEntry;
}

const TIER_COLORS: Record<string, string> = {
  DIAMOND: "bg-bg-alt text-muted",
  PLATINUM: "bg-bg-alt text-muted",
  GOLD: "bg-bg-alt text-muted",
  SILVER: "bg-bg-alt text-muted",
  BRONZE: "bg-bg-alt text-muted",
  UNRATED: "bg-bg-alt text-muted",
};

function RankBadge({ rank }: { rank: number }): React.ReactElement {
  if (rank === 1) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-amber-950">
        {rank}
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-400 text-xs font-bold text-sky-950">
        {rank}
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-orange-400 text-xs font-bold text-orange-950">
        {rank}
      </span>
    );
  }
  return (
    <span className="text-sm font-medium text-muted tabular-nums">{rank}</span>
  );
}

export function LeaderboardRow({ entry }: LeaderboardRowProps): React.ReactElement {
  return (
    <tr className="border-b border-border transition-colors hover:bg-bg-alt/80">
      <td className="px-4 py-3.5 text-sm tabular-nums">
        <RankBadge rank={entry.rank} />
      </td>
      <td className="px-4 py-3.5">
        <Link
          href={`/creator/${entry.creator.slug}`}
          className="flex items-center gap-3"
        >
          {entry.creator.profileImageUrl ? (
            <Image
              src={entry.creator.profileImageUrl}
              alt={entry.creator.displayName}
              width={36}
              height={36}
              className="h-9 w-9 rounded-full object-cover ring-1 ring-border/40"
              unoptimized
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-subtle text-sm font-semibold text-accent ring-1 ring-border/40">
              {entry.creator.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <span className="text-sm font-medium text-text hover:underline">
              {entry.creator.displayName}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                  TIER_COLORS[entry.tier] ?? TIER_COLORS.UNRATED,
                )}
              >
                {entry.tier}
              </span>
              {entry.creator.isVerified && (
                <span className="text-[10px] font-medium text-accent">
                  Verified
                </span>
              )}
            </div>
          </div>
        </Link>
      </td>
      <td className="px-4 py-3.5 text-right">
        {entry.score.rmtScore != null ? (
          <ScoreBadge score={entry.score.rmtScore} size="sm" />
        ) : (
          <span className="inline-flex items-center rounded-md bg-bg-alt px-2 py-0.5 text-xs font-medium text-muted">
            Pending
          </span>
        )}
      </td>
      <td className="px-4 py-3.5 text-right text-sm tabular-nums text-text">
        {entry.score.accuracyRate != null
          ? `${(entry.score.accuracyRate * 100).toFixed(1)}%`
          : "—"}
      </td>
      <td className="px-4 py-3.5 text-right text-sm tabular-nums">
        {entry.score.avgReturnPct != null ? (
          <span
            className={
              entry.score.avgReturnPct >= 0 ? "text-success" : "text-danger"
            }
          >
            {formatPercent(entry.score.avgReturnPct)}
          </span>
        ) : (
          <span className="text-muted">—</span>
        )}
      </td>
      <td className="px-4 py-3.5 text-right text-sm tabular-nums text-muted">
        {entry.totalTips}
      </td>
    </tr>
  );
}
