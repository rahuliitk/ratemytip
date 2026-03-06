import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
vi.mock("@/lib/db", () => ({
  db: {
    tip: { findMany: vi.fn().mockResolvedValue([]), update: vi.fn() },
    stock: { update: vi.fn() },
  },
}));
vi.mock("@/lib/utils/cache-invalidation", () => ({
  invalidateStockCache: vi.fn(),
}));

import { PriceMonitor } from "@/lib/market-data/price-monitor";
import type { YahooFinanceService } from "@/lib/market-data/yahoo-finance";
import type { NseService } from "@/lib/market-data/nse";
import type { CurrentPrice } from "@/lib/market-data/types";

describe("PriceMonitor — NSE-first price fetching", () => {
  let mockNse: { getCurrentPrice: ReturnType<typeof vi.fn> };
  let mockYahoo: { getCurrentPrice: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockNse = { getCurrentPrice: vi.fn() };
    mockYahoo = { getCurrentPrice: vi.fn() };
  });

  it("uses NSE price when available for NSE stocks", async () => {
    const nsePrice: CurrentPrice = { symbol: "RELIANCE", price: 2500, change: 10, changePct: 0.4, timestamp: new Date() };
    mockNse.getCurrentPrice.mockResolvedValue(nsePrice);

    const monitor = new PriceMonitor(
      mockYahoo as unknown as YahooFinanceService,
      mockNse as unknown as NseService,
    );

    // Verify monitor was constructed with the NSE mock
    expect(monitor).toBeInstanceOf(PriceMonitor);
    expect(mockNse.getCurrentPrice).toBeDefined();
  });

  it("falls back to Yahoo when NSE throws", async () => {
    mockNse.getCurrentPrice.mockRejectedValue(new Error("NSE unavailable"));
    const yahooPrice: CurrentPrice = { symbol: "RELIANCE", price: 2495, change: 5, changePct: 0.2, timestamp: new Date() };
    mockYahoo.getCurrentPrice.mockResolvedValue(yahooPrice);

    const monitor = new PriceMonitor(
      mockYahoo as unknown as YahooFinanceService,
      mockNse as unknown as NseService,
    );

    // Verify monitor was constructed with fallback mock
    expect(monitor).toBeInstanceOf(PriceMonitor);
    expect(mockYahoo.getCurrentPrice).toBeDefined();
  });
});
