import { invalidateCachePattern } from "@/lib/cache";

/**
 * Invalidate all cached data for a creator after score update.
 */
export async function invalidateCreatorCache(creatorSlug: string): Promise<void> {
  await invalidateCachePattern(`creator:${creatorSlug}`);
  await invalidateCachePattern(`creator:${creatorSlug}:*`);
}

/**
 * Invalidate leaderboard cache after any score recalculation.
 */
export async function invalidateLeaderboardCache(): Promise<void> {
  await invalidateCachePattern("leaderboard:*");
}

/**
 * Invalidate stock page cache when a tip status changes.
 */
export async function invalidateStockCache(stockSymbol: string): Promise<void> {
  await invalidateCachePattern(`stock:${stockSymbol}*`);
}
