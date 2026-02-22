// src/lib/parser/extractor.ts

import { PARSER } from "@/lib/constants";
import { AppError } from "@/lib/errors";

import { calculateConfidence } from "./confidence";
import { normalizeStockName, isValidSymbolFormat } from "./normalizer";
import {
  STOCK_SYMBOL_PATTERN,
  TARGET_PATTERN,
  STOP_LOSS_PATTERN,
  ENTRY_PATTERN,
  ENTRY_RANGE_PATTERN,
  DIRECTION_PATTERN,
  TIMEFRAME_PATTERN,
  SYMBOL_BLACKLIST,
  normalizeDirection,
  normalizeTimeframe,
  parsePrice,
} from "./templates";
import type {
  ParsedTip,
  ParsedDirection,
  ParsedExchange,
  ParsedTimeframe,
  ParsedConviction,
  RawExtraction,
  ParserResult,
  LlmTipExtraction,
} from "./types";

// ──── Stage 1: Rule-Based Extraction ────

/**
 * Extract all regex matches for a given pattern from text.
 * Resets the regex lastIndex on each call to avoid stateful bugs.
 */
function extractAllMatches(pattern: RegExp, text: string): string[] {
  const matches: string[] = [];
  const regex = new RegExp(pattern.source, pattern.flags);
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Find the first non-undefined capture group (supports patterns with
    // multiple alternative groups, e.g. STOCK_SYMBOL_PATTERN where cashtags
    // land in group 1 and bare symbols in group 2).
    for (let i = 1; i < match.length; i++) {
      const group = match[i];
      if (group !== undefined) {
        matches.push(group);
        break;
      }
    }
  }

  return matches;
}

/**
 * Run the rule-based (Stage 1) extraction on raw post content.
 *
 * Extracts stock symbols, prices, targets, stop-losses, entries,
 * directions, and timeframes using regex patterns.
 *
 * @param content - Raw text from a scraped social media post
 * @returns RawExtraction with all matched fields and arrays
 */
export function extractRuleBased(content: string): RawExtraction {
  // Extract stock symbols: uppercase words not in blacklist
  const rawSymbols = extractAllMatches(STOCK_SYMBOL_PATTERN, content);
  const stockSymbols = rawSymbols
    .filter((s) => !SYMBOL_BLACKLIST.has(s))
    .filter((s) => isValidSymbolFormat(s));

  // Extract target prices
  const rawTargets = extractAllMatches(TARGET_PATTERN, content);
  const targets = rawTargets.map(parsePrice).filter((n) => !isNaN(n));

  // Extract stop-loss prices
  const rawStopLosses = extractAllMatches(STOP_LOSS_PATTERN, content);
  const stopLosses = rawStopLosses.map(parsePrice).filter((n) => !isNaN(n));

  // Extract entry prices (try range pattern first, then single entry)
  const entryPrices = extractEntryPrices(content);

  // Extract direction keywords
  const directions = extractAllMatches(DIRECTION_PATTERN, content);

  // Extract timeframe keywords
  const timeframes = extractAllMatches(TIMEFRAME_PATTERN, content);

  // Extract generic prices (fallback for unmatched numbers)
  const prices: number[] = [];

  return {
    stockSymbols,
    prices,
    targets,
    stopLosses,
    entryPrices,
    directions,
    timeframes,
  };
}

/**
 * Extract entry prices, handling range patterns like "2400-2420" by
 * returning the midpoint.
 */
function extractEntryPrices(content: string): number[] {
  const results: number[] = [];

  // Try range pattern first (e.g., "Entry: 2400-2420")
  const rangeRegex = new RegExp(
    ENTRY_RANGE_PATTERN.source,
    ENTRY_RANGE_PATTERN.flags
  );
  let rangeMatch: RegExpExecArray | null;

  while ((rangeMatch = rangeRegex.exec(content)) !== null) {
    const low = parsePrice(rangeMatch[1] ?? "");
    const high = parsePrice(rangeMatch[2] ?? "");
    if (!isNaN(low) && !isNaN(high)) {
      results.push((low + high) / 2); // Midpoint of range
    }
  }

  // If no range found, try single entry pattern
  if (results.length === 0) {
    const singles = extractAllMatches(ENTRY_PATTERN, content);
    for (const s of singles) {
      const price = parsePrice(s);
      if (!isNaN(price)) {
        results.push(price);
      }
    }
  }

  return results;
}

