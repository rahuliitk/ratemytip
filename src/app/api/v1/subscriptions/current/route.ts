// GET /api/v1/subscriptions/current — Get current subscription status
import { NextResponse } from "next/server";
import { requireUser, isAuthError } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function GET(): Promise<NextResponse> {
  const result = await requireUser();
  if (isAuthError(result)) return result;

  const user = await db.user.findUniqueOrThrow({
    where: { id: result.userId },
    select: { subscriptionTier: true },
  });

  const subscription = await db.subscription.findFirst({
    where: { userId: result.userId, status: { in: ["ACTIVE", "PAST_DUE"] } },
    orderBy: { createdAt: "desc" },
    select: {
      tier: true,
      status: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
      canceledAt: true,
    },
  });

  const recentPayments = await db.payment.findMany({
    where: { userId: result.userId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      amount: true,
      currency: true,
      status: true,
      description: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      tier: user.subscriptionTier,
      subscription,
      payments: recentPayments,
    },
  });
}
