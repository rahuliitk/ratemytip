import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

interface RateLimitConfig {
  /** Maximum requests allowed within the window. */
  readonly limit: number;
  /** Window size in seconds. */
  readonly windowSeconds: number;
}

const GENERAL_LIMIT: RateLimitConfig = { limit: 60, windowSeconds: 60 };
const SEARCH_LIMIT: RateLimitConfig = { limit: 10, windowSeconds: 60 };

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

/**
 * Check the rate limit for a request. Returns null if allowed, or
 * a 429 NextResponse if the limit is exceeded.
 */
async function checkLimit(
  ip: string,
  endpoint: string,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  try {
    const key = `ratelimit:${ip}:${endpoint}`;
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, config.windowSeconds);
    }
    if (current > config.limit) {
      const ttl = await redis.ttl(key);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many requests. Please try again later.",
          },
        },
        {
          status: 429,
          headers: { "Retry-After": String(Math.max(ttl, 1)) },
        }
      );
    }
  } catch {
    // Redis unavailable — allow the request through
  }
  return null;
}

/** Rate limit for general public API endpoints (60 req/min). */
export async function rateLimit(
  request: NextRequest
): Promise<NextResponse | null> {
  const ip = getClientIp(request);
  return checkLimit(ip, "general", GENERAL_LIMIT);
}

/** Rate limit for the search endpoint (10 req/min). */
export async function rateLimitSearch(
  request: NextRequest
): Promise<NextResponse | null> {
  const ip = getClientIp(request);
  return checkLimit(ip, "search", SEARCH_LIMIT);
}
