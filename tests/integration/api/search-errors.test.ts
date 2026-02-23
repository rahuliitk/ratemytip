// tests/integration/api/search-errors.test.ts
//
// Tests for error paths in the /api/v1/search endpoint.
// Validates 400 for missing/invalid query parameter.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    creator: { findMany: vi.fn() },
    stock: { findMany: vi.fn() },
    tip: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/cache", () => ({
  cached: vi.fn((_key: string, _ttl: number, fn: () => unknown) => fn()),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimitSearch: vi.fn().mockResolvedValue(null),
}));

import { GET } from "@/app/api/v1/search/route";
import { NextRequest } from "next/server";

function makeRequest(params: Record<string, string>): NextRequest {
  const url = new URL("http://localhost:3000/api/v1/search");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url);
}

describe("/api/v1/search — error paths", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when q parameter is missing", async () => {
    const res = await GET(makeRequest({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when q is empty string", async () => {
    const res = await GET(makeRequest({ q: "" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("returns 400 for invalid type parameter", async () => {
    const res = await GET(makeRequest({ q: "RELIANCE", type: "invalid" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("returns 400 for limit exceeding max", async () => {
    const res = await GET(makeRequest({ q: "test", limit: "999" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("returns 400 for non-numeric limit", async () => {
    const res = await GET(makeRequest({ q: "test", limit: "abc" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });
});
