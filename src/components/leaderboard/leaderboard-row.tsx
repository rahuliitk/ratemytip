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
  DIAMOND: "bg-gradient-to-r from-purple-500 to-purple-400 text-white",
  PLATINUM: "bg-gradient-to-r from-blue-500 to-blue-400 text-white",
  GOLD: "bg-gradient-to-r from-yellow-500 to-yellow-400 text-white",
  SILVER: "bg-gradient-to-r from-gray-400 to-gray-300 text-white",
  BRONZE: "bg-gradient-to-r from-orange-500 to-orange-400 text-white",
  UNRATED: "bg-gray-100 text-gray-500",
};

const RANK_STYLES: Record<number, { border: string; bg: string }> = {
  1: { border: "border-l-4 border-l-yellow-400", bg: "bg-gradient-to-r from-yellow-50/50 to-transparent" },
  2: { border: "border-l-4 border-l-gray-300", bg: "bg-gradient-to-r from-gray-50/50 to-transparent" },
  3: { border: "border-l-4 border-l-orange-300", bg: "bg-gradient-to-r from-orange-50/50 to-transparent" },
};

export function LeaderboardRow({ entry }: LeaderboardRowProps): React.ReactElement {
  const rankStyle = RANK_STYLES[entry.rank];

  return (
    <tr
      className={cn(
        "transition-all duration-200 hover:bg-[#2B6CB0]/[0.03] even:bg-gray-50/30",
        rankStyle?.border,
        rankStyle?.bg,
      )}
    >
      <td className="px-4 py-3.5 text-sm tabular-nums">
        {entry.rank <= 3 ? (
          <span
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white",
              entry.rank === 1 && "bg-gradient-to-br from-yellow-400 to-yellow-500 shadow-sm",
              entry.rank === 2 && "bg-gradient-to-br from-gray-300 to-gray-400 shadow-sm",
              entry.rank === 3 && "bg-gradient-to-br from-orange-300 to-orange-400 shadow-sm",
            )}
          >
            {entry.rank}
          </span>
        ) : (
          <span className="font-medium text-muted">{entry.rank}</span>
        )}
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
              className="h-9 w-9 rounded-full object-cover ring-2 ring-gray-100"
              unoptimized
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#1A365D]/10 to-[#2B6CB0]/10 text-sm font-semibold text-accent ring-2 ring-gray-100">
              {entry.creator.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <span className="text-sm font-medium text-text hover:underline">
              {entry.creator.displayName}
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  TIER_COLORS[entry.tier] ?? TIER_COLORS.UNRATED,
                )}
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
      <td className="px-4 py-3.5 text-right">
        <ScoreBadge score={entry.score.rmtScore} size="sm" />
      </td>
      <td className="px-4 py-3.5 text-right text-sm tabular-nums text-text">
        {(entry.score.accuracyRate * 100).toFixed(1)}%
      </td>
      <td className="px-4 py-3.5 text-right text-sm tabular-nums">
        <span
          className={
            entry.score.avgReturnPct >= 0 ? "text-success" : "text-danger"
          }
        >
          {formatPercent(entry.score.avgReturnPct)}
        </span>
      </td>
      <td className="px-4 py-3.5 text-right text-sm tabular-nums text-muted">
        {entry.totalTips}
      </td>
    </tr>
  );
}
