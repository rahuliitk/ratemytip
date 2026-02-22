// tests/unit/parser/extractor.test.ts
//
// Unit tests for the NLP tip extractor — both rule-based (Stage 1)
// and the tip-building logic. LLM tests are kept separate since
// they require mocking the OpenAI API.

import { describe, it, expect } from "vitest";
import { extractRuleBased, buildTipFromExtraction } from "@/lib/parser/extractor";

describe("extractRuleBased", () => {
  it("extracts stock symbols from uppercase words", () => {
    const result = extractRuleBased("Buy RELIANCE target 2500");
    expect(result.stockSymbols).toContain("RELIANCE");
  });

  it("extracts cashtag symbols ($AAPL)", () => {
    const result = extractRuleBased("$AAPL looking strong, buy above 185");
    expect(result.stockSymbols).toContain("AAPL");
  });

  it("filters out blacklisted words (BUY, SELL, NSE, etc.)", () => {
    const result = extractRuleBased("BUY RELIANCE on NSE SL 2350");
    expect(result.stockSymbols).not.toContain("BUY");
    expect(result.stockSymbols).not.toContain("NSE");
    expect(result.stockSymbols).toContain("RELIANCE");
  });

  it("extracts target prices with various keywords", () => {
    const result = extractRuleBased("TCS target 3800 tgt 3900");
    expect(result.targets).toContain(3800);
    expect(result.targets).toContain(3900);
  });

  it("extracts target prices with emoji markers", () => {
    const result = extractRuleBased("INFY 🎯2500 🎯2600");
    expect(result.targets).toContain(2500);
    expect(result.targets).toContain(2600);
  });

  it("extracts stop loss prices", () => {
    const result = extractRuleBased("RELIANCE SL: 2350 stop loss 2300");
    expect(result.stopLosses).toContain(2350);
    expect(result.stopLosses).toContain(2300);
  });

  it("extracts stop loss with emoji markers", () => {
    const result = extractRuleBased("HDFCBANK ⛔1520");
    expect(result.stopLosses).toContain(1520);
  });

  it("extracts entry prices", () => {
    const result = extractRuleBased("RELIANCE entry: 2400 CMP 2410");
    expect(result.entryPrices).toContain(2400);
  });

  it("extracts entry price ranges as midpoint", () => {
    const result = extractRuleBased("Buy RELIANCE entry: 2400-2420");
    // Should get midpoint: 2410
    expect(result.entryPrices.length).toBeGreaterThan(0);
    expect(result.entryPrices[0]).toBeCloseTo(2410, 0);
  });

  it("extracts direction keywords", () => {
    const result = extractRuleBased("Buy RELIANCE, bullish setup");
    expect(result.directions.length).toBeGreaterThan(0);
    const lower = result.directions.map((d) => d.toLowerCase());
    expect(lower).toContain("buy");
  });

  it("extracts sell direction", () => {
    const result = extractRuleBased("SELL TATAMOTORS, bearish pattern");
    const lower = result.directions.map((d) => d.toLowerCase());
    expect(lower).toContain("sell");
  });

  it("extracts timeframe keywords", () => {
    const result = extractRuleBased("RELIANCE intraday buy 2400 tgt 2450");
    const lower = result.timeframes.map((t) => t.toLowerCase());
    expect(lower).toContain("intraday");
  });

  it("extracts BTST as timeframe", () => {
    const result = extractRuleBased("ITC BTST buy 450 target 460");
    const lower = result.timeframes.map((t) => t.toLowerCase());
    expect(lower).toContain("btst");
  });

  it("handles tabular format (Format 1)", () => {
    const post = `
BUY RELIANCE
Entry: 2400
Target 1: 2500
Target 2: 2600
SL: 2350
Timeframe: Swing
    `.trim();

    const result = extractRuleBased(post);
    expect(result.stockSymbols).toContain("RELIANCE");
    expect(result.entryPrices).toContain(2400);
    expect(result.targets).toContain(2500);
    expect(result.targets).toContain(2600);
    expect(result.stopLosses).toContain(2350);
  });

  it("handles inline format (Format 2)", () => {
    const post = "RELIANCE Buy above 2420 TGT 2500/2600 SL 2350";

    const result = extractRuleBased(post);
    expect(result.stockSymbols).toContain("RELIANCE");
    expect(result.targets).toContain(2500);
    expect(result.stopLosses).toContain(2350);
  });

  it("handles hashtag-heavy format (Format 3)", () => {
    const post = "#RELIANCE Buy CMP 2415 🎯2500 🎯2600 ⛔2350 #StockTips #NSE";

    const result = extractRuleBased(post);
    expect(result.targets).toContain(2500);
    expect(result.targets).toContain(2600);
    expect(result.stopLosses).toContain(2350);
  });

  it("returns empty arrays for non-tip content", () => {
    const result = extractRuleBased(
      "Good morning! Today was a nice day in the market."
    );
    expect(result.stockSymbols.length).toBe(0);
    expect(result.targets.length).toBe(0);
    expect(result.stopLosses.length).toBe(0);
    expect(result.entryPrices.length).toBe(0);
  });

  it("handles prices with comma separators", () => {
    const result = extractRuleBased("RELIANCE target 2,500 SL 2,350");
    expect(result.targets).toContain(2500);
    expect(result.stopLosses).toContain(2350);
  });

  it("handles prices with INR symbol", () => {
    const result = extractRuleBased("TCS entry ₹3500 target ₹3700");
    expect(result.entryPrices).toContain(3500);
    expect(result.targets).toContain(3700);
  });
});

