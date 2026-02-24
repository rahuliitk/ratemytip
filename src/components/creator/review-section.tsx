"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ReviewCard, type ReviewData } from "./review-card";
import { Star } from "lucide-react";

interface ReviewSectionProps {
  readonly creatorId: string;
}

interface ReviewSummary {
  avgRating: number;
  totalReviews: number;
}

interface UserReview {
  id: string;
  rating: number;
  content: string | null;
}

export function ReviewSection({ creatorId }: ReviewSectionProps): React.ReactElement {
  const { data: session } = useSession();
  const router = useRouter();
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [summary, setSummary] = useState<ReviewSummary>({ avgRating: 0, totalReviews: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Review form state
  const [showForm, setShowForm] = useState(false);
  const [userReview, setUserReview] = useState<UserReview | null>(null);
  const [formRating, setFormRating] = useState(0);
  const [formContent, setFormContent] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = useCallback(async (pageNum: number) => {
    try {
      const res = await fetch(`/api/v1/creators/${creatorId}/reviews?page=${pageNum}`);
      if (res.ok) {
        const json = await res.json();
        if (pageNum === 1) {
          setReviews(json.data.reviews);
        } else {
          setReviews((prev) => [...prev, ...json.data.reviews]);
        }
        setSummary(json.data.summary);
        setHasMore(json.meta.hasMore);
        if (json.data.userReview) {
          setUserReview(json.data.userReview);
          setFormRating(json.data.userReview.rating);
          setFormContent(json.data.userReview.content || "");
        }
      }
    } catch {
      // keep existing state on error
    }
    setLoading(false);
  }, [creatorId]);

  useEffect(() => {
    fetchReviews(1);
  }, [fetchReviews]);

  async function handleSubmit(): Promise<void> {
    if (!session?.user?.userId) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (formRating === 0) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/creators/${creatorId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: formRating,
          content: formContent.trim() || null,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setUserReview({ id: json.data.id, rating: json.data.rating, content: json.data.content });
        setShowForm(false);
        // Refresh to get updated summary and list
        setPage(1);
        fetchReviews(1);
      }
    } catch {
      // no-op
    }
    setSubmitting(false);
  }

  function handleLoadMore(): void {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchReviews(nextPage);
  }

  const displayRating = hoverRating || formRating;

  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_0_rgba(26,54,93,0.06),0_1px_2px_-1px_rgba(26,54,93,0.06)]">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gradient-primary">Reviews</h2>
        {session?.user?.userId && (
          <Button
            size="sm"
            variant={showForm ? "ghost" : "default"}
            onClick={() => setShowForm(!showForm)}
          >
            {userReview ? "Edit Review" : "Write Review"}
          </Button>
        )}
      </div>

      {/* Summary */}
      {!loading && summary.totalReviews > 0 && (
        <div className="mt-3 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary tabular-nums">
              {summary.avgRating.toFixed(1)}
            </span>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= Math.round(summary.avgRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
          <span className="text-sm text-muted">
            {summary.totalReviews} review{summary.totalReviews !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Review form */}
      {showForm && (
        <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/50 p-4">
          <p className="text-sm font-medium text-[#1A365D]">
            {userReview ? "Update your review" : "Rate this creator"}
          </p>
          <div className="mt-2 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="p-0.5 transition-colors"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setFormRating(star)}
                aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
              >
                <Star
                  className={`h-6 w-6 ${
                    star <= displayRating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
          <textarea
            value={formContent}
            onChange={(e) => setFormContent(e.target.value)}
            placeholder="Share your experience with this creator (optional)"
            className="mt-3 w-full rounded-xl border border-gray-100 bg-white px-3 py-2 text-sm placeholder:text-gray-400 transition-colors duration-200 focus:border-[#2B6CB0] focus:outline-none focus:ring-1 focus:ring-[#2B6CB0]/20"
            rows={3}
            maxLength={2000}
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-muted">{formContent.length}/2000</span>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={submitting || formRating === 0}>
                {submitting ? "Submitting..." : userReview ? "Update" : "Submit"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Review list */}
      <div className="mt-4 divide-y divide-gray-100">
        {loading ? (
          <div className="space-y-4 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gray-200" />
                  <div className="h-4 w-24 rounded bg-gray-200" />
                </div>
                <div className="ml-11 h-4 w-3/4 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted">
            No reviews yet. Be the first to review this creator!
          </div>
        ) : (
          reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))
        )}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="mt-4 text-center">
          <Button variant="ghost" size="sm" onClick={handleLoadMore}>
            Load more reviews
          </Button>
        </div>
      )}
    </div>
  );
}