/**
 * Build a ParsedTip from the rule-based extraction, if enough fields
 * are present to form a coherent tip.
 *
 * Returns null if the extraction is insufficient to construct a tip.
 */
export function buildTipFromExtraction(extraction: RawExtraction): ParsedTip | null {
  // Must have at least a stock and one of entry/target/SL to attempt a tip
  if (
    extraction.stockSymbols.length === 0 ||
    (extraction.entryPrices.length === 0 &&
      extraction.targets.length === 0 &&
      extraction.stopLosses.length === 0)
  ) {
    return null;
  }

  const stockSymbol = normalizeStockName(extraction.stockSymbols[0]!);
  const entryPrice = extraction.entryPrices[0] ?? 0;
  const target1 = extraction.targets[0] ?? 0;
  const target2 = extraction.targets[1] ?? null;
  const target3 = extraction.targets[2] ?? null;
  const stopLoss = extraction.stopLosses[0] ?? 0;

  // If any core price field is 0, we still try but mark lower confidence
  if (entryPrice === 0 || target1 === 0 || stopLoss === 0) {
    // Some fields are missing — the confidence scorer will penalize this
  }

  // Determine direction
  const rawDirection = extraction.directions[0];
  const direction: ParsedDirection =
    (rawDirection ? normalizeDirection(rawDirection) : null) ?? inferDirection(entryPrice, target1);

  // Determine timeframe
  const rawTimeframe = extraction.timeframes[0];
  const timeframe: ParsedTimeframe =
    (rawTimeframe ? normalizeTimeframe(rawTimeframe) : null) ?? "SWING"; // Default to SWING

  // Determine exchange (heuristic based on symbol patterns)
  const exchange = inferExchange(stockSymbol);

  // Calculate confidence
  const confidence = calculateConfidence(extraction);

  return {
    stockSymbol,
    exchange,
    direction,
    entryPrice,
    target1,
    target2,
    target3,
    stopLoss,
    timeframe,
    conviction: "MEDIUM",
    isTip: true,
    confidence,
  };
}

/**
 * Infer BUY/SELL direction from price relationships.
 * If target > entry, it's a BUY. If target < entry, it's a SELL.
 */
function inferDirection(entryPrice: number, targetPrice: number): ParsedDirection {
  if (targetPrice > entryPrice) return "BUY";
  if (targetPrice < entryPrice) return "SELL";
  return "BUY"; // Default to BUY if equal or both zero
}

/**
 * Infer exchange from stock symbol using heuristics.
 * Returns null when the exchange can't be determined (will be resolved via DB lookup).
 */
function inferExchange(symbol: string): ParsedExchange {
  const indexSymbols = new Set([
    "NIFTY 50", "NIFTY BANK", "NIFTY IT", "NIFTY PHARMA", "NIFTY MIDCAP 50",
    "SENSEX", "SPX", "DJI", "IXIC", "VIX", "QQQ",
    "FTSE 100", "DAX", "CAC 40", "NIKKEI 225", "HSI",
  ]);
  if (indexSymbols.has(symbol)) return "INDEX";

  const cryptoSymbols = new Set([
    "BTC", "ETH", "SOL", "XRP", "ADA", "DOGE", "MATIC", "AVAX",
    "LINK", "DOT", "LTC", "UNI", "PEPE", "SHIB",
  ]);
  if (cryptoSymbols.has(symbol)) return "CRYPTO";

  // Default: null — the caller should resolve via the stocks table
  // If not found there, it will be treated based on context
  return "NSE";
}

// ──── Stage 2: LLM-Based Extraction ────

