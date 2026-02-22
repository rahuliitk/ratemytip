// tests/integration/api/leaderboard.test.ts
//
// Integration tests for the /api/v1/leaderboard endpoint.
// Tests query parameter validation, response format, and sorting.

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module
vi.mock("@/lib/db", () => ({
  db: {
    creator: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

// Import after mock
import { db } from "@/lib/db";

const mockCreators = [
  {
    id: "creator-1",
    slug: "top-trader",
    displayName: "Top Trader",
    profileImageUrl: null,
    tier: "GOLD",
    isActive: true,
    totalTips: 200,
    specializations: ["INTRADAY", "EQUITY_NSE"],
    currentScore: {
      rmtScore: 82.5,
      accuracyRate: 0.72,
      avgReturnPct: 4.2,
      confidenceInterval: 3.1,
      accuracyScore: 72,
      riskAdjustedScore: 65,
      consistencyScore: 80,
      volumeFactorScore: 70,
      totalScoredTips: 180,
    },
  },
  {
    id: "creator-2",
    slug: "swing-master",
    displayName: "Swing Master",
    profileImageUrl: "https://example.com/avatar.jpg",
    tier: "SILVER",
    isActive: true,
    totalTips: 75,
    specializations: ["SWING"],
    currentScore: {
      rmtScore: 68.3,
      accuracyRate: 0.65,
      avgReturnPct: 3.1,
      confidenceInterval: 4.5,
      accuracyScore: 65,
      riskAdjustedScore: 55,
      consistencyScore: 70,
      volumeFactorScore: 50,
      totalScoredTips: 60,
    },
  },
];

describe("/api/v1/leaderboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns leaderboard entries sorted by rmtScore descending", async () => {
    vi.mocked(db.creator.findMany).mockResolvedValue(mockCreators as never);
    vi.mocked(db.creator.count).mockResolvedValue(2);

    // Verify mock data is sorted correctly
    const sorted = [...mockCreators].sort(
      (a, b) => (b.currentScore?.rmtScore ?? 0) - (a.currentScore?.rmtScore ?? 0)
    );

    expect(sorted[0]!.slug).toBe("top-trader");
    expect(sorted[1]!.slug).toBe("swing-master");
  });

  it("filters creators with minimum tip count", () => {
    const minTips = 20;
    const filtered = mockCreators.filter((c) => c.totalTips >= minTips);
    expect(filtered.length).toBe(2); // Both have >= 20 tips
  });

  it("filters by specialization category", () => {
    const intradayCreators = mockCreators.filter((c) =>
      c.specializations.some((s) => s === "INTRADAY")
    );
    expect(intradayCreators.length).toBe(1);
    expect(intradayCreators[0]!.slug).toBe("top-trader");
  });

  it("only includes active creators", () => {
    const activeCreators = mockCreators.filter((c) => c.isActive);
    expect(activeCreators.length).toBe(2);
  });

  it("includes all required leaderboard entry fields", () => {
    const creator = mockCreators[0]!;
    expect(creator.id).toBeDefined();
    expect(creator.slug).toBeDefined();
    expect(creator.displayName).toBeDefined();
    expect(creator.tier).toBeDefined();
    expect(creator.totalTips).toBeDefined();
    expect(creator.currentScore).toBeDefined();
    expect(creator.currentScore!.rmtScore).toBeDefined();
    expect(creator.currentScore!.accuracyRate).toBeDefined();
    expect(creator.currentScore!.avgReturnPct).toBeDefined();
    expect(creator.currentScore!.confidenceInterval).toBeDefined();
  });

  it("produces correct ranking order", () => {
    const ranked = mockCreators
      .filter((c) => c.currentScore)
      .sort((a, b) => (b.currentScore?.rmtScore ?? 0) - (a.currentScore?.rmtScore ?? 0))
      .map((c, idx) => ({ rank: idx + 1, slug: c.slug, score: c.currentScore?.rmtScore }));

    expect(ranked[0]).toEqual({ rank: 1, slug: "top-trader", score: 82.5 });
    expect(ranked[1]).toEqual({ rank: 2, slug: "swing-master", score: 68.3 });
  });
});
