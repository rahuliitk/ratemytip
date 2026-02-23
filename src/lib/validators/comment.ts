import { z } from "zod";

export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(1000, "Comment cannot exceed 1000 characters").trim(),
  parentId: z.string().nullable().optional(),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(1000, "Comment cannot exceed 1000 characters").trim(),
});

export const voteSchema = z.object({
  voteType: z.enum(["UPVOTE", "DOWNVOTE"]),
});

export const reportSchema = z.object({
  reason: z.enum(["SPAM", "HARASSMENT", "MISLEADING", "OTHER"]),
  details: z.string().max(500).optional(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type VoteInput = z.infer<typeof voteSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
