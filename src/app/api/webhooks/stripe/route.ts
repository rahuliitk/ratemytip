// POST /api/webhooks/stripe — Handle Stripe webhook events
// No auth middleware — signature is verified via Stripe's webhook secret.
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import type { SubscriptionTier, SubscriptionStatus } from "@prisma/client";

function mapTier(priceId: string): SubscriptionTier {
  if (priceId === process.env.STRIPE_PREMIUM_PRICE_ID) return "PREMIUM";
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return "PRO";
  return "FREE";
}

function mapStatus(status: string): SubscriptionStatus {
  switch (status) {
    case "active": return "ACTIVE";
    case "past_due": return "PAST_DUE";
    case "canceled": return "CANCELED";
    case "incomplete": return "INCOMPLETE";
    default: return "ACTIVE";
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const subId = session.subscription as string | null;
      if (!userId || !subId) break;

      const sub = await stripe.subscriptions.retrieve(subId);
      const priceId = sub.items.data[0]?.price.id ?? "";
      const tier = mapTier(priceId);

      // In Stripe SDK v20, period dates moved from Subscription to SubscriptionItem
      const item = sub.items.data[0];
      const periodStart = item?.current_period_start ?? Math.floor(Date.now() / 1000);
      const periodEnd = item?.current_period_end ?? Math.floor(Date.now() / 1000);

      // Idempotent upsert — unique on stripeSubscriptionId
      await db.subscription.upsert({
        where: { stripeSubscriptionId: subId },
        create: {
          userId,
          stripeSubscriptionId: subId,
          stripePriceId: priceId,
          tier,
          status: "ACTIVE",
          currentPeriodStart: new Date(periodStart * 1000),
          currentPeriodEnd: new Date(periodEnd * 1000),
        },
        update: {
          status: "ACTIVE",
          tier,
          stripePriceId: priceId,
          currentPeriodStart: new Date(periodStart * 1000),
          currentPeriodEnd: new Date(periodEnd * 1000),
        },
      });

      await db.user.update({
        where: { id: userId },
        data: { subscriptionTier: tier },
      });
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const priceId = sub.items.data[0]?.price.id ?? "";
      const tier = mapTier(priceId);
      const status = mapStatus(sub.status);

      const existing = await db.subscription.findUnique({
        where: { stripeSubscriptionId: sub.id },
      });
      if (!existing) break;

      // In Stripe SDK v20, period dates moved from Subscription to SubscriptionItem
      const updatedItem = sub.items.data[0];
      const updPeriodStart = updatedItem?.current_period_start ?? Math.floor(Date.now() / 1000);
      const updPeriodEnd = updatedItem?.current_period_end ?? Math.floor(Date.now() / 1000);

      await db.subscription.update({
        where: { stripeSubscriptionId: sub.id },
        data: {
          status,
          tier,
          stripePriceId: priceId,
          currentPeriodStart: new Date(updPeriodStart * 1000),
          currentPeriodEnd: new Date(updPeriodEnd * 1000),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
        },
      });

      // Sync user tier
      const effectiveTier = status === "ACTIVE" ? tier : "FREE";
      await db.user.update({
        where: { id: existing.userId },
        data: { subscriptionTier: effectiveTier },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const existing = await db.subscription.findUnique({
        where: { stripeSubscriptionId: sub.id },
      });
      if (!existing) break;

      await db.subscription.update({
        where: { stripeSubscriptionId: sub.id },
        data: { status: "CANCELED", canceledAt: new Date() },
      });

      await db.user.update({
        where: { id: existing.userId },
        data: { subscriptionTier: "FREE" },
      });
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      // In Stripe SDK v20, customer is a union type
      const customerId = typeof invoice.customer === "string"
        ? invoice.customer
        : invoice.customer?.id ?? null;
      if (!customerId) break;

      const user = await db.user.findUnique({
        where: { stripeCustomerId: customerId },
        select: { id: true },
      });
      if (!user) break;

      // In Stripe SDK v20, payment_intent is no longer on Invoice directly.
      // Use the invoice ID as idempotency key (each invoice is paid at most once).
      await db.payment.upsert({
        where: { stripePaymentIntentId: invoice.id },
        create: {
          userId: user.id,
          stripePaymentIntentId: invoice.id,
          amount: invoice.amount_paid,
          currency: invoice.currency,
          status: "SUCCEEDED",
          description: invoice.description ?? `Subscription payment`,
        },
        update: { status: "SUCCEEDED" },
      });
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      // In Stripe SDK v20, subscription is at parent.subscription_details
      const subRef = invoice.parent?.subscription_details?.subscription;
      const subId = typeof subRef === "string" ? subRef : subRef?.id ?? null;
      if (!subId) break;

      await db.subscription.updateMany({
        where: { stripeSubscriptionId: subId },
        data: { status: "PAST_DUE" },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
