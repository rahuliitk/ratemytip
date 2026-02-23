// tests/integration/api/leaderboard-errors.test.ts
//
// Tests for error paths in the /api/v1/leaderboard endpoint.
// Validates 400 responses for invalid parameters.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    creator: { findMany: vi.fn(), count: vi.fn() },
  },
}));

vi.mock("@/lib/cache", () => ({
  cached: vi.fn((_key: string, _ttl: number, fn: () => unknown) => fn()),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockResolvedValue(null),
}));

import { GET } from "@/app/api/v1/leaderboard/route";
import { NextRequest } from "next/server";

function makeRequest(params: Record<string, string>): NextRequest {
  const url = new URL("http://localhost:3000/api/v1/leaderboard");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url);
}

describe("/api/v1/leaderboard — error paths", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for invalid category", async () => {
    const res = await GET(makeRequest({ category: "invalidcategory" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for invalid sortBy", async () => {
    const res = await GET(makeRequest({ sortBy: "not_a_field" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("returns 400 for invalid sortOrder", async () => {
    const res = await GET(makeRequest({ sortOrder: "sideways" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("returns 400 for negative page number", async () => {
    const res = await GET(makeRequest({ page: "-1" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("returns 400 for page size exceeding max", async () => {
    const res = await GET(makeRequest({ pageSize: "999" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("returns 400 for non-numeric minTips", async () => {
    const res = await GET(makeRequest({ minTips: "abc" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("returns 400 for invalid timeRange", async () => {
    const res = await GET(makeRequest({ timeRange: "5y" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });
});
