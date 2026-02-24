// src/lib/queue/workers/notification-worker.ts
//
// BullMQ worker that creates in-app notifications for users.
// Handles various notification types: tip status changes, new tips from
// followed creators, claim approvals/rejections, and comment replies.

import { Worker, type Job } from "bullmq";
import type { NotificationType } from "@prisma/client";

import { createLogger } from "@/lib/logger";
import { db } from "@/lib/db";

const log = createLogger("worker/notification");

// ──── Job payload type ────

interface NotificationJobData {
  readonly type: NotificationType;
  readonly userId?: string;
  readonly tipId?: string;
  readonly creatorId?: string;
  readonly claimId?: string;
  readonly commentId?: string;
  readonly enqueuedAt: string;
}

// ──── Redis connection ────

function getConnection(): { host: string; port: number; password?: string } {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || "6379", 10),
    password: parsed.password || undefined,
  };
}

// ──── Notification processors by type ────

async function handleTipStatusChanged(data: NotificationJobData): Promise<number> {
  if (!data.tipId) return 0;

  const tip = await db.tip.findUnique({
    where: { id: data.tipId },
    select: {
      id: true,
      status: true,
      stock: { select: { symbol: true } },
      creator: { select: { displayName: true } },
    },
  });

  if (!tip) return 0;

  // Notify users who saved this tip
  const savedBy = await db.savedTip.findMany({
    where: { tipId: data.tipId },
    select: { userId: true },
  });

  if (savedBy.length === 0) return 0;

  const statusLabel = tip.status.replace(/_/g, " ").toLowerCase();

  await db.notification.createMany({
    data: savedBy.map((s) => ({
      userId: s.userId,
      type: "TIP_STATUS_CHANGED" as const,
      title: `Tip update: ${tip.stock.symbol}`,
      body: `${tip.creator.displayName}'s tip on ${tip.stock.symbol} is now ${statusLabel}`,
      actionUrl: `/tip/${tip.id}`,
      metadata: { tipId: tip.id, status: tip.status },
    })),
  });

  return savedBy.length;
}

async function handleNewTipFromFollowed(data: NotificationJobData): Promise<number> {
  if (!data.tipId || !data.creatorId) return 0;

  const tip = await db.tip.findUnique({
    where: { id: data.tipId },
    select: {
      id: true,
      direction: true,
      stock: { select: { symbol: true } },
      creator: { select: { displayName: true, slug: true } },
    },
  });

  if (!tip) return 0;

  // Get all followers of this creator
  const followers = await db.follow.findMany({
    where: { creatorId: data.creatorId },
    select: { userId: true },
  });

  if (followers.length === 0) return 0;

  await db.notification.createMany({
    data: followers.map((f) => ({
      userId: f.userId,
      type: "NEW_TIP_FROM_FOLLOWED" as const,
      title: `New tip from ${tip.creator.displayName}`,
      body: `${tip.direction} ${tip.stock.symbol}`,
      actionUrl: `/tip/${tip.id}`,
      metadata: { tipId: tip.id, creatorSlug: tip.creator.slug },
    })),
  });

  return followers.length;
}

async function handleClaimApproved(data: NotificationJobData): Promise<number> {
  if (!data.claimId || !data.userId) return 0;

  const claim = await db.claimRequest.findUnique({
    where: { id: data.claimId },
    select: { creatorId: true },
  });

  if (!claim) return 0;

  const creator = await db.creator.findUnique({
    where: { id: claim.creatorId },
    select: { displayName: true, slug: true },
  });

  if (!creator) return 0;

  await db.notification.create({
    data: {
      userId: data.userId,
      type: "CLAIM_APPROVED",
      title: "Claim approved!",
      body: `Your claim for "${creator.displayName}" has been approved. You can now access the Creator Dashboard.`,
      actionUrl: "/creator-dashboard",
      metadata: { creatorSlug: creator.slug },
    },
  });

  return 1;
}

async function handleClaimRejected(data: NotificationJobData): Promise<number> {
  if (!data.claimId || !data.userId) return 0;

  const claim = await db.claimRequest.findUnique({
    where: { id: data.claimId },
    select: { creatorId: true, reviewNote: true },
  });

  if (!claim) return 0;

  const creator = await db.creator.findUnique({
    where: { id: claim.creatorId },
    select: { displayName: true, slug: true },
  });

  if (!creator) return 0;

  await db.notification.create({
    data: {
      userId: data.userId,
      type: "CLAIM_REJECTED",
      title: "Claim update",
      body: `Your claim for "${creator.displayName}" was not approved.${claim.reviewNote ? ` Reason: ${claim.reviewNote}` : ""}`,
      actionUrl: `/creator/${creator.slug}`,
      metadata: { creatorSlug: creator.slug },
    },
  });

  return 1;
}

async function handleCommentReply(data: NotificationJobData): Promise<number> {
  if (!data.commentId) return 0;

  const comment = await db.comment.findUnique({
    where: { id: data.commentId },
    select: {
      id: true,
      parentId: true,
      user: { select: { displayName: true } },
      tip: { select: { id: true, stock: { select: { symbol: true } } } },
    },
  });

  if (!comment?.parentId) return 0;

  const parentComment = await db.comment.findUnique({
    where: { id: comment.parentId },
    select: { userId: true },
  });

  if (!parentComment || parentComment.userId === data.userId) return 0;

  await db.notification.create({
    data: {
      userId: parentComment.userId,
      type: "COMMENT_REPLY",
      title: "New reply to your comment",
      body: `${comment.user.displayName} replied to your comment on ${comment.tip.stock.symbol}`,
      actionUrl: `/tip/${comment.tip.id}`,
      metadata: { commentId: comment.id, tipId: comment.tip.id },
    },
  });

  return 1;
}

// ──── Main processor ────

async function processNotification(
  job: Job<NotificationJobData>
): Promise<{ sent: number }> {
  const { type } = job.data;
  log.info({ type, jobId: job.id }, "Processing notification");

  let sent = 0;

  switch (type) {
    case "TIP_STATUS_CHANGED":
      sent = await handleTipStatusChanged(job.data);
      break;
    case "NEW_TIP_FROM_FOLLOWED":
      sent = await handleNewTipFromFollowed(job.data);
      break;
    case "CLAIM_APPROVED":
      sent = await handleClaimApproved(job.data);
      break;
    case "CLAIM_REJECTED":
      sent = await handleClaimRejected(job.data);
      break;
    case "COMMENT_REPLY":
      sent = await handleCommentReply(job.data);
      break;
    default:
      log.warn({ type }, "Unknown notification type");
  }

  log.info({ type, sent }, "Notification processed");
  return { sent };
}

// ──── Worker registration ────

export function createNotificationWorker(): Worker {
  const worker = new Worker<NotificationJobData>(
    "notifications",
    processNotification,
    {
      connection: getConnection(),
      concurrency: 5,
    }
  );

  worker.on("completed", (job) => {
    log.info({ jobId: job.id }, "Notification job completed");
  });

  worker.on("failed", (job, error) => {
    log.error({ err: error, jobId: job?.id }, "Notification job failed");
  });

  return worker;
}
