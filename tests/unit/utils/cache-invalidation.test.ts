import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the cache module before importing
vi.mock("@/lib/cache", () => ({
  invalidateCachePattern: vi.fn().mockResolvedValue(undefined),
}));

import { invalidateCachePattern } from "@/lib/cache";
import {
  invalidateCreatorCache,
  invalidateLeaderboardCache,
  invalidateStockCache,
} from "@/lib/utils/cache-invalidation";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("cache invalidation", () => {
  it("invalidateCreatorCache clears creator and wildcard patterns", async () => {
    await invalidateCreatorCache("finance-guru");

    expect(invalidateCachePattern).toHaveBeenCalledWith("creator:finance-guru");
    expect(invalidateCachePattern).toHaveBeenCalledWith("creator:finance-guru:*");
    expect(invalidateCachePattern).toHaveBeenCalledTimes(2);
  });

  it("invalidateLeaderboardCache clears leaderboard pattern", async () => {
    await invalidateLeaderboardCache();

    expect(invalidateCachePattern).toHaveBeenCalledWith("leaderboard:*");
    expect(invalidateCachePattern).toHaveBeenCalledTimes(1);
  });

  it("invalidateStockCache clears stock pattern", async () => {
    await invalidateStockCache("RELIANCE");

    expect(invalidateCachePattern).toHaveBeenCalledWith("stock:RELIANCE*");
    expect(invalidateCachePattern).toHaveBeenCalledTimes(1);
  });
});
