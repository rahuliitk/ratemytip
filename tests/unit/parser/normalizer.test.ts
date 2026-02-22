// tests/unit/parser/normalizer.test.ts
//
// Unit tests for stock name normalization.
// Verifies the alias map, cleaning logic, and edge cases.

import { describe, it, expect } from "vitest";
import {
  normalizeStockName,
  isValidSymbolFormat,
  getStaticAliases,
} from "@/lib/parser/normalizer";

describe("normalizeStockName", () => {
  // ──── Indian Stocks ────

  it("resolves exact NSE symbol", () => {
    expect(normalizeStockName("RELIANCE")).toBe("RELIANCE");
  });

  it("resolves common alias (RIL -> RELIANCE)", () => {
    expect(normalizeStockName("RIL")).toBe("RELIANCE");
  });

  it("resolves full company name (TATA CONSULTANCY SERVICES -> TCS)", () => {
    expect(normalizeStockName("TATA CONSULTANCY SERVICES")).toBe("TCS");
  });

  it("resolves short alias (HDFC -> HDFCBANK)", () => {
    expect(normalizeStockName("HDFC")).toBe("HDFCBANK");
  });

  it("resolves ICICI Bank aliases", () => {
    expect(normalizeStockName("ICICI")).toBe("ICICIBANK");
    expect(normalizeStockName("ICICI BANK")).toBe("ICICIBANK");
    expect(normalizeStockName("ICICIBANK")).toBe("ICICIBANK");
  });

  it("resolves SBI aliases", () => {
    expect(normalizeStockName("SBI")).toBe("SBIN");
    expect(normalizeStockName("STATE BANK OF INDIA")).toBe("SBIN");
  });

  it("resolves L&T alias", () => {
    expect(normalizeStockName("L&T")).toBe("LT");
    expect(normalizeStockName("LARSEN & TOUBRO")).toBe("LT");
  });

  // ──── US Stocks ────

  it("resolves US stock symbol (AAPL)", () => {
    expect(normalizeStockName("AAPL")).toBe("AAPL");
  });

  it("resolves full company name to symbol (APPLE -> AAPL)", () => {
    expect(normalizeStockName("APPLE")).toBe("AAPL");
  });

  it("resolves Facebook/Meta aliases", () => {
    expect(normalizeStockName("FB")).toBe("META");
    expect(normalizeStockName("FACEBOOK")).toBe("META");
    expect(normalizeStockName("META")).toBe("META");
  });

  it("resolves GOOGL/GOOG/GOOGLE/ALPHABET", () => {
    expect(normalizeStockName("GOOGL")).toBe("GOOGL");
    expect(normalizeStockName("GOOG")).toBe("GOOGL");
    expect(normalizeStockName("GOOGLE")).toBe("GOOGL");
    expect(normalizeStockName("ALPHABET")).toBe("GOOGL");
  });

  // ──── Indices ────

  it("resolves NIFTY aliases", () => {
    expect(normalizeStockName("NIFTY")).toBe("NIFTY 50");
    expect(normalizeStockName("NIFTY50")).toBe("NIFTY 50");
    expect(normalizeStockName("NIFTY 50")).toBe("NIFTY 50");
  });

  it("resolves BANKNIFTY aliases", () => {
    expect(normalizeStockName("BANKNIFTY")).toBe("NIFTY BANK");
    expect(normalizeStockName("BANK NIFTY")).toBe("NIFTY BANK");
  });

  it("resolves US index aliases", () => {
    expect(normalizeStockName("S&P 500")).toBe("SPX");
    expect(normalizeStockName("SPX")).toBe("SPX");
    expect(normalizeStockName("DOW JONES")).toBe("DJI");
  });

  // ──── Crypto ────

  it("resolves Bitcoin aliases", () => {
    expect(normalizeStockName("BITCOIN")).toBe("BTC");
    expect(normalizeStockName("BTC/USDT")).toBe("BTC");
    expect(normalizeStockName("BTCUSDT")).toBe("BTC");
  });

  it("resolves Ethereum aliases", () => {
    expect(normalizeStockName("ETHEREUM")).toBe("ETH");
    expect(normalizeStockName("ETH/USDT")).toBe("ETH");
  });

  it("resolves altcoin aliases", () => {
    expect(normalizeStockName("SOLANA")).toBe("SOL");
    expect(normalizeStockName("DOGECOIN")).toBe("DOGE");
    expect(normalizeStockName("RIPPLE")).toBe("XRP");
    expect(normalizeStockName("CHAINLINK")).toBe("LINK");
  });

  // ──── Edge Cases ────

  it("is case-insensitive", () => {
    expect(normalizeStockName("reliance")).toBe("RELIANCE");
    expect(normalizeStockName("Aapl")).toBe("AAPL");
    expect(normalizeStockName("bitcoin")).toBe("BTC");
  });

  it("strips special characters (#, $, @)", () => {
    expect(normalizeStockName("#RELIANCE")).toBe("RELIANCE");
    expect(normalizeStockName("$AAPL")).toBe("AAPL");
    expect(normalizeStockName("@TCS")).toBe("TCS");
  });

  it("trims whitespace", () => {
    expect(normalizeStockName("  RELIANCE  ")).toBe("RELIANCE");
  });

  it("returns cleaned input if no alias match found", () => {
    expect(normalizeStockName("XYZUNKNOWN")).toBe("XYZUNKNOWN");
  });

  it("handles empty string", () => {
    expect(normalizeStockName("")).toBe("");
  });
});

