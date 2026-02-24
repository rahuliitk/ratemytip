// tests/integration/health.test.ts
//
// Integration tests for GET /api/health
// Tests infrastructure health check endpoint with database and Redis probes.

import { describe, it, expect, vi, beforeEach } from "vitest";

// ──── Mocks ────

vi.mock("@/lib/db", () => ({
  db: {
    $queryRaw: vi.fn(),
  },
}));

vi.mock("@/lib/redis", () => ({
  redis: {
    ping: vi.fn(),
  },
}));

import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { GET } from "@/app/api/health/route";

// ──── Tests ────

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with status 'healthy' when all checks pass", async () => {
    vi.mocked(db.$queryRaw).mockResolvedValue([{ "?column?": 1 }] as never);
    vi.mocked(redis.ping).mockResolvedValue("PONG");

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("healthy");
    expect(body.checks.database).toBe("ok");
    expect(body.checks.redis).toBe("ok");
    expect(body.timestamp).toBeDefined();
  });

  it("returns 503 with status 'degraded' when database fails", async () => {
    vi.mocked(db.$queryRaw).mockRejectedValue(new Error("Connection refused"));
    vi.mocked(redis.ping).mockResolvedValue("PONG");

    const res = await GET();
    expect(res.status).toBe(503);

    const body = await res.json();
    expect(body.status).toBe("degraded");
    expect(body.checks.database).toBe("error");
    expect(body.checks.redis).toBe("ok");
  });

  it("returns 503 with status 'degraded' when Redis fails", async () => {
    vi.mocked(db.$queryRaw).mockResolvedValue([{ "?column?": 1 }] as never);
    vi.mocked(redis.ping).mockRejectedValue(new Error("ECONNREFUSED"));

    const res = await GET();
    expect(res.status).toBe(503);

    const body = await res.json();
    expect(body.status).toBe("degraded");
    expect(body.checks.database).toBe("ok");
    expect(body.checks.redis).toBe("error");
  });

  it("returns 503 when both database and Redis fail", async () => {
    vi.mocked(db.$queryRaw).mockRejectedValue(new Error("DB down"));
    vi.mocked(redis.ping).mockRejectedValue(new Error("Redis down"));

    const res = await GET();
    expect(res.status).toBe(503);

    const body = await res.json();
    expect(body.status).toBe("degraded");
    expect(body.checks.database).toBe("error");
    expect(body.checks.redis).toBe("error");
  });

  it("marks Redis as error when ping returns unexpected value", async () => {
    vi.mocked(db.$queryRaw).mockResolvedValue([{ "?column?": 1 }] as never);
    vi.mocked(redis.ping).mockResolvedValue("NOT_PONG" as never);

    const res = await GET();
    expect(res.status).toBe(503);

    const body = await res.json();
    expect(body.status).toBe("degraded");
    expect(body.checks.database).toBe("ok");
    expect(body.checks.redis).toBe("error");
  });

  it("includes a valid ISO timestamp in the response", async () => {
    vi.mocked(db.$queryRaw).mockResolvedValue([{ "?column?": 1 }] as never);
    vi.mocked(redis.ping).mockResolvedValue("PONG");

    const res = await GET();
    const body = await res.json();

    // Verify timestamp is a valid ISO date string
    const parsed = new Date(body.timestamp);
    expect(parsed.toISOString()).toBe(body.timestamp);
  });
});
