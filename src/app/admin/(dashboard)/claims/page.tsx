"use client";

import { useState, useEffect } from "react";
import { Check, X, ChevronDown, ChevronRight, Loader2, ExternalLink } from "lucide-react";

interface ClaimUser {
  id: string;
  displayName: string | null;
  username: string | null;
  email: string;
  avatarUrl: string | null;
}

interface ClaimCreator {
  id: string;
  slug: string;
  displayName: string;
  profileImageUrl: string | null;
  isClaimed: boolean;
}

interface ClaimReviewer {
  id: string;
  name: string;
  email: string;
}

interface Claim {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  proofUrl: string | null;
  verificationNote: string | null;
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  user: ClaimUser;
  creator: ClaimCreator | null;
  reviewer: ClaimReviewer | null;
}

const STATUS_FILTERS = ["ALL", "PENDING", "APPROVED", "REJECTED"] as const;

export default function ClaimsPage(): React.ReactElement {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchClaims(statusFilter);
  }, [statusFilter]);

  async function fetchClaims(status: string): Promise<void> {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ pageSize: "50" });
      if (status !== "ALL") params.set("status", status);

      const res = await fetch(`/api/admin/claims?${params}`);
      const data = await res.json();
      if (data.success) {
        setClaims(data.data);
        setTotal(data.meta?.total ?? data.data.length);
      }
    } catch {
      // silently handle
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAction(claimId: string, action: "APPROVED" | "REJECTED"): Promise<void> {
    setActionLoading(claimId);
    try {
      const res = await fetch(`/api/admin/claims/${claimId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reviewNote: reviewNote || undefined }),
      });
      if (res.ok) {
        setClaims((prev) =>
          prev.map((c) => (c.id === claimId ? { ...c, status: action, reviewedAt: new Date().toISOString() } : c))
        );
        setReviewNote("");
        setExpandedId(null);
      }
    } catch {
      // silently handle
    } finally {
      setActionLoading(null);
    }
  }

  const pendingCount = claims.filter((c) => c.status === "PENDING").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Claim Requests</h1>
          <p className="mt-1 text-sm text-muted">
            {total} total &middot; {pendingCount} pending review
          </p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1.5 rounded-lg border border-border/60 bg-surface p-1 shadow-sm w-fit">
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
            {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted" />
        </div>
      ) : claims.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-surface py-20 text-center shadow-sm">
          <p className="text-sm text-muted">No claim requests found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {claims.map((claim) => {
            const isExpanded = expandedId === claim.id;
            return (
              <div
                key={claim.id}
                className="rounded-xl border border-border/60 bg-surface shadow-sm"
              >
                {/* Summary row */}
                <div className="flex items-center justify-between px-5 py-3.5">
                  <button
                    type="button"
                    className="flex flex-1 items-center gap-3 text-left"
                    onClick={() => setExpandedId(isExpanded ? null : claim.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted" />
                    )}
                    <span className="text-sm font-medium text-text">
                      {claim.user.displayName ?? claim.user.username ?? claim.user.email}
                    </span>
                    <span className="text-xs text-muted">&rarr;</span>
                    <span className="text-sm font-semibold text-text">
                      {claim.creator?.displayName ?? "Unknown creator"}
                    </span>
                    <StatusBadge status={claim.status} />
                    <span className="text-xs text-muted tabular-nums">
                      {new Date(claim.createdAt).toLocaleDateString("en-IN")}
                    </span>
                  </button>

                  {claim.status === "PENDING" && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAction(claim.id, "APPROVED")}
                        disabled={actionLoading === claim.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
                      >
                        {actionLoading === claim.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction(claim.id, "REJECTED")}
                        disabled={actionLoading === claim.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                      >
                        <X className="h-3 w-3" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-border/60 px-5 py-4">
                    <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold text-muted">Claiming User</p>
                        <p className="mt-1 font-medium text-text">
                          {claim.user.displayName ?? claim.user.username ?? "--"}
                        </p>
                        <p className="text-xs text-muted">{claim.user.email}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted">Creator Profile</p>
                        {claim.creator ? (
                          <a
                            href={`/creator/${claim.creator.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1.5 font-medium text-accent hover:underline"
                          >
                            {claim.creator.displayName}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <p className="mt-1 text-muted">Creator not found</p>
                        )}
                      </div>
                      {claim.proofUrl && (
                        <div>
                          <p className="text-xs font-semibold text-muted">Proof URL</p>
                          <a
                            href={claim.proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
                          >
                            {claim.proofUrl.length > 60
                              ? claim.proofUrl.slice(0, 60) + "..."
                              : claim.proofUrl}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                      {claim.verificationNote && (
                        <div>
                          <p className="text-xs font-semibold text-muted">Verification Note</p>
                          <p className="mt-1 text-sm text-text">{claim.verificationNote}</p>
                        </div>
                      )}
                      {claim.reviewNote && (
                        <div>
                          <p className="text-xs font-semibold text-muted">Review Note</p>
                          <p className="mt-1 text-sm text-text">{claim.reviewNote}</p>
                        </div>
                      )}
                      {claim.reviewer && (
                        <div>
                          <p className="text-xs font-semibold text-muted">Reviewed By</p>
                          <p className="mt-1 text-sm text-text">
                            {claim.reviewer.name} &middot;{" "}
                            {claim.reviewedAt
                              ? new Date(claim.reviewedAt).toLocaleDateString("en-IN")
                              : ""}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Review note input for pending claims */}
                    {claim.status === "PENDING" && (
                      <div className="mt-4">
                        <label htmlFor={`note-${claim.id}`} className="text-xs font-semibold text-muted">
                          Review Note (optional)
                        </label>
                        <textarea
                          id={`note-${claim.id}`}
                          value={reviewNote}
                          onChange={(e) => setReviewNote(e.target.value)}
                          rows={2}
                          className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-text placeholder:text-muted/60 focus:border-border focus:outline-none focus:ring-2 focus:ring-primary/10"
                          placeholder="Add a note about your decision..."
                        />
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

function StatusBadge({ status }: { readonly status: string }): React.ReactElement {
  const styles: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700",
    APPROVED: "bg-emerald-50 text-emerald-700",
    REJECTED: "bg-red-50 text-red-700",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? "bg-bg-alt text-muted"}`}>
      {status}
    </span>
  );
}
