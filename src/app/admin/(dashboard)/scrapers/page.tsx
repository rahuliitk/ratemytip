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
  QUEUED: "bg-yellow-100 text-yellow-800",
  RUNNING: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-600",
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
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Scraper Jobs</h1>
          <p className="mt-1 text-sm text-muted">
            Manage and monitor scraping jobs
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => triggerScrape("TWITTER")}
            disabled={isTriggering}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50"
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
            className="inline-flex items-center gap-2 rounded-md bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50"
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
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-muted hover:bg-bg"
          >
            <RotateCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-8 flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted" />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 bg-surface">
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
                  Posts Found
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-muted">
                  Tips Extracted
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
                  <td className="px-4 py-3 text-sm text-muted">
                    {job.jobType}
                  </td>
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
              No scrape jobs found. Trigger a scrape to get started.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
