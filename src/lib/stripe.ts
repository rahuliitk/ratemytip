// src/lib/stripe.ts
//
// Stripe client singleton — same pattern as db.ts and redis.ts.
// Only instantiated on the server side.
// Uses lazy initialization to avoid crashing during Next.js build
// when STRIPE_SECRET_KEY is not available.

import Stripe from "stripe";

const globalForStripe = globalThis as unknown as { stripe: Stripe | undefined };

function getStripeClient(): Stripe {
  if (globalForStripe.stripe) return globalForStripe.stripe;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY environment variable is not set");
  }
  const client = new Stripe(key);

  if (process.env.NODE_ENV !== "production") {
    globalForStripe.stripe = client;
  }
  return client;
}

/** Lazily initialized Stripe client — throws at first use if STRIPE_SECRET_KEY is missing. */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    const client = getStripeClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
