import { db } from "@/lib/db";

const STOCK_ALIASES: Record<string, string> = {
  "RIL": "RELIANCE",
  "RELIANCE INDUSTRIES": "RELIANCE",
  "TATA CONSULTANCY": "TCS",
  "INFOSYS": "INFY",
  "HDFC BANK": "HDFCBANK",
  "ICICI BANK": "ICICIBANK",
  "NIFTY": "NIFTY 50",
  "NIFTY50": "NIFTY 50",
  "BANKNIFTY": "NIFTY BANK",
  "BANK NIFTY": "NIFTY BANK",
};

export function normalizeStockSymbol(input: string): string {
  const upper = input.toUpperCase().trim();
  return STOCK_ALIASES[upper] ?? upper;
}

export async function lookupStock(symbol: string): Promise<{ id: string; symbol: string } | null> {
  const normalized = normalizeStockSymbol(symbol);
  const stock = await db.stock.findFirst({
    where: {
      OR: [
        { symbol: normalized },
        { name: { contains: normalized, mode: "insensitive" } },
      ],
    },
    select: { id: true, symbol: true },
  });
  return stock;
}
