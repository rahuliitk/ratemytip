// tests/unit/pnl-calculation.test.ts

import { describe, it, expect } from "vitest";
import { calculatePositionPnl } from "@/lib/portfolio";

describe("calculatePositionPnl", () => {
  it("BUY direction: positive P&L when price goes up", () => {
    const result = calculatePositionPnl(100, 120, 1, "BUY", false);
    expect(result.pnl).toBe(20);
    expect(result.pnlPct).toBe(20);
  });

  it("BUY direction: negative P&L when price goes down", () => {
    const result = calculatePositionPnl(100, 80, 1, "BUY", false);
    expect(result.pnl).toBe(-20);
    expect(result.pnlPct).toBe(-20);
  });

  it("SELL direction: positive P&L when price goes down", () => {
    const result = calculatePositionPnl(100, 80, 1, "SELL", false);
    expect(result.pnl).toBe(20);
    expect(result.pnlPct).toBe(20);
  });

  it("SELL direction: negative P&L when price goes up", () => {
    const result = calculatePositionPnl(100, 120, 1, "SELL", false);
    expect(result.pnl).toBe(-20);
    expect(result.pnlPct).toBe(-20);
  });

  it("zero P&L when entry equals current price", () => {
    const result = calculatePositionPnl(100, 100, 1, "BUY", false);
    expect(result.pnl).toBe(0);
    expect(result.pnlPct).toBe(0);
  });

  it("quantity scales P&L correctly", () => {
    const result = calculatePositionPnl(100, 120, 5, "BUY", false);
    expect(result.pnl).toBe(100);
    expect(result.pnlPct).toBe(20);
  });

  it("returns correct isRealized flag when unrealized", () => {
    const result = calculatePositionPnl(100, 120, 1, "BUY", false);
    expect(result.isRealized).toBe(false);
  });

  it("returns correct isRealized flag when realized", () => {
    const result = calculatePositionPnl(100, 120, 1, "BUY", true);
    expect(result.isRealized).toBe(true);
  });

  it("returns all expected fields", () => {
    const result = calculatePositionPnl(200, 250, 3, "BUY", true);
    expect(result).toEqual({
      entryPrice: 200,
      currentPrice: 250,
      quantity: 3,
      pnl: 150,
      pnlPct: 25,
      isRealized: true,
    });
  });
});
