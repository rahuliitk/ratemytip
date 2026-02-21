import { LeaderboardRow } from "./leaderboard-row";
import type { LeaderboardEntry } from "@/types";

interface LeaderboardTableProps {
  readonly entries: readonly LeaderboardEntry[];
}

export function LeaderboardTable({ entries }: LeaderboardTableProps): React.ReactElement {
  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-surface px-4 py-16 text-center">
        <p className="text-sm text-muted">
          No creators match the current filters. Try adjusting your criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-surface">
      <table className="w-full min-w-[700px] text-left">
        <thead>
          <tr className="border-b border-gray-200 bg-bg">
            <th className="px-4 py-3 text-xs font-semibold uppercase text-muted">
              Rank
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase text-muted">
              Creator
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-muted">
              RMT Score
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-muted">
              Accuracy
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-muted">
              Avg Return
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-muted">
              Total Tips
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <LeaderboardRow key={entry.creator.id} entry={entry} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
