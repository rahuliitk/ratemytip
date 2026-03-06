"use client";

import { useState, useEffect } from "react";
import { EyeOff, XCircle, Loader2, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";

interface ReportAuthor {
  id: string;
  displayName: string | null;
  username: string | null;
}

interface ReportComment {
  id: string;
  content: string;
  isHidden: boolean;
  createdAt: string;
  author: ReportAuthor;
  tipId: string;
  stockSymbol: string;
}

interface Report {
  id: string;
  reason: string;
  details: string | null;
  status: "PENDING_REPORT" | "REVIEWED" | "ACTIONED" | "DISMISSED";
  createdAt: string;
  reporter: ReportAuthor | null;
  comment: ReportComment;
}

const STATUS_FILTERS = ["ALL", "PENDING_REPORT", "REVIEWED", "ACTIONED", "DISMISSED"] as const;

const STATUS_LABELS: Record<string, string> = {
  ALL: "All",
  PENDING_REPORT: "Pending",
  REVIEWED: "Reviewed",
  ACTIONED: "Actioned",
  DISMISSED: "Dismissed",
};

export default function CommentReportsPage(): React.ReactElement {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchReports(statusFilter);
  }, [statusFilter]);

  async function fetchReports(status: string): Promise<void> {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ pageSize: "50" });
      if (status !== "ALL") params.set("status", status);

      const res = await fetch(`/api/admin/reports?${params}`);
      const data = await res.json();
      if (data.success) {
        setReports(data.data);
        setTotal(data.meta?.total ?? data.data.length);
      }
    } catch {
      // silently handle
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAction(reportId: string, action: "DISMISS" | "HIDE_COMMENT" | "REVIEWED"): Promise<void> {
    setActionLoading(reportId);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const statusMap: Record<string, Report["status"]> = {
          DISMISS: "DISMISSED",
          HIDE_COMMENT: "ACTIONED",
          REVIEWED: "REVIEWED",
        };
        setReports((prev) =>
          prev.map((r) =>
            r.id === reportId
              ? {
                  ...r,
                  status: statusMap[action] ?? r.status,
                  comment: action === "HIDE_COMMENT" ? { ...r.comment, isHidden: true } : r.comment,
                }
              : r
          )
        );
      }
    } catch {
      // silently handle
    } finally {
      setActionLoading(null);
    }
  }

  const pendingCount = reports.filter((r) => r.status === "PENDING_REPORT").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Comment Reports</h1>
          <p className="mt-1 text-sm text-muted">
            {total} total &middot; {pendingCount} pending review
          </p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-1.5 rounded-lg border border-border/60 bg-surface p-1 shadow-sm w-fit">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-all ${
              statusFilter === status
                ? "bg-primary text-white shadow-sm"
                : "text-muted hover:bg-bg-alt hover:text-text"
            }`}
          >
            {STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted" />
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-surface py-20 text-center shadow-sm">
          <p className="text-sm text-muted">No reports found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const isExpanded = expandedId === report.id;
            return (
              <div
                key={report.id}
                className="rounded-xl border border-border/60 bg-surface shadow-sm"
              >
                {/* Summary row */}
                <div className="flex items-center justify-between px-5 py-3.5">
                  <button
                    type="button"
                    className="flex flex-1 items-center gap-3 text-left"
                    onClick={() => setExpandedId(isExpanded ? null : report.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted" />
                    )}
                    <ReasonBadge reason={report.reason} />
                    <span className="text-sm text-text">
                      Comment by{" "}
                      <span className="font-medium">
                        {report.comment.author.displayName ?? report.comment.author.username ?? "User"}
                      </span>
                    </span>
                    <span className="rounded-md bg-bg-alt px-2 py-0.5 text-xs font-medium text-muted">
                      {report.comment.stockSymbol}
                    </span>
                    <ReportStatusBadge status={report.status} />
                    {report.comment.isHidden && (
                      <span className="rounded-md bg-bg-alt px-2 py-0.5 text-xs font-medium text-muted">
                        Hidden
                      </span>
                    )}
                  </button>

                  {report.status === "PENDING_REPORT" && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAction(report.id, "HIDE_COMMENT")}
                        disabled={actionLoading === report.id}
                        title="Hide comment"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                      >
                        {actionLoading === report.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <EyeOff className="h-3 w-3" />
                        )}
                        Hide
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction(report.id, "DISMISS")}
                        disabled={actionLoading === report.id}
                        title="Dismiss report"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3.5 py-1.5 text-xs font-semibold text-surface transition-colors hover:bg-muted/80 disabled:opacity-50"
                      >
                        <XCircle className="h-3 w-3" />
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-border/60 px-5 py-4">
                    <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold text-muted">Reported Comment</p>
                        <div className="mt-1.5 rounded-lg border border-border/40 bg-bg-alt p-3 text-sm leading-relaxed text-text">
                          {report.comment.content}
                        </div>
                        <p className="mt-1.5 text-xs text-muted">
                          Posted {new Date(report.comment.createdAt).toLocaleDateString("en-IN")} by{" "}
                          {report.comment.author.displayName ?? report.comment.author.username ?? "User"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted">Report Details</p>
                        <p className="mt-1.5 text-sm text-text">
                          <span className="font-medium">Reason:</span> {report.reason}
                        </p>
                        {report.details && (
                          <p className="mt-1 text-sm text-text">
                            <span className="font-medium">Details:</span> {report.details}
                          </p>
                        )}
                        <p className="mt-1.5 text-xs text-muted">
                          Reported by{" "}
                          {report.reporter?.displayName ?? report.reporter?.username ?? "Unknown"}{" "}
                          on {new Date(report.createdAt).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted">Related Tip</p>
                        <a
                          href={`/tip/${report.comment.tipId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
                        >
                          {report.comment.stockSymbol} tip
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>

                    {/* Actions for non-pending reports */}
                    {report.status !== "PENDING_REPORT" && !report.comment.isHidden && (
                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleAction(report.id, "HIDE_COMMENT")}
                          disabled={actionLoading === report.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-text transition-colors hover:bg-bg-alt disabled:opacity-50"
                        >
                          <EyeOff className="h-3 w-3" />
                          Hide Comment
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ReasonBadge({ reason }: { readonly reason: string }): React.ReactElement {
  const styles: Record<string, string> = {
    SPAM: "bg-amber-50 text-amber-700",
    HARASSMENT: "bg-red-50 text-red-700",
    MISLEADING: "bg-orange-50 text-orange-700",
    OTHER: "bg-bg-alt text-muted",
  };
  return (
    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${styles[reason] ?? "bg-bg-alt text-muted"}`}>
      {reason}
    </span>
  );
}

function ReportStatusBadge({ status }: { readonly status: string }): React.ReactElement {
  const styles: Record<string, string> = {
    PENDING_REPORT: "bg-amber-50 text-amber-700",
    REVIEWED: "bg-blue-50 text-blue-700",
    ACTIONED: "bg-emerald-50 text-emerald-700",
    DISMISSED: "bg-bg-alt text-muted",
  };
  const labels: Record<string, string> = {
    PENDING_REPORT: "Pending",
    REVIEWED: "Reviewed",
    ACTIONED: "Actioned",
    DISMISSED: "Dismissed",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? "bg-bg-alt text-muted"}`}>
      {labels[status] ?? status}
    </span>
  );
}
