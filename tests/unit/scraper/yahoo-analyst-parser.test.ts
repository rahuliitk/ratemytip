// tests/unit/scraper/yahoo-analyst-parser.test.ts

import { describe, it, expect } from "vitest";
import {
  parseYahooUpgradeDowngrade,
  firmSlug,
} from "@/lib/scraper/yahoo-analyst-parser";
import type { YahooUpgradeDowngrade } from "@/types/consensus";

// ──── Helper ────

function buildRecord(
  overrides: Partial<YahooUpgradeDowngrade> = {}
): YahooUpgradeDowngrade {
  return {
    epochGradeDate: Math.floor(Date.now() / 1000),
    firm: "Morgan Stanley",
    toGrade: "Overweight",
    fromGrade: "Equal-Weight",
    action: "upgrade",
    ...overrides,
  };
}

// ──── Tests ────

describe("parseYahooUpgradeDowngrade", () => {
  it("parses a BUY upgrade with consensus target", () => {
    const record = buildRecord({ toGrade: "Overweight", action: "upgrade" });
    const result = parseYahooUpgradeDowngrade(record, "MSFT", 400, 450);

    expect(result).not.toBeNull();
    expect(result!.direction).toBe("BUY");
    expect(result!.entryPrice).toBe(400);
    expect(result!.target1).toBe(450);
    expect(result!.stopLoss).toBe(368); // 400 * 0.92
    expect(result!.timeframe).toBe("LONG_TERM");
    expect(result!.firmName).toBe("Morgan Stanley");
    expect(result!.confidence).toBe(0.88);
  });

  it("parses a SELL downgrade", () => {
    const record = buildRecord({
      toGrade: "Underweight",
      action: "downgrade",
      fromGrade: "Overweight",
    });
    const result = parseYahooUpgradeDowngrade(record, "TSLA", 250, 200);

    expect(result).not.toBeNull();
    expect(result!.direction).toBe("SELL");
    expect(result!.target1).toBe(200);
    expect(result!.stopLoss).toBe(270); // 250 * 1.08
  });

  it("returns null for Hold/Neutral/Equal-Weight grades", () => {
    expect(
      parseYahooUpgradeDowngrade(
        buildRecord({ toGrade: "Hold" }),
        "AAPL",
        150,
        180
      )
    ).toBeNull();

    expect(
      parseYahooUpgradeDowngrade(
        buildRecord({ toGrade: "Neutral" }),
        "AAPL",
        150,
        180
      )
    ).toBeNull();

    expect(
      parseYahooUpgradeDowngrade(
        buildRecord({ toGrade: "Equal-Weight" }),
        "AAPL",
        150,
        180
      )
    ).toBeNull();
  });

  it("returns null for zero or negative price", () => {
    const record = buildRecord();
    expect(parseYahooUpgradeDowngrade(record, "AAPL", 0, 180)).toBeNull();
    expect(parseYahooUpgradeDowngrade(record, "AAPL", -5, 180)).toBeNull();
  });

  it("falls back to 15% target when consensus is null", () => {
    const record = buildRecord({ toGrade: "Buy" });
    const result = parseYahooUpgradeDowngrade(record, "GOOGL", 200, null);

    expect(result).not.toBeNull();
    expect(result!.target1).toBe(230); // 200 * 1.15
  });

  it("corrects invalid target direction", () => {
    // BUY with target below entry
    const record = buildRecord({ toGrade: "Buy" });
    const result = parseYahooUpgradeDowngrade(record, "AMZN", 200, 190);

    expect(result).not.toBeNull();
    expect(result!.target1).toBe(230); // Corrected to 200 * 1.15
  });

  it("assigns HIGH conviction for upgrade to strong grades", () => {
    const record = buildRecord({ action: "upgrade", toGrade: "Buy" });
    const result = parseYahooUpgradeDowngrade(record, "NVDA", 500, 600);

    expect(result!.conviction).toBe("HIGH");
  });

  it("assigns MEDIUM conviction for initiated coverage", () => {
    const record = buildRecord({ action: "init", toGrade: "Outperform" });
    const result = parseYahooUpgradeDowngrade(record, "AMD", 150, 180);

    expect(result!.conviction).toBe("MEDIUM");
  });

  it("assigns LOW conviction for reiterated/maintained", () => {
    const record = buildRecord({ action: "main", toGrade: "Buy" });
    const result = parseYahooUpgradeDowngrade(record, "CRM", 250, 300);

    expect(result!.conviction).toBe("LOW");
  });

  it("handles the Add grade as BUY", () => {
    const record = buildRecord({ toGrade: "Add" });
    const result = parseYahooUpgradeDowngrade(record, "AAPL", 150, 180);

    expect(result!.direction).toBe("BUY");
  });

  it("handles Strong Sell as SELL", () => {
    const record = buildRecord({
      toGrade: "Strong Sell",
      action: "downgrade",
    });
    const result = parseYahooUpgradeDowngrade(record, "META", 300, 250);

    expect(result!.direction).toBe("SELL");
  });

  it("uses stock symbol from parameter, not from record", () => {
    const record = buildRecord();
    const result = parseYahooUpgradeDowngrade(record, "CUSTOM_SYM", 100, 120);

    expect(result!.stockSymbol).toBe("CUSTOM_SYM");
  });
});

describe("firmSlug", () => {
  it("converts firm name to slug", () => {
    expect(firmSlug("Morgan Stanley")).toBe("morgan-stanley");
    expect(firmSlug("JP Morgan")).toBe("jp-morgan");
    expect(firmSlug("TD Cowen")).toBe("td-cowen");
  });
});
