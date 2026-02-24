import { LeaderboardRow } from "./leaderboard-row";
import type { LeaderboardEntry } from "@/types";

interface LeaderboardTableProps {
  readonly entries: readonly LeaderboardEntry[];
}

export function LeaderboardTable({ entries }: LeaderboardTableProps): React.ReactElement {
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white px-4 py-16 text-center shadow-[0_1px_2px_0_rgba(26,54,93,0.04)]">
        <p className="text-sm text-muted">
          No creators match the current filters. Try adjusting your criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_1px_2px_0_rgba(26,54,93,0.04)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-50/50">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                Rank
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                Creator
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">
                RMT Score
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">
                Accuracy
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">
                Avg Return
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">
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
    </div>
  );
}
