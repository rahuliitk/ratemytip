import { invalidateCachePattern } from "@/lib/cache";

/**
 * Invalidate all cached data for a creator after score update.
 * Invalidates both slug-keyed and id-keyed entries since the API
 * caches under whichever identifier the endpoint was hit with.
 */
export async function invalidateCreatorCache(creatorSlug: string, creatorId?: string): Promise<void> {
  await invalidateCachePattern(`creator:${creatorSlug}`);
  await invalidateCachePattern(`creator:${creatorSlug}:*`);
  if (creatorId) {
    await invalidateCachePattern(`creator:${creatorId}`);
    await invalidateCachePattern(`creator:${creatorId}:*`);
  }
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
