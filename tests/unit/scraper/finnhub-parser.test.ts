// tests/unit/scraper/finnhub-parser.test.ts

import { describe, it, expect } from "vitest";
import {
  parseFinnhubUpgradeDowngrade,
  brokerageSlug,
} from "@/lib/scraper/finnhub-parser";
import type { FinnhubUpgradeDowngrade } from "@/types/consensus";

// ──── Helper to build test records ────

function buildRecord(
  overrides: Partial<FinnhubUpgradeDowngrade> = {}
): FinnhubUpgradeDowngrade {
  return {
    symbol: "AAPL",
    company: "Goldman Sachs",
    action: "upgrade",
    fromGrade: "Neutral",
    toGrade: "Buy",
    gradeTime: Math.floor(Date.now() / 1000),
    ...overrides,
  };
}

// ──── Tests ────

describe("parseFinnhubUpgradeDowngrade", () => {
  it("parses a BUY upgrade with target from consensus", () => {
    const record = buildRecord({ toGrade: "Buy", action: "upgrade" });
    const result = parseFinnhubUpgradeDowngrade(record, 150, 180);

    expect(result).not.toBeNull();
    expect(result!.direction).toBe("BUY");
    expect(result!.entryPrice).toBe(150);
    expect(result!.target1).toBe(180);
    expect(result!.stopLoss).toBe(138); // 150 * 0.92
    expect(result!.timeframe).toBe("LONG_TERM");
    expect(result!.conviction).toBe("HIGH");
    expect(result!.confidence).toBe(0.9);
    expect(result!.brokerageName).toBe("Goldman Sachs");
  });

  it("parses a SELL downgrade", () => {
    const record = buildRecord({
      toGrade: "Sell",
      action: "downgrade",
      fromGrade: "Buy",
    });
    const result = parseFinnhubUpgradeDowngrade(record, 150, 120);

    expect(result).not.toBeNull();
    expect(result!.direction).toBe("SELL");
    expect(result!.target1).toBe(120);
    expect(result!.stopLoss).toBe(162); // 150 * 1.08
    expect(result!.conviction).toBe("HIGH");
  });

  it("returns null for Hold/Neutral grades", () => {
    const hold = buildRecord({ toGrade: "Hold" });
    expect(parseFinnhubUpgradeDowngrade(hold, 150, 180)).toBeNull();

    const neutral = buildRecord({ toGrade: "Neutral" });
    expect(parseFinnhubUpgradeDowngrade(neutral, 150, 180)).toBeNull();

    const equalWeight = buildRecord({ toGrade: "Equal-Weight" });
    expect(parseFinnhubUpgradeDowngrade(equalWeight, 150, 180)).toBeNull();
  });

  it("returns null when currentPrice is zero or negative", () => {
    const record = buildRecord();
    expect(parseFinnhubUpgradeDowngrade(record, 0, 180)).toBeNull();
    expect(parseFinnhubUpgradeDowngrade(record, -10, 180)).toBeNull();
  });

  it("falls back to 15% target when consensus is null", () => {
    const record = buildRecord({ toGrade: "Buy" });
    const result = parseFinnhubUpgradeDowngrade(record, 100, null);

    expect(result).not.toBeNull();
    expect(result!.target1).toBe(115); // 100 * 1.15
  });

  it("overrides invalid consensus target direction", () => {
    // BUY with target below entry — should be corrected
    const record = buildRecord({ toGrade: "Buy" });
    const result = parseFinnhubUpgradeDowngrade(record, 150, 140);

    expect(result).not.toBeNull();
    expect(result!.target1).toBe(172.5); // Fallback: 150 * 1.15
  });

  it("assigns MEDIUM conviction for initiated coverage", () => {
    const record = buildRecord({ action: "initiated", toGrade: "Buy" });
    const result = parseFinnhubUpgradeDowngrade(record, 100, 120);

    expect(result!.conviction).toBe("MEDIUM");
  });

  it("assigns LOW conviction for reiterated coverage", () => {
    const record = buildRecord({ action: "reiterated", toGrade: "Buy" });
    const result = parseFinnhubUpgradeDowngrade(record, 100, 120);

    expect(result!.conviction).toBe("LOW");
  });

  it("handles Outperform grade as BUY", () => {
    const record = buildRecord({ toGrade: "Outperform" });
    const result = parseFinnhubUpgradeDowngrade(record, 100, 120);

    expect(result!.direction).toBe("BUY");
  });

  it("handles Underperform grade as SELL", () => {
    const record = buildRecord({ toGrade: "Underperform", action: "downgrade" });
    const result = parseFinnhubUpgradeDowngrade(record, 100, 80);

    expect(result!.direction).toBe("SELL");
    expect(result!.conviction).toBe("HIGH");
  });
});

describe("brokerageSlug", () => {
  it("converts brokerage name to slug", () => {
    expect(brokerageSlug("Goldman Sachs")).toBe("goldman-sachs");
    expect(brokerageSlug("JP Morgan")).toBe("jp-morgan");
    expect(brokerageSlug("Bank of America")).toBe("bank-of-america");
  });

  it("handles special characters", () => {
    expect(brokerageSlug("BofA Securities")).toBe("bofa-securities");
    expect(brokerageSlug("  Piper Sandler  ")).toBe("piper-sandler");
  });
});
