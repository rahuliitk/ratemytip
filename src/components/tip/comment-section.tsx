"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CommentCard, type CommentData } from "./comment-card";
import { MessageSquare } from "lucide-react";

interface CommentSectionProps {
  readonly tipId: string;
}

export function CommentSection({ tipId }: CommentSectionProps): React.ReactElement {
  const { data: session } = useSession();
  const router = useRouter();
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"newest" | "top">("newest");
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/tips/${tipId}/comments?sort=${sortBy}`);
      if (res.ok) {
        const json = await res.json();
        setComments(json.data);
      }
    } catch {
      // keep existing comments on error
    }
    setLoading(false);
  }, [tipId, sortBy]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  async function handlePost(): Promise<void> {
    if (!session?.user?.userId) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!newComment.trim()) return;

    setPosting(true);
    try {
      const res = await fetch(`/api/v1/tips/${tipId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });

      if (res.ok) {
        const json = await res.json();
        setComments((prev) => [json.data, ...prev]);
        setNewComment("");
      }
    } catch {
      // no-op
    }
    setPosting(false);
  }

  function handleReplyAdded(parentId: string, reply: CommentData): void {
    setComments((prev) =>
      prev.map((c) =>
        c.id === parentId ? { ...c, replies: [...c.replies, reply] } : c
      )
    );
  }

  function handleCommentUpdated(id: string, content: string): void {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === id) return { ...c, content };
        return {
          ...c,
          replies: c.replies.map((r) =>
            r.id === id ? { ...r, content } : r
          ),
        };
      })
    );
  }

  function handleCommentDeleted(id: string): void {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === id) return { ...c, isDeleted: true, content: "[deleted]" };
        return {
          ...c,
          replies: c.replies.map((r) =>
            r.id === id ? { ...r, isDeleted: true, content: "[deleted]" } : r
          ),
        };
      })
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-surface p-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-primary">
          <MessageSquare className="h-5 w-5" />
          Comments
          {comments.length > 0 && (
            <span className="text-sm font-normal text-muted">({comments.length})</span>
          )}
        </h2>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setSortBy("newest")}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              sortBy === "newest"
                ? "bg-blue-100 text-blue-700"
                : "text-muted hover:bg-gray-100"
            }`}
          >
            Newest
          </button>
          <button
            type="button"
            onClick={() => setSortBy("top")}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              sortBy === "top"
                ? "bg-blue-100 text-blue-700"
                : "text-muted hover:bg-gray-100"
            }`}
          >
            Top
          </button>
        </div>
      </div>

      {/* New comment form */}
      <div className="mt-4">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={session?.user ? "Share your thoughts..." : "Sign in to comment"}
          className="w-full rounded-md border border-gray-200 px-4 py-3 text-sm placeholder:text-gray-400 focus:border-blue-300 focus:outline-none"
          rows={3}
          maxLength={1000}
          disabled={!session?.user}
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-muted">
            {newComment.length}/1000
          </span>
          <Button
            size="sm"
            onClick={handlePost}
            disabled={posting || !newComment.trim() || !session?.user}
          >
            {posting ? "Posting..." : "Post Comment"}
          </Button>
        </div>
      </div>

      {/* Comment list */}
      <div className="mt-4 divide-y divide-gray-100">
        {loading ? (
          <div className="space-y-4 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-gray-200" />
                  <div className="h-4 w-24 rounded bg-gray-200" />
                </div>
                <div className="ml-9 h-4 w-3/4 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted">
            No comments yet. Be the first to share your thoughts!
          </div>
        ) : (
          comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              tipId={tipId}
              onReplyAdded={handleReplyAdded}
              onCommentUpdated={handleCommentUpdated}
              onCommentDeleted={handleCommentDeleted}
            />
          ))
        )}
      </div>
    </div>
  );
}
