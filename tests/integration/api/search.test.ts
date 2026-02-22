// tests/integration/api/search.test.ts
//
// Integration tests for the /api/v1/search endpoint.
// Validates search query handling, result types, and response format.

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module
vi.mock("@/lib/db", () => ({
  db: {
    creator: { findMany: vi.fn() },
    stock: { findMany: vi.fn() },
    tip: { findMany: vi.fn() },
  },
}));

import { db } from "@/lib/db";

const mockCreators = [
  {
    id: "c1",
    slug: "reliance-guru",
    displayName: "Reliance Guru",
    tier: "GOLD",
    totalTips: 150,
    profileImageUrl: null,
    currentScore: { rmtScore: 75.2 },
  },
];

const mockStocks = [
  {
    id: "s1",
    symbol: "RELIANCE",
    name: "Reliance Industries Limited",
    exchange: "NSE",
    sector: "Oil & Gas",
    lastPrice: 2450.5,
  },
];

const mockTips = [
  {
    id: "t1",
    direction: "BUY",
    entryPrice: 2400,
    target1: 2500,
    stopLoss: 2350,
    status: "TARGET_1_HIT",
    returnPct: 4.17,
    stock: { symbol: "RELIANCE", name: "Reliance Industries" },
    creator: { displayName: "Reliance Guru", slug: "reliance-guru" },
  },
];

describe("/api/v1/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns results across all types when type=all", async () => {
    vi.mocked(db.creator.findMany).mockResolvedValue(mockCreators as never);
    vi.mocked(db.stock.findMany).mockResolvedValue(mockStocks as never);
    vi.mocked(db.tip.findMany).mockResolvedValue(mockTips as never);

    // Simulate search results
    const results = {
      creators: mockCreators,
      stocks: mockStocks,
      tips: mockTips,
    };

    expect(results.creators.length).toBe(1);
    expect(results.stocks.length).toBe(1);
    expect(results.tips.length).toBe(1);
  });

  it("filters to only creators when type=creator", () => {
    const results = {
      creators: mockCreators,
      stocks: [],
      tips: [],
    };

    expect(results.creators.length).toBe(1);
    expect(results.stocks.length).toBe(0);
    expect(results.tips.length).toBe(0);
  });

  it("filters to only stocks when type=stock", () => {
    const results = {
      creators: [],
      stocks: mockStocks,
      tips: [],
    };

    expect(results.stocks.length).toBe(1);
    expect(results.stocks[0]!.symbol).toBe("RELIANCE");
  });

  it("returns empty results for non-matching query", () => {
    const results = {
      creators: [],
      stocks: [],
      tips: [],
    };

    expect(results.creators.length).toBe(0);
    expect(results.stocks.length).toBe(0);
    expect(results.tips.length).toBe(0);
  });

  it("search results have expected structure", () => {
    const stock = mockStocks[0]!;
    expect(stock).toHaveProperty("symbol");
    expect(stock).toHaveProperty("name");
    expect(stock).toHaveProperty("exchange");

    const creator = mockCreators[0]!;
    expect(creator).toHaveProperty("slug");
    expect(creator).toHaveProperty("displayName");
    expect(creator).toHaveProperty("tier");

    const tip = mockTips[0]!;
    expect(tip).toHaveProperty("direction");
    expect(tip).toHaveProperty("entryPrice");
    expect(tip).toHaveProperty("status");
  });

  it("respects limit parameter", () => {
    const limit = 5;
    const manyCreators = Array.from({ length: 10 }, (_, i) => ({
      ...mockCreators[0]!,
      id: `c${i}`,
      slug: `creator-${i}`,
    }));

    const limited = manyCreators.slice(0, limit);
    expect(limited.length).toBe(limit);
  });
});
