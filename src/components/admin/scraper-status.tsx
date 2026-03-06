interface ScrapeJobData {
  readonly id: string;
  readonly platform: string;
  readonly jobType: string;
  readonly status: string;
  readonly postsFound: number;
  readonly tipsExtracted: number;
  readonly errorMessage: string | null;
  readonly startedAt: string | null;
  readonly completedAt: string | null;
  readonly createdAt: string;
}

interface ScraperStatusProps {
  readonly jobs: readonly ScrapeJobData[];
}

const STATUS_COLORS: Record<string, string> = {
  QUEUED: "bg-amber-50 text-amber-700",
  RUNNING: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  FAILED: "bg-red-50 text-red-700",
  CANCELLED: "bg-bg-alt text-muted",
};

export function ScraperStatus({ jobs }: ScraperStatusProps): React.ReactElement {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/60 bg-surface shadow-sm">
      <table className="w-full min-w-[700px] text-left">
        <thead>
          <tr className="border-b border-border/60 bg-bg-alt/80">
            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
              Platform
            </th>
            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
              Type
            </th>
            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
              Status
            </th>
            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">
              Posts
            </th>
            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">
              Tips
            </th>
            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
              Started
            </th>
            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
              Error
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {jobs.map((job) => (
            <tr key={job.id} className="transition-colors hover:bg-bg-alt/50">
              <td className="px-5 py-3 text-sm font-medium text-text">
                {job.platform}
              </td>
              <td className="px-5 py-3 text-sm text-muted">{job.jobType}</td>
              <td className="px-5 py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    STATUS_COLORS[job.status] ?? "bg-bg-alt text-muted"
                  }`}
                >
                  {job.status === "RUNNING" && (
                    <span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
                  )}
                  {job.status}
                </span>
              </td>
              <td className="px-5 py-3 text-right text-sm font-medium tabular-nums text-text">
                {job.postsFound}
              </td>
              <td className="px-5 py-3 text-right text-sm font-medium tabular-nums text-text">
                {job.tipsExtracted}
              </td>
              <td className="px-5 py-3 text-xs text-muted tabular-nums">
                {job.startedAt
                  ? new Date(job.startedAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "-"}
              </td>
              <td className="max-w-[200px] truncate px-5 py-3 text-xs text-red-600">
                {job.errorMessage ?? "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {jobs.length === 0 && (
        <div className="py-16 text-center text-sm text-muted">
          No scrape jobs found.
        </div>
      )}
    </div>
  );
}
