// src/lib/scraper/rate-limiter.ts

import type { RateLimiterConfig } from "./types";

/**
 * Token bucket rate limiter for API request throttling.
 *
 * Tracks requests within a sliding window and provides methods to check
 * availability, record usage, and wait for an open slot.
 *
 * Usage:
 *   const limiter = new RateLimiter({ maxRequests: 300, windowMs: 15 * 60 * 1000 });
 *   await limiter.waitForSlot();
 *   limiter.recordRequest();
 */
export class RateLimiter {
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly timestamps: number[] = [];

  constructor(config: RateLimiterConfig) {
    this.maxRequests = config.maxRequests;
    this.windowMs = config.windowMs;
  }

  /**
   * Remove timestamps that have fallen outside the current window.
   */
  private pruneExpired(): void {
    const cutoff = Date.now() - this.windowMs;
    while (this.timestamps.length > 0 && this.timestamps[0]! < cutoff) {
      this.timestamps.shift();
    }
  }

  /**
   * Check whether a request can be made right now without exceeding the limit.
   */
  canMakeRequest(): boolean {
    this.pruneExpired();
    return this.timestamps.length < this.maxRequests;
  }

  /**
   * Record that a request was just made. Call this after every successful API call.
   */
  recordRequest(): void {
    this.timestamps.push(Date.now());
  }

  /**
   * Returns the number of remaining requests in the current window.
   */
  remainingRequests(): number {
    this.pruneExpired();
    return Math.max(0, this.maxRequests - this.timestamps.length);
  }

  /**
   * Returns the number of milliseconds until the next slot opens.
   * Returns 0 if a slot is already available.
   */
  msUntilNextSlot(): number {
    this.pruneExpired();
    if (this.timestamps.length < this.maxRequests) {
      return 0;
    }
    const oldestTimestamp = this.timestamps[0];
    if (oldestTimestamp === undefined) {
      return 0;
    }
    const expiresAt = oldestTimestamp + this.windowMs;
    return Math.max(0, expiresAt - Date.now());
  }

  /**
   * Wait until a request slot is available. Resolves immediately if a slot
   * is open, otherwise sleeps until the oldest request expires from the window.
   */
  async waitForSlot(): Promise<void> {
    const waitMs = this.msUntilNextSlot();
    if (waitMs <= 0) {
      return;
    }
    await new Promise<void>((resolve) => {
      setTimeout(resolve, waitMs);
    });
    // After waiting, prune again to ensure slot is actually free (handles clock drift)
    this.pruneExpired();
  }

  /**
   * Reset the limiter, clearing all tracked timestamps.
   * Useful for testing or after a long idle period.
   */
  reset(): void {
    this.timestamps.length = 0;
  }
}

// ──── Pre-configured factory functions for each platform ────

/** Twitter API v2 App-only auth: 1500 requests per 15 minutes */
export function createTwitterRateLimiter(): RateLimiter {
  return new RateLimiter({
    maxRequests: 1500,
    windowMs: 15 * 60 * 1000,
  });
}

/** YouTube Data API v3: 10,000 units per day (we track calls, not units) */
export function createYouTubeRateLimiter(): RateLimiter {
  return new RateLimiter({
    maxRequests: 10_000,
    windowMs: 24 * 60 * 60 * 1000,
  });
}

/** MoneyControl website: be polite, max 2 requests per 10 seconds */
export function createMoneyControlRateLimiter(): RateLimiter {
  return new RateLimiter({
    maxRequests: 2,
    windowMs: 10_000,
  });
}
