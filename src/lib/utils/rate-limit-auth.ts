import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";

interface RateLimitConfig {
  windowSec: number;
  maxAttempts: number;
}

const AUTH_RATE_LIMITS: Record<string, RateLimitConfig> = {
  register: { windowSec: 3600, maxAttempts: 5 },
  login: { windowSec: 900, maxAttempts: 10 },
  "forgot-password": { windowSec: 3600, maxAttempts: 5 },
  "reset-password": { windowSec: 3600, maxAttempts: 5 },
  "check-username": { windowSec: 60, maxAttempts: 20 },
};

export async function checkAuthRateLimit(
  ip: string,
  action: string
): Promise<NextResponse | null> {
  const config = AUTH_RATE_LIMITS[action];
  if (!config) return null;

  // Skip rate limiting when IP can't be determined to avoid
  // funneling all unknown clients into a single Redis bucket.
  if (ip === "unknown") return null;

  const key = `auth-ratelimit:${action}:${ip}`;

  try {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, config.windowSec);
    }

    if (current > config.maxAttempts) {
      const ttl = await redis.ttl(key);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many attempts. Please try again later.",
          },
        },
        {
          status: 429,
          headers: { "Retry-After": String(ttl > 0 ? ttl : config.windowSec) },
        }
      );
    }
  } catch {
    // If Redis is down, allow the request (fail open for auth)
  }

  return null;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0]?.trim();
    if (ip) return ip;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
