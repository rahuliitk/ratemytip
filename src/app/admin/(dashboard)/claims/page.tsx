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
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Claim Requests</h1>
          <p className="mt-1 text-sm text-muted">
            {total} total &middot; {pendingCount} pending review
          </p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="mt-4 flex gap-2">
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
            {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="mt-8 flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted" />
        </div>
      ) : claims.length === 0 ? (
        <div className="mt-8 rounded-lg border border-gray-200 bg-surface py-16 text-center">
          <p className="text-sm text-muted">No claim requests found.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {claims.map((claim) => {
            const isExpanded = expandedId === claim.id;
            return (
              <div
                key={claim.id}
                className="rounded-lg border border-gray-200 bg-surface"
              >
                {/* Summary row */}
                <div className="flex items-center justify-between px-4 py-3">
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
                    <span className="text-sm font-semibold text-primary">
                      {claim.creator?.displayName ?? "Unknown creator"}
                    </span>
                    <StatusBadge status={claim.status} />
                    <span className="text-xs text-muted">
                      {new Date(claim.createdAt).toLocaleDateString("en-IN")}
                    </span>
                  </button>

                  {claim.status === "PENDING" && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAction(claim.id, "APPROVED")}
                        disabled={actionLoading === claim.id}
                        className="inline-flex items-center gap-1 rounded-md bg-success px-3 py-1.5 text-xs font-medium text-white hover:bg-success/90 disabled:opacity-50"
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
                        className="inline-flex items-center gap-1 rounded-md bg-danger px-3 py-1.5 text-xs font-medium text-white hover:bg-danger/90 disabled:opacity-50"
                      >
                        <X className="h-3 w-3" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-gray-200 px-4 py-4">
                    <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium text-muted">Claiming User</p>
                        <p className="mt-0.5 font-medium text-text">
                          {claim.user.displayName ?? claim.user.username ?? "—"}
                        </p>
                        <p className="text-xs text-muted">{claim.user.email}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted">Creator Profile</p>
                        {claim.creator ? (
                          <a
                            href={`/creator/${claim.creator.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-0.5 inline-flex items-center gap-1 font-medium text-accent hover:underline"
                          >
                            {claim.creator.displayName}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <p className="mt-0.5 text-muted">Creator not found</p>
                        )}
                      </div>
                      {claim.proofUrl && (
                        <div>
                          <p className="text-xs font-medium text-muted">Proof URL</p>
                          <a
                            href={claim.proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-0.5 inline-flex items-center gap-1 text-sm text-accent hover:underline"
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
                          <p className="text-xs font-medium text-muted">Verification Note</p>
                          <p className="mt-0.5 text-sm text-text">{claim.verificationNote}</p>
                        </div>
                      )}
                      {claim.reviewNote && (
                        <div>
                          <p className="text-xs font-medium text-muted">Review Note</p>
                          <p className="mt-0.5 text-sm text-text">{claim.reviewNote}</p>
                        </div>
                      )}
                      {claim.reviewer && (
                        <div>
                          <p className="text-xs font-medium text-muted">Reviewed By</p>
                          <p className="mt-0.5 text-sm text-text">
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
                        <label htmlFor={`note-${claim.id}`} className="text-xs font-medium text-muted">
                          Review Note (optional)
                        </label>
                        <textarea
                          id={`note-${claim.id}`}
                          value={reviewNote}
                          onChange={(e) => setReviewNote(e.target.value)}
                          rows={2}
                          className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
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
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${styles[status] ?? "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}