describe("buildTipFromExtraction", () => {
  it("returns null when no stock symbols found", () => {
    const result = buildTipFromExtraction({
      stockSymbols: [],
      prices: [],
      targets: [2500],
      stopLosses: [2350],
      entryPrices: [2400],
      directions: ["buy"],
      timeframes: ["swing"],
    });
    expect(result).toBeNull();
  });

  it("returns null when no price data at all", () => {
    const result = buildTipFromExtraction({
      stockSymbols: ["RELIANCE"],
      prices: [],
      targets: [],
      stopLosses: [],
      entryPrices: [],
      directions: [],
      timeframes: [],
    });
    expect(result).toBeNull();
  });

  it("builds a complete tip from full extraction", () => {
    const result = buildTipFromExtraction({
      stockSymbols: ["RELIANCE"],
      prices: [],
      targets: [2500, 2600],
      stopLosses: [2350],
      entryPrices: [2400],
      directions: ["buy"],
      timeframes: ["swing"],
    });

    expect(result).not.toBeNull();
    expect(result!.stockSymbol).toBe("RELIANCE");
    expect(result!.direction).toBe("BUY");
    expect(result!.entryPrice).toBe(2400);
    expect(result!.target1).toBe(2500);
    expect(result!.target2).toBe(2600);
    expect(result!.stopLoss).toBe(2350);
    expect(result!.timeframe).toBe("SWING");
    expect(result!.isTip).toBe(true);
  });

  it("infers BUY direction when target > entry", () => {
    const result = buildTipFromExtraction({
      stockSymbols: ["TCS"],
      prices: [],
      targets: [3800],
      stopLosses: [3500],
      entryPrices: [3600],
      directions: [],
      timeframes: [],
    });

    expect(result!.direction).toBe("BUY");
  });

  it("infers SELL direction when target < entry", () => {
    const result = buildTipFromExtraction({
      stockSymbols: ["TATASTEEL"],
      prices: [],
      targets: [100],
      stopLosses: [130],
      entryPrices: [120],
      directions: [],
      timeframes: [],
    });

    expect(result!.direction).toBe("SELL");
  });

  it("defaults to SWING timeframe when none specified", () => {
    const result = buildTipFromExtraction({
      stockSymbols: ["INFY"],
      prices: [],
      targets: [1800],
      stopLosses: [1650],
      entryPrices: [1700],
      directions: ["buy"],
      timeframes: [],
    });

    expect(result!.timeframe).toBe("SWING");
  });

  it("has high confidence when all 4 core fields present", () => {
    const result = buildTipFromExtraction({
      stockSymbols: ["RELIANCE"],
      prices: [],
      targets: [2500],
      stopLosses: [2350],
      entryPrices: [2400],
      directions: ["buy"],
      timeframes: ["swing"],
    });

    expect(result!.confidence).toBeGreaterThanOrEqual(0.90);
  });

  it("has lower confidence when stop loss is missing", () => {
    const result = buildTipFromExtraction({
      stockSymbols: ["RELIANCE"],
      prices: [],
      targets: [2500],
      stopLosses: [],
      entryPrices: [2400],
      directions: ["buy"],
      timeframes: [],
    });

    expect(result).not.toBeNull();
    expect(result!.confidence).toBeLessThan(0.90);
  });

  it("normalizes stock aliases (RIL -> RELIANCE)", () => {
    const result = buildTipFromExtraction({
      stockSymbols: ["RIL"],
      prices: [],
      targets: [2500],
      stopLosses: [2350],
      entryPrices: [2400],
      directions: ["buy"],
      timeframes: [],
    });

    expect(result!.stockSymbol).toBe("RELIANCE");
  });

  it("sets target2 and target3 to null when not present", () => {
    const result = buildTipFromExtraction({
      stockSymbols: ["TCS"],
      prices: [],
      targets: [3800],
      stopLosses: [3500],
      entryPrices: [3600],
      directions: [],
      timeframes: [],
    });

    expect(result!.target1).toBe(3800);
    expect(result!.target2).toBeNull();
    expect(result!.target3).toBeNull();
  });

  it("handles Hinglish direction keyword (kharidein)", () => {
    const result = buildTipFromExtraction({
      stockSymbols: ["INFY"],
      prices: [],
      targets: [1800],
      stopLosses: [1650],
      entryPrices: [1700],
      directions: ["kharidein"],
      timeframes: [],
    });

    expect(result!.direction).toBe("BUY");
  });
});
