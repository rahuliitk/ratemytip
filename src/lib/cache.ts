import { redis } from "@/lib/redis";

/**
 * Cache-aside helper: returns cached value if available, otherwise
 * calls the fetcher, stores the result in Redis with the given TTL,
 * and returns it. Gracefully falls back to the fetcher when Redis
 * is unavailable.
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  try {
    const hit = await redis.get(key);
    if (hit !== null) {
      return JSON.parse(hit) as T;
    }
  } catch {
    // Redis unavailable — fall through to fetcher
  }

  const data = await fetcher();

  try {
    await redis.set(key, JSON.stringify(data), "EX", ttlSeconds);
  } catch {
    // Redis unavailable — data still returned from fetcher
  }

  return data;
}

/** Delete one or more cache keys (e.g. on data mutation). */
export async function invalidateCache(...keys: string[]): Promise<void> {
  try {
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Redis unavailable — silently ignore
  }
}

/** Delete all keys matching a pattern (e.g. "leaderboard:*"). */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Redis unavailable — silently ignore
  }
}
