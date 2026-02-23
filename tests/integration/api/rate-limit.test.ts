// tests/integration/api/rate-limit.test.ts
//
// Tests for the rate limiting middleware.
// Validates 429 response and Retry-After header.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/redis", () => {
  let counter = 0;
  return {
    redis: {
      incr: vi.fn().mockImplementation(() => {
        counter++;
        return Promise.resolve(counter);
      }),
      expire: vi.fn().mockResolvedValue(1),
      ttl: vi.fn().mockResolvedValue(45),
      // Reset helper for tests
      __resetCounter: () => { counter = 0; },
    },
  };
});

import { rateLimit, rateLimitSearch } from "@/lib/rate-limit";
import { redis } from "@/lib/redis";
import { NextRequest } from "next/server";

function makeRequest(ip = "192.168.1.1"): NextRequest {
  return new NextRequest("http://localhost:3000/api/v1/test", {
    headers: { "x-forwarded-for": ip },
  });
}

describe("Rate Limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (redis as unknown as { __resetCounter: () => void }).__resetCounter();
  });

  it("allows requests under the limit", async () => {
    vi.mocked(redis.incr).mockResolvedValue(1);
    const result = await rateLimit(makeRequest());
    expect(result).toBeNull();
  });

  it("returns 429 when general limit is exceeded", async () => {
    vi.mocked(redis.incr).mockResolvedValue(61); // Over 60 limit
    const result = await rateLimit(makeRequest());
    expect(result).not.toBeNull();
    expect(result!.status).toBe(429);
    const body = await result!.json();
    expect(body.error.code).toBe("RATE_LIMIT_EXCEEDED");
  });

  it("returns Retry-After header on 429", async () => {
    vi.mocked(redis.incr).mockResolvedValue(61);
    vi.mocked(redis.ttl).mockResolvedValue(30);
    const result = await rateLimit(makeRequest());
    expect(result).not.toBeNull();
    expect(result!.headers.get("Retry-After")).toBe("30");
  });

  it("returns 429 when search limit is exceeded", async () => {
    vi.mocked(redis.incr).mockResolvedValue(11); // Over 10 limit
    const result = await rateLimitSearch(makeRequest());
    expect(result).not.toBeNull();
    expect(result!.status).toBe(429);
  });

  it("allows request when Redis is unavailable (graceful degradation)", async () => {
    vi.mocked(redis.incr).mockRejectedValue(new Error("Redis unavailable"));
    const result = await rateLimit(makeRequest());
    // Should allow the request through
    expect(result).toBeNull();
  });

  it("uses x-forwarded-for header for client IP", async () => {
    vi.mocked(redis.incr).mockResolvedValue(1);
    await rateLimit(makeRequest("10.0.0.1"));
    expect(redis.incr).toHaveBeenCalledWith(
      expect.stringContaining("10.0.0.1")
    );
  });
});
