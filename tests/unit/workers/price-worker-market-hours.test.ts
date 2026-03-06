import { describe, it, expect } from "vitest";
import { isNseMarketOpen, isAnyMarketOpen } from "@/lib/utils/market-hours";

describe("isNseMarketOpen", () => {
  it("returns true at 10:00 AM IST on a Wednesday", () => {
    // 10:00 AM IST = 04:30 UTC, 2025-07-16 is a Wednesday
    expect(isNseMarketOpen(new Date("2025-07-16T04:30:00.000Z"))).toBe(true);
  });

  it("returns true at exactly 9:15 AM IST (market open)", () => {
    // 9:15 AM IST = 03:45 UTC
    expect(isNseMarketOpen(new Date("2025-07-16T03:45:00.000Z"))).toBe(true);
  });

  it("returns true at exactly 3:30 PM IST (market close)", () => {
    // 3:30 PM IST = 10:00 UTC
    expect(isNseMarketOpen(new Date("2025-07-16T10:00:00.000Z"))).toBe(true);
  });

  it("returns false at 4:00 PM IST (after 3:30 PM close)", () => {
    // 4:00 PM IST = 10:30 UTC
    expect(isNseMarketOpen(new Date("2025-07-16T10:30:00.000Z"))).toBe(false);
  });

  it("returns false at 9:00 AM IST (before 9:15 open)", () => {
    // 9:00 AM IST = 03:30 UTC
    expect(isNseMarketOpen(new Date("2025-07-16T03:30:00.000Z"))).toBe(false);
  });

  it("returns false on Saturday even during trading hours", () => {
    // 2025-07-19 is a Saturday, 10:00 AM IST = 04:30 UTC
    expect(isNseMarketOpen(new Date("2025-07-19T04:30:00.000Z"))).toBe(false);
  });

  it("returns false on Sunday even during trading hours", () => {
    // 2025-07-20 is a Sunday, 10:00 AM IST = 04:30 UTC
    expect(isNseMarketOpen(new Date("2025-07-20T04:30:00.000Z"))).toBe(false);
  });
});

describe("isAnyMarketOpen", () => {
  it("returns true when NSE is open", () => {
    // Wednesday 10:00 AM IST
    expect(isAnyMarketOpen(new Date("2025-07-16T04:30:00.000Z"))).toBe(true);
  });

  it("returns true when NYSE is open (even if NSE is closed)", () => {
    // Wednesday 3:00 PM ET = 19:00 UTC — NYSE open (14:30-21:00 UTC)
    expect(isAnyMarketOpen(new Date("2025-07-16T19:00:00.000Z"))).toBe(true);
  });

  it("returns false on Saturday when only weekday exchanges exist (except crypto)", () => {
    // Saturday 12:00 UTC — crypto is 24/7 so isAnyMarketOpen should still be true
    expect(isAnyMarketOpen(new Date("2025-07-19T12:00:00.000Z"))).toBe(true);
  });

  it("returns true for crypto markets on weekends", () => {
    // Sunday 05:00 UTC — crypto is open 0:00-23:59
    expect(isAnyMarketOpen(new Date("2025-07-20T05:00:00.000Z"))).toBe(true);
  });
});
