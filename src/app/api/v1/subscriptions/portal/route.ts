// POST /api/v1/subscriptions/portal — Create Stripe customer portal URL
import { NextResponse } from "next/server";
import { requireUser, isAuthError } from "@/lib/auth-helpers";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function POST(): Promise<NextResponse> {
  const result = await requireUser();
  if (isAuthError(result)) return result;

  const user = await db.user.findUniqueOrThrow({
    where: { id: result.userId },
    select: { stripeCustomerId: true },
  });

  if (!user.stripeCustomerId) {
    return NextResponse.json(
      { success: false, error: { code: "NO_CUSTOMER", message: "No Stripe customer found" } },
      { status: 404 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${baseUrl}/settings/billing`,
  });

  return NextResponse.json({ success: true, data: { url: session.url } });
}
