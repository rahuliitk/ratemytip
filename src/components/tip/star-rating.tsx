"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";

interface StarRatingProps {
  readonly tipId: string;
  readonly avgRating?: number | null;
  readonly ratingCount?: number;
}

export function StarRating({ tipId, avgRating, ratingCount = 0 }: StarRatingProps): React.ReactElement {
  const { data: session } = useSession();
  const router = useRouter();
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch user's existing rating
  useEffect(() => {
    if (!session?.user?.userId) return;
    fetch(`/api/v1/tips/${tipId}/ratings`)
      .then((r) => r.json())
      .then((data) => {
        if (data.data?.rating) setUserRating(data.data.rating);
      })
      .catch(() => {});
  }, [tipId, session?.user?.userId]);

  async function handleRate(rating: number): Promise<void> {
    if (!session?.user?.userId) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setLoading(true);
    const prev = userRating;
    setUserRating(rating); // optimistic

    try {
      const res = await fetch(`/api/v1/tips/${tipId}/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });

      if (!res.ok) setUserRating(prev);
    } catch {
      setUserRating(prev);
    }
    setLoading(false);
  }

  const displayRating = hoverRating || userRating || 0;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={loading}
            className="p-0.5 transition-colors disabled:cursor-not-allowed"
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => handleRate(star)}
            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
          >
            <Star
              className={`h-5 w-5 ${
                star <= displayRating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
      <span className="text-sm text-muted">
        {avgRating ? avgRating.toFixed(1) : "—"}{" "}
        <span className="text-xs">({ratingCount})</span>
      </span>
    </div>
  );
}
