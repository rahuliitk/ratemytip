"use client";

import { useState, useEffect } from "react";
import { Loader2, Play, RotateCw } from "lucide-react";

interface ScrapeJob {
  id: string;
  platform: string;
  jobType: string;
  status: string;
  postsFound: number;
  tipsExtracted: number;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  QUEUED: "bg-amber-50 text-amber-700",
  RUNNING: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  FAILED: "bg-red-50 text-red-700",
  CANCELLED: "bg-bg-alt text-muted",
};

export default function AdminScrapersPage(): React.ReactElement {
  const [jobs, setJobs] = useState<ScrapeJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs(): Promise<void> {
    try {
      const res = await fetch("/api/admin/scrapers");
      const data = await res.json();
      if (data.success) {
        setJobs(data.data);
      }
    } catch {
      // Silently handle
    } finally {
      setIsLoading(false);
    }
  }

  async function triggerScrape(platform: "TWITTER" | "YOUTUBE"): Promise<void> {
    setIsTriggering(true);
    try {
      const res = await fetch("/api/admin/scrapers/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, type: "INCREMENTAL" }),
      });
      if (res.ok) {
        await fetchJobs();
      }
    } catch {
      // Silently handle
    } finally {
      setIsTriggering(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Scraper Jobs</h1>
          <p className="mt-1 text-sm text-muted">
            Manage and monitor scraping jobs
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => triggerScrape("TWITTER")}
            disabled={isTriggering}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isTriggering ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Scrape Twitter
          </button>
          <button
            type="button"
            onClick={() => triggerScrape("YOUTUBE")}
            disabled={isTriggering}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isTriggering ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Scrape YouTube
          </button>
          <button
            type="button"
            onClick={fetchJobs}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-bg-alt"
          >
            <RotateCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted" />
        </div>
      ) : (
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
                  Posts Found
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">
                  Tips Extracted
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
                  <td className="px-5 py-3.5 text-sm font-medium text-text">
                    {job.platform}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted">
                    {job.jobType}
                  </td>
                  <td className="px-5 py-3.5">
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
                  <td className="px-5 py-3.5 text-right text-sm font-medium tabular-nums text-text">
                    {job.postsFound}
                  </td>
                  <td className="px-5 py-3.5 text-right text-sm font-medium tabular-nums text-text">
                    {job.tipsExtracted}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-muted tabular-nums">
                    {job.startedAt
                      ? new Date(job.startedAt).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </td>
                  <td className="max-w-[200px] truncate px-5 py-3.5 text-xs text-red-600">
                    {job.errorMessage ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {jobs.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-sm text-muted">
                No scrape jobs found. Trigger a scrape to get started.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
