// tests/integration/checkout.test.ts
//
// Integration tests for POST /api/v1/checkout/session
// Tests Stripe checkout session creation with mocked dependencies.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

// ──── Environment ────
// vi.hoisted runs before vi.mock hoisting, ensuring env vars are set
// before the route module's PRICE_MAP captures them at import time.
vi.hoisted(() => {
  process.env.STRIPE_PRO_PRICE_ID = "price_pro_123";
  process.env.STRIPE_PREMIUM_PRICE_ID = "price_premium_456";
  process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";
});

// ──── Mocks ────

vi.mock("@/lib/auth-helpers", () => ({
  requireUser: vi.fn(),
  isAuthError: vi.fn((r: unknown) => r instanceof NextResponse),
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    checkout: { sessions: { create: vi.fn() } },
    customers: { create: vi.fn() },
  },
}));

import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { POST } from "@/app/api/v1/checkout/session/route";

// ──── Tests ────

describe("POST /api/v1/checkout/session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns checkout URL for valid PRO tier request", async () => {
    vi.mocked(requireUser).mockResolvedValue({
      session: {} as never,
      userId: "user1",
      username: "test",
    });

    vi.mocked(db.user.findUniqueOrThrow).mockResolvedValue({
      stripeCustomerId: "cus_123",
      email: "test@test.com",
      displayName: "Test",
    } as never);

    vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
      url: "https://checkout.stripe.com/test",
    } as never);

    const req = new Request("http://localhost/api/v1/checkout/session", {
      method: "POST",
      body: JSON.stringify({ tier: "PRO" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.url).toBe("https://checkout.stripe.com/test");

    // Verify Stripe was called with correct price ID
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "cus_123",
        mode: "subscription",
        line_items: [{ price: "price_pro_123", quantity: 1 }],
      })
    );
  });

  it("returns checkout URL for valid PREMIUM tier request", async () => {
    vi.mocked(requireUser).mockResolvedValue({
      session: {} as never,
      userId: "user1",
      username: "test",
    });

    vi.mocked(db.user.findUniqueOrThrow).mockResolvedValue({
      stripeCustomerId: "cus_456",
      email: "premium@test.com",
      displayName: "Premium User",
    } as never);

    vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
      url: "https://checkout.stripe.com/premium-session",
    } as never);

    const req = new Request("http://localhost/api/v1/checkout/session", {
      method: "POST",
      body: JSON.stringify({ tier: "PREMIUM" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.url).toBe("https://checkout.stripe.com/premium-session");
  });

  it("returns 400 for invalid tier", async () => {
    vi.mocked(requireUser).mockResolvedValue({
      session: {} as never,
      userId: "user1",
      username: "test",
    });

    const req = new Request("http://localhost/api/v1/checkout/session", {
      method: "POST",
      body: JSON.stringify({ tier: "INVALID" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 401 when user is not authenticated", async () => {
    vi.mocked(requireUser).mockResolvedValue(
      NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      )
    );

    const req = new Request("http://localhost/api/v1/checkout/session", {
      method: "POST",
      body: JSON.stringify({ tier: "PRO" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("creates Stripe customer when user has no stripeCustomerId", async () => {
    vi.mocked(requireUser).mockResolvedValue({
      session: {} as never,
      userId: "user2",
      username: "newuser",
    });

    vi.mocked(db.user.findUniqueOrThrow).mockResolvedValue({
      stripeCustomerId: null,
      email: "new@test.com",
      displayName: "New User",
    } as never);

    vi.mocked(stripe.customers.create).mockResolvedValue({
      id: "cus_new_789",
    } as never);

    vi.mocked(db.user.update).mockResolvedValue({} as never);

    vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
      url: "https://checkout.stripe.com/new-session",
    } as never);

    const req = new Request("http://localhost/api/v1/checkout/session", {
      method: "POST",
      body: JSON.stringify({ tier: "PRO" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    // Verify customer was created
    expect(stripe.customers.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "new@test.com",
        name: "New User",
        metadata: { userId: "user2" },
      })
    );

    // Verify user was updated with new customer ID
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: "user2" },
      data: { stripeCustomerId: "cus_new_789" },
    });

    // Verify checkout session used the new customer ID
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_new_789" })
    );
  });
});
