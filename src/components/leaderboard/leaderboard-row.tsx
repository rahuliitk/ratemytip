import Link from "next/link";
import { ScoreBadge } from "@/components/shared/score-badge";
import { formatPercent } from "@/lib/utils/format";
import type { LeaderboardEntry } from "@/types";

interface LeaderboardRowProps {
  readonly entry: LeaderboardEntry;
}

const TIER_COLORS: Record<string, string> = {
  DIAMOND: "bg-purple-100 text-purple-800",
  PLATINUM: "bg-blue-100 text-blue-800",
  GOLD: "bg-yellow-100 text-yellow-800",
  SILVER: "bg-gray-200 text-gray-700",
  BRONZE: "bg-orange-100 text-orange-700",
  UNRATED: "bg-gray-100 text-gray-500",
};

export function LeaderboardRow({ entry }: LeaderboardRowProps): React.ReactElement {
  return (
    <tr className="border-b border-gray-100 transition-colors hover:bg-bg">
      <td className="px-4 py-3 text-sm font-medium text-muted tabular-nums">
        {entry.rank}
      </td>
      <td className="px-4 py-3">
        <Link
          href={`/creator/${entry.creator.slug}`}
          className="flex items-center gap-3"
        >
          {entry.creator.profileImageUrl ? (
            <img
              src={entry.creator.profileImageUrl}
              alt={entry.creator.displayName}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent">
              {entry.creator.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <span className="text-sm font-medium text-text hover:underline">
              {entry.creator.displayName}
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`mt-0.5 rounded px-1.5 py-0.5 text-xs font-medium ${
                  TIER_COLORS[entry.tier] ?? TIER_COLORS.UNRATED
                }`}
              >
                {entry.tier}
              </span>
              {entry.creator.isVerified && (
                <span className="text-xs text-accent" title="Verified">
                  Verified
                </span>
              )}
            </div>
          </div>
        </Link>
      </td>
      <td className="px-4 py-3 text-right">
        <ScoreBadge score={entry.score.rmtScore} size="sm" />
      </td>
      <td className="px-4 py-3 text-right text-sm tabular-nums text-text">
        {(entry.score.accuracyRate * 100).toFixed(1)}%
      </td>
      <td className="px-4 py-3 text-right text-sm tabular-nums">
        <span
          className={
            entry.score.avgReturnPct >= 0 ? "text-success" : "text-danger"
          }
        >
          {formatPercent(entry.score.avgReturnPct)}
        </span>
      </td>
      <td className="px-4 py-3 text-right text-sm tabular-nums text-muted">
        {entry.totalTips}
      </td>
    </tr>
  );
}
