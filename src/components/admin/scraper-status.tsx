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
  QUEUED: "bg-yellow-100 text-yellow-800",
  RUNNING: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-600",
};

export function ScraperStatus({ jobs }: ScraperStatusProps): React.ReactElement {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-surface">
      <table className="w-full min-w-[700px] text-left">
        <thead>
          <tr className="border-b border-gray-200 bg-bg">
            <th className="px-4 py-3 text-xs font-semibold uppercase text-muted">
              Platform
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase text-muted">
              Type
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase text-muted">
              Status
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-muted">
              Posts
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-muted">
              Tips
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase text-muted">
              Started
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase text-muted">
              Error
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {jobs.map((job) => (
            <tr key={job.id} className="hover:bg-bg">
              <td className="px-4 py-3 text-sm font-medium text-text">
                {job.platform}
              </td>
              <td className="px-4 py-3 text-sm text-muted">{job.jobType}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    STATUS_COLORS[job.status] ?? "bg-gray-100 text-gray-600"
                  }`}
                >
                  {job.status}
                </span>
              </td>
              <td className="px-4 py-3 text-right text-sm tabular-nums text-muted">
                {job.postsFound}
              </td>
              <td className="px-4 py-3 text-right text-sm tabular-nums text-muted">
                {job.tipsExtracted}
              </td>
              <td className="px-4 py-3 text-xs text-muted">
                {job.startedAt
                  ? new Date(job.startedAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "-"}
              </td>
              <td className="max-w-[200px] truncate px-4 py-3 text-xs text-danger">
                {job.errorMessage ?? "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {jobs.length === 0 && (
        <div className="py-12 text-center text-sm text-muted">
          No scrape jobs found.
        </div>
      )}
    </div>
  );
}
