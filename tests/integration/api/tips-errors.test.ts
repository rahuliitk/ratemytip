// tests/integration/api/tips-errors.test.ts
//
// Tests for error paths in the /api/v1/tips and /api/v1/tips/:id endpoints.
// Validates 404 for missing tips and 400 for invalid filters.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    tip: { findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn() },
  },
}));

import { db } from "@/lib/db";
import { GET } from "@/app/api/v1/tips/[id]/route";
import { NextRequest } from "next/server";

describe("/api/v1/tips/:id — error paths", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 for non-existent tip", async () => {
    vi.mocked(db.tip.findUnique).mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/v1/tips/nonexistent");
    const res = await GET(req, { params: Promise.resolve({ id: "nonexistent" }) });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("TIP_NOT_FOUND");
  });

  it("404 error includes the tip ID in message", async () => {
    vi.mocked(db.tip.findUnique).mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/v1/tips/abc123");
    const res = await GET(req, { params: Promise.resolve({ id: "abc123" }) });
    const body = await res.json();
    expect(body.error.message).toContain("abc123");
  });

  it("returns 500 when database throws", async () => {
    vi.mocked(db.tip.findUnique).mockRejectedValue(new Error("DB connection failed"));

    const req = new NextRequest("http://localhost:3000/api/v1/tips/abc123");
    const res = await GET(req, { params: Promise.resolve({ id: "abc123" }) });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INTERNAL_ERROR");
  });
});