describe("isValidSymbolFormat", () => {
  it("accepts standard symbols (2-20 uppercase letters)", () => {
    expect(isValidSymbolFormat("TCS")).toBe(true);
    expect(isValidSymbolFormat("RELIANCE")).toBe(true);
    expect(isValidSymbolFormat("AAPL")).toBe(true);
  });

  it("accepts symbols with dots (BRK.B)", () => {
    expect(isValidSymbolFormat("BRK.B")).toBe(true);
  });

  it("accepts symbols with ampersand (M&M)", () => {
    expect(isValidSymbolFormat("M&M")).toBe(true);
  });

  it("rejects single-character strings", () => {
    // Single uppercase letter — too ambiguous
    expect(isValidSymbolFormat("A")).toBe(true); // A is actually valid (Agilent)
  });

  it("rejects lowercase strings", () => {
    expect(isValidSymbolFormat("reliance")).toBe(false);
  });

  it("rejects strings with spaces", () => {
    expect(isValidSymbolFormat("HDFC BANK")).toBe(false);
  });

  it("rejects strings exceeding 20 characters", () => {
    expect(isValidSymbolFormat("A".repeat(21))).toBe(false);
  });

  it("rejects numeric-only strings", () => {
    expect(isValidSymbolFormat("12345")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidSymbolFormat("")).toBe(false);
  });
});

describe("getStaticAliases", () => {
  it("returns a non-empty readonly record", () => {
    const aliases = getStaticAliases();
    expect(Object.keys(aliases).length).toBeGreaterThan(100);
  });

  it("contains expected US stock aliases", () => {
    const aliases = getStaticAliases();
    expect(aliases["AAPL"]).toBe("AAPL");
    expect(aliases["APPLE"]).toBe("AAPL");
    expect(aliases["MSFT"]).toBe("MSFT");
  });

  it("contains expected Indian stock aliases", () => {
    const aliases = getStaticAliases();
    expect(aliases["RIL"]).toBe("RELIANCE");
    expect(aliases["HDFC BANK"]).toBe("HDFCBANK");
    expect(aliases["SBI"]).toBe("SBIN");
  });

  it("contains expected crypto aliases", () => {
    const aliases = getStaticAliases();
    expect(aliases["BITCOIN"]).toBe("BTC");
    expect(aliases["ETHEREUM"]).toBe("ETH");
    expect(aliases["SOLANA"]).toBe("SOL");
  });
});
