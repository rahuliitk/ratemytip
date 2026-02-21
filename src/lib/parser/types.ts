// src/lib/parser/types.ts

/** Direction of a parsed tip */
export type ParsedDirection = "BUY" | "SELL";

/** Exchange where the stock trades */
export type ParsedExchange =
  | "NYSE" | "NASDAQ" | "TSX"
  | "LSE" | "XETRA" | "EURONEXT"
  | "NSE" | "BSE" | "TSE" | "HKEX" | "ASX" | "KRX" | "SGX"
  | "MCX" | "CRYPTO" | "INDEX";

/** Timeframe of a parsed tip */
export type ParsedTimeframe = "INTRADAY" | "SWING" | "POSITIONAL" | "LONG_TERM";

/** Conviction level inferred from language intensity */
export type ParsedConviction = "LOW" | "MEDIUM" | "HIGH";

/** Structured tip data extracted from unstructured text */
export interface ParsedTip {
  readonly stockSymbol: string;
  readonly exchange: ParsedExchange | null;
  readonly direction: ParsedDirection;
  readonly entryPrice: number;
  readonly target1: number;
  readonly target2: number | null;
  readonly target3: number | null;
  readonly stopLoss: number;
  readonly timeframe: ParsedTimeframe;
  readonly conviction: ParsedConviction;
  readonly isTip: boolean;
  readonly confidence: number;
}

/** Raw extraction results from the rule-based stage before normalization */
export interface RawExtraction {
  readonly stockSymbols: readonly string[];
  readonly prices: readonly number[];
  readonly targets: readonly number[];
  readonly stopLosses: readonly number[];
  readonly entryPrices: readonly number[];
  readonly directions: readonly string[];
  readonly timeframes: readonly string[];
}

/** Full result returned by the parser pipeline */
export interface ParserResult {
  readonly parsedTip: ParsedTip | null;
  readonly confidence: number;
  readonly rawExtraction: RawExtraction;
  readonly stage: "rule_based" | "llm_assisted";
}

/** LLM response schema for structured tip extraction */
export interface LlmTipExtraction {
  readonly stock_name: string | null;
  readonly exchange: string | null;
  readonly direction: string | null;
  readonly entry_price: number | null;
  readonly target_1: number | null;
  readonly target_2: number | null;
  readonly target_3: number | null;
  readonly stop_loss: number | null;
  readonly timeframe: string | null;
  readonly conviction: string | null;
  readonly is_tip: boolean;
}
