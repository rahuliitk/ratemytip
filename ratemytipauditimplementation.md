# RateMyTip Audit — Implementation Guide

> **Created:** March 6, 2026
> **Companion to:** `ratemytipaudit.md`
> **Purpose:** Step-by-step instructions to resolve every issue identified in the audit
> **Approach:** Ordered by priority (blocking → critical → high → medium → low), with exact file paths, code changes, and verification steps

---

## TABLE OF CONTENTS

1. [Sprint 0: Pre-Launch Blockers (Day 1-2)](#sprint-0-pre-launch-blockers)
2. [Sprint 1: Score Worker Deduplication & Data Integrity (Day 2-3)](#sprint-1-score-worker-deduplication)
3. [Sprint 2: Security Hardening (Day 3-4)](#sprint-2-security-hardening)
4. [Sprint 3: Parser Cleanup & Auto-Approval (Day 4-5)](#sprint-3-parser-cleanup)
5. [Sprint 4: Market Data Integration (Day 5-8)](#sprint-4-market-data-integration)
6. [Sprint 5: Frontend UX — Loading & Error States (Day 8-10)](#sprint-5-frontend-ux)
7. [Sprint 6: Accessibility Fixes (Day 10-11)](#sprint-6-accessibility)
8. [Sprint 7: Cache Invalidation & Performance (Day 11-12)](#sprint-7-cache-invalidation)
9. [Sprint 8: Monitoring & Observability (Day 12-13)](#sprint-8-monitoring)
10. [Sprint 9: Testing Coverage (Day 13-16)](#sprint-9-testing)
11. [Sprint 10: Scoring Algorithm Enhancements (Day 16-19)](#sprint-10-scoring-enhancements)
12. [Sprint 11: Scope Cleanup Decision (Day 19-20)](#sprint-11-scope-cleanup)
13. [Sprint 12: SEO & Polish (Day 20-22)](#sprint-12-seo-polish)
14. [Sprint 13: Design System Formalization (Day 22-23)](#sprint-13-design-system)
15. [Sprint 14: Admin Dashboard Improvements (Day 23-24)](#sprint-14-admin-dashboard)
16. [Sprint 15: Advanced Market Intelligence (Day 24-28)](#sprint-15-market-intelligence)
17. [Sprint 16: UI/UX Enhancements (Day 28-32)](#sprint-16-ui-ux-enhancements)
18. [Verification Checklist](#verification-checklist)

---

## SPRINT 0: PRE-LAUNCH BLOCKERS

> **Priority:** P0 — Application will crash without these fixes
> **Estimated Time:** 4-6 hours
> **Risk if skipped:** Runtime crashes, deployment failure

---

### TASK 0.1: Generate and Commit Prisma Migrations

**Audit Reference:** BUG — No migration files committed
**Why it matters:** Without committed migrations, deployments to staging/production will fail. `prisma migrate deploy` requires migration files in version control.

**Files to modify:**
- `prisma/migrations/` (created by Prisma CLI)

**Steps:**

```bash
# Step 1: Ensure Docker containers are running
docker compose up -d

# Step 2: Wait for Postgres to be healthy
docker compose exec postgres pg_isready -U ratemytip

# Step 3: Generate initial migration from current schema
npx prisma migrate dev --name initial_schema

# Step 4: Verify migration was created
ls -la prisma/migrations/

# Step 5: Verify the migration SQL is complete
cat prisma/migrations/*/migration.sql | head -50

# Step 6: Verify Prisma client generation
npx prisma generate

# Step 7: Run seed to verify schema works end-to-end
npx prisma db seed

# Step 8: Commit migration files
git add prisma/migrations/
git commit -m "chore: add initial Prisma migration"
```

**Verification:**
- [ ] `prisma/migrations/` directory exists with timestamped folder
- [ ] `migration.sql` contains all 34 CREATE TABLE statements
- [ ] `npx prisma migrate status` shows no pending migrations
- [ ] `npx prisma db seed` completes without errors

---

### TASK 0.2: Fix Parser Duplicate Logic

**Audit Reference:** BUG-001 — Parser has duplicate implementations
**Why it matters:** `src/lib/parser/index.ts` duplicates extraction logic from `src/lib/parser/extractor.ts`, creating maintenance risk. The `parseTipFromPost()` function in `index.ts` (lines 25-101) is functionally identical to `extractTip()` in `extractor.ts` (lines 456-525).

**Files to modify:**
- `src/lib/parser/index.ts`

**Implementation:**

The `index.ts` orchestrator should delegate to `extractor.ts` functions instead of reimplementing extraction. Refactor as follows:

```typescript
// src/lib/parser/index.ts
// REMOVE the inline extraction logic (lines 25-101 approximately)
// REPLACE with a call to the canonical extractor functions

import { extractRuleBased, extractWithLlm } from "./extractor";
import { calculateConfidence, isHighConfidence, isLowConfidence } from "./confidence";
import { normalizeStockSymbol } from "./normalizer";
import type { ParsedTip, RawPostContent } from "./types";
import { PARSER } from "@/lib/constants";
import { createLogger } from "@/lib/logger";

const log = createLogger("parser");

/**
 * Two-stage tip parser orchestrator.
 * Stage 1: Rule-based regex extraction (fast, free)
 * Stage 2: LLM-based extraction for medium-confidence results (accurate, costs money)
 */
export async function parseTipFromPost(
  post: RawPostContent,
  creatorName?: string,
  specializations?: string[]
): Promise<ParsedTip | null> {
  // Stage 1: Rule-based extraction
  const ruleBasedResult = extractRuleBased(post.content);

  if (!ruleBasedResult) {
    log.debug({ postId: post.id }, "No tip-like content detected");
    return null;
  }

  const confidence = calculateConfidence(ruleBasedResult);

  // High confidence → use rule-based result directly
  if (isHighConfidence(confidence)) {
    log.info({ postId: post.id, confidence }, "High confidence rule-based extraction");
    return finalizeResult(ruleBasedResult, confidence, "RULE_BASED");
  }

  // Low confidence → not a tip
  if (isLowConfidence(confidence)) {
    log.debug({ postId: post.id, confidence }, "Low confidence, skipping");
    return null;
  }

  // Medium confidence → invoke LLM for refinement
  log.info({ postId: post.id, confidence }, "Medium confidence, invoking LLM");
  try {
    const llmResult = await extractWithLlm(
      post.content,
      creatorName ?? "Unknown",
      specializations ?? []
    );

    if (llmResult) {
      const llmConfidence = calculateConfidence(llmResult);
      return finalizeResult(llmResult, llmConfidence, "LLM");
    }
  } catch (error) {
    log.error({ postId: post.id, err: error }, "LLM extraction failed, falling back to rule-based");
  }

  // Fallback to rule-based result if LLM fails
  return finalizeResult(ruleBasedResult, confidence, "RULE_BASED_FALLBACK");
}

function finalizeResult(
  result: ExtractedTipData,
  confidence: number,
  source: string
): ParsedTip {
  // Normalize stock symbol
  const normalizedSymbol = normalizeStockSymbol(result.stockSymbol);

  return {
    ...result,
    stockSymbol: normalizedSymbol ?? result.stockSymbol,
    parseConfidence: confidence,
    parseSource: source,
  };
}

// Re-export for external use
export { normalizeStockSymbol } from "./normalizer";
export { calculateConfidence } from "./confidence";
```

**Also remove** the duplicate `extractTip()` function at the bottom of `extractor.ts` (lines ~456-525) if it duplicates `parseTipFromPost()`.

**Verification:**
- [ ] `parseTipFromPost()` exists only in `index.ts` (not reimplemented)
- [ ] `extractRuleBased()` and `extractWithLlm()` are only in `extractor.ts`
- [ ] Unit tests pass: `npx vitest run src/lib/parser/`
- [ ] No duplicate function definitions across parser files

---

### TASK 0.3: Fix Homepage Caching

**Audit Reference:** Homepage uses `force-dynamic` which disables ISR
**Why it matters:** The spec requires 5-minute ISR revalidation on the homepage. `force-dynamic` forces server rendering on EVERY request, causing unnecessary load and slower response times.

**File to modify:**
- `src/app/page.tsx`

**Implementation:**

```typescript
// src/app/page.tsx
// REMOVE this line:
// export const dynamic = "force-dynamic";

// REPLACE with ISR revalidation:
export const revalidate = 300; // 5 minutes, matching spec
```

**Verification:**
- [ ] `force-dynamic` removed from `src/app/page.tsx`
- [ ] `revalidate = 300` present
- [ ] Homepage loads correctly in development
- [ ] Build succeeds: `npm run build` (no static generation errors)

---

## SPRINT 1: SCORE WORKER DEDUPLICATION

> **Priority:** P0 — Data integrity risk
> **Estimated Time:** 4-6 hours
> **Risk if skipped:** Divergent scores between worker and API

---

### TASK 1.1: Refactor Score Worker to Use Shared Scoring Module

**Audit Reference:** BUG-003 — Score worker duplicates all scoring logic
**Why it matters:** `src/lib/queue/workers/score-worker.ts` (544 lines) reimplements accuracy, risk-adjusted return, consistency, volume factor, tier assignment, streaks, and confidence interval calculations. These are identical to the canonical implementations in `src/lib/scoring/`. Two implementations WILL diverge after future code changes.

**Files to modify:**
- `src/lib/queue/workers/score-worker.ts` (major refactor — ~400 lines removed)
- `src/lib/scoring/index.ts` (may need minor exports)

**Implementation Strategy:**

The score-worker should become a thin orchestration layer that:
1. Queries the database for creators to score
2. Calls `calculateCreatorScore()` from `src/lib/scoring/index.ts`
3. Calls `persistCreatorScore()` from `src/lib/scoring/index.ts`
4. Handles batching and error logging

```typescript
// src/lib/queue/workers/score-worker.ts — REFACTORED

import { Worker } from "bullmq";
import { connection } from "../queues";
import { calculateCreatorScore, persistCreatorScore } from "@/lib/scoring";
import { db } from "@/lib/db";
import { createLogger } from "@/lib/logger";
import { SCORING } from "@/lib/constants";

const log = createLogger("worker/score");

interface ScoreJobData {
  creatorId?: string; // If provided, score single creator; otherwise score all
  triggeredBy?: string;
}

export function createScoreWorker(): Worker<ScoreJobData> {
  return new Worker<ScoreJobData>(
    "calculate-scores",
    async (job) => {
      log.info({ jobId: job.id, data: job.data }, "Score calculation job started");

      if (job.data.creatorId) {
        await scoreSingleCreator(job.data.creatorId);
      } else {
        await scoreAllCreators();
      }
    },
    {
      connection,
      concurrency: 1, // Score calculation is DB-heavy; single at a time
    }
  );
}

async function scoreSingleCreator(creatorId: string): Promise<void> {
  try {
    const result = await calculateCreatorScore(creatorId);
    if (result) {
      await persistCreatorScore(creatorId, result);
      log.info({ creatorId, rmtScore: result.rmtScore }, "Creator score updated");
    } else {
      log.info({ creatorId }, "Creator has insufficient tips for scoring");
    }
  } catch (error) {
    log.error({ creatorId, err: error }, "Failed to score creator");
    throw error; // Let BullMQ retry
  }
}

async function scoreAllCreators(): Promise<void> {
  const creators = await db.creator.findMany({
    where: { isActive: true },
    select: { id: true, slug: true, totalTips: true },
    orderBy: { totalTips: "desc" },
  });

  log.info({ totalCreators: creators.length }, "Starting full score recalculation");

  const BATCH_SIZE = 50;
  let scored = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < creators.length; i += BATCH_SIZE) {
    const batch = creators.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async (creator) => {
        // Skip creators below minimum threshold for efficiency
        if (creator.totalTips < SCORING.MIN_TIPS_FOR_DISPLAY) {
          skipped++;
          return;
        }

        const result = await calculateCreatorScore(creator.id);
        if (result) {
          await persistCreatorScore(creator.id, result);
          scored++;
        } else {
          skipped++;
        }
      })
    );

    // Count failures
    const batchFailed = results.filter((r) => r.status === "rejected").length;
    failed += batchFailed;

    log.info(
      { batch: Math.floor(i / BATCH_SIZE) + 1, scored, skipped, failed },
      "Score batch completed"
    );
  }

  log.info({ scored, skipped, failed, total: creators.length }, "Full score recalculation complete");
}
```

**Key changes:**
1. DELETE all inline scoring functions from score-worker.ts (~lines 50-260)
2. DELETE `recalculateCreatorScore()` function
3. IMPORT and USE `calculateCreatorScore()` and `persistCreatorScore()` from `@/lib/scoring`
4. Keep only the Worker setup, batching logic, and error handling

**Verification:**
- [ ] `score-worker.ts` is under 100 lines (down from 544)
- [ ] No scoring math functions remain in the worker file
- [ ] `grep -r "calculateAccuracy\|calculateRiskAdjusted\|calculateConsistency\|calculateVolumeFactor" src/lib/queue/workers/` returns no results
- [ ] Worker processes without errors: test by running `npx tsx workers/start.ts` and triggering a score job
- [ ] Scores match when comparing: API response vs. worker output for the same creator

---

### TASK 1.2: Ensure Scoring Index Exports All Required Functions

**Audit Reference:** Supporting task for Task 1.1
**Why it matters:** The `src/lib/scoring/index.ts` module must export everything the refactored worker needs.

**File to verify/modify:**
- `src/lib/scoring/index.ts`

**Verify these exports exist:**

```typescript
// src/lib/scoring/index.ts should export:
export { calculateCompositeScore } from "./composite";
export { calculateAccuracy } from "./accuracy";
export { calculateRiskAdjustedReturn } from "./risk-adjusted";
export { calculateConsistency } from "./consistency";
export { calculateVolumeFactor } from "./volume-factor";

// These orchestration functions must exist:
export async function calculateCreatorScore(creatorId: string): Promise<CompositeScoreResult | null>;
export async function persistCreatorScore(creatorId: string, result: CompositeScoreResult): Promise<void>;
```

If `persistCreatorScore()` doesn't handle updating the `Creator.tier` field and creating a `ScoreSnapshot`, ensure it does:

```typescript
export async function persistCreatorScore(
  creatorId: string,
  result: CompositeScoreResult
): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await db.$transaction([
    // Upsert CreatorScore
    db.creatorScore.upsert({
      where: { creatorId },
      update: {
        accuracyScore: result.accuracyScore,
        riskAdjustedScore: result.riskAdjustedScore,
        consistencyScore: result.consistencyScore,
        volumeFactorScore: result.volumeFactorScore,
        rmtScore: result.rmtScore,
        confidenceInterval: result.confidenceInterval,
        accuracyRate: result.accuracyRate,
        avgReturnPct: result.avgReturnPct,
        avgRiskRewardRatio: result.avgRiskRewardRatio,
        winStreak: result.winStreak,
        lossStreak: result.lossStreak,
        bestTipReturnPct: result.bestTipReturnPct,
        worstTipReturnPct: result.worstTipReturnPct,
        intradayAccuracy: result.intradayAccuracy,
        swingAccuracy: result.swingAccuracy,
        positionalAccuracy: result.positionalAccuracy,
        longTermAccuracy: result.longTermAccuracy,
        totalScoredTips: result.totalScoredTips,
        scorePeriodStart: result.scorePeriodStart,
        scorePeriodEnd: result.scorePeriodEnd,
        calculatedAt: new Date(),
      },
      create: {
        creatorId,
        // ... same fields as update
      },
    }),

    // Update Creator tier
    db.creator.update({
      where: { id: creatorId },
      data: { tier: result.tier },
    }),

    // Daily snapshot (upsert to handle re-runs)
    db.scoreSnapshot.upsert({
      where: { creatorId_date: { creatorId, date: today } },
      update: {
        rmtScore: result.rmtScore,
        accuracyRate: result.accuracyRate,
        totalScoredTips: result.totalScoredTips,
      },
      create: {
        creatorId,
        date: today,
        rmtScore: result.rmtScore,
        accuracyRate: result.accuracyRate,
        totalScoredTips: result.totalScoredTips,
      },
    }),
  ]);
}
```

**Verification:**
- [ ] `calculateCreatorScore()` is exported from `src/lib/scoring/index.ts`
- [ ] `persistCreatorScore()` is exported and handles upsert + snapshot + tier update
- [ ] Both functions used only in score-worker (no other callers need changes)

---

### TASK 1.3: Fix Risk-Adjusted Return Edge Case

**Audit Reference:** BUG-005 — Division by zero when entry equals stop-loss
**File:** `src/lib/scoring/risk-adjusted.ts`

**Implementation:**

Find the `safeRiskPct` fallback (around line 54) and replace:

```typescript
// BEFORE:
const safeRiskPct = 0.01; // Arbitrary fallback

// AFTER:
// If riskPct is 0 (entry === stoploss), this tip has invalid data.
// Assign a neutral risk-reward ratio of 1.0 instead of inflating it.
if (riskPct === 0) {
  return {
    returnPct,
    riskPct: 0,
    riskRewardRatio: returnPct > 0 ? 1.0 : -1.0, // Neutral R:R
  };
}
```

Also add validation in the tip creation/approval flow to reject tips where `entry_price === stop_loss`:

**File:** `src/lib/validators/tip.ts`

Add a Zod refinement:

```typescript
export const tipCreationSchema = z.object({
  // ... existing fields
}).refine(
  (data) => data.entryPrice !== data.stopLoss,
  { message: "Entry price cannot equal stop-loss price", path: ["stopLoss"] }
).refine(
  (data) => {
    if (data.direction === "BUY") {
      return data.target1 > data.entryPrice && data.stopLoss < data.entryPrice;
    }
    return data.target1 < data.entryPrice && data.stopLoss > data.entryPrice;
  },
  { message: "Target and stop-loss must be on opposite sides of entry price", path: ["target1"] }
);
```

**Verification:**
- [ ] `riskPct === 0` handled gracefully (returns neutral R:R, doesn't inflate)
- [ ] Zod validation rejects tips where `entryPrice === stopLoss`
- [ ] Zod validation rejects tips where target/SL are on wrong side of entry
- [ ] Unit test added: `tests/unit/scoring/risk-adjusted.test.ts` — test case for zero risk

---

## SPRINT 2: SECURITY HARDENING

> **Priority:** P1 — Security vulnerabilities
> **Estimated Time:** 6-8 hours
> **Risk if skipped:** Brute force attacks, data exposure

---

### TASK 2.1: Add Rate Limiting to Authentication Endpoints

**Audit Reference:** SEC-001 — No rate limiting on auth endpoints

**File to create:**
- `src/lib/utils/rate-limit-auth.ts`

**Files to modify:**
- `src/app/api/auth/register/route.ts`
- `src/app/api/auth/forgot-password/route.ts`
- `src/app/api/auth/reset-password/route.ts`
- `src/app/api/auth/check-username/route.ts`
- `src/app/api/auth/[...nextauth]/route.ts` (login attempts)

**Implementation:**

```typescript
// src/lib/utils/rate-limit-auth.ts
import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";

interface RateLimitConfig {
  windowMs: number;
  maxAttempts: number;
}

const AUTH_RATE_LIMITS: Record<string, RateLimitConfig> = {
  register: { windowMs: 3600_000, maxAttempts: 5 },       // 5 per hour
  login: { windowMs: 900_000, maxAttempts: 10 },           // 10 per 15 min
  "forgot-password": { windowMs: 3600_000, maxAttempts: 5 }, // 5 per hour
  "reset-password": { windowMs: 3600_000, maxAttempts: 5 },  // 5 per hour
  "check-username": { windowMs: 60_000, maxAttempts: 20 },   // 20 per minute
};

export async function checkAuthRateLimit(
  ip: string,
  action: keyof typeof AUTH_RATE_LIMITS
): Promise<NextResponse | null> {
  const config = AUTH_RATE_LIMITS[action];
  if (!config) return null;

  const key = `auth-ratelimit:${action}:${ip}`;
  const windowSec = Math.ceil(config.windowMs / 1000);

  try {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, windowSec);
    }

    if (current > config.maxAttempts) {
      const ttl = await redis.ttl(key);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many attempts. Please try again later.",
          },
        },
        {
          status: 429,
          headers: { "Retry-After": String(ttl > 0 ? ttl : windowSec) },
        }
      );
    }
  } catch {
    // If Redis is down, allow the request (fail open for auth)
  }

  return null;
}
```

**Apply to each auth route — example for register:**

```typescript
// src/app/api/auth/register/route.ts
import { checkAuthRateLimit } from "@/lib/utils/rate-limit-auth";

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Add rate limiting as the FIRST check
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown";
  const rateLimited = await checkAuthRateLimit(ip, "register");
  if (rateLimited) return rateLimited;

  // ... existing registration logic
}
```

Repeat for `forgot-password`, `reset-password`, `check-username`, and login.

**Verification:**
- [ ] Rate limiter function created at `src/lib/utils/rate-limit-auth.ts`
- [ ] All 5 auth endpoints call `checkAuthRateLimit()` as first operation
- [ ] Test: 6th registration attempt from same IP within 1 hour returns 429
- [ ] Test: Rate limit resets after window expires
- [ ] Test: Redis failure doesn't block auth (fail-open)

---

### TASK 2.2: Remove Admin Email from Moderation API Response

**Audit Reference:** SEC-002 — Admin email exposed
**File:** `src/app/api/admin/moderation/route.ts`

**Implementation:**

Find the response mapping (around line 80-90) and remove `email`:

```typescript
// BEFORE:
admin: {
  id: action.admin.id,
  name: action.admin.name,
  email: action.admin.email,  // REMOVE THIS LINE
  role: action.admin.role,
},

// AFTER:
admin: {
  id: action.admin.id,
  name: action.admin.name,
  role: action.admin.role,
},
```

**Verification:**
- [ ] `email` field removed from admin object in moderation response
- [ ] `grep -n "admin.email" src/app/api/admin/moderation/route.ts` returns no results
- [ ] API response verified: `GET /api/admin/moderation` no longer contains email

---

### TASK 2.3: Strengthen Password Requirements

**Audit Reference:** SEC-004 — Weak password requirements
**File:** `src/app/api/auth/register/route.ts` (or the relevant Zod schema)

**Implementation:**

Find the password validation and update:

```typescript
// In your Zod schema or inline validation:
const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");
```

**Verification:**
- [ ] Password "abcdefgh" (8 chars, lowercase only) is rejected
- [ ] Password "Abcdef1234!" (11 chars, mixed) is accepted
- [ ] Error message specifies which requirement failed

---

### TASK 2.4: Add Zod Validation to Admin Claims and Reports

**Audit Reference:** API-001, API-002 — Manual string parsing instead of Zod

**Files to modify:**
- `src/app/api/admin/claims/route.ts`
- `src/app/api/admin/reports/route.ts`

**Implementation for claims:**

```typescript
// Add at top of file or in src/lib/validators/admin.ts
import { z } from "zod";

const claimsQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// In the GET handler:
export async function GET(request: NextRequest): Promise<NextResponse> {
  const adminResult = await requireAdmin();
  if (isAuthError(adminResult)) return adminResult;

  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = claimsQuerySchema.safeParse(searchParams);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid query parameters", details: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  const { status, page, pageSize } = parsed.data;
  // ... rest of handler using validated params
}
```

Apply same pattern to `reports/route.ts`.

**Verification:**
- [ ] Both routes use Zod for query parameter validation
- [ ] Invalid params return 400 with structured error
- [ ] No manual `searchParams.get()` followed by inline checks

---

## SPRINT 3: PARSER CLEANUP

> **Priority:** P1 — 40-60% of tips may be lost without proper parsing
> **Estimated Time:** 4-6 hours
> **Risk if skipped:** Majority of tips not processed

---

### TASK 3.1: Verify and Fix LLM Parser Integration

**Audit Reference:** Audit claimed `extractWithLlm()` doesn't exist — deep dive reveals it DOES exist in `extractor.ts` at line 304

**Actual Status:** The LLM parser IS implemented in `src/lib/parser/extractor.ts`. The function uses OpenAI's API with the model specified in `OPENAI_MODEL` env var. The issue is that the parser `index.ts` may not be correctly wiring the call.

**File to verify:**
- `src/lib/parser/index.ts` — Ensure it properly calls `extractWithLlm()` from `extractor.ts`
- `src/lib/parser/extractor.ts` — Verify the OpenAI integration at line 304

**Steps:**

1. Read `src/lib/parser/index.ts` and verify the import of `extractWithLlm` from `./extractor`
2. Verify the function signature matches: `extractWithLlm(content: string, creatorName: string, specializations: string[])`
3. Ensure `.env.example` has `OPENAI_API_KEY` and `OPENAI_MODEL` (it does)
4. Write a manual test:

```typescript
// scripts/test-llm-parser.ts
import { extractWithLlm } from "../src/lib/parser/extractor";

const testPost = `
BUY RELIANCE
Entry: 2400-2420
Target 1: 2500
Target 2: 2600
SL: 2350
Timeframe: Swing
`;

async function main() {
  const result = await extractWithLlm(testPost, "TestCreator", ["SWING"]);
  console.log("LLM extraction result:", JSON.stringify(result, null, 2));
}

main().catch(console.error);
```

```bash
npx tsx scripts/test-llm-parser.ts
```

**Verification:**
- [ ] `extractWithLlm()` is properly imported in `index.ts`
- [ ] Manual test returns correct structured tip data
- [ ] OpenAI API key is set in `.env.local`
- [ ] Graceful fallback to rule-based when OpenAI API fails

---

### TASK 3.2: Implement Auto-Approval for High-Confidence Tips

**Audit Reference:** Missing auto-approval logic
**Why it matters:** CLAUDE.md Section 10.1 says tips with confidence >= 0.85 should be auto-approved. Currently ALL tips go to manual review queue, creating an admin bottleneck.

**File to modify:**
- `src/lib/queue/workers/parse-worker.ts`

**Implementation:**

In the parse worker, after extracting a tip and before inserting into the database, add auto-approval logic:

```typescript
import { PARSER } from "@/lib/constants";

// After successful tip extraction:
const confidence = parsedTip.parseConfidence;

let reviewStatus: ReviewStatus;
let tipStatus: TipStatus;

if (confidence >= PARSER.HIGH_CONFIDENCE_THRESHOLD) {
  // Auto-approve high-confidence tips
  reviewStatus = "AUTO_APPROVED";
  tipStatus = "ACTIVE";
  log.info({ confidence, stock: parsedTip.stockSymbol }, "Tip auto-approved (high confidence)");
} else if (confidence < PARSER.LOW_CONFIDENCE_THRESHOLD) {
  // Auto-reject low-confidence tips
  reviewStatus = "REJECTED";
  tipStatus = "REJECTED";
  log.info({ confidence }, "Tip auto-rejected (low confidence)");
} else {
  // Medium confidence → human review
  reviewStatus = "PENDING";
  tipStatus = "PENDING_REVIEW";
  log.info({ confidence, stock: parsedTip.stockSymbol }, "Tip queued for human review");
}

// Create tip with appropriate status
await db.tip.create({
  data: {
    // ... tip fields
    status: tipStatus,
    reviewStatus: reviewStatus,
    parseConfidence: confidence,
    reviewedAt: reviewStatus === "AUTO_APPROVED" ? new Date() : null,
  },
});
```

**Verification:**
- [ ] Tips with confidence >= 0.85 are created with `status: "ACTIVE"` and `reviewStatus: "AUTO_APPROVED"`
- [ ] Tips with confidence < 0.40 are created with `status: "REJECTED"` and `reviewStatus: "REJECTED"`
- [ ] Tips with confidence 0.40-0.84 are created with `status: "PENDING_REVIEW"` and `reviewStatus: "PENDING"`
- [ ] Admin review queue only shows medium-confidence tips

---

### TASK 3.3: Expand Symbol Blacklist

**Audit Reference:** Symbol extraction regex produces too many false positives
**File:** `src/lib/parser/templates.ts`

**Implementation:**

Find the `SYMBOL_BLACKLIST` array (around line 82) and add missing entries:

```typescript
// Add these to the existing SYMBOL_BLACKLIST array:
const ADDITIONAL_BLACKLIST = [
  // Directional words
  "ABOVE", "BELOW", "RANGE", "NEAR", "AROUND",
  // Time words
  "YEAR", "MONTH", "WEEK", "DAY", "HOUR", "TODAY", "TOMORROW",
  // Price/market words
  "HIGH", "LOW", "OPEN", "CLOSE", "VOLUME", "MARKET",
  // Financial terms that aren't tickers
  "PROFIT", "LOSS", "MARGIN", "RISK", "RETURN", "DIVIDEND",
  "EARNINGS", "REVENUE", "GROWTH", "YIELD", "RATIO",
  // Common English words 2-4 chars that match pattern
  "THE", "AND", "FOR", "NOT", "BUT", "ALL", "CAN", "HAS", "HER", "HIM",
  "HOW", "ITS", "MAY", "NEW", "NOW", "OLD", "OUR", "OUT", "OWN", "USE",
  "WAY", "WHO", "DID", "GET", "GOT", "HAD", "LET", "SAY", "SHE", "TOO",
  "ALSO", "BACK", "BEEN", "COME", "DOWN", "EACH", "EVEN", "GOOD", "HAVE",
  "HERE", "INTO", "JUST", "KEEP", "LAST", "LONG", "MADE", "MAKE", "MANY",
  "MORE", "MOST", "MUCH", "MUST", "NAME", "NEXT", "ONLY", "OVER", "PART",
  "SAME", "SOME", "SUCH", "TAKE", "THAN", "THEM", "THEN", "THIS", "TIME",
  "VERY", "WANT", "WELL", "WHAT", "WHEN", "WILL", "WITH", "WORK", "FROM",
  // Hinglish
  "YAAR", "BHAI", "ACCHA", "DEKHO", "KARO",
  // Action words that aren't tickers
  "HOLD", "WAIT", "BOOK", "EXIT", "TRAIL", "AVOID", "WATCH",
  "UPDATE", "NOTE", "ALERT", "SIGNAL", "VIEW", "IDEA",
];
```

Merge with existing blacklist and deduplicate.

**Verification:**
- [ ] "ABOVE 2400" no longer produces "ABOVE" as a stock symbol
- [ ] "HIGH of 2500" no longer produces "HIGH" as a stock symbol
- [ ] Legitimate tickers like "YES" (YES Bank) need manual exception handling
- [ ] Run parser tests to ensure no regression

---

### TASK 3.4: Add Price Relationship Validation

**Audit Reference:** No validation that target > entry for BUY tips
**File:** `src/lib/parser/extractor.ts` or `src/lib/parser/index.ts`

**Implementation:**

Add a validation step after extraction:

```typescript
function validatePriceRelationships(tip: ExtractedTipData): boolean {
  const { direction, entryPrice, target1, target2, target3, stopLoss } = tip;

  if (!entryPrice || !target1 || !stopLoss) return false;

  if (direction === "BUY") {
    // For BUY: target > entry > stopLoss
    if (target1 <= entryPrice) return false;
    if (stopLoss >= entryPrice) return false;
    if (target2 && target2 <= target1) return false;
    if (target3 && target3 <= (target2 ?? target1)) return false;
  } else if (direction === "SELL") {
    // For SELL: stopLoss > entry > target
    if (target1 >= entryPrice) return false;
    if (stopLoss <= entryPrice) return false;
    if (target2 && target2 >= target1) return false;
    if (target3 && target3 >= (target2 ?? target1)) return false;
  }

  return true;
}
```

Call this after extraction. If validation fails, reduce confidence by 0.20 (tips with wrong price relationships are likely misparses).

---

## SPRINT 4: MARKET DATA INTEGRATION

> **Priority:** P1 — Primary data source missing
> **Estimated Time:** 3-5 days

---

### TASK 4.1: Integrate NSE Service into Price Monitor

**Audit Reference:** NSE implementation exists but isn't wired into the price monitoring pipeline
**Current State:** `src/lib/market-data/nse.ts` is fully implemented (243 lines) with session cookie management, rate limiting, current price, historical prices, and market status. It's just not used by the price monitor.

**File to modify:**
- `src/lib/market-data/index.ts`
- `src/lib/market-data/price-monitor.ts`

**Implementation:**

Update the market data orchestrator to try NSE first for Indian equities, then fall back to Yahoo:

```typescript
// src/lib/market-data/index.ts
import { NseService } from "./nse";
import { BseService } from "./bse";
import { YahooFinanceService } from "./yahoo-finance";

const nseService = new NseService();
const bseService = new BseService();

/**
 * Fetch current price with fallback chain:
 * Indian equities: NSE → Yahoo Finance
 * BSE equities: BSE → Yahoo Finance
 * Others: Yahoo Finance
 */
export async function fetchCurrentPrice(
  symbol: string,
  exchange: string
): Promise<CurrentPrice | null> {
  // Try primary source first
  if (exchange === "NSE" || exchange === "INDEX") {
    const nsePrice = await nseService.getCurrentPrice(symbol);
    if (nsePrice) return nsePrice;
    log.warn({ symbol }, "NSE price unavailable, falling back to Yahoo");
  }

  if (exchange === "BSE") {
    // BSE requires scrip code — would need a mapping table
    // For now, fall through to Yahoo
    log.debug({ symbol }, "BSE price fetch not mapped, using Yahoo");
  }

  // Fallback to Yahoo Finance
  return yahooService.getCurrentPrice(symbol, exchange);
}
```

**Verification:**
- [ ] NSE prices fetched for NIFTY stocks when NSE API is available
- [ ] Graceful fallback to Yahoo when NSE returns null
- [ ] BSE integration documented as future improvement (needs scrip code mapping)
- [ ] Logging shows which source served each price

---

### TASK 4.2: Implement Historical Price Backfill Script

**Audit Reference:** No historical price backfill
**File to create:** `scripts/backfill-prices.ts`

**Implementation:**

```typescript
// scripts/backfill-prices.ts
import { db } from "../src/lib/db";
import { NseService } from "../src/lib/market-data/nse";
import { YahooFinanceService } from "../src/lib/market-data/yahoo-finance";
import { subYears } from "date-fns";

const nse = new NseService();
const yahoo = new YahooFinanceService();

async function backfillPrices(): Promise<void> {
  const stocks = await db.stock.findMany({
    where: { isActive: true },
    select: { id: true, symbol: true, exchange: true },
  });

  console.log(`Backfilling prices for ${stocks.length} stocks...`);

  const toDate = new Date();
  const fromDate = subYears(toDate, 1);

  for (const stock of stocks) {
    try {
      // Check if already backfilled
      const existingCount = await db.stockPrice.count({
        where: { stockId: stock.id },
      });

      if (existingCount > 200) {
        console.log(`  ${stock.symbol}: Already has ${existingCount} records, skipping`);
        continue;
      }

      // Fetch historical data
      let prices: PriceData[] = [];

      if (stock.exchange === "NSE") {
        prices = await nse.getHistoricalPrices(stock.symbol, fromDate, toDate);
      }

      // Fallback to Yahoo if NSE returns nothing
      if (prices.length === 0) {
        prices = await yahoo.getHistoricalPrices(stock.symbol, stock.exchange, fromDate, toDate);
      }

      if (prices.length === 0) {
        console.log(`  ${stock.symbol}: No historical data available`);
        continue;
      }

      // Batch insert
      await db.stockPrice.createMany({
        data: prices.map((p) => ({
          stockId: stock.id,
          date: p.date,
          open: p.open,
          high: p.high,
          low: p.low,
          close: p.close,
          volume: p.volume ? BigInt(p.volume) : null,
          source: p.source,
        })),
        skipDuplicates: true,
      });

      console.log(`  ${stock.symbol}: Inserted ${prices.length} price records`);

      // Rate limit: wait between stocks
      await new Promise((r) => setTimeout(r, 1000));
    } catch (error) {
      console.error(`  ${stock.symbol}: Error — ${error}`);
    }
  }

  console.log("Backfill complete.");
}

backfillPrices().catch(console.error);
```

Add to `package.json` scripts:
```json
"backfill:prices": "tsx scripts/backfill-prices.ts"
```

**Verification:**
- [ ] Script runs without errors: `npm run backfill:prices`
- [ ] `stock_prices` table populated with ~250 records per stock (1 year of trading days)
- [ ] Both NSE and Yahoo sources used
- [ ] Duplicate dates handled via `skipDuplicates`

---

### TASK 4.3: Add IST Timezone Handling to Price Monitor

**Audit Reference:** Price monitor uses local time instead of IST
**File:** `src/lib/market-data/price-monitor.ts`

**Implementation:**

```typescript
import { formatInTimeZone, toZonedTime } from "date-fns-tz";

const IST_TIMEZONE = "Asia/Kolkata";

/**
 * Check if NSE market is currently open (9:15 AM - 3:30 PM IST, Mon-Fri)
 */
function isNseMarketOpen(): boolean {
  const nowIST = toZonedTime(new Date(), IST_TIMEZONE);
  const day = nowIST.getDay(); // 0=Sun, 6=Sat

  // Weekend check
  if (day === 0 || day === 6) return false;

  const hours = nowIST.getHours();
  const minutes = nowIST.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  const marketOpen = 9 * 60 + 15;  // 9:15 AM
  const marketClose = 15 * 60 + 30; // 3:30 PM

  return timeInMinutes >= marketOpen && timeInMinutes <= marketClose;
}
```

Use this function in the price worker instead of the generic `EXCHANGE_MARKET_HOURS` UTC-based check for NSE stocks.

**Verification:**
- [ ] Market open check uses IST timezone, not server local time
- [ ] Returns false on weekends
- [ ] Returns true only between 9:15 AM and 3:30 PM IST
- [ ] `date-fns-tz` is already in dependencies (confirmed in package.json)

---

## SPRINT 5: FRONTEND UX — LOADING & ERROR STATES

> **Priority:** P1 — Poor user experience
> **Estimated Time:** 2-3 days

---

### TASK 5.1: Create Loading Pages for All Routes

**Audit Reference:** Zero `loading.tsx` or `error.tsx` files exist

**Files to create (loading.tsx for each page directory):**

```
src/app/(public)/leaderboard/loading.tsx
src/app/(public)/leaderboard/[category]/loading.tsx
src/app/(public)/creator/[slug]/loading.tsx
src/app/(public)/stock/[symbol]/loading.tsx
src/app/(public)/tip/[id]/loading.tsx
src/app/(public)/search/loading.tsx
src/app/(public)/tips/loading.tsx
src/app/admin/(dashboard)/loading.tsx
src/app/admin/review/loading.tsx
src/app/admin/creators/loading.tsx
```

**Template for each loading.tsx:**

```typescript
// Example: src/app/(public)/leaderboard/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function LeaderboardLoading(): React.ReactElement {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header skeleton */}
      <Skeleton className="h-10 w-64 mb-6" />

      {/* Filter bar skeleton */}
      <div className="flex gap-4 mb-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Table skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
```

Customize each loading skeleton to match the page layout:
- **Creator profile:** Avatar circle + stats cards + chart placeholder
- **Stock page:** Stock header + price chart + tip list
- **Tip detail:** Tip card + price chart + sidebar
- **Admin pages:** Table with rows

---

### TASK 5.2: Create Error Pages for All Routes

**Files to create (error.tsx for each page directory):**

```
src/app/(public)/leaderboard/error.tsx
src/app/(public)/creator/[slug]/error.tsx
src/app/(public)/stock/[symbol]/error.tsx
src/app/(public)/tip/[id]/error.tsx
src/app/admin/(dashboard)/error.tsx
```

**Template:**

```typescript
// src/app/(public)/leaderboard/error.tsx
"use client";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function LeaderboardError({ error, reset }: ErrorPageProps): React.ReactElement {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
      <p className="text-gray-600 mb-6">
        We couldn&apos;t load the leaderboard. Please try again.
      </p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition"
      >
        Try Again
      </button>
      {process.env.NODE_ENV === "development" && (
        <pre className="mt-8 p-4 bg-red-50 text-red-800 text-sm text-left rounded-lg overflow-auto">
          {error.message}
        </pre>
      )}
    </div>
  );
}
```

**Verification:**
- [ ] Every public page directory has both `loading.tsx` and `error.tsx`
- [ ] Loading skeletons match page layout proportions
- [ ] Error pages have a "Try Again" button that calls `reset()`
- [ ] Development mode shows error details; production shows generic message

---

## SPRINT 6: ACCESSIBILITY

> **Priority:** P2 — WCAG compliance
> **Estimated Time:** 1-2 days

---

### TASK 6.1: Add Skip-to-Content Link

**File:** `src/components/layout/header.tsx`

Add as the first child inside the header component:

```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-white focus:text-[var(--color-primary)] focus:rounded-lg focus:shadow-lg focus:ring-2 focus:ring-[var(--color-accent)]"
>
  Skip to main content
</a>
```

**File:** `src/app/(public)/layout.tsx` (or root layout)

Add `id="main-content"` to the main content wrapper:

```tsx
<main id="main-content" tabIndex={-1}>
  {children}
</main>
```

---

### TASK 6.2: Add ARIA Labels to Search Input

**File:** `src/components/search/search-bar.tsx`

```tsx
<input
  type="search"
  aria-label="Search creators, stocks, and tips"
  placeholder="Search creators, stocks..."
  // ... existing props
/>
```

---

### TASK 6.3: Add Keyboard Navigation to Search Suggestions

**File:** `src/components/search/search-suggestions.tsx` (or wherever autocomplete is implemented)

Add arrow key navigation:

```typescript
const [selectedIndex, setSelectedIndex] = useState(-1);

const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === "ArrowDown") {
    e.preventDefault();
    setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    setSelectedIndex((prev) => Math.max(prev - 1, -1));
  } else if (e.key === "Enter" && selectedIndex >= 0) {
    e.preventDefault();
    navigateToResult(results[selectedIndex]);
  } else if (e.key === "Escape") {
    setIsOpen(false);
  }
};
```

Add `role="listbox"` to the suggestions container and `role="option"` + `aria-selected` to each suggestion item.

---

### TASK 6.4: Fix Color Contrast

**File:** `src/app/globals.css`

```css
/* Update muted text color for WCAG AA compliance (4.5:1 ratio) */
:root {
  --color-muted: #5A6878; /* Changed from #718096 to pass WCAG AA on white */
}
```

Verify contrast ratio at https://webaim.org/resources/contrastchecker/

---

### TASK 6.5: Add Visible Focus Indicators

**File:** `src/app/globals.css`

```css
/* Global focus indicator */
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* Remove default outline only when not using keyboard */
:focus:not(:focus-visible) {
  outline: none;
}
```

**Verification:**
- [ ] Tab through entire page — every interactive element has visible focus ring
- [ ] Skip-to-content link works when pressing Tab from page top
- [ ] Search suggestions navigable with arrow keys
- [ ] Color contrast passes WCAG AA (4.5:1 ratio for normal text)

---

## SPRINT 7: CACHE INVALIDATION

> **Priority:** P2 — Stale data after score updates
> **Estimated Time:** 4-6 hours

---

### TASK 7.1: Implement Cache Invalidation After Score Recalculation

**Audit Reference:** Cache not invalidated when scores update
**File to create:** `src/lib/utils/cache-invalidation.ts`

```typescript
import { redis } from "@/lib/redis";
import { createLogger } from "@/lib/logger";

const log = createLogger("cache");

/**
 * Invalidate all cached data for a creator after score update.
 */
export async function invalidateCreatorCache(creatorSlug: string): Promise<void> {
  const patterns = [
    `creator:${creatorSlug}`,
    `creator:${creatorSlug}:*`,
  ];

  for (const pattern of patterns) {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      log.debug({ pattern, count: keys.length }, "Cache keys invalidated");
    }
  }
}

/**
 * Invalidate leaderboard cache after any score recalculation.
 */
export async function invalidateLeaderboardCache(): Promise<void> {
  const keys = await redis.keys("leaderboard:*");
  if (keys.length > 0) {
    await redis.del(...keys);
    log.info({ count: keys.length }, "Leaderboard cache invalidated");
  }
}

/**
 * Invalidate stock page cache when a tip status changes.
 */
export async function invalidateStockCache(stockSymbol: string): Promise<void> {
  const keys = await redis.keys(`stock:${stockSymbol}*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

**File to modify:** `src/lib/scoring/index.ts` — Add cache invalidation to `persistCreatorScore()`:

```typescript
import { invalidateCreatorCache, invalidateLeaderboardCache } from "@/lib/utils/cache-invalidation";

export async function persistCreatorScore(creatorId: string, result: CompositeScoreResult): Promise<void> {
  // ... existing DB operations ...

  // Invalidate related caches
  const creator = await db.creator.findUnique({ where: { id: creatorId }, select: { slug: true } });
  if (creator) {
    await invalidateCreatorCache(creator.slug);
  }
  await invalidateLeaderboardCache();
}
```

**Also modify:** `src/lib/market-data/price-monitor.ts` — After tip status changes:

```typescript
import { invalidateStockCache, invalidateCreatorCache } from "@/lib/utils/cache-invalidation";

// After resolving a tip:
await invalidateStockCache(tip.stock.symbol);
```

**Verification:**
- [ ] After score recalculation, `GET /api/v1/leaderboard` returns fresh data
- [ ] After tip status change, stock page cache is invalidated
- [ ] Redis keys properly cleaned up (verify with `redis-cli KEYS "*"`)

---

## SPRINT 8: MONITORING & OBSERVABILITY

> **Priority:** P2 — No production visibility
> **Estimated Time:** 3-4 hours

---

### TASK 8.1: Integrate Sentry Error Tracking

**Install:**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**Files created by wizard:**
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- Updates to `next.config.ts`

**Manual integration in error boundary:**

```typescript
// src/components/shared/error-boundary.tsx
import * as Sentry from "@sentry/nextjs";

class ErrorBoundary extends React.Component<Props, State> {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    Sentry.captureException(error, {
      contexts: { react: { componentStack: errorInfo.componentStack } },
    });
  }
}
```

**Add to API route error handlers:**

```typescript
// In catch blocks across API routes:
import * as Sentry from "@sentry/nextjs";

catch (error) {
  Sentry.captureException(error);
  return NextResponse.json(
    { success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
    { status: 500 }
  );
}
```

**Verification:**
- [ ] `SENTRY_DSN` configured in `.env.local`
- [ ] Throwing a test error shows up in Sentry dashboard
- [ ] Source maps uploaded for production builds
- [ ] No PII (passwords, tokens) sent to Sentry

---

### TASK 8.2: Add Request Correlation IDs

**File to create:** `src/lib/utils/correlation-id.ts`

```typescript
import { randomUUID } from "crypto";
import { headers } from "next/headers";

export function getCorrelationId(): string {
  const headersList = headers();
  return headersList.get("x-correlation-id") ?? randomUUID();
}
```

**File to modify:** All API routes — add correlation ID to error logs:

```typescript
const correlationId = getCorrelationId();
log.error({ correlationId, err: error }, "Request failed");
```

---

## SPRINT 9: TESTING COVERAGE

> **Priority:** P2 — Missing test coverage
> **Estimated Time:** 3-5 days

---

### TASK 9.1: Add NLP Parser Unit Tests

**File to create:** `tests/unit/parser/extractor.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { extractRuleBased } from "@/lib/parser/extractor";

describe("Rule-Based Extractor", () => {
  it("extracts structured tabular tip format", () => {
    const post = `BUY RELIANCE\nEntry: 2400\nTarget 1: 2500\nTarget 2: 2600\nSL: 2350`;
    const result = extractRuleBased(post);

    expect(result).not.toBeNull();
    expect(result?.stockSymbol).toBe("RELIANCE");
    expect(result?.direction).toBe("BUY");
    expect(result?.entryPrice).toBe(2400);
    expect(result?.target1).toBe(2500);
    expect(result?.target2).toBe(2600);
    expect(result?.stopLoss).toBe(2350);
  });

  it("extracts inline format", () => {
    const post = "RELIANCE Buy above 2420 TGT 2500/2600 SL 2350";
    const result = extractRuleBased(post);

    expect(result?.stockSymbol).toBe("RELIANCE");
    expect(result?.entryPrice).toBe(2420);
    expect(result?.target1).toBe(2500);
  });

  it("extracts hashtag format with emojis", () => {
    const post = "#RELIANCE Buy CMP 2415 target 2500 target 2600 SL 2350 #StockTips";
    const result = extractRuleBased(post);
    expect(result?.stockSymbol).toBe("RELIANCE");
  });

  it("handles entry price range (uses midpoint)", () => {
    const post = "BUY TCS Entry: 3400-3420 Target: 3500 SL: 3350";
    const result = extractRuleBased(post);
    expect(result?.entryPrice).toBe(3410); // midpoint
  });

  it("infers direction from price relationships", () => {
    const post = "INFY Entry 1500 Target 1600 SL 1450";
    const result = extractRuleBased(post);
    expect(result?.direction).toBe("BUY"); // target > entry → BUY
  });

  it("handles SELL direction", () => {
    const post = "SELL NIFTY Entry 19500 Target 19200 SL 19700";
    const result = extractRuleBased(post);
    expect(result?.direction).toBe("SELL");
  });

  it("returns null for non-tip content", () => {
    const post = "Market is looking bullish today! #StockMarket";
    const result = extractRuleBased(post);
    expect(result).toBeNull();
  });

  it("does not extract blacklisted words as stock symbols", () => {
    const post = "BUY ABOVE 2400 TARGET 2500 SL 2350";
    const result = extractRuleBased(post);
    expect(result?.stockSymbol).not.toBe("ABOVE");
    expect(result?.stockSymbol).not.toBe("TARGET");
  });

  it("handles Hinglish tip format", () => {
    const post = "RELIANCE kharidein 2400 ke paas, target 2500, stoploss 2350";
    const result = extractRuleBased(post);
    expect(result?.stockSymbol).toBe("RELIANCE");
  });
});
```

**File to create:** `tests/unit/parser/normalizer.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { normalizeStockSymbol } from "@/lib/parser/normalizer";

describe("Stock Name Normalizer", () => {
  it("normalizes common aliases", () => {
    expect(normalizeStockSymbol("RIL")).toBe("RELIANCE");
    expect(normalizeStockSymbol("RELIANCE INDUSTRIES")).toBe("RELIANCE");
    expect(normalizeStockSymbol("HDFC BANK")).toBe("HDFCBANK");
  });

  it("normalizes index names", () => {
    expect(normalizeStockSymbol("NIFTY")).toBe("NIFTY 50");
    expect(normalizeStockSymbol("BANKNIFTY")).toBe("NIFTY BANK");
  });

  it("is case insensitive", () => {
    expect(normalizeStockSymbol("reliance")).toBe("RELIANCE");
    expect(normalizeStockSymbol("Tcs")).toBe("TCS");
  });

  it("returns null for unknown symbols", () => {
    expect(normalizeStockSymbol("XYZABC123")).toBeNull();
  });
});
```

---

### TASK 9.2: Add Content Hash Integrity Tests

**File to create:** `tests/unit/utils/crypto.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { calculateTipContentHash } from "@/lib/utils/crypto";

describe("Content Hash", () => {
  it("produces consistent hash for same input", () => {
    const tip = {
      creatorId: "creator1",
      stockSymbol: "RELIANCE",
      direction: "BUY",
      entryPrice: 2400,
      target1: 2500,
      target2: null,
      target3: null,
      stopLoss: 2350,
      timeframe: "SWING",
      tipTimestamp: new Date("2026-01-15T10:00:00Z"),
    };

    const hash1 = calculateTipContentHash(tip);
    const hash2 = calculateTipContentHash(tip);
    expect(hash1).toBe(hash2);
  });

  it("produces different hash when any field changes", () => {
    const baseTip = {
      creatorId: "creator1",
      stockSymbol: "RELIANCE",
      direction: "BUY",
      entryPrice: 2400,
      target1: 2500,
      target2: null,
      target3: null,
      stopLoss: 2350,
      timeframe: "SWING",
      tipTimestamp: new Date("2026-01-15T10:00:00Z"),
    };

    const modifiedTip = { ...baseTip, entryPrice: 2401 };
    expect(calculateTipContentHash(baseTip)).not.toBe(calculateTipContentHash(modifiedTip));
  });
});
```

---

### TASK 9.3: Add E2E Tests for Critical Flows

**File to create:** `tests/e2e/leaderboard.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test.describe("Leaderboard", () => {
  test("loads and displays creator rankings", async ({ page }) => {
    await page.goto("/leaderboard");
    await expect(page.getByRole("heading", { name: /leaderboard/i })).toBeVisible();
    // Wait for data to load
    await expect(page.locator("table tbody tr").first()).toBeVisible({ timeout: 10000 });
  });

  test("filters by category", async ({ page }) => {
    await page.goto("/leaderboard");
    await page.getByRole("tab", { name: /intraday/i }).click();
    await expect(page).toHaveURL(/\/leaderboard\/intraday/);
  });

  test("navigates to creator profile", async ({ page }) => {
    await page.goto("/leaderboard");
    await page.locator("table tbody tr").first().click();
    await expect(page).toHaveURL(/\/creator\//);
  });
});
```

**Verification:**
- [ ] `npx vitest run tests/unit/parser/` — all parser tests pass
- [ ] `npx vitest run tests/unit/utils/crypto.test.ts` — hash tests pass
- [ ] `npx playwright test tests/e2e/leaderboard.spec.ts` — E2E test passes

---

## SPRINT 10: SCORING ALGORITHM ENHANCEMENTS

> **Priority:** P3 — Analyst-recommended improvements
> **Estimated Time:** 3-5 days

---

### TASK 10.1: Add Market Regime Adjustment

**Audit Reference:** Scoring Concern 1 — No market regime adjustment
**File to create:** `src/lib/scoring/market-regime.ts`

```typescript
import { db } from "@/lib/db";

type MarketRegime = "BULL" | "BEAR" | "SIDEWAYS";

interface RegimeMultiplier {
  regime: MarketRegime;
  multiplier: number;
}

const REGIME_MULTIPLIERS: Record<MarketRegime, number> = {
  BULL: 0.85,     // Easier to be right in bull market
  BEAR: 1.25,     // Harder to be right in bear market
  SIDEWAYS: 1.0,  // Neutral
};

/**
 * Determine the market regime at a given date based on NIFTY 50 performance.
 *
 * Bull: NIFTY 50 up > 10% over last 90 days
 * Bear: NIFTY 50 down > 10% over last 90 days
 * Sideways: Within +/- 10%
 */
export async function getMarketRegime(date: Date): Promise<RegimeMultiplier> {
  const ninetyDaysAgo = new Date(date);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const niftyStock = await db.stock.findFirst({
    where: { symbol: "NIFTY 50", isIndex: true },
  });

  if (!niftyStock) return { regime: "SIDEWAYS", multiplier: 1.0 };

  const [startPrice, endPrice] = await Promise.all([
    db.stockPrice.findFirst({
      where: { stockId: niftyStock.id, date: { gte: ninetyDaysAgo } },
      orderBy: { date: "asc" },
      select: { close: true },
    }),
    db.stockPrice.findFirst({
      where: { stockId: niftyStock.id, date: { lte: date } },
      orderBy: { date: "desc" },
      select: { close: true },
    }),
  ]);

  if (!startPrice || !endPrice) return { regime: "SIDEWAYS", multiplier: 1.0 };

  const changePct = ((endPrice.close - startPrice.close) / startPrice.close) * 100;

  if (changePct > 10) return { regime: "BULL", multiplier: REGIME_MULTIPLIERS.BULL };
  if (changePct < -10) return { regime: "BEAR", multiplier: REGIME_MULTIPLIERS.BEAR };
  return { regime: "SIDEWAYS", multiplier: REGIME_MULTIPLIERS.SIDEWAYS };
}
```

**Integration:** Apply `regimeMultiplier` to accuracy weights in `src/lib/scoring/accuracy.ts`:

```typescript
// In the tip weighting loop, multiply each tip's weight by its regime multiplier:
const regimeMultiplier = await getMarketRegime(tip.closedAt);
const adjustedWeight = weight * regimeMultiplier.multiplier;
```

---

### TASK 10.2: Add Timeframe Difficulty Weighting

**Audit Reference:** Scoring Concern 3 — Intraday vs long-term treated equally
**File:** `src/lib/scoring/accuracy.ts`

```typescript
const TIMEFRAME_DIFFICULTY: Record<string, number> = {
  INTRADAY: 0.7,    // Easiest — market noise covers tight targets
  SWING: 0.9,       // Medium
  POSITIONAL: 1.1,  // Hard — requires conviction
  LONG_TERM: 1.3,   // Hardest — must be fundamentally right
};

// In accuracy calculation, weight hits by timeframe difficulty:
const difficultyMultiplier = TIMEFRAME_DIFFICULTY[tip.timeframe] ?? 1.0;
const adjustedWeight = weight * difficultyMultiplier;
```

---

### TASK 10.3: Incorporate Max Drawdown into Risk-Adjusted Returns

**Audit Reference:** Scoring Concern 4 — maxDrawdownPct field unused
**File:** `src/lib/scoring/risk-adjusted.ts`

```typescript
// After calculating riskRewardRatio, apply a drawdown penalty:
const drawdownPenalty = tip.maxDrawdownPct
  ? Math.max(0, 1 - Math.abs(tip.maxDrawdownPct) / 20) // Penalty increases with drawdown
  : 1.0; // No penalty if drawdown not tracked

const adjustedRiskReward = riskRewardRatio * drawdownPenalty;
```

This means a tip with -20% drawdown gets 0% of its R:R credited, while a tip with -5% drawdown gets 75%.

---

## SPRINT 11: SCOPE CLEANUP

> **Priority:** P3 — Architectural decision
> **Estimated Time:** 1-2 days

---

### TASK 11.1: Decide on Scope Strategy

**Two options:**

**Option A: Remove Phase 2/3 code (Recommended for clean Phase 1 launch)**

Create a `phase2` branch with all current code, then remove out-of-scope features from `main`:

```bash
# Preserve Phase 2/3 work
git checkout -b phase2-features
git push origin phase2-features

# Return to main
git checkout main

# Remove out-of-scope directories (carefully)
rm -rf src/app/(auth)/register
rm -rf src/app/(user)/
rm -rf src/app/(creator)/
rm -rf src/app/(public)/pricing/
rm -rf src/app/(public)/profile/
rm -rf src/app/api/v1/portfolio/
rm -rf src/app/api/v1/subscriptions/
rm -rf src/app/api/v1/checkout/
rm -rf src/app/api/v1/follows/
rm -rf src/app/api/v1/feed/
rm -rf src/app/api/v1/comments/
rm -rf src/app/api/v1/user/
rm -rf src/app/api/v1/recommendations/
rm -rf src/app/api/v1/creator-dashboard/
rm -rf src/app/api/webhooks/stripe/
rm -rf src/app/api/admin/claims/
rm -rf src/app/api/admin/reports/
rm -rf src/components/portfolio/
rm -rf src/components/recommendations/
rm -rf src/components/creator-dashboard/
```

Update middleware.ts to remove user/creator route guards. Keep only admin protection.

**Option B: Keep Phase 2/3 code but disable routes**

Add route guards that return 404 for Phase 2/3 features:

```typescript
// src/middleware.ts — add to disabled routes
const PHASE2_ROUTES = ["/pricing", "/portfolio", "/feed", "/discover", "/saved"];
if (PHASE2_ROUTES.some(r => req.nextUrl.pathname.startsWith(r))) {
  return NextResponse.rewrite(new URL("/404", req.url));
}
```

**Recommendation:** Option A for production cleanliness. The code lives in `phase2-features` branch for later use.

---

## SPRINT 12: SEO & POLISH

> **Priority:** P3
> **Estimated Time:** 1-2 days

---

### TASK 12.1: Add Canonical URLs

**Files to modify:** All page.tsx files with `generateMetadata()`

```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  return {
    // ... existing metadata
    alternates: {
      canonical: `https://ratemytip.com/creator/${params.slug}`,
    },
  };
}
```

---

### TASK 12.2: Add BreadcrumbList Schema

**File to create:** `src/components/shared/breadcrumb-schema.tsx`

```tsx
interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }): React.ReactElement {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

Add to creator profile, stock page, and tip detail pages.

---

### TASK 12.3: Create Default OG Image

**File to create:** `public/og-default.png`

Create a 1200x630 image with:
- RateMyTip logo
- Tagline: "Every Call. Rated."
- Brand colors (navy #1A365D background, white text)

Use any design tool (Figma, Canva) or generate programmatically via `@vercel/og`.

---

## SPRINT 13: DESIGN SYSTEM FORMALIZATION

> **Priority:** P3
> **Estimated Time:** 2-3 hours

---

### TASK 13.1: Create tailwind.config.ts (If Using Tailwind v4 CSS-First Config)

**Current State:** The project uses Tailwind v4 with `@import "tailwindcss"` in `globals.css`. Design system colors ARE defined as CSS custom properties in `globals.css` `:root {}`. This is actually the Tailwind v4 way of configuring themes.

**What's Needed:** Ensure components USE the CSS custom properties instead of hardcoded hex values.

**File to modify:** `src/app/globals.css` — verify the `@theme` block maps CSS vars to Tailwind utilities:

```css
@theme inline {
  --color-primary: var(--color-primary);
  --color-accent: var(--color-accent);
  --color-success: var(--color-success);
  --color-danger: var(--color-danger);
  --color-warning: var(--color-warning);
}
```

**Then audit components** to replace hardcoded colors:

```bash
# Find hardcoded hex colors in components
grep -rn "#1A365D\|#2B6CB0\|#276749\|#C53030\|#C05621\|#718096" src/components/
```

Replace with CSS variable references: `var(--color-primary)`, `text-[var(--color-primary)]`, etc.

---

### TASK 13.2: Extract Score Color Constants

**File to create:** `src/lib/utils/score-colors.ts`

```typescript
export function getScoreColor(score: number): string {
  if (score >= 90) return "var(--score-excellent)";
  if (score >= 75) return "var(--score-very-good)";
  if (score >= 60) return "var(--score-good)";
  if (score >= 45) return "var(--score-average)";
  if (score >= 30) return "var(--score-below-avg)";
  return "var(--score-poor)";
}

export function getScoreColorClass(score: number): string {
  if (score >= 90) return "text-green-700";
  if (score >= 75) return "text-green-600";
  if (score >= 60) return "text-blue-600";
  if (score >= 45) return "text-orange-600";
  if (score >= 30) return "text-red-600";
  return "text-red-800";
}
```

Replace all inline score color logic in components with calls to this utility.

---

## SPRINT 14: ADMIN DASHBOARD IMPROVEMENTS

> **Priority:** P3
> **Estimated Time:** 1-2 days

---

### TASK 14.1: Add Keyboard Shortcuts to Review Queue

**Audit Reference:** CLAUDE.md Section 14.2 specifies A/R/E/N/P keyboard shortcuts

**File:** `src/app/admin/review/page.tsx` (or the review queue component)

```typescript
"use client";
import { useEffect, useCallback } from "react";

function useReviewKeyboardShortcuts({
  onApprove,
  onReject,
  onEdit,
  onNext,
  onPrevious,
}: ReviewShortcutHandlers) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case "a":
          e.preventDefault();
          onApprove();
          break;
        case "r":
          e.preventDefault();
          onReject();
          break;
        case "e":
          e.preventDefault();
          onEdit();
          break;
        case "n":
        case "j": // vim-style
          e.preventDefault();
          onNext();
          break;
        case "p":
        case "k": // vim-style
          e.preventDefault();
          onPrevious();
          break;
      }
    },
    [onApprove, onReject, onEdit, onNext, onPrevious]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
```

Add a keyboard shortcut legend to the review page UI:

```tsx
<div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
  <span className="font-medium">Keyboard shortcuts:</span>{" "}
  <kbd className="px-1.5 py-0.5 bg-white border rounded text-xs">A</kbd> Approve{" "}
  <kbd className="px-1.5 py-0.5 bg-white border rounded text-xs">R</kbd> Reject{" "}
  <kbd className="px-1.5 py-0.5 bg-white border rounded text-xs">E</kbd> Edit{" "}
  <kbd className="px-1.5 py-0.5 bg-white border rounded text-xs">N</kbd> Next{" "}
  <kbd className="px-1.5 py-0.5 bg-white border rounded text-xs">P</kbd> Previous
</div>
```

---

### TASK 14.2: Add Mobile Admin Layout

**File:** `src/components/layout/admin-sidebar.tsx`

Add a mobile hamburger menu that collapses the sidebar:

```tsx
// Mobile toggle button (visible on small screens)
<button
  onClick={() => setIsOpen(!isOpen)}
  className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
  aria-label="Toggle admin menu"
>
  {isOpen ? <X size={20} /> : <Menu size={20} />}
</button>

// Sidebar: hidden on mobile unless open
<aside className={`
  fixed inset-y-0 left-0 z-40 w-64 bg-white border-r transform transition-transform
  md:translate-x-0 md:static
  ${isOpen ? "translate-x-0" : "-translate-x-full"}
`}>
  {/* sidebar content */}
</aside>
```

---

## SPRINT 15: ADVANCED MARKET INTELLIGENCE

> **Priority:** P4 — Analyst-recommended enhancements
> **Estimated Time:** 3-5 days

---

### TASK 15.1: Add Sector-Wise Accuracy Breakdown

**File to add to:** `src/lib/scoring/composite.ts` (or new file `src/lib/scoring/sector-analysis.ts`)

```typescript
export async function calculateSectorAccuracy(
  creatorId: string
): Promise<Record<string, { accuracy: number; totalTips: number }>> {
  const tips = await db.tip.findMany({
    where: {
      creatorId,
      status: { in: ["TARGET_1_HIT", "ALL_TARGETS_HIT", "STOPLOSS_HIT", "EXPIRED"] },
    },
    include: { stock: { select: { sector: true } } },
  });

  const sectorMap = new Map<string, { hits: number; total: number }>();

  for (const tip of tips) {
    const sector = tip.stock.sector ?? "Unknown";
    const entry = sectorMap.get(sector) ?? { hits: 0, total: 0 };
    entry.total++;
    if (["TARGET_1_HIT", "TARGET_2_HIT", "TARGET_3_HIT", "ALL_TARGETS_HIT"].includes(tip.status)) {
      entry.hits++;
    }
    sectorMap.set(sector, entry);
  }

  const result: Record<string, { accuracy: number; totalTips: number }> = {};
  for (const [sector, data] of sectorMap) {
    result[sector] = {
      accuracy: data.total > 0 ? data.hits / data.total : 0,
      totalTips: data.total,
    };
  }

  return result;
}
```

Add to creator profile API response and display as a bar chart.

---

### TASK 15.2: Add Holding Period Analysis

**File:** New component `src/components/creator/holding-period-chart.tsx`

Calculate the average time from tip creation to resolution, broken down by timeframe:

```typescript
// In API or data fetching layer:
const holdingPeriods = completedTips.map((tip) => ({
  timeframe: tip.timeframe,
  daysHeld: differenceInDays(tip.closedAt, tip.tipTimestamp),
  outcome: isTargetHit(tip.status) ? "WIN" : "LOSS",
}));

// Average holding period per timeframe
const avgByTimeframe = groupBy(holdingPeriods, "timeframe");
```

Display as a histogram showing distribution of holding periods.

---

## SPRINT 16: UI/UX ENHANCEMENTS

> **Priority:** P4 — Nice-to-have
> **Estimated Time:** 3-5 days

---

### TASK 16.1: Add Toast Notification System

**Install:**
```bash
npx shadcn@latest add toast sonner
```

**File to modify:** `src/app/layout.tsx`

```tsx
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
```

Use throughout admin actions:

```typescript
import { toast } from "sonner";

// After successful approval:
toast.success("Tip approved successfully");

// After error:
toast.error("Failed to approve tip");
```

---

### TASK 16.2: Add "Clear All Filters" Button

**File:** `src/components/leaderboard/leaderboard-filters.tsx`

```tsx
<button
  onClick={() => {
    setCategory("all");
    setTimeRange("all");
    setMinTips(20);
    setSortBy("rmt_score");
    router.push("/leaderboard");
  }}
  className="text-sm text-[var(--color-accent)] hover:underline"
>
  Clear all filters
</button>
```

---

### TASK 16.3: Add Back-to-Top Button

**File to create:** `src/components/shared/back-to-top.tsx`

```tsx
"use client";
import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

export function BackToTop(): React.ReactElement | null {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => setIsVisible(window.scrollY > 500);
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  if (!isVisible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-8 right-8 p-3 bg-[var(--color-primary)] text-white rounded-full shadow-lg hover:opacity-90 transition z-40"
      aria-label="Back to top"
    >
      <ArrowUp size={20} />
    </button>
  );
}
```

Add to the public layout.

---

### TASK 16.4: Add Dark Mode Support

**File:** `src/app/globals.css`

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #0F172A;
    --color-surface: #1E293B;
    --color-text: #F1F5F9;
    --color-muted: #94A3B8;
    /* Adjust other colors for dark mode */
  }
}
```

Add a dark mode toggle button to the header that sets `class="dark"` on `<html>`.

---

## VERIFICATION CHECKLIST

### Pre-Launch Verification

```
CRITICAL (Must pass before deployment):
[ ] Prisma migrations committed and deployable
[ ] Parser doesn't crash on medium-confidence posts
[ ] Score worker uses shared scoring module (no duplication)
[ ] Homepage uses ISR revalidation (not force-dynamic)
[ ] Auth endpoints have rate limiting
[ ] Admin email not exposed in API responses
[ ] Price worker starts without crashing
[ ] All public pages load in < 2 seconds (LCP)

HIGH (Should pass):
[ ] Loading states on all pages
[ ] Error states on all pages
[ ] Auto-approval works for high-confidence tips
[ ] Cache invalidated after score updates
[ ] Sentry captures errors in production
[ ] Price monitor uses IST timezone
[ ] Parser validates price relationships

MEDIUM (Nice to have):
[ ] Accessibility: skip-to-content, ARIA labels, focus indicators
[ ] Color contrast passes WCAG AA
[ ] Toast notifications for admin actions
[ ] Keyboard shortcuts in review queue
[ ] Dark mode works
[ ] Back-to-top button present
[ ] Clear all filters button on leaderboard

TESTING:
[ ] npx vitest run — all unit tests pass
[ ] npx vitest run --coverage — scoring at 100%, parser at 90%+
[ ] npx playwright test — E2E tests pass
[ ] Manual test: Full tip lifecycle (scrape → parse → review → active → target hit → score update)
```

### Performance Benchmarks

```
[ ] Homepage LCP < 2 seconds
[ ] Leaderboard page load < 1.5 seconds (cached)
[ ] Creator profile page load < 2 seconds
[ ] Search autocomplete response < 200ms
[ ] Score recalculation for 500 creators < 5 minutes
[ ] Price monitoring cycle (all active tips) < 60 seconds
```

---

**END OF IMPLEMENTATION GUIDE**

*Total estimated effort: 32-40 developer days across 16 sprints.
Sprints 0-2 are launch blockers (~3 days). Sprints 3-8 are launch quality (~10 days).
Sprints 9-16 are post-launch improvements (~20 days).*
