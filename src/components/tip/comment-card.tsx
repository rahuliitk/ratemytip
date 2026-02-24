"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TimeAgo } from "@/components/shared/time-ago";
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Flag,
  Pencil,
  Trash2,
  X,
  Check,
} from "lucide-react";

interface CommentUser {
  id: string;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
}

export interface CommentData {
  id: string;
  content: string;
  isDeleted: boolean;
  upvotes: number;
  downvotes: number;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  user: CommentUser;
  userVote: string | null;
  replies: CommentData[];
}

interface CommentCardProps {
  readonly comment: CommentData;
  readonly tipId: string;
  readonly depth?: number;
  readonly onReplyAdded?: (parentId: string, reply: CommentData) => void;
  readonly onCommentUpdated?: (id: string, content: string) => void;
  readonly onCommentDeleted?: (id: string) => void;
}

export function CommentCard({
  comment,
  tipId,
  depth = 0,
  onReplyAdded,
  onCommentUpdated,
  onCommentDeleted,
}: CommentCardProps): React.ReactElement {
  const { data: session } = useSession();
  const router = useRouter();
  const [upvotes, setUpvotes] = useState(comment.upvotes);
  const [downvotes, setDownvotes] = useState(comment.downvotes);
  const [userVote, setUserVote] = useState<string | null>(comment.userVote);
  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [editLoading, setEditLoading] = useState(false);
  const [reported, setReported] = useState(false);

  const isOwner = session?.user?.userId === comment.user.id;
  const canNest = depth < 1; // only one level of replies

  async function handleVote(voteType: "UPVOTE" | "DOWNVOTE"): Promise<void> {
    if (!session?.user?.userId) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    const prevVote = userVote;
    const prevUp = upvotes;
    const prevDown = downvotes;

    // Optimistic update
    if (userVote === voteType) {
      // Remove vote
      setUserVote(null);
      if (voteType === "UPVOTE") setUpvotes((v) => v - 1);
      else setDownvotes((v) => v - 1);
    } else {
      // Switch or new vote
      if (userVote === "UPVOTE") setUpvotes((v) => v - 1);
      if (userVote === "DOWNVOTE") setDownvotes((v) => v - 1);
      setUserVote(voteType);
      if (voteType === "UPVOTE") setUpvotes((v) => v + 1);
      else setDownvotes((v) => v + 1);
    }

    try {
      const res = await fetch(`/api/v1/comments/${comment.id}/votes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voteType }),
      });
      if (!res.ok) {
        setUserVote(prevVote);
        setUpvotes(prevUp);
        setDownvotes(prevDown);
      }
    } catch {
      setUserVote(prevVote);
      setUpvotes(prevUp);
      setDownvotes(prevDown);
    }
  }

  async function handleReply(): Promise<void> {
    if (!replyContent.trim()) return;
    setReplyLoading(true);

    try {
      const res = await fetch(`/api/v1/tips/${tipId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent, parentId: comment.id }),
      });

      if (res.ok) {
        const json = await res.json();
        onReplyAdded?.(comment.id, json.data);
        setReplyContent("");
        setShowReply(false);
      }
    } catch {
      // keep form open on error
    }
    setReplyLoading(false);
  }

  async function handleEdit(): Promise<void> {
    if (!editContent.trim()) return;
    setEditLoading(true);

    try {
      const res = await fetch(`/api/v1/comments/${comment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });

      if (res.ok) {
        onCommentUpdated?.(comment.id, editContent);
        setEditing(false);
      }
    } catch {
      // keep editing on error
    }
    setEditLoading(false);
  }

  async function handleDelete(): Promise<void> {
    try {
      const res = await fetch(`/api/v1/comments/${comment.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        onCommentDeleted?.(comment.id);
      }
    } catch {
      // no-op
    }
  }

  async function handleReport(): Promise<void> {
    if (!session?.user?.userId) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    try {
      const res = await fetch(`/api/v1/comments/${comment.id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "SPAM" }),
      });

      if (res.ok) setReported(true);
    } catch {
      // no-op
    }
  }

  const displayName = comment.user.displayName || comment.user.username || "User";

  return (
    <div className={`${depth > 0 ? "ml-8 border-l-2 border-gray-100 pl-4" : ""}`}>
      <div className="py-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2B6CB0]/10 text-xs font-semibold text-[#2B6CB0]">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-primary">{displayName}</span>
          <TimeAgo date={comment.createdAt} className="text-xs" />
          {comment.isPinned && (
            <span className="rounded-md bg-[#C05621]/10 px-1.5 py-0.5 text-xs font-medium text-[#C05621]">
              Pinned
            </span>
          )}
        </div>

        {/* Content */}
        <div className="mt-1.5 pl-9">
          {comment.isDeleted ? (
            <p className="text-sm italic text-muted">[deleted]</p>
          ) : editing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full rounded-xl border border-gray-200/60 px-3 py-2 text-sm focus:border-[#2B6CB0]/40 focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]/10"
                rows={3}
                maxLength={1000}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleEdit} disabled={editLoading}>
                  <Check className="mr-1 h-3 w-3" />
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setEditContent(comment.content); }}>
                  <X className="mr-1 h-3 w-3" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-primary whitespace-pre-wrap">{comment.content}</p>
          )}

          {/* Actions */}
          {!comment.isDeleted && !editing && (
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleVote("UPVOTE")}
                className={`flex items-center gap-1 text-xs transition-colors ${
                  userVote === "UPVOTE" ? "text-green-600" : "text-muted hover:text-green-600"
                }`}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                {upvotes > 0 && <span>{upvotes}</span>}
              </button>
              <button
                type="button"
                onClick={() => handleVote("DOWNVOTE")}
                className={`flex items-center gap-1 text-xs transition-colors ${
                  userVote === "DOWNVOTE" ? "text-red-600" : "text-muted hover:text-red-600"
                }`}
              >
                <ThumbsDown className="h-3.5 w-3.5" />
                {downvotes > 0 && <span>{downvotes}</span>}
              </button>

              {canNest && (
                <button
                  type="button"
                  onClick={() => {
                    if (!session?.user?.userId) {
                      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
                      return;
                    }
                    setShowReply(!showReply);
                  }}
                  className="flex items-center gap-1 text-xs text-muted transition-colors hover:text-blue-600"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Reply
                </button>
              )}

              {isOwner && (
                <>
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1 text-xs text-muted transition-colors hover:text-blue-600"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex items-center gap-1 text-xs text-muted transition-colors hover:text-red-600"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                </>
              )}

              {!isOwner && !reported && (
                <button
                  type="button"
                  onClick={handleReport}
                  className="flex items-center gap-1 text-xs text-muted transition-colors hover:text-orange-600"
                >
                  <Flag className="h-3 w-3" />
                  Report
                </button>
              )}
              {reported && (
                <span className="text-xs text-orange-600">Reported</span>
              )}
            </div>
          )}

          {/* Reply form */}
          {showReply && (
            <div className="mt-3 space-y-2">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="w-full rounded-xl border border-gray-200/60 px-3 py-2 text-sm focus:border-[#2B6CB0]/40 focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]/10"
                rows={2}
                maxLength={1000}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleReply} disabled={replyLoading || !replyContent.trim()}>
                  {replyLoading ? "Posting..." : "Reply"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowReply(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {comment.replies.length > 0 && (
        <div>
          {comment.replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              tipId={tipId}
              depth={depth + 1}
              onReplyAdded={onReplyAdded}
              onCommentUpdated={onCommentUpdated}
              onCommentDeleted={onCommentDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
