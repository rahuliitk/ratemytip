"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ──── Constants ────

const MAX_REVIEW_LENGTH = 500;

const REVIEW_CATEGORIES = [
  { key: "clarity", label: "Clarity", description: "How clear are the tips?" },
  { key: "timeliness", label: "Timeliness", description: "Are tips posted in time to act?" },
  { key: "riskManagement", label: "Risk Management", description: "Are stop losses and risk levels appropriate?" },
  { key: "transparency", label: "Transparency", description: "Does the creator share rationale and track record?" },
] as const;

type CategoryKey = (typeof REVIEW_CATEGORIES)[number]["key"];

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

interface CreatorReviewFormProps {
  readonly creatorId: string;
}

// ──── Star sub-component ────

interface StarInputProps {
  readonly rating: number;
  readonly hoverRating: number;
  readonly onSelect: (rating: number) => void;
  readonly onHover: (rating: number) => void;
  readonly onLeave: () => void;
  readonly size?: "sm" | "md";
}

function StarInput({
  rating,
  hoverRating,
  onSelect,
  onHover,
  onLeave,
  size = "md",
}: StarInputProps): React.ReactElement {
  const displayRating = hoverRating || rating;
  const starSize = size === "sm" ? "h-5 w-5" : "h-7 w-7";

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="p-0.5 transition-transform hover:scale-110"
          onMouseEnter={() => onHover(star)}
          onMouseLeave={onLeave}
          onClick={() => onSelect(star)}
          aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
        >
          <svg
            className={cn(
              starSize,
              "transition-colors",
              star <= displayRating
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
        </button>
      ))}
    </div>
  );
}

// ──── Helpers ────

function getStorageKey(creatorId: string): string {
  return `${creatorId}_review`;
}

function loadExistingReview(creatorId: string): StoredReview | null {
  try {
    const stored = localStorage.getItem(getStorageKey(creatorId));
    if (stored) {
      return JSON.parse(stored) as StoredReview;
    }
  } catch {
    // localStorage unavailable or corrupted
  }
  return null;
}

// ──── Component ────

export function CreatorReviewForm({ creatorId }: CreatorReviewFormProps): React.ReactElement {
  const [overallRating, setOverallRating] = React.useState(0);
  const [overallHover, setOverallHover] = React.useState(0);
  const [categoryRatings, setCategoryRatings] = React.useState<CategoryRatings>({
    clarity: 0,
    timeliness: 0,
    riskManagement: 0,
    transparency: 0,
  });
  const [categoryHovers, setCategoryHovers] = React.useState<CategoryRatings>({
    clarity: 0,
    timeliness: 0,
    riskManagement: 0,
    transparency: 0,
  });
  const [reviewText, setReviewText] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [hasExisting, setHasExisting] = React.useState(false);

  // Load existing review on mount
  React.useEffect(() => {
    const existing = loadExistingReview(creatorId);
    if (existing) {
      setOverallRating(existing.overallRating);
      setCategoryRatings(existing.categoryRatings);
      setReviewText(existing.reviewText);
      setHasExisting(true);
    }
  }, [creatorId]);

  function handleCategoryRating(key: CategoryKey, value: number): void {
    setCategoryRatings((prev) => ({ ...prev, [key]: value }));
  }

  function handleCategoryHover(key: CategoryKey, value: number): void {
    setCategoryHovers((prev) => ({ ...prev, [key]: value }));
  }

  function handleCategoryLeave(key: CategoryKey): void {
    setCategoryHovers((prev) => ({ ...prev, [key]: 0 }));
  }

  function handleSubmit(): void {
    if (overallRating === 0) return;

    const review: StoredReview = {
      overallRating,
      categoryRatings,
      reviewText: reviewText.trim(),
      date: new Date().toISOString(),
    };

    try {
      localStorage.setItem(getStorageKey(creatorId), JSON.stringify(review));

      // Also add to the reviews list for this creator
      const listKey = `${creatorId}_reviews`;
      const existingList = localStorage.getItem(listKey);
      const reviews: StoredReview[] = existingList ? JSON.parse(existingList) : [];

      // If updating existing, replace last entry; otherwise add new
      if (hasExisting && reviews.length > 0) {
        reviews[reviews.length - 1] = review;
      } else {
        reviews.push(review);
      }
      localStorage.setItem(listKey, JSON.stringify(reviews));

      setSubmitted(true);
      setHasExisting(true);
      setTimeout(() => setSubmitted(false), 3000);
    } catch {
      // localStorage unavailable
    }
  }

  const isValid = overallRating > 0;

  return (
    <div className="rounded-xl border border-border/60 bg-surface p-6 shadow-sm">
      <h3 className="text-base font-semibold text-text">
        {hasExisting ? "Update Your Review" : "Rate This Creator"}
      </h3>
      <p className="mt-1 text-xs text-muted">
        Share your experience to help others make informed decisions.
      </p>

      {/* Overall Rating */}
      <div className="mt-5 space-y-1">
        <label className="text-sm font-medium text-text">
          Overall Rating
        </label>
        <StarInput
          rating={overallRating}
          hoverRating={overallHover}
          onSelect={setOverallRating}
          onHover={setOverallHover}
          onLeave={() => setOverallHover(0)}
          size="md"
        />
        {overallRating > 0 && (
          <p className="text-xs text-muted">
            {overallRating === 1 && "Poor"}
            {overallRating === 2 && "Below Average"}
            {overallRating === 3 && "Average"}
            {overallRating === 4 && "Good"}
            {overallRating === 5 && "Excellent"}
          </p>
        )}
      </div>

      {/* Category Ratings */}
      <div className="mt-5 space-y-3">
        <p className="text-sm font-medium text-text">Category Ratings</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {REVIEW_CATEGORIES.map((category) => (
            <div
              key={category.key}
              className="rounded-lg border border-border/40 bg-bg-alt/30 p-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-text">
                    {category.label}
                  </p>
                  <p className="text-[10px] text-muted">
                    {category.description}
                  </p>
                </div>
              </div>
              <div className="mt-1.5">
                <StarInput
                  rating={categoryRatings[category.key]}
                  hoverRating={categoryHovers[category.key]}
                  onSelect={(v) => handleCategoryRating(category.key, v)}
                  onHover={(v) => handleCategoryHover(category.key, v)}
                  onLeave={() => handleCategoryLeave(category.key)}
                  size="sm"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Written Review */}
      <div className="mt-5 space-y-1.5">
        <label htmlFor="review-text" className="text-sm font-medium text-text">
          Written Review{" "}
          <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="review-text"
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value.slice(0, MAX_REVIEW_LENGTH))}
          placeholder="What was your experience following this creator's tips?"
          className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text shadow-xs transition-colors placeholder:text-muted-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:border-accent"
          rows={3}
          maxLength={MAX_REVIEW_LENGTH}
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted">
            {reviewText.length}/{MAX_REVIEW_LENGTH}
          </span>
        </div>
      </div>

      {/* Submit */}
      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isValid}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            isValid
              ? "bg-accent text-white hover:bg-accent-hover"
              : "bg-bg-alt text-muted cursor-not-allowed"
          )}
        >
          {hasExisting ? "Update Review" : "Submit Review"}
        </button>
        {submitted && (
          <span className="text-sm font-medium text-emerald-600 animate-in fade-in">
            Review {hasExisting ? "updated" : "submitted"} successfully!
          </span>
        )}
      </div>
    </div>
  );
}
