import { LeaderboardRow } from "./leaderboard-row";
import type { LeaderboardEntry } from "@/types";

interface LeaderboardTableProps {
  readonly entries: readonly LeaderboardEntry[];
}

export function LeaderboardTable({ entries }: LeaderboardTableProps): React.ReactElement {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-surface px-4 py-16 text-center shadow-sm">
        <p className="text-sm text-muted">
          No creators match the current filters. Try adjusting your criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-surface shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left">
          <thead>
            <tr className="bg-bg-alt/80">
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