/**
 * The structured prompt sent to the LLM for tip extraction.
 * The LLM is only called when the rule-based stage yields a confidence
 * between LOW_CONFIDENCE_THRESHOLD and HIGH_CONFIDENCE_THRESHOLD.
 */
function buildLlmPrompt(
  postContent: string,
  creatorName: string,
  specializations: readonly string[]
): string {
  return `You are a financial tip parser. Extract structured tip data from the following social media post.
The post may be from any global market (US, India, Europe, Asia, crypto) and may contain mixed-language text.

Extract the following fields:
- stock_name: Full stock name or symbol (e.g., "AAPL", "RELIANCE", "BTC", "NIFTY")
- exchange: NYSE, NASDAQ, NSE, BSE, LSE, CRYPTO, INDEX, or other exchange code
- direction: BUY or SELL
- entry_price: Entry price or CMP (current market price)
- target_1: Primary target price
- target_2: Secondary target (if mentioned)
- target_3: Tertiary target (if mentioned)
- stop_loss: Stop loss price
- timeframe: INTRADAY, SWING, POSITIONAL, or LONG_TERM
- conviction: LOW, MEDIUM, or HIGH (infer from language intensity)
- is_tip: true if this post contains an actionable financial tip, false otherwise

RULES:
- If a field is not mentioned, set it to null
- For price ranges (e.g., "2400-2420"), use the midpoint
- "BTST" = Buy Today Sell Tomorrow = SWING timeframe
- "CMP" means current market price — use it as entry_price
- If the post is just market commentary without actionable advice, set is_tip to false
- Return ONLY valid JSON, no markdown or explanation

Post: "${postContent.replace(/"/g, '\\"')}"

Creator: ${creatorName} (known for: ${specializations.join(", ") || "general"})`;
}

/**
 * Call the OpenAI API to extract a structured tip from free-form text.
 *
 * Uses the model specified in OPENAI_MODEL env var (default: gpt-4o-mini).
 *
 * @param content - Raw text from a social media post
 * @param creatorName - Name of the creator for context
 * @param specializations - Creator's known specializations
 * @returns ParsedTip extracted by the LLM, or null if not a tip
 */
export async function extractWithLlm(
  content: string,
  creatorName: string,
  specializations: readonly string[]
): Promise<ParsedTip | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new AppError(
      "OPENAI_API_KEY not configured",
      "MISSING_CONFIG",
      500
    );
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const prompt = buildLlmPrompt(content, creatorName, specializations);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a precise financial data extraction assistant. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1, // Low temperature for deterministic extraction
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new AppError(
      `OpenAI API error: ${response.status} ${body}`,
      "OPENAI_API_ERROR",
      response.status
    );
  }

  const data = (await response.json()) as {
    choices: { message: { content: string } }[];
  };
  const rawContent = data.choices[0]?.message?.content;

  if (!rawContent) {
    return null;
  }

  return parseLlmResponse(rawContent);
}

/**
 * Parse the raw LLM JSON response into a structured ParsedTip.
 * Handles cases where the LLM returns markdown-wrapped JSON.
 */
function parseLlmResponse(rawContent: string): ParsedTip | null {
  // Strip markdown code fences if present
  let jsonStr = rawContent.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  let parsed: LlmTipExtraction;
  try {
    parsed = JSON.parse(jsonStr) as LlmTipExtraction;
  } catch {
    return null; // LLM returned invalid JSON
  }

  if (!parsed.is_tip) {
    return null;
  }

  // Validate required fields
  if (!parsed.stock_name || !parsed.entry_price || !parsed.target_1) {
    return null;
  }

  const stockSymbol = normalizeStockName(parsed.stock_name);
  const direction = validateDirection(parsed.direction);
  const timeframe = validateTimeframe(parsed.timeframe);
  const conviction = validateConviction(parsed.conviction);
  const exchange = validateExchange(parsed.exchange);

  return {
    stockSymbol,
    exchange,
    direction,
    entryPrice: parsed.entry_price,
    target1: parsed.target_1,
    target2: parsed.target_2,
    target3: parsed.target_3,
    stopLoss: parsed.stop_loss ?? 0,
    timeframe,
    conviction,
    isTip: true,
    confidence: 0.80, // LLM-assisted extractions get a baseline of 0.80
  };
}

