// src/lib/parser/index.ts

import { PARSER } from "@/lib/constants";

import { calculateConfidence, isHighConfidence, isLowConfidence } from "./confidence";
import { extractRuleBased, buildTipFromExtraction, extractWithLlm } from "./extractor";
import type { ParserResult } from "./types";

/**
 * Parse a social media post and extract a structured stock tip.
 *
 * Two-stage pipeline:
 *   1. Rule-based regex extraction (fast, free)
 *      - If confidence >= HIGH_CONFIDENCE_THRESHOLD (0.85) -> return directly
 *      - If confidence < LOW_CONFIDENCE_THRESHOLD (0.40) -> return null (not a tip)
 *   2. LLM-based extraction (for results with confidence between 0.40 and 0.85)
 *      - Uses OpenAI gpt-4o-mini for accurate entity extraction
 *      - Falls back to rule-based result if LLM fails
 *
 * @param content - Raw text content from a scraped social media post
 * @param creatorName - Display name of the creator (for LLM context)
 * @param specializations - Creator's known specializations (e.g., ["INTRADAY", "LARGE_CAP"])
 * @returns ParserResult containing the parsed tip (or null), confidence, and extraction metadata
 */
export async function parseTipFromPost(
  content: string,
  creatorName: string,
  specializations: readonly string[]
): Promise<ParserResult> {
  // Stage 1: Rule-based extraction
  const rawExtraction = extractRuleBased(content);
  const ruleBasedTip = buildTipFromExtraction(rawExtraction);

  // If rule-based extraction produced a tip candidate, evaluate confidence
  if (ruleBasedTip) {
    const confidence = ruleBasedTip.confidence;

    // High confidence: rule-based result is trustworthy -> auto-approve candidate
    if (isHighConfidence(confidence, PARSER.HIGH_CONFIDENCE_THRESHOLD)) {
      return {
        parsedTip: ruleBasedTip,
        confidence,
        rawExtraction,
        stage: "rule_based",
      };
    }

    // Low confidence: likely not a real tip -> skip LLM expense
    if (isLowConfidence(confidence, PARSER.LOW_CONFIDENCE_THRESHOLD)) {
      return {
        parsedTip: null,
        confidence,
        rawExtraction,
        stage: "rule_based",
      };
    }

    // Middle confidence (0.40 - 0.85): invoke LLM for refinement
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

      // LLM determined it's not a tip
      return {
        parsedTip: null,
        confidence: 0.30,
        rawExtraction,
        stage: "llm_assisted",
      };
    } catch {
      // LLM call failed — return rule-based result for human review
      return {
        parsedTip: ruleBasedTip,
        confidence,
        rawExtraction,
        stage: "rule_based",
      };
    }
  }

  // No tip candidate from rule-based extraction
  const confidence = calculateConfidence(rawExtraction);
  return {
    parsedTip: null,
    confidence,
    rawExtraction,
    stage: "rule_based",
  };
}

// Re-export commonly used types and utilities for convenience
export type { ParserResult, ParsedTip, RawExtraction } from "./types";
export { calculateConfidence, isHighConfidence, isLowConfidence, needsReview } from "./confidence";
export { normalizeStockName, isValidSymbolFormat } from "./normalizer";
export { containsFinancialKeywords, FINANCIAL_KEYWORDS } from "./templates";
