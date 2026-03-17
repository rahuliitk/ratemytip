"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ──── Types ────

interface CategoryRatings {
  clarity: number;
  timeliness: number;
  riskManagement: number;
  transparency: number;
}

interface StoredReview {
  overallRating: number;
  categoryRatings: CategoryRatings;
  reviewText: string;
  date: string;
}

interface ReviewListProps {
  readonly creatorId: string;
}

// ──── Constants ────

const CATEGORY_LABELS: Record<keyof CategoryRatings, string> = {
  clarity: "Clarity",
  timeliness: "Timeliness",
  riskManagement: "Risk Mgmt",
  transparency: "Transparency",
};

// ──── Star display sub-component ────

function StarDisplay({
  rating,
  size = "sm",
}: {
  readonly rating: number;
  readonly size?: "sm" | "xs";
}): React.ReactElement {
  const starSize = size === "xs" ? "h-3 w-3" : "h-4 w-4";

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={cn(
            starSize,
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-none text-gray-300"
          )}
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
          />
        </svg>
      ))}
    </div>
  );
}

// ──── Helpers ────

function calculateAverageRating(reviews: StoredReview[]): number {
  if (reviews.length === 0) return 0;
  const total = reviews.reduce((sum, r) => sum + r.overallRating, 0);
  return total / reviews.length;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "Unknown date";
  }
}

// ──── Component ────

export function ReviewList({ creatorId }: ReviewListProps): React.ReactElement {
  const [reviews, setReviews] = React.useState<StoredReview[]>([]);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    try {
      const listKey = `${creatorId}_reviews`;
      const stored = localStorage.getItem(listKey);
      if (stored) {
        const parsed = JSON.parse(stored) as StoredReview[];
        // Show newest first
        setReviews(parsed.reverse());
      }
    } catch {
      // localStorage unavailable or corrupted
    }
    setLoaded(true);
  }, [creatorId]);

  if (!loaded) {
    return (
      <div className="rounded-xl border border-border/60 bg-surface p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-48 rounded bg-bg-alt" />
          <div className="h-4 w-32 rounded bg-bg-alt" />
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 rounded bg-bg-alt" />
                <div className="h-10 w-full rounded bg-bg-alt" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const avgRating = calculateAverageRating(reviews);

  return (
    <div className="rounded-xl border border-border/60 bg-surface p-6 shadow-sm">
      <h3 className="text-base font-semibold text-text">Community Reviews</h3>

      {reviews.length === 0 ? (
        <div className="mt-4 rounded-lg bg-bg-alt/50 p-8 text-center">
          <svg
            className="mx-auto h-8 w-8 text-muted-light"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
            />
          </svg>
          <p className="mt-2 text-sm text-muted">
            No reviews yet. Be the first to share your experience!
          </p>
        </div>
      ) : (
        <>
          {/* Average Rating Summary */}
          <div className="mt-4 flex items-center gap-3 rounded-lg bg-bg-alt/50 p-4">
            <div className="text-3xl font-bold text-text tabular-nums">
              {avgRating.toFixed(1)}
            </div>
            <div>
              <StarDisplay rating={Math.round(avgRating)} size="sm" />
              <p className="mt-0.5 text-xs text-muted">
                based on {reviews.length} review{reviews.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Review List */}
          <div className="mt-4 divide-y divide-border/40">
            {reviews.map((review, index) => (
              <div key={index} className="py-4 first:pt-0 last:pb-0">
                {/* Rating + Date */}
                <div className="flex items-center justify-between">
                  <StarDisplay rating={review.overallRating} size="sm" />
                  <span className="text-xs text-muted">
                    {formatDate(review.date)}
                  </span>
                </div>

                {/* Category Ratings */}
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {(Object.keys(CATEGORY_LABELS) as (keyof CategoryRatings)[]).map(
                    (key) =>
                      review.categoryRatings[key] > 0 && (
                        <div key={key} className="flex items-center gap-1.5">
                          <span className="text-[10px] text-muted">
                            {CATEGORY_LABELS[key]}
                          </span>
                          <StarDisplay
                            rating={review.categoryRatings[key]}
                            size="xs"
                          />
                        </div>
                      )
                  )}
                </div>

                {/* Review Text */}
                {review.reviewText && (
                  <p className="mt-2 text-sm leading-relaxed text-text">
                    {review.reviewText}
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
