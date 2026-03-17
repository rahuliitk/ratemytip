"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ──── Types ────

interface SimilarTip {
  readonly id: string;
  readonly direction: "BUY" | "SELL";
  readonly entryPrice: number;
  readonly target1: number;
  readonly stopLoss: number;
  readonly status: string;
  readonly returnPct: number | null;
  readonly tipTimestamp: string;
}

interface SimilarTipsSummary {
  readonly total: number;
  readonly hits: number;
  readonly accuracy: number;
  readonly avgReturn: number;
}

interface SimilarTipsResponse {
  readonly success: boolean;
  readonly data?: {
    readonly tips: readonly SimilarTip[];
    readonly summary: SimilarTipsSummary;
  };
  readonly error?: {
    readonly code: string;
    readonly message: string;
  };
}

interface SimilarTipsPanelProps {
  readonly tipId: string;
  readonly creatorName?: string;
}

// ──── Status Helpers ────

function getStatusLabel(status: string): string {
  switch (status) {
    case "TARGET_1_HIT":
      return "T1 Hit";
    case "TARGET_2_HIT":
      return "T2 Hit";
    case "TARGET_3_HIT":
      return "T3 Hit";
    case "ALL_TARGETS_HIT":
      return "All Hit";
    case "STOPLOSS_HIT":
      return "SL Hit";
    case "EXPIRED":
      return "Expired";
    case "ACTIVE":
      return "Active";
    default:
      return status;
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case "TARGET_1_HIT":
    case "TARGET_2_HIT":
    case "TARGET_3_HIT":
    case "ALL_TARGETS_HIT":
      return "text-green-600";
    case "STOPLOSS_HIT":
      return "text-red-600";
    case "EXPIRED":
      return "text-muted";
    case "ACTIVE":
      return "text-accent";
    default:
      return "text-text";
  }
}

