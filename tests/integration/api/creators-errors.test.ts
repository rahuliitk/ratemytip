// tests/integration/api/creators-errors.test.ts
//
// Tests for error paths in the /api/v1/creators/:id endpoint.
// Validates 404 for missing creators and 500 for DB failures.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    creator: { findUnique: vi.fn(), findFirst: vi.fn() },
    tip: { findMany: vi.fn() },
    scoreSnapshot: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/cache", () => ({
  cached: vi.fn((_key: string, _ttl: number, fetcher: () => unknown) => fetcher()),
}));

import { db } from "@/lib/db";
import { GET } from "@/app/api/v1/creators/[id]/route";
import { NextRequest } from "next/server";

describe("/api/v1/creators/:id — error paths", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 for non-existent creator by ID", async () => {
    vi.mocked(db.creator.findFirst).mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/v1/creators/nonexistent");
    const res = await GET(req, { params: Promise.resolve({ id: "nonexistent" }) });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("returns 500 when database throws", async () => {
    vi.mocked(db.creator.findFirst).mockRejectedValue(new Error("DB error"));

    const req = new NextRequest("http://localhost:3000/api/v1/creators/abc");
    const res = await GET(req, { params: Promise.resolve({ id: "abc" }) });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INTERNAL_ERROR");
  });
});
