// POST /api/v1/subscriptions/cancel — Cancel subscription at period end
import { NextResponse } from "next/server";
import { requireUser, isAuthError } from "@/lib/auth-helpers";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function POST(): Promise<NextResponse> {
  const result = await requireUser();
  if (isAuthError(result)) return result;

  const subscription = await db.subscription.findFirst({
    where: { userId: result.userId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });

  if (!subscription) {
    return NextResponse.json(
      { success: false, error: { code: "NO_SUBSCRIPTION", message: "No active subscription found" } },
      { status: 404 }
    );
  }

  // Cancel at period end (not immediately) so user retains access until billing cycle ends
  await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  await db.subscription.update({
    where: { id: subscription.id },
    data: { cancelAtPeriodEnd: true, canceledAt: new Date() },
  });

  return NextResponse.json({
    success: true,
    data: { message: "Subscription will cancel at end of billing period" },
  });
}