function isTargetHit(status: string): boolean {
  return (
    status === "TARGET_1_HIT" ||
    status === "TARGET_2_HIT" ||
    status === "TARGET_3_HIT" ||
    status === "ALL_TARGETS_HIT"
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

function formatPrice(price: number): string {
  return `\u20B9${price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function formatReturnPct(returnPct: number | null): string {
  if (returnPct === null || returnPct === undefined) return "--";
  const sign = returnPct >= 0 ? "+" : "";
  return `${sign}${returnPct.toFixed(2)}%`;
}

function getReturnColor(returnPct: number | null): string {
  if (returnPct === null || returnPct === undefined) return "text-muted";
  return returnPct >= 0 ? "text-green-600" : "text-red-600";
}

// ──── Component ────

export function SimilarTipsPanel({
  tipId,
  creatorName,
}: SimilarTipsPanelProps): React.ReactElement {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [responseData, setResponseData] = React.useState<SimilarTipsResponse | null>(null);
  const [hasFetched, setHasFetched] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen || hasFetched) return;

    let cancelled = false;

    async function fetchSimilarTips(): Promise<void> {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/v1/similar-tips/${tipId}`);
        if (cancelled) return;

        const json = (await response.json()) as SimilarTipsResponse;
        setResponseData(json);
      } catch {
        if (!cancelled) {
          setResponseData({
            success: false,
            error: {
              code: "FETCH_ERROR",
              message: "Failed to load similar tips",
            },
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setHasFetched(true);
        }
      }
    }

    void fetchSimilarTips();

    return () => {
      cancelled = true;
    };
  }, [isOpen, hasFetched, tipId]);

  const tips = responseData?.data?.tips ?? [];
  const summary = responseData?.data?.summary;
  const displayName = creatorName ?? "This Creator";

  return (
    <div className="rounded-xl border border-border/60 bg-surface shadow-sm overflow-hidden">
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-bg-alt/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            className="h-5 w-5 text-accent"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z"
            />
          </svg>
          <span className="text-sm font-semibold text-text">
            Similar Past Tips from {displayName}
          </span>
        </div>
        <svg
          className={cn(
            "h-4 w-4 text-muted transition-transform duration-200",
            isOpen && "rotate-180"
          )}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m19.5 8.25-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>

      {/* Collapsible Body */}
      {isOpen && (
        <div className="border-t border-border/60 p-4 space-y-4">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-6">
              <div className="flex items-center gap-2 text-sm text-muted">
                <svg
                  className="h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Loading similar tips...
              </div>
            </div>
          )}

          {/* Error State */}
          {!isLoading && responseData && !responseData.success && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
              <svg
                className="h-4 w-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                />
              </svg>
              <span>{responseData.error?.message ?? "Failed to load similar tips"}</span>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && responseData?.success && tips.length === 0 && (
            <div className="text-center py-6">
              <p className="text-sm text-muted">
                This is the first tip from this creator on this stock
              </p>
            </div>
          )}

          {/* Data Loaded */}
          {!isLoading && responseData?.success && tips.length > 0 && summary && (
            <>
              {/* Summary Header */}
              <div className="rounded-lg bg-bg-alt/60 p-3 space-y-2">
                <p className="text-sm text-text">
                  This creator has given{" "}
                  <span className="font-semibold">{summary.total} similar tip{summary.total === 1 ? "" : "s"}</span>{" "}
                  before
                </p>
                <p className="text-sm font-medium text-text">
                  <span
                    className={cn(
                      "tabular-nums",
                      summary.accuracy >= 50 ? "text-green-600" : "text-red-600"
                    )}
                  >
                    {summary.hits} of {summary.total} hit target ({summary.accuracy.toFixed(1)}%)
                  </span>
                  {", "}
                  <span className="text-muted">
                    avg return:{" "}
                    <span
                      className={cn(
                        "tabular-nums font-semibold",
                        summary.avgReturn >= 0 ? "text-green-600" : "text-red-600"
                      )}
                    >
                      {summary.avgReturn >= 0 ? "+" : ""}
                      {summary.avgReturn.toFixed(2)}%
                    </span>
                  </span>
                </p>
              </div>

              {/* Mini Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60">
                      <th className="py-2 pr-3 text-left text-xs font-medium text-muted uppercase tracking-wide">
                        Date
                      </th>
                      <th className="py-2 pr-3 text-left text-xs font-medium text-muted uppercase tracking-wide">
                        Dir
                      </th>
                      <th className="py-2 pr-3 text-right text-xs font-medium text-muted uppercase tracking-wide">
                        Entry
                      </th>
                      <th className="py-2 pr-3 text-right text-xs font-medium text-muted uppercase tracking-wide">
                        Target
                      </th>
                      <th className="py-2 pr-3 text-left text-xs font-medium text-muted uppercase tracking-wide">
                        Status
                      </th>
                      <th className="py-2 text-right text-xs font-medium text-muted uppercase tracking-wide">
                        Return
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tips.map((similarTip) => (
                      <tr
                        key={similarTip.id}
                        className="border-b border-border/30 last:border-b-0"
                      >
                        <td className="py-2 pr-3 text-xs text-muted tabular-nums whitespace-nowrap">
                          {formatDate(similarTip.tipTimestamp)}
                        </td>
                        <td className="py-2 pr-3">
                          <span
                            className={cn(
                              "text-xs font-medium",
                              similarTip.direction === "BUY"
                                ? "text-green-600"
                                : "text-red-600"
                            )}
                          >
                            {similarTip.direction}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-right text-xs tabular-nums text-text">
                          {formatPrice(similarTip.entryPrice)}
                        </td>
                        <td className="py-2 pr-3 text-right text-xs tabular-nums text-text">
                          {formatPrice(similarTip.target1)}
                        </td>
                        <td className="py-2 pr-3">
                          <span
                            className={cn(
                              "text-xs font-medium",
                              getStatusColor(similarTip.status)
                            )}
                          >
                            {getStatusLabel(similarTip.status)}
                          </span>
                        </td>
                        <td
                          className={cn(
                            "py-2 text-right text-xs font-medium tabular-nums",
                            getReturnColor(similarTip.returnPct)
                          )}
                        >
                          {formatReturnPct(similarTip.returnPct)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
