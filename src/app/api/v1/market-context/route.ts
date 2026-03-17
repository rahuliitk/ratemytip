import { NextResponse } from "next/server";
import {
  classifyVix,
  classifyMarketMood,
  isMarketOpen,
} from "@/lib/market-context/market-mood";
import type { MarketContext } from "@/lib/market-context/market-mood";

// TODO: Replace with live market data from Yahoo Finance or NSE API.
// Currently returns mock/static data for development and UI prototyping.

const MOCK_NIFTY_LEVEL = 22450.5;
const MOCK_NIFTY_CHANGE = 125.3;
const MOCK_NIFTY_CHANGE_PCT = 0.56;
const MOCK_VIX_LEVEL = 14.2;

export async function GET(): Promise<NextResponse> {
  try {
    const vixCategory = classifyVix(MOCK_VIX_LEVEL);
    const marketMood = classifyMarketMood(MOCK_NIFTY_CHANGE_PCT, MOCK_VIX_LEVEL);
    const marketOpen = isMarketOpen();

    const data: MarketContext = {
      niftyLevel: MOCK_NIFTY_LEVEL,
      niftyChange: MOCK_NIFTY_CHANGE,
      niftyChangePct: MOCK_NIFTY_CHANGE_PCT,
      vixLevel: MOCK_VIX_LEVEL,
      vixCategory,
      marketMood,
      isMarketOpen: marketOpen,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          "Cache-Control": "public, max-age=30, s-maxage=30",
        },
      },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch market context",
        },
      },
      { status: 500 },
    );
  }
}
