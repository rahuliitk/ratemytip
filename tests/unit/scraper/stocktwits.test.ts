// tests/unit/scraper/stocktwits.test.ts

import { describe, it, expect } from "vitest";
import { StockTwitsScraper } from "@/lib/scraper/stocktwits";
import { YahooAnalystScraper } from "@/lib/scraper/yahoo-analyst";
import { STOCKTWITS } from "@/lib/constants";

describe("StockTwitsScraper.isTrackableUser", () => {
  it("returns true for users above follower threshold", () => {
    expect(
      StockTwitsScraper.isTrackableUser(STOCKTWITS.MIN_FOLLOWERS_FOR_TRACKING)
    ).toBe(true);
    expect(StockTwitsScraper.isTrackableUser(5000)).toBe(true);
    expect(StockTwitsScraper.isTrackableUser(100_000)).toBe(true);
  });

  it("returns false for users below follower threshold", () => {
    expect(StockTwitsScraper.isTrackableUser(0)).toBe(false);
    expect(StockTwitsScraper.isTrackableUser(100)).toBe(false);
    expect(
      StockTwitsScraper.isTrackableUser(
        STOCKTWITS.MIN_FOLLOWERS_FOR_TRACKING - 1
      )
    ).toBe(false);
  });

  it("uses the MIN_FOLLOWERS_FOR_TRACKING constant (1000)", () => {
    expect(STOCKTWITS.MIN_FOLLOWERS_FOR_TRACKING).toBe(1000);
    expect(StockTwitsScraper.isTrackableUser(999)).toBe(false);
    expect(StockTwitsScraper.isTrackableUser(1000)).toBe(true);
  });
});

describe("YahooAnalystScraper.toYahooSymbol", () => {
  it("returns US symbols unchanged", () => {
    expect(YahooAnalystScraper.toYahooSymbol("AAPL", "NASDAQ")).toBe("AAPL");
    expect(YahooAnalystScraper.toYahooSymbol("JPM", "NYSE")).toBe("JPM");
  });

  it("adds .NS suffix for NSE stocks", () => {
    expect(YahooAnalystScraper.toYahooSymbol("RELIANCE", "NSE")).toBe(
      "RELIANCE.NS"
    );
    expect(YahooAnalystScraper.toYahooSymbol("TCS", "NSE")).toBe("TCS.NS");
  });

  it("adds .BO suffix for BSE stocks", () => {
    expect(YahooAnalystScraper.toYahooSymbol("INFY", "BSE")).toBe("INFY.BO");
  });

  it("maps index symbols correctly", () => {
    expect(YahooAnalystScraper.toYahooSymbol("SPX", "INDEX")).toBe("^GSPC");
    expect(YahooAnalystScraper.toYahooSymbol("DJI", "INDEX")).toBe("^DJI");
    expect(YahooAnalystScraper.toYahooSymbol("NIFTY 50", "INDEX")).toBe(
      "^NSEI"
    );
  });

  it("adds exchange suffixes for other global exchanges", () => {
    expect(YahooAnalystScraper.toYahooSymbol("VOD", "LSE")).toBe("VOD.L");
    expect(YahooAnalystScraper.toYahooSymbol("SAP", "XETRA")).toBe("SAP.DE");
    expect(YahooAnalystScraper.toYahooSymbol("7203", "TSE")).toBe("7203.T");
  });
});
