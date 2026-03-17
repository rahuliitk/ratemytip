"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";

// ──── Types ────

interface TipFeedbackData {
  readonly helpful: boolean | null; // true = thumbs up, false = thumbs down, null = no vote
  readonly followed: boolean; // did the user follow this tip?
}

interface StoredFeedbackMap {
  [tipId: string]: TipFeedbackData;
}

// ──── Storage helpers ────

const STORAGE_KEY = "ratemytip-tip-feedback";

function getAllFeedback(): StoredFeedbackMap {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as StoredFeedbackMap;
    }
  } catch {
    // ignore
  }
  return {};
}

function saveFeedback(tipId: string, data: TipFeedbackData): void {
  try {
    const all = getAllFeedback();
    all[tipId] = data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

function computeAggregation(feedbackMap: StoredFeedbackMap): {
  totalVotes: number;
  helpfulPct: number;
} {
  const entries = Object.values(feedbackMap);
  const voted = entries.filter((e) => e.helpful !== null);
  if (voted.length === 0) return { totalVotes: 0, helpfulPct: 0 };
  const helpful = voted.filter((e) => e.helpful === true).length;
  return {
    totalVotes: voted.length,
    helpfulPct: Math.round((helpful / voted.length) * 100),
  };
}

// ──── Props ────

interface TipFeedbackProps {
  readonly tipId: string;
  readonly className?: string;
}

// ──── Component ────

export function TipFeedback({
  tipId,
  className,
}: TipFeedbackProps): React.ReactElement {
  const [feedback, setFeedback] = useState<TipFeedbackData>({
    helpful: null,
    followed: false,
  });
  const [mounted, setMounted] = useState(false);
  const [aggregation, setAggregation] = useState({
    totalVotes: 0,
    helpfulPct: 0,
  });

  // Load from localStorage on mount
  useEffect(() => {
    const all = getAllFeedback();
    const existing = all[tipId];
    if (existing) {
      setFeedback(existing);
    }
    setAggregation(computeAggregation(all));
    setMounted(true);
  }, [tipId]);

  const handleVote = useCallback(
    (helpful: boolean) => {
      const newFeedback: TipFeedbackData = {
        ...feedback,
        helpful: feedback.helpful === helpful ? null : helpful, // toggle
      };
      setFeedback(newFeedback);
      saveFeedback(tipId, newFeedback);
      // Re-compute aggregation
      setAggregation(computeAggregation(getAllFeedback()));
    },
    [feedback, tipId]
  );

  const handleFollowToggle = useCallback(() => {
    const newFeedback: TipFeedbackData = {
      ...feedback,
      followed: !feedback.followed,
    };
    setFeedback(newFeedback);
    saveFeedback(tipId, newFeedback);
  }, [feedback, tipId]);

  const hasVoted = feedback.helpful !== null;

  // Server-side / pre-mount: render minimal placeholder
  if (!mounted) {
    return <div className={cn("h-8", className)} />;
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted",
        className
      )}
    >
      {/* Vote buttons */}
      <div className="flex items-center gap-1.5">
        <span className="mr-1">Helpful?</span>
        <button
          type="button"
          onClick={() => handleVote(true)}
          aria-label="Mark as helpful"
          className={cn(
            "inline-flex items-center gap-1 rounded-md border px-2 py-1 transition-all duration-150",
            feedback.helpful === true
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : "border-border/60 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
          )}
        >
          <ThumbsUp className="h-3 w-3" />
          Yes
        </button>
        <button
          type="button"
          onClick={() => handleVote(false)}
          aria-label="Mark as not helpful"
          className={cn(
            "inline-flex items-center gap-1 rounded-md border px-2 py-1 transition-all duration-150",
            feedback.helpful === false
              ? "border-red-300 bg-red-50 text-red-700"
              : "border-border/60 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
          )}
        >
          <ThumbsDown className="h-3 w-3" />
          No
        </button>
      </div>

      {/* Followed toggle */}
      <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={feedback.followed}
          onChange={handleFollowToggle}
          className="h-3.5 w-3.5 rounded border-border/60 text-accent focus:ring-accent/30"
        />
        <span>I followed this tip</span>
      </label>

      {/* Aggregated text */}
      {aggregation.totalVotes > 0 && (
        <span className="text-muted/70">
          {aggregation.helpfulPct}% of users found this helpful
        </span>
      )}
    </div>
  );
}
