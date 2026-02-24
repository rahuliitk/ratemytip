"use client";

import { useState, useEffect } from "react";
import { EyeOff, XCircle, CheckCircle, Loader2, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";

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
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gradient-primary">Comment Reports</h1>
          <p className="mt-1 text-sm text-muted">
            {total} total &middot; {pendingCount} pending review
          </p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="mt-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === status
                ? "bg-accent text-white"
                : "bg-bg text-muted hover:bg-gray-200"
            }`}
          >
            {STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="mt-8 flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted" />
        </div>
      ) : reports.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-white shadow-[0_1px_3px_0_rgba(26,54,93,0.06),0_1px_2px_-1px_rgba(26,54,93,0.06)] py-16 text-center">
          <p className="text-sm text-muted">No reports found.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {reports.map((report) => {
            const isExpanded = expandedId === report.id;
            return (
              <div
                key={report.id}
                className="rounded-2xl bg-white shadow-[0_1px_2px_0_rgba(26,54,93,0.04)]"
              >
                {/* Summary row */}
                <div className="flex items-center justify-between px-4 py-3">
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
                    <span className="text-xs text-muted">on {report.comment.stockSymbol}</span>
                    <ReportStatusBadge status={report.status} />
                    {report.comment.isHidden && (
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">Hidden</span>
                    )}
                  </button>

                  {report.status === "PENDING_REPORT" && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAction(report.id, "HIDE_COMMENT")}
                        disabled={actionLoading === report.id}
                        title="Hide comment"
                        className="inline-flex items-center gap-1 rounded-md bg-danger px-3 py-1.5 text-xs font-medium text-white hover:bg-danger/90 disabled:opacity-50"
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
                        className="inline-flex items-center gap-1 rounded-md bg-gray-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-600 disabled:opacity-50"
                      >
                        <XCircle className="h-3 w-3" />
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-gray-200 px-4 py-4">
                    <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium text-muted">Reported Comment</p>
                        <div className="mt-1 rounded bg-bg p-3 text-sm text-text">
                          {report.comment.content}
                        </div>
                        <p className="mt-1 text-xs text-muted">
                          Posted {new Date(report.comment.createdAt).toLocaleDateString("en-IN")} by{" "}
                          {report.comment.author.displayName ?? report.comment.author.username ?? "User"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted">Report Details</p>
                        <p className="mt-1 text-sm text-text">
                          <span className="font-medium">Reason:</span> {report.reason}
                        </p>
                        {report.details && (
                          <p className="mt-1 text-sm text-text">
                            <span className="font-medium">Details:</span> {report.details}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-muted">
                          Reported by{" "}
                          {report.reporter?.displayName ?? report.reporter?.username ?? "Unknown"}{" "}
                          on {new Date(report.createdAt).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted">Related Tip</p>
                        <a
                          href={`/tip/${report.comment.tipId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-0.5 inline-flex items-center gap-1 text-sm text-accent hover:underline"
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
                          className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-text hover:bg-[#2B6CB0]/5 disabled:opacity-50"
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
    SPAM: "bg-orange-100 text-orange-800",
    HARASSMENT: "bg-red-100 text-red-800",
    MISLEADING: "bg-yellow-100 text-yellow-800",
    OTHER: "bg-gray-100 text-gray-700",
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${styles[reason] ?? "bg-gray-100 text-gray-700"}`}>
      {reason}
    </span>
  );
}

function ReportStatusBadge({ status }: { readonly status: string }): React.ReactElement {
  const styles: Record<string, string> = {
    PENDING_REPORT: "bg-yellow-100 text-yellow-800",
    REVIEWED: "bg-blue-100 text-blue-800",
    ACTIONED: "bg-green-100 text-green-800",
    DISMISSED: "bg-gray-100 text-gray-700",
  };
  const labels: Record<string, string> = {
    PENDING_REPORT: "Pending",
    REVIEWED: "Reviewed",
    ACTIONED: "Actioned",
    DISMISSED: "Dismissed",
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${styles[status] ?? "bg-gray-100 text-gray-700"}`}>
      {labels[status] ?? status}
    </span>
  );
}