// ──── Validation helpers for LLM output ────

function validateDirection(raw: string | null): ParsedDirection {
  if (raw === "BUY" || raw === "SELL") return raw;
  if (raw) {
    const normalized = normalizeDirection(raw);
    if (normalized) return normalized;
  }
  return "BUY"; // Default
}

function validateTimeframe(raw: string | null): ParsedTimeframe {
  const valid: ParsedTimeframe[] = ["INTRADAY", "SWING", "POSITIONAL", "LONG_TERM"];
  if (raw && valid.includes(raw as ParsedTimeframe)) {
    return raw as ParsedTimeframe;
  }
  if (raw) {
    const normalized = normalizeTimeframe(raw);
    if (normalized) return normalized;
  }
  return "SWING"; // Default
}

function validateConviction(raw: string | null): ParsedConviction {
  const valid: ParsedConviction[] = ["LOW", "MEDIUM", "HIGH"];
  if (raw && valid.includes(raw as ParsedConviction)) {
    return raw as ParsedConviction;
  }
  return "MEDIUM"; // Default
}

function validateExchange(raw: string | null): ParsedExchange | null {
  const valid: ParsedExchange[] = [
    "NYSE", "NASDAQ", "TSX",
    "LSE", "XETRA", "EURONEXT",
    "NSE", "BSE", "TSE", "HKEX", "ASX", "KRX", "SGX",
    "MCX", "CRYPTO", "INDEX",
  ];
  if (raw && valid.includes(raw as ParsedExchange)) {
    return raw as ParsedExchange;
  }
  return null; // Unknown exchange — will be resolved via DB lookup
}

// ──── Combined two-stage extraction ────

/**
 * Run the full two-stage extraction pipeline.
 *
 * Stage 1: Rule-based regex extraction (fast, free)
 * Stage 2: LLM-based extraction (accurate, costs money) — only for results
 *          with confidence between LOW and HIGH thresholds.
 *
 * @param content - Raw text from a social media post
 * @param creatorName - Name of the creator for LLM context
 * @param specializations - Creator's known specializations
 * @returns ParserResult with the parsed tip (or null) and metadata
 */
export async function extractTip(
  content: string,
  creatorName: string,
  specializations: readonly string[]
): Promise<ParserResult> {
  // Stage 1: Rule-based extraction
  const rawExtraction = extractRuleBased(content);
  const ruleBasedTip = buildTipFromExtraction(rawExtraction);

  if (ruleBasedTip) {
    const confidence = ruleBasedTip.confidence;

    // High confidence — trust the rule-based extraction
    if (confidence >= PARSER.HIGH_CONFIDENCE_THRESHOLD) {
      return {
        parsedTip: ruleBasedTip,
        confidence,
        rawExtraction,
        stage: "rule_based",
      };
    }

    // Low confidence — not worth sending to LLM
    if (confidence < PARSER.LOW_CONFIDENCE_THRESHOLD) {
      return {
        parsedTip: null,
        confidence,
        rawExtraction,
        stage: "rule_based",
      };
    }

    // Middle confidence — use LLM to refine
    try {
      const llmTip = await extractWithLlm(
        content,
        creatorName,
        specializations
      );

      if (llmTip) {
        return {
          parsedTip: llmTip,
          confidence: llmTip.confidence,
          rawExtraction,
          stage: "llm_assisted",
        };
      }
    } catch {
      // LLM failed — fall back to the rule-based result
    }

    // LLM returned null or failed — return rule-based result for human review
    return {
      parsedTip: ruleBasedTip,
      confidence,
      rawExtraction,
      stage: "rule_based",
    };
  }

  // Rule-based extraction produced no tip candidate at all
  const confidence = calculateConfidence(rawExtraction);
  return {
    parsedTip: null,
    confidence,
    rawExtraction,
    stage: "rule_based",
  };
}
