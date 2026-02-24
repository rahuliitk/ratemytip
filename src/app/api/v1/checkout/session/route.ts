// POST /api/v1/checkout/session — Create a Stripe checkout session
import { NextResponse } from "next/server";
import { requireUser, isAuthError } from "@/lib/auth-helpers";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { checkoutSessionSchema } from "@/lib/validators/subscription";

const PRICE_MAP: Record<string, string | undefined> = {
  PRO: process.env.STRIPE_PRO_PRICE_ID,
  PREMIUM: process.env.STRIPE_PREMIUM_PRICE_ID,
};

export async function POST(request: Request): Promise<NextResponse> {
  const result = await requireUser();
  if (isAuthError(result)) return result;

  const body: unknown = await request.json();
  const parsed = checkoutSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.message } },
      { status: 400 }
    );
  }

  const priceId = PRICE_MAP[parsed.data.tier];
  if (!priceId) {
    return NextResponse.json(
      { success: false, error: { code: "CONFIG_ERROR", message: "Price ID not configured for tier" } },
      { status: 500 }
    );
  }

  // Get or create Stripe customer
  const user = await db.user.findUniqueOrThrow({
    where: { id: result.userId },
    select: { stripeCustomerId: true, email: true, displayName: true },
  });

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.displayName,
      metadata: { userId: result.userId },
    });
    customerId = customer.id;
    await db.user.update({
      where: { id: result.userId },
      data: { stripeCustomerId: customerId },
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/settings/billing?success=true`,
    cancel_url: `${baseUrl}/pricing?canceled=true`,
    metadata: { userId: result.userId, tier: parsed.data.tier },
  });

  return NextResponse.json({ success: true, data: { url: session.url } });
}
