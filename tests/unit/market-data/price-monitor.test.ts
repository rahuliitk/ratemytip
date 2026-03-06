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

import { db } from "@/lib/db";
import { PriceMonitor } from "@/lib/market-data/price-monitor";
import type { YahooFinanceService } from "@/lib/market-data/yahoo-finance";
import type { NseService } from "@/lib/market-data/nse";
import type { CurrentPrice } from "@/lib/market-data/types";

const mockTipFindMany = vi.mocked(db.tip.findMany);

function buildActiveTip(overrides: { symbol?: string; exchange?: string } = {}) {
  return {
    id: "tip-1",
    direction: "BUY",
    entryPrice: 2400,
    target1: 2500,
    target2: null,
    target3: null,
    stopLoss: 2350,
    status: "ACTIVE",
    expiresAt: new Date("2099-01-01"),
    assetClass: "EQUITY_NSE",
    target1HitAt: null,
    target2HitAt: null,
    stock: {
      symbol: overrides.symbol ?? "RELIANCE",
      exchange: overrides.exchange ?? "NSE",
    },
  };
}

describe("PriceMonitor — NSE-first price fetching", () => {
  let mockNse: { getCurrentPrice: ReturnType<typeof vi.fn> };
  let mockYahoo: { getCurrentPrice: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    mockNse = { getCurrentPrice: vi.fn() };
    mockYahoo = { getCurrentPrice: vi.fn() };
  });

  it("uses NSE price for NSE stocks and does not call Yahoo", async () => {
    const nsePrice: CurrentPrice = { symbol: "RELIANCE", price: 2500, change: 10, changePct: 0.4, timestamp: new Date() };
    mockNse.getCurrentPrice.mockResolvedValue(nsePrice);
    mockTipFindMany.mockResolvedValue([buildActiveTip()] as never);

    const monitor = new PriceMonitor(
      mockYahoo as unknown as YahooFinanceService,
      mockNse as unknown as NseService,
    );

    await monitor.checkActiveTips();

    expect(mockNse.getCurrentPrice).toHaveBeenCalledWith("RELIANCE");
    expect(mockYahoo.getCurrentPrice).not.toHaveBeenCalled();
  });

  it("falls back to Yahoo when NSE throws", async () => {
    mockNse.getCurrentPrice.mockRejectedValue(new Error("NSE unavailable"));
    const yahooPrice: CurrentPrice = { symbol: "RELIANCE", price: 2495, change: 5, changePct: 0.2, timestamp: new Date() };
    mockYahoo.getCurrentPrice.mockResolvedValue(yahooPrice);
    mockTipFindMany.mockResolvedValue([buildActiveTip()] as never);

    const monitor = new PriceMonitor(
      mockYahoo as unknown as YahooFinanceService,
      mockNse as unknown as NseService,
    );

    await monitor.checkActiveTips();

    expect(mockNse.getCurrentPrice).toHaveBeenCalledWith("RELIANCE");
    expect(mockYahoo.getCurrentPrice).toHaveBeenCalledWith("RELIANCE", "NSE");
  });

  it("falls back to Yahoo when NSE returns null", async () => {
    mockNse.getCurrentPrice.mockResolvedValue(null);
    const yahooPrice: CurrentPrice = { symbol: "RELIANCE", price: 2490, change: 2, changePct: 0.1, timestamp: new Date() };
    mockYahoo.getCurrentPrice.mockResolvedValue(yahooPrice);
    mockTipFindMany.mockResolvedValue([buildActiveTip()] as never);

    const monitor = new PriceMonitor(
      mockYahoo as unknown as YahooFinanceService,
      mockNse as unknown as NseService,
    );

    await monitor.checkActiveTips();

    expect(mockNse.getCurrentPrice).toHaveBeenCalledWith("RELIANCE");
    expect(mockYahoo.getCurrentPrice).toHaveBeenCalledWith("RELIANCE", "NSE");
  });

  it("skips NSE for non-Indian exchanges and goes directly to Yahoo", async () => {
    const yahooPrice: CurrentPrice = { symbol: "AAPL", price: 190, change: 1, changePct: 0.5, timestamp: new Date() };
    mockYahoo.getCurrentPrice.mockResolvedValue(yahooPrice);
    mockTipFindMany.mockResolvedValue([
      buildActiveTip({ symbol: "AAPL", exchange: "NASDAQ" }),
    ] as never);

    const monitor = new PriceMonitor(
      mockYahoo as unknown as YahooFinanceService,
      mockNse as unknown as NseService,
    );

    await monitor.checkActiveTips();

    expect(mockNse.getCurrentPrice).not.toHaveBeenCalled();
    expect(mockYahoo.getCurrentPrice).toHaveBeenCalledWith("AAPL", "NASDAQ");
  });

  it("returns empty array when no active tips exist", async () => {
    mockTipFindMany.mockResolvedValue([]);

    const monitor = new PriceMonitor(
      mockYahoo as unknown as YahooFinanceService,
      mockNse as unknown as NseService,
    );

    const result = await monitor.checkActiveTips();

    expect(result).toEqual([]);
    expect(mockNse.getCurrentPrice).not.toHaveBeenCalled();
    expect(mockYahoo.getCurrentPrice).not.toHaveBeenCalled();
  });
});
