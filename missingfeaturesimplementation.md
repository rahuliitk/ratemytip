# Missing Features Implementation Guide — RateMyTip Beginner Features

> **This document is the complete engineering implementation plan for all 32 missing features
> identified in `missingfeatures.md`.** Every feature includes: database schema changes, API
> endpoints, frontend components, backend services, worker jobs, and step-by-step build order.
> Built on top of the existing Phase 1 codebase (Next.js 16, Prisma 6.5, BullMQ, Redis, PostgreSQL).

---

## TABLE OF CONTENTS

0. [Architecture Overview & Shared Infrastructure](#0-architecture-overview--shared-infrastructure)
1. [Feature 1.1: Jargon Buster / Inline Glossary](#feature-11-jargon-buster--inline-glossary)
2. [Feature 1.2: How to Follow This Tip Guide](#feature-12-how-to-follow-this-tip-guide)
3. [Feature 1.3: Beginner Learning Paths](#feature-13-beginner-learning-paths)
4. [Feature 1.4: Tip Post-Mortems](#feature-14-tip-post-mortems)
5. [Feature 2.1: Position Size Calculator](#feature-21-position-size-calculator)
6. [Feature 2.2: Risk Level Indicator Per Tip](#feature-22-risk-level-indicator-per-tip)
7. [Feature 2.3: Maximum Drawdown Display](#feature-23-maximum-drawdown-display)
8. [Feature 2.4: Capital at Risk Dashboard](#feature-24-capital-at-risk-dashboard)
9. [Feature 3.1: Who Should I Follow Quiz](#feature-31-who-should-i-follow-quiz)
10. [Feature 3.2: Creator Comparison Tool](#feature-32-creator-comparison-tool)
11. [Feature 3.3: Conflicting Tip Detector](#feature-33-conflicting-tip-detector)
12. [Feature 3.4: Market Context Widget](#feature-34-market-context-widget)
13. [Feature 3.5: Similar Past Tips Pattern Matcher](#feature-35-similar-past-tips-pattern-matcher)
14. [Feature 4.1: Personal Watchlist / Follow System](#feature-41-personal-watchlist--follow-system)
15. [Feature 4.2: Alert / Notification System](#feature-42-alert--notification-system)
16. [Feature 4.3: Virtual Portfolio / Paper Trading](#feature-43-virtual-portfolio--paper-trading)
17. [Feature 4.4: P&L Simulator / Backtest Tool](#feature-44-pl-simulator--backtest-tool)
18. [Feature 5.1: Red Flag / Warning System](#feature-51-red-flag--warning-system)
19. [Feature 5.2: SEBI Registration Verification](#feature-52-sebi-registration-verification)
20. [Feature 5.3: Creator Behavior Analytics](#feature-53-creator-behavior-analytics)
21. [Feature 6.1: Beginner Discussion Forums / Q&A](#feature-61-beginner-discussion-forums--qa)
22. [Feature 6.2: Mentor Matching](#feature-62-mentor-matching)
23. [Feature 6.3: Traders Like Me Social Proof](#feature-63-traders-like-me-social-proof)
24. [Feature 7.1: Guided Onboarding Experience](#feature-71-guided-onboarding-experience)
25. [Feature 7.2: Personalized Dashboard](#feature-72-personalized-dashboard)
26. [Feature 7.3: Experience Level Filter / Beginner Mode](#feature-73-experience-level-filter--beginner-mode)
27. [Feature 8.1: Brokerage Cost Calculator](#feature-81-brokerage-cost-calculator)
28. [Feature 8.2: Tax Implications Guide](#feature-82-tax-implications-guide)
29. [Feature 8.3: Scam Protection Guide](#feature-83-scam-protection-guide)
30. [Feature 9.1: Creator Performance by Market Conditions](#feature-91-creator-performance-by-market-conditions)
31. [Feature 9.2: Sector Strength Dashboard](#feature-92-sector-strength-dashboard)
32. [Feature 9.3: Entry Timing Insights](#feature-93-entry-timing-insights)
33. [Feature 10.1: Multi-Language Support](#feature-101-multi-language-support)
34. [Feature 10.2: Voice / Audio Summaries](#feature-102-voice--audio-summaries)
35. [Feature 10.3: Simplified / Lite Mode](#feature-103-simplified--lite-mode)
36. [Feature 10.4: Offline Access / PWA](#feature-104-offline-access--pwa)
37. [Feature 11.1: Learning Streak & Badges](#feature-111-learning-streak--badges)
38. [Feature 11.2: Weekly Challenges](#feature-112-weekly-challenges)
39. [Feature 12.1: Was This Useful Feedback](#feature-121-was-this-useful-feedback)
40. [Feature 12.2: Creator Review System](#feature-122-creator-review-system)
41. [Implementation Phases & Build Order](#implementation-phases--build-order)
42. [Database Migration Strategy](#database-migration-strategy)

---

## 0. ARCHITECTURE OVERVIEW & SHARED INFRASTRUCTURE

### 0.1 User Account System (Prerequisite for Most Features)

The existing codebase has Phase 2 user tables scaffolded in the Prisma schema. Many missing features
require a **lightweight user account**. This is the foundational change that enables 80% of the features below.

#### Database: Extend Existing User Model

The existing schema already has a `User` model scaffolded for Phase 2. We need to activate and extend it:

```prisma
// Add to existing User model in prisma/schema.prisma

model User {
  id                String    @id @default(cuid())
  email             String?   @unique
  displayName       String?   @map("display_name")
  passwordHash      String?   @map("password_hash")

  // ──── Beginner-Specific Fields ────
  experienceLevel   ExperienceLevel @default(BEGINNER) @map("experience_level")
  totalCapital      Float?    @map("total_capital")        // Persisted for calculators
  riskPerTrade      Float     @default(2.0) @map("risk_per_trade") // Default 2%
  preferredBroker   String?   @map("preferred_broker")     // zerodha, groww, angelone, etc.
  preferredLanguage String    @default("en") @map("preferred_language")
  displayMode       DisplayMode @default(STANDARD) @map("display_mode") // LITE or STANDARD
  onboardingStep    Int       @default(0) @map("onboarding_step")  // 0 = not started
  onboardingDone    Boolean   @default(false) @map("onboarding_done")
  quizCompleted     Boolean   @default(false) @map("quiz_completed")

  // ──── Gamification ────
  xpPoints          Int       @default(0) @map("xp_points")
  currentStreak     Int       @default(0) @map("current_streak")
  longestStreak     Int       @default(0) @map("longest_streak")
  lastActiveDate    DateTime? @map("last_active_date")
  tradingIqScore    Int       @default(0) @map("trading_iq_score")

  // ──── Timestamps ────
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  // ──── Relations ────
  follows           Follow[]
  stockWatchlist    StockWatchlist[]
  paperPortfolio    PaperPortfolioEntry[]
  quizAnswers       UserQuizAnswer[]
  learningProgress  UserLearningProgress[]
  badges            UserBadge[]
  tipFeedback       TipFeedback[]
  creatorReviews    CreatorReview[]
  notifications     UserNotification[]
  notificationPrefs NotificationPreference?
  challengeEntries  ChallengeEntry[]
  mentorships       Mentorship[]        @relation("MentorUser")
  menteeships       Mentorship[]        @relation("MenteeUser")
  forumPosts        ForumPost[]
  forumVotes        ForumVote[]

  @@map("users")
}

enum ExperienceLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
}

enum DisplayMode {
  LITE
  STANDARD
  ADVANCED
}
```

#### Authentication: Lightweight Sign-Up

```typescript
// src/lib/auth.ts — Extend existing NextAuth config

// Add Google + Email magic link providers alongside existing admin credentials
// Phase 1.5 users get:
//   - Google OAuth (one-click sign up)
//   - Email magic link (passwordless)
//   - No password to remember, low friction

// NEW: Add to existing NextAuth providers array:
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";

// providers: [
//   ...existing CredentialsProvider for admin...,
//   GoogleProvider({
//     clientId: process.env.GOOGLE_CLIENT_ID!,
//     clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
//   }),
//   EmailProvider({
//     server: process.env.EMAIL_SERVER,
//     from: process.env.EMAIL_FROM,
//   }),
// ]
```

#### New Environment Variables

```bash
# .env.local additions
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
EMAIL_SERVER="smtp://..."
EMAIL_FROM="noreply@ratemytip.com"
WEB_PUSH_VAPID_PUBLIC_KEY="..."
WEB_PUSH_VAPID_PRIVATE_KEY="..."
GOOGLE_TTS_API_KEY="..." # For audio summaries
TELEGRAM_BOT_TOKEN="..." # For Telegram notifications
```

#### New Packages Required (All Features Combined)

```bash
npm install web-push            # Push notifications
npm install next-intl           # i18n / multi-language
npm install next-pwa            # PWA / offline support
npm install react-joyride       # Guided tours / onboarding
npm install @google-cloud/text-to-speech  # Audio summaries
npm install node-telegram-bot-api         # Telegram bot
npm install telegraf             # Telegram bot (alternative, lighter)
npm install sharp                # Image processing for OG images
npm install swr                  # Already likely present — client-side data fetching
```

### 0.2 New File Structure (Additions to Existing)

```
src/
├── lib/
│   ├── glossary/                    # Feature 1.1
│   │   ├── terms.ts                 # Glossary term definitions
│   │   └── context-builder.ts       # Contextual explanation generator
│   │
│   ├── risk/                        # Features 2.1, 2.2, 2.3, 2.4
│   │   ├── position-sizer.ts        # Position size calculation
│   │   ├── risk-scorer.ts           # Tip risk level calculation
│   │   ├── drawdown.ts              # Max drawdown calculation
│   │   └── brokerage-costs.ts       # Brokerage cost calculator
│   │
│   ├── recommendation/              # Feature 3.1
│   │   ├── quiz-engine.ts           # Quiz scoring logic
│   │   └── creator-matcher.ts       # Match creators to user profile
│   │
│   ├── market-context/              # Features 3.4, 9.1, 9.2
│   │   ├── vix.ts                   # India VIX fetcher
│   │   ├── market-mood.ts           # Bull/bear/sideways classifier
│   │   ├── sector-strength.ts       # Sector heatmap data
│   │   ├── fii-dii.ts               # FII/DII activity
│   │   └── market-regime.ts         # Bull/bear/sideways detection
│   │
│   ├── red-flags/                   # Feature 5.1
│   │   ├── detector.ts              # Red flag detection engine
│   │   ├── rules.ts                 # Individual red flag rules
│   │   └── transparency-score.ts    # Creator transparency scoring
│   │
│   ├── sebi/                        # Feature 5.2
│   │   ├── registry-checker.ts      # SEBI registration lookup
│   │   └── types.ts
│   │
│   ├── paper-trading/               # Feature 4.3
│   │   ├── engine.ts                # Paper trade execution engine
│   │   ├── portfolio-tracker.ts     # Virtual portfolio tracking
│   │   └── pnl-calculator.ts        # P&L calculations
│   │
│   ├── backtester/                  # Feature 4.4
│   │   ├── engine.ts                # Backtest simulation engine
│   │   └── equity-curve.ts          # Equity curve generator
│   │
│   ├── post-mortem/                 # Feature 1.4
│   │   ├── generator.ts             # Auto-generate tip analysis
│   │   └── market-context-at-time.ts # Historical market context
│   │
│   ├── notifications/               # Feature 4.2
│   │   ├── web-push.ts              # Web push notification sender
│   │   ├── email-digest.ts          # Email digest generator
│   │   ├── telegram-bot.ts          # Telegram bot integration
│   │   └── dispatcher.ts            # Notification routing
│   │
│   ├── i18n/                        # Feature 10.1
│   │   ├── config.ts                # next-intl configuration
│   │   └── messages/
│   │       ├── en.json
│   │       └── hi.json
│   │
│   ├── gamification/                # Features 11.1, 11.2
│   │   ├── xp-engine.ts             # XP point calculation
│   │   ├── badge-engine.ts          # Badge award logic
│   │   ├── streak-tracker.ts        # Daily streak tracking
│   │   └── challenge-engine.ts      # Weekly challenge logic
│   │
│   ├── tax/                         # Feature 8.2
│   │   └── india-tax-calculator.ts  # Indian stock market tax estimation
│   │
│   └── learning/                    # Feature 1.3
│       ├── modules.ts               # Learning module definitions
│       ├── quiz-engine.ts           # Quiz logic
│       └── progress-tracker.ts      # Progress tracking
│
├── components/
│   ├── beginner/                    # Beginner-specific components
│   │   ├── glossary-tooltip.tsx     # 1.1: Hover tooltip
│   │   ├── glossary-sidebar.tsx     # 1.1: Full glossary sidebar
│   │   ├── execution-guide.tsx      # 1.2: How to follow tip
│   │   ├── position-calculator.tsx  # 2.1: Position size calculator
│   │   ├── risk-badge.tsx           # 2.2: Risk level badge
│   │   ├── risk-explainer.tsx       # 2.2: Risk explanation card
│   │   ├── brokerage-cost-card.tsx  # 8.1: Cost breakdown
│   │   ├── tax-estimate-card.tsx    # 8.2: Tax estimate
│   │   ├── lite-tip-card.tsx        # 10.3: Simplified tip card
│   │   ├── lite-leaderboard-row.tsx # 10.3: Simplified leaderboard row
│   │   └── beginner-mode-toggle.tsx # 7.3: Mode switcher
│   │
│   ├── onboarding/                  # Feature 7.1
│   │   ├── onboarding-tour.tsx      # Guided tour overlay
│   │   ├── onboarding-checklist.tsx # Getting started checklist
│   │   ├── welcome-modal.tsx        # First visit welcome
│   │   └── quiz-wizard.tsx          # Feature 3.1 quiz UI
│   │
│   ├── market-context/              # Feature 3.4
│   │   ├── market-bar.tsx           # Persistent market context bar
│   │   ├── vix-indicator.tsx        # VIX gauge
│   │   ├── market-mood-badge.tsx    # Bull/bear/neutral badge
│   │   ├── fii-dii-bar.tsx          # FII/DII activity bar
│   │   └── sector-heatmap.tsx       # Feature 9.2 sector visualization
│   │
│   ├── paper-trading/               # Feature 4.3
│   │   ├── paper-trade-button.tsx   # "Paper Follow" button
│   │   ├── paper-portfolio.tsx      # Portfolio dashboard
│   │   ├── paper-positions.tsx      # Active positions table
│   │   ├── paper-pnl-chart.tsx      # P&L over time chart
│   │   └── paper-leaderboard.tsx    # Paper trader leaderboard
│   │
│   ├── notifications/               # Feature 4.2
│   │   ├── notification-bell.tsx    # Bell icon with badge count
│   │   ├── notification-panel.tsx   # Dropdown notification list
│   │   ├── notification-settings.tsx # Preferences UI
│   │   └── push-permission.tsx      # Push notification permission prompt
│   │
│   ├── comparison/                  # Feature 3.2
│   │   ├── compare-selector.tsx     # Creator selection for comparison
│   │   ├── compare-table.tsx        # Side-by-side comparison table
│   │   └── compare-verdict.tsx      # AI-generated comparison verdict
│   │
│   ├── red-flags/                   # Feature 5.1
│   │   ├── red-flag-badge.tsx       # Warning badge on creator
│   │   ├── red-flag-panel.tsx       # Detailed red flag list
│   │   └── transparency-meter.tsx   # Transparency score visualization
│   │
│   ├── analytics/                   # Features 9.1, 9.3
│   │   ├── market-condition-chart.tsx # Performance by market condition
│   │   ├── entry-timing-card.tsx    # Entry timing analysis
│   │   ├── drawdown-chart.tsx       # Feature 2.3: Equity curve with drawdowns
│   │   └── similar-tips-panel.tsx   # Feature 3.5: Similar past tips
│   │
│   ├── learning/                    # Feature 1.3
│   │   ├── module-card.tsx          # Learning module card
│   │   ├── module-viewer.tsx        # Module content viewer
│   │   ├── quiz-card.tsx            # Quiz question card
│   │   ├── progress-bar.tsx         # Learning progress bar
│   │   └── badge-showcase.tsx       # Feature 11.1: Badge display
│   │
│   ├── community/                   # Features 6.1, 6.2, 6.3
│   │   ├── forum-thread.tsx         # Discussion thread
│   │   ├── forum-post.tsx           # Individual post
│   │   ├── forum-composer.tsx       # New post composer
│   │   ├── mentor-card.tsx          # Mentor profile card
│   │   ├── mentor-match.tsx         # Mentor matching UI
│   │   └── traders-like-me.tsx      # Social proof widget
│   │
│   ├── feedback/                    # Features 12.1, 12.2
│   │   ├── tip-feedback.tsx         # Thumbs up/down on tip
│   │   ├── creator-review-form.tsx  # Review submission form
│   │   └── review-list.tsx          # Review display list
│   │
│   └── post-mortem/                 # Feature 1.4
│       ├── post-mortem-card.tsx     # Tip post-mortem display
│       └── post-mortem-chart.tsx    # Price chart with annotations
│
├── app/
│   ├── (public)/
│   │   ├── learn/
│   │   │   ├── page.tsx             # Learning hub
│   │   │   └── [moduleSlug]/
│   │   │       └── page.tsx         # Individual module
│   │   ├── compare/
│   │   │   └── page.tsx             # Creator comparison page
│   │   ├── paper-trading/
│   │   │   └── page.tsx             # Paper trading dashboard
│   │   ├── protect-yourself/
│   │   │   └── page.tsx             # Scam protection guides
│   │   ├── market/
│   │   │   └── page.tsx             # Market overview / sector heatmap
│   │   ├── quiz/
│   │   │   └── page.tsx             # Who should I follow quiz
│   │   └── challenges/
│   │       └── page.tsx             # Weekly challenges page
│   │
│   ├── api/
│   │   └── v1/
│   │       ├── glossary/
│   │       │   └── route.ts         # GET /api/v1/glossary
│   │       ├── risk/
│   │       │   ├── position-size/
│   │       │   │   └── route.ts     # POST /api/v1/risk/position-size
│   │       │   └── tip-risk/
│   │       │       └── [tipId]/
│   │       │           └── route.ts # GET /api/v1/risk/tip-risk/:tipId
│   │       ├── market-context/
│   │       │   └── route.ts         # GET /api/v1/market-context
│   │       ├── quiz/
│   │       │   └── route.ts         # POST /api/v1/quiz (submit + get results)
│   │       ├── compare/
│   │       │   └── route.ts         # GET /api/v1/compare?creators=id1,id2,id3
│   │       ├── paper-trading/
│   │       │   ├── route.ts         # GET/POST paper portfolio
│   │       │   └── [entryId]/
│   │       │       └── route.ts     # PATCH/DELETE paper entry
│   │       ├── backtest/
│   │       │   └── route.ts         # POST /api/v1/backtest
│   │       ├── red-flags/
│   │       │   └── [creatorId]/
│   │       │       └── route.ts     # GET /api/v1/red-flags/:creatorId
│   │       ├── notifications/
│   │       │   ├── route.ts         # GET notifications
│   │       │   ├── subscribe/
│   │       │   │   └── route.ts     # POST push subscription
│   │       │   └── preferences/
│   │       │       └── route.ts     # GET/PATCH notification preferences
│   │       ├── learning/
│   │       │   ├── route.ts         # GET modules list
│   │       │   ├── progress/
│   │       │   │   └── route.ts     # GET/POST learning progress
│   │       │   └── quiz/
│   │       │       └── route.ts     # POST quiz answers
│   │       ├── forum/
│   │       │   ├── route.ts         # GET/POST forum threads
│   │       │   └── [threadId]/
│   │       │       ├── route.ts     # GET thread detail
│   │       │       └── vote/
│   │       │           └── route.ts # POST vote
│   │       ├── feedback/
│   │       │   └── route.ts         # POST tip feedback
│   │       ├── reviews/
│   │       │   └── route.ts         # GET/POST creator reviews
│   │       ├── challenges/
│   │       │   └── route.ts         # GET active challenges
│   │       ├── post-mortem/
│   │       │   └── [tipId]/
│   │       │       └── route.ts     # GET tip post-mortem
│   │       ├── similar-tips/
│   │       │   └── [tipId]/
│   │       │       └── route.ts     # GET similar past tips
│   │       ├── sectors/
│   │       │   └── route.ts         # GET sector strength data
│   │       ├── entry-timing/
│   │       │   └── [tipId]/
│   │       │       └── route.ts     # GET entry timing analysis
│   │       └── user/
│   │           ├── onboarding/
│   │           │   └── route.ts     # PATCH onboarding progress
│   │           └── experience-level/
│   │               └── route.ts     # PATCH experience level
│   │
│   └── manifest.ts                  # PWA manifest (Feature 10.4)
```

---

## FEATURE 1.1: JARGON BUSTER / INLINE GLOSSARY

### Step 1: Define Glossary Data

```typescript
// src/lib/glossary/terms.ts

export interface GlossaryTerm {
  readonly id: string;
  readonly term: string;
  readonly shortDefinition: string;     // 1-sentence tooltip
  readonly fullDefinition: string;       // 2-3 sentence explanation
  readonly example?: string;             // Contextual example with numbers
  readonly category: "trading" | "risk" | "analysis" | "platform" | "market";
  readonly difficulty: "beginner" | "intermediate" | "advanced";
  readonly hindiTranslation?: string;    // For multi-language support
  readonly relatedTerms?: string[];      // IDs of related terms
}

export const GLOSSARY_TERMS: readonly GlossaryTerm[] = [
  {
    id: "entry-price",
    term: "Entry Price",
    shortDefinition: "The price at which the analyst recommends you buy (or sell) the stock.",
    fullDefinition: "Entry Price is the specific price level where the tip creator suggests entering a trade. For a BUY tip, this is the price you should set your buy order at. If the stock is already above this price, the entry opportunity may have passed.",
    example: "If Entry Price is ₹2,420, you should place a limit buy order at ₹2,420. If the stock is already at ₹2,480, it has moved ₹60 above entry.",
    category: "trading",
    difficulty: "beginner",
    hindiTranslation: "प्रवेश मूल्य — वह कीमत जिस पर विश्लेषक स्टॉक खरीदने की सिफारिश करता है।",
    relatedTerms: ["stop-loss", "target-price", "cmp"],
  },
  {
    id: "stop-loss",
    term: "Stop Loss (SL)",
    shortDefinition: "The price at which you sell to limit your loss — your safety net.",
    fullDefinition: "A Stop Loss is a pre-decided price level where you exit a losing trade to prevent further losses. Think of it as insurance — you pay a small known loss to protect against a catastrophic unknown loss. ALWAYS use a stop loss on every trade.",
    example: "If you buy at ₹2,420 with SL at ₹2,350, your maximum loss per share is ₹70 (2.9%). If you bought 10 shares, your worst case is ₹700.",
    category: "risk",
    difficulty: "beginner",
    hindiTranslation: "स्टॉप लॉस — वह कीमत जिस पर आप अपना नुकसान सीमित करने के लिए बेचते हैं।",
    relatedTerms: ["entry-price", "risk-reward-ratio", "target-price"],
  },
  {
    id: "target-price",
    term: "Target Price (TGT)",
    shortDefinition: "The price the analyst expects the stock to reach — your profit-taking point.",
    fullDefinition: "The target price is where the analyst believes the stock will move to. Tips often have multiple targets (T1, T2, T3). T1 is the most conservative and most likely to hit. Many traders book partial profits at T1 and let the rest ride to T2/T3.",
    example: "Entry: ₹2,420, Target 1: ₹2,500 (+3.3%), Target 2: ₹2,600 (+7.4%). If only T1 hits, you still make a profit.",
    category: "trading",
    difficulty: "beginner",
    relatedTerms: ["entry-price", "risk-reward-ratio"],
  },
  {
    id: "rmt-score",
    term: "RMT Score",
    shortDefinition: "RateMyTip's proprietary 0-100 rating of a creator's overall tip performance.",
    fullDefinition: "The RMT Score combines four factors: Accuracy (40% weight — how often tips hit targets), Risk-Adjusted Returns (30% — how much profit relative to risk), Consistency (20% — whether performance is steady or erratic), and Volume (10% — statistical confidence from more tips). A score above 70 is considered good.",
    example: "A creator with RMT Score 78 has roughly 70% accuracy, decent risk-adjusted returns, and consistent performance across 200+ rated tips.",
    category: "platform",
    difficulty: "beginner",
    relatedTerms: ["accuracy-rate", "risk-reward-ratio", "consistency-score"],
  },
  {
    id: "risk-reward-ratio",
    term: "Risk-Reward Ratio (R:R)",
    shortDefinition: "For every ₹1 you risk losing, how many ₹ you could potentially gain.",
    fullDefinition: "Risk-Reward Ratio compares potential profit to potential loss. A 1:3 R:R means for every ₹1 risked, you could gain ₹3. Good tips have R:R of at least 1:2. Even with 50% accuracy, a 1:3 R:R is profitable overall.",
    example: "Entry: ₹2,420, SL: ₹2,350 (risk ₹70), TGT: ₹2,630 (reward ₹210). R:R = 70:210 = 1:3. Excellent.",
    category: "risk",
    difficulty: "beginner",
    relatedTerms: ["stop-loss", "target-price", "position-sizing"],
  },
  {
    id: "swing-trade",
    term: "Swing Trade",
    shortDefinition: "A trade held for 2-14 days. Good for people with day jobs.",
    fullDefinition: "Swing trading means buying a stock and holding it for a few days to two weeks, capturing a 'swing' in price. Unlike intraday trading, you don't need to watch the screen all day. Swing trades are generally recommended for beginners who can't monitor markets full-time.",
    category: "trading",
    difficulty: "beginner",
    relatedTerms: ["intraday", "positional", "timeframe"],
  },
  {
    id: "intraday",
    term: "Intraday",
    shortDefinition: "A trade opened and closed on the same day. Requires full-time attention.",
    fullDefinition: "Intraday trading means buying and selling within the same trading session (9:15 AM - 3:30 PM). If you don't sell by market close, your broker may auto-square off your position. Intraday requires constant monitoring and fast decision-making — NOT recommended for beginners.",
    category: "trading",
    difficulty: "beginner",
    relatedTerms: ["swing-trade", "positional", "btst"],
  },
  {
    id: "positional",
    term: "Positional Trade",
    shortDefinition: "A trade held for 2 weeks to 3 months. Requires patience, less monitoring.",
    fullDefinition: "Positional trading captures larger market moves over weeks or months. It requires less daily attention than swing trading but more capital patience. Good for those who believe in a stock's medium-term direction.",
    category: "trading",
    difficulty: "beginner",
    relatedTerms: ["swing-trade", "long-term"],
  },
  {
    id: "cmp",
    term: "CMP (Current Market Price)",
    shortDefinition: "The price the stock is trading at right now.",
    fullDefinition: "When a tip says 'Buy at CMP', it means buy at whatever the stock is currently priced at — don't wait for a specific entry level. This is common for tips with strong conviction where the analyst believes any current price is a good entry.",
    category: "trading",
    difficulty: "beginner",
    relatedTerms: ["entry-price", "limit-order", "market-order"],
  },
  {
    id: "nifty-50",
    term: "NIFTY 50",
    shortDefinition: "India's main stock market index — tracks the 50 largest companies on NSE.",
    fullDefinition: "NIFTY 50 is to Indian stocks what the S&P 500 is to US stocks. It represents the overall market direction. When someone says 'the market is up', they usually mean NIFTY 50 went up. It's a good benchmark — if your returns beat NIFTY, you're outperforming the market.",
    category: "market",
    difficulty: "beginner",
    relatedTerms: ["sensex", "bank-nifty", "index"],
  },
  {
    id: "india-vix",
    term: "India VIX (Volatility Index)",
    shortDefinition: "The 'fear gauge' — higher VIX means more market uncertainty and risk.",
    fullDefinition: "India VIX measures expected volatility in the next 30 days. VIX below 15 = calm market (good for trading). VIX 15-20 = moderate uncertainty. VIX above 20 = high fear (risky for new traders). During market crashes, VIX can spike above 30-40.",
    example: "If VIX is at 22, the market expects ±22% annualized swings. For a beginner, this means wider stop losses and smaller position sizes.",
    category: "market",
    difficulty: "intermediate",
    relatedTerms: ["nifty-50", "market-mood"],
  },
  {
    id: "accuracy-rate",
    term: "Accuracy Rate",
    shortDefinition: "Percentage of a creator's tips that hit their target price.",
    fullDefinition: "Accuracy Rate = (Tips that hit target) ÷ (Total completed tips) × 100. A 70% accuracy means 7 out of 10 tips were profitable. However, accuracy alone doesn't tell the full story — a creator could have 90% accuracy with tiny profits and one huge loss that wipes everything out. That's why RateMyTip also considers risk-adjusted returns.",
    category: "platform",
    difficulty: "beginner",
    relatedTerms: ["rmt-score", "risk-reward-ratio"],
  },
  {
    id: "conviction",
    term: "Conviction Level",
    shortDefinition: "How confident the creator is in their tip — LOW, MEDIUM, or HIGH.",
    fullDefinition: "Conviction is the creator's self-assessed confidence. HIGH conviction means they're very sure about the trade. However, this is subjective and unverified — a creator's conviction doesn't guarantee the tip will succeed. Always use your own judgement and proper risk management regardless of conviction level.",
    category: "trading",
    difficulty: "beginner",
    relatedTerms: ["rmt-score", "risk-level"],
  },
  // ... 50+ more terms covering: market cap, large/mid/small cap, sector,
  // beta, volume, delivery %, breakout, breakdown, support, resistance,
  // dividend, PE ratio, EPS, book value, FII/DII, circuit limits,
  // upper/lower circuit, T+1 settlement, demat account, etc.
] as const;

// Index by ID for quick lookup
export const GLOSSARY_MAP = new Map(
  GLOSSARY_TERMS.map(term => [term.id, term])
);

// Index by keyword for pattern matching in text
export const KEYWORD_TO_TERM_ID: Record<string, string> = {
  "entry price": "entry-price",
  "entry": "entry-price",
  "stop loss": "stop-loss",
  "stoploss": "stop-loss",
  "sl": "stop-loss",
  "target": "target-price",
  "tgt": "target-price",
  "rmt score": "rmt-score",
  "rmt": "rmt-score",
  "risk reward": "risk-reward-ratio",
  "r:r": "risk-reward-ratio",
  "swing": "swing-trade",
  "intraday": "intraday",
  "positional": "positional",
  "cmp": "cmp",
  "nifty": "nifty-50",
  "vix": "india-vix",
  "accuracy": "accuracy-rate",
  "conviction": "conviction",
  // ... more keyword mappings
};
```

### Step 2: Contextual Explanation Generator

```typescript
// src/lib/glossary/context-builder.ts

import type { Tip } from "@prisma/client";

interface ContextualExplanation {
  readonly term: string;
  readonly explanation: string;  // With actual numbers from the tip
}

export function buildContextualExplanations(tip: Tip): ContextualExplanation[] {
  const explanations: ContextualExplanation[] = [];
  const slDistance = Math.abs(tip.entryPrice - tip.stopLoss);
  const slPct = (slDistance / tip.entryPrice * 100).toFixed(1);
  const targetDistance = Math.abs(tip.target1 - tip.entryPrice);
  const targetPct = (targetDistance / tip.entryPrice * 100).toFixed(1);
  const riskRewardRatio = (targetDistance / slDistance).toFixed(1);

  explanations.push({
    term: "Stop Loss",
    explanation: `Your stop loss is ₹${slDistance.toFixed(0)} below entry (${slPct}%). If you buy 10 shares, your maximum loss would be ₹${(slDistance * 10).toFixed(0)}.`,
  });

  explanations.push({
    term: "Target 1",
    explanation: `If the stock hits Target 1 at ₹${tip.target1}, you'd gain ₹${targetDistance.toFixed(0)} per share (${targetPct}%). With 10 shares, that's ₹${(targetDistance * 10).toFixed(0)} profit.`,
  });

  explanations.push({
    term: "Risk-Reward",
    explanation: `You risk ₹${slDistance.toFixed(0)} to potentially gain ₹${targetDistance.toFixed(0)}. That's a 1:${riskRewardRatio} risk-reward ratio. ${
      parseFloat(riskRewardRatio) >= 2 ? "This is a favorable ratio." : "This ratio is below 1:2 — proceed with caution."
    }`,
  });

  return explanations;
}
```

### Step 3: React Component — GlossaryTooltip

```typescript
// src/components/beginner/glossary-tooltip.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { GLOSSARY_MAP } from "@/lib/glossary/terms";

interface GlossaryTooltipProps {
  readonly termId: string;
  readonly children: React.ReactNode;
  readonly showInBeginnerModeOnly?: boolean;
}

export function GlossaryTooltip({
  termId,
  children,
  showInBeginnerModeOnly = false
}: GlossaryTooltipProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const term = GLOSSARY_MAP.get(termId);
  const triggerRef = useRef<HTMLSpanElement>(null);

  if (!term) return <>{children}</>;

  return (
    <span className="relative inline-block" ref={triggerRef}>
      <span
        className="border-b border-dashed border-blue-400 cursor-help"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        tabIndex={0}
        role="button"
        aria-describedby={`glossary-${termId}`}
      >
        {children}
      </span>

      {isOpen && (
        <div
          id={`glossary-${termId}`}
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-80
                     bg-white dark:bg-gray-800 rounded-lg shadow-xl border
                     border-gray-200 dark:border-gray-700 p-4"
        >
          <div className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
            {term.term}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {term.shortDefinition}
          </div>
          {term.example && (
            <div className="mt-2 text-xs text-blue-600 dark:text-blue-400
                            bg-blue-50 dark:bg-blue-900/20 rounded p-2">
              {term.example}
            </div>
          )}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2
                          w-3 h-3 bg-white dark:bg-gray-800 border-r border-b
                          border-gray-200 dark:border-gray-700 rotate-45" />
        </div>
      )}
    </span>
  );
}
```

### Step 4: Integration — Wrap Existing Tip Card

Modify the existing `src/components/tip/tip-card.tsx` to include glossary tooltips:

```typescript
// In existing tip-card.tsx, wrap terms like this:

// BEFORE:
// <span>Entry Price: ₹{tip.entryPrice}</span>

// AFTER:
// <span><GlossaryTooltip termId="entry-price">Entry Price</GlossaryTooltip>: ₹{tip.entryPrice}</span>
```

### Step 5: API Route

```typescript
// src/app/api/v1/glossary/route.ts
import { NextResponse } from "next/server";
import { GLOSSARY_TERMS } from "@/lib/glossary/terms";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const difficulty = searchParams.get("difficulty");

  let terms = [...GLOSSARY_TERMS];

  if (category) {
    terms = terms.filter(t => t.category === category);
  }
  if (difficulty) {
    terms = terms.filter(t => t.difficulty === difficulty);
  }

  return NextResponse.json({
    success: true,
    data: terms,
    meta: { total: terms.length },
  });
}
```

### Build Steps:
1. Create `src/lib/glossary/terms.ts` with 50+ term definitions
2. Create `src/lib/glossary/context-builder.ts`
3. Create `src/components/beginner/glossary-tooltip.tsx`
4. Integrate tooltips into existing `tip-card.tsx`, `leaderboard-row.tsx`, `creator-header.tsx`
5. Create `/api/v1/glossary` endpoint for full glossary page
6. Add glossary page at `/learn/glossary`
7. Test tooltips render correctly on mobile (tap-to-open instead of hover)

---

## FEATURE 1.2: HOW TO FOLLOW THIS TIP GUIDE

### Step 1: Broker Configuration Data

```typescript
// src/lib/constants.ts — Add broker configurations

export const BROKERS = {
  ZERODHA: {
    name: "Zerodha (Kite)",
    slug: "zerodha",
    orderTypes: ["Market", "Limit", "SL", "SL-M"],
    deliveryCharge: 0,       // Free delivery
    intradayCharge: 20,      // Per executed order
    sttBuyDelivery: 0.001,   // 0.1% of buy value
    sttSellDelivery: 0.001,  // 0.1% of sell value
    sttIntraday: 0.00025,    // 0.025% of sell value
    gst: 0.18,               // 18% on brokerage + transaction charges
    sebiCharges: 0.000001,   // Rs 10 per crore
    stampDuty: 0.00015,      // 0.015% on buy side
    exchangeTxn: 0.0000345,  // NSE transaction charges
    steps: {
      buy: [
        "Open Kite app → Search for {STOCK}",
        "Tap on the stock → Click 'B' (Buy) button",
        "Select 'Limit' order type → Enter price: ₹{ENTRY_PRICE}",
        "Enter quantity: {QUANTITY} shares",
        "Select 'CNC' (delivery) for swing/positional, 'MIS' for intraday",
        "Review and swipe to confirm",
      ],
      setSL: [
        "After your buy order is executed, go to 'Positions'",
        "Tap on your {STOCK} position → Click 'Exit'",
        "Select 'SL' (Stop Loss) order type",
        "Set Trigger Price: ₹{STOP_LOSS}",
        "Set Limit Price: ₹{STOP_LOSS - 2} (slightly below trigger for execution)",
        "Swipe to place SL order",
      ],
      setTarget: [
        "Go to 'Orders' → 'GTT' (Good Till Triggered)",
        "Select {STOCK} → Set trigger at ₹{TARGET_1}",
        "This will auto-sell your shares when target is hit",
      ],
    },
  },
  GROWW: {
    name: "Groww",
    slug: "groww",
    orderTypes: ["Market", "Limit"],
    deliveryCharge: 20,
    intradayCharge: 20,
    // ... similar structure
    steps: { /* groww-specific steps */ },
  },
  ANGEL_ONE: {
    name: "Angel One",
    slug: "angel-one",
    // ... similar structure
    steps: { /* angel-one-specific steps */ },
  },
  UPSTOX: {
    name: "Upstox",
    slug: "upstox",
    // ... similar structure
    steps: { /* upstox-specific steps */ },
  },
  ICICI_DIRECT: {
    name: "ICICI Direct",
    slug: "icici-direct",
    // ... similar structure
    steps: { /* icici-direct-specific steps */ },
  },
} as const;
```

### Step 2: Execution Guide Component

```typescript
// src/components/beginner/execution-guide.tsx
"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { BROKERS } from "@/lib/constants";
import type { Tip, Stock } from "@prisma/client";

interface ExecutionGuideProps {
  readonly tip: Tip & { stock: Stock };
  readonly preferredBroker?: string;
}

export function ExecutionGuide({ tip, preferredBroker }: ExecutionGuideProps): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState(preferredBroker ?? "zerodha");
  const broker = BROKERS[selectedBroker.toUpperCase() as keyof typeof BROKERS] ?? BROKERS.ZERODHA;

  // Interpolate tip values into step templates
  const interpolateStep = (template: string): string => {
    return template
      .replace("{STOCK}", tip.stock.symbol)
      .replace("{ENTRY_PRICE}", tip.entryPrice.toFixed(2))
      .replace("{STOP_LOSS}", tip.stopLoss.toFixed(2))
      .replace("{STOP_LOSS - 2}", (tip.stopLoss - 2).toFixed(2))
      .replace("{TARGET_1}", tip.target1.toFixed(2))
      .replace("{QUANTITY}", "calculated from position sizer");
  };

  return (
    <div className="border border-blue-200 rounded-lg mt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-blue-700
                   hover:bg-blue-50 transition-colors"
      >
        <span className="font-medium text-sm">
          How to Execute This Tip (Step-by-Step)
        </span>
        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Broker selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Your broker:</span>
            <select
              value={selectedBroker}
              onChange={(e) => setSelectedBroker(e.target.value)}
              className="text-sm border rounded px-2 py-1"
            >
              {Object.entries(BROKERS).map(([key, b]) => (
                <option key={key} value={key.toLowerCase()}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Step 1: Calculate position */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Step 1: Calculate Your Position Size</h4>
            <p className="text-sm text-gray-600">
              Use the Position Size Calculator above to determine how many shares to buy
              based on your capital and risk tolerance.
            </p>
          </div>

          {/* Step 2: Place buy order */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Step 2: Place Buy Order on {broker.name}</h4>
            <ol className="list-decimal list-inside space-y-1">
              {broker.steps.buy.map((step, i) => (
                <li key={i} className="text-sm text-gray-700">{interpolateStep(step)}</li>
              ))}
            </ol>
          </div>

          {/* Step 3: Set stop loss */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-red-700">
              Step 3: Set Stop Loss IMMEDIATELY
            </h4>
            <ol className="list-decimal list-inside space-y-1">
              {broker.steps.setSL.map((step, i) => (
                <li key={i} className="text-sm text-gray-700">{interpolateStep(step)}</li>
              ))}
            </ol>
          </div>

          {/* Step 4: Set target */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-green-700">
              Step 4: Set Target Exit (Optional)
            </h4>
            <ol className="list-decimal list-inside space-y-1">
              {broker.steps.setTarget.map((step, i) => (
                <li key={i} className="text-sm text-gray-700">{interpolateStep(step)}</li>
              ))}
            </ol>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 flex items-start gap-2">
            <AlertTriangle className="text-yellow-600 mt-0.5 flex-shrink-0" size={16} />
            <p className="text-xs text-yellow-800">
              Never invest more than you can afford to lose. RateMyTip provides information
              only — not financial advice. Always do your own research.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Build Steps:
1. Add broker configuration data to `src/lib/constants.ts`
2. Create `src/components/beginner/execution-guide.tsx`
3. Integrate into existing `tip-detail.tsx` and `tip-card.tsx` (expanded view)
4. Store user's preferred broker in User model (persisted via cookie for non-logged-in users)
5. Test with each broker's step templates

---

## FEATURE 2.1: POSITION SIZE CALCULATOR

### Step 1: Core Calculation Logic

```typescript
// src/lib/risk/position-sizer.ts

export interface PositionSizeInput {
  readonly totalCapital: number;         // User's total trading capital
  readonly riskPercentage: number;       // % of capital to risk per trade (default 2%)
  readonly entryPrice: number;           // Tip entry price
  readonly stopLoss: number;             // Tip stop loss price
  readonly direction: "BUY" | "SELL";    // Tip direction
}

export interface PositionSizeResult {
  readonly maxShares: number;            // Maximum shares to buy
  readonly investmentAmount: number;     // Total capital deployed
  readonly capitalUsedPct: number;       // % of total capital used
  readonly maxLoss: number;              // Maximum loss in rupees
  readonly maxLossPct: number;           // Maximum loss as % of capital
  readonly riskPerShare: number;         // Loss per share if SL hit
  readonly riskPerSharePct: number;      // Loss per share as % of entry
  readonly warnings: string[];           // Risk warnings
}

export function calculatePositionSize(input: PositionSizeInput): PositionSizeResult {
  const { totalCapital, riskPercentage, entryPrice, stopLoss, direction } = input;

  // Calculate risk per share
  const riskPerShare = direction === "BUY"
    ? entryPrice - stopLoss
    : stopLoss - entryPrice;

  if (riskPerShare <= 0) {
    return {
      maxShares: 0,
      investmentAmount: 0,
      capitalUsedPct: 0,
      maxLoss: 0,
      maxLossPct: 0,
      riskPerShare: 0,
      riskPerSharePct: 0,
      warnings: ["Invalid stop loss — it must be below entry for BUY tips and above entry for SELL tips."],
    };
  }

  // Maximum rupees to risk
  const maxRiskAmount = totalCapital * (riskPercentage / 100);

  // Maximum shares based on risk
  const maxSharesByRisk = Math.floor(maxRiskAmount / riskPerShare);

  // Maximum shares based on capital (can't invest more than you have)
  const maxSharesByCapital = Math.floor(totalCapital / entryPrice);

  // Take the lower of the two
  const maxShares = Math.min(maxSharesByRisk, maxSharesByCapital);

  const investmentAmount = maxShares * entryPrice;
  const capitalUsedPct = (investmentAmount / totalCapital) * 100;
  const maxLoss = maxShares * riskPerShare;
  const maxLossPct = (maxLoss / totalCapital) * 100;
  const riskPerSharePct = (riskPerShare / entryPrice) * 100;

  // Generate warnings
  const warnings: string[] = [];

  if (capitalUsedPct > 50) {
    warnings.push(`This trade uses ${capitalUsedPct.toFixed(0)}% of your capital. Consider a smaller position — experts recommend max 20-25% per trade.`);
  }
  if (capitalUsedPct > 20 && capitalUsedPct <= 50) {
    warnings.push(`This trade uses ${capitalUsedPct.toFixed(0)}% of your capital. This is on the higher side for a single position.`);
  }
  if (riskPerSharePct > 5) {
    warnings.push(`The stop loss is ${riskPerSharePct.toFixed(1)}% from entry — wider than typical. This stock may be more volatile.`);
  }
  if (maxShares === 0) {
    warnings.push("Your capital is insufficient for even 1 share at the 2% risk rule. Consider increasing capital or skipping this trade.");
  }
  if (maxShares < 5) {
    warnings.push(`You can only afford ${maxShares} shares. Transaction costs may eat a significant portion of any profits.`);
  }

  return {
    maxShares,
    investmentAmount,
    capitalUsedPct,
    maxLoss,
    maxLossPct,
    riskPerShare,
    riskPerSharePct,
    warnings,
  };
}
```

### Step 2: React Component

```typescript
// src/components/beginner/position-calculator.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { Calculator, AlertTriangle, Info } from "lucide-react";
import { calculatePositionSize } from "@/lib/risk/position-sizer";
import type { Tip } from "@prisma/client";

interface PositionCalculatorProps {
  readonly tip: Tip;
  readonly initialCapital?: number;
  readonly initialRiskPct?: number;
}

export function PositionCalculator({
  tip,
  initialCapital,
  initialRiskPct = 2
}: PositionCalculatorProps): React.ReactElement {
  // Persist capital in localStorage
  const [capital, setCapital] = useState<number>(initialCapital ?? 0);
  const [riskPct, setRiskPct] = useState<number>(initialRiskPct);

  useEffect(() => {
    const saved = localStorage.getItem("rmt_user_capital");
    if (saved && !initialCapital) setCapital(parseFloat(saved));
    const savedRisk = localStorage.getItem("rmt_user_risk_pct");
    if (savedRisk) setRiskPct(parseFloat(savedRisk));
  }, [initialCapital]);

  useEffect(() => {
    if (capital > 0) localStorage.setItem("rmt_user_capital", capital.toString());
    localStorage.setItem("rmt_user_risk_pct", riskPct.toString());
  }, [capital, riskPct]);

  const result = useMemo(() => {
    if (capital <= 0) return null;
    return calculatePositionSize({
      totalCapital: capital,
      riskPercentage: riskPct,
      entryPrice: tip.entryPrice,
      stopLoss: tip.stopLoss,
      direction: tip.direction,
    });
  }, [capital, riskPct, tip.entryPrice, tip.stopLoss, tip.direction]);

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2 text-gray-800 font-semibold text-sm">
        <Calculator size={16} />
        Position Size Calculator
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Your Total Capital (₹)</label>
          <input
            type="number"
            value={capital || ""}
            onChange={(e) => setCapital(parseFloat(e.target.value) || 0)}
            placeholder="e.g., 50000"
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">
            Risk Per Trade (%)
            <span className="ml-1 text-blue-500 cursor-help" title="Most experts recommend 1-2% risk per trade">
              <Info size={12} className="inline" />
            </span>
          </label>
          <input
            type="number"
            value={riskPct}
            onChange={(e) => setRiskPct(parseFloat(e.target.value) || 2)}
            min={0.5}
            max={10}
            step={0.5}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
      </div>

      {result && (
        <div className="space-y-3 pt-2 border-t border-gray-200">
          {/* Main recommendation */}
          <div className="bg-white rounded p-3 border">
            <div className="text-lg font-bold text-gray-900">
              Buy {result.maxShares} shares
            </div>
            <div className="text-sm text-gray-600">
              Investment: ₹{result.investmentAmount.toLocaleString("en-IN")}
              ({result.capitalUsedPct.toFixed(1)}% of your capital)
            </div>
          </div>

          {/* Risk breakdown */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-red-50 rounded p-2">
              <div className="text-xs text-red-600">Maximum Loss</div>
              <div className="font-semibold text-red-800">
                ₹{result.maxLoss.toLocaleString("en-IN")} ({result.maxLossPct.toFixed(1)}%)
              </div>
            </div>
            <div className="bg-green-50 rounded p-2">
              <div className="text-xs text-green-600">Potential Gain (T1)</div>
              <div className="font-semibold text-green-800">
                ₹{(result.maxShares * Math.abs(tip.target1 - tip.entryPrice)).toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          {/* Capital allocation pie visualization */}
          <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                result.capitalUsedPct > 50 ? "bg-red-500" :
                result.capitalUsedPct > 25 ? "bg-yellow-500" : "bg-green-500"
              }`}
              style={{ width: `${Math.min(result.capitalUsedPct, 100)}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 text-center">
            Capital allocation: {result.capitalUsedPct.toFixed(1)}% used
          </div>

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="space-y-1">
              {result.warnings.map((warning, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-yellow-800 bg-yellow-50 rounded p-2">
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5 text-yellow-600" />
                  {warning}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### Step 3: API Route

```typescript
// src/app/api/v1/risk/position-size/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { calculatePositionSize } from "@/lib/risk/position-sizer";

const schema = z.object({
  totalCapital: z.number().positive(),
  riskPercentage: z.number().min(0.1).max(100),
  entryPrice: z.number().positive(),
  stopLoss: z.number().positive(),
  direction: z.enum(["BUY", "SELL"]),
});

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.message } },
      { status: 400 }
    );
  }

  const result = calculatePositionSize(parsed.data);
  return NextResponse.json({ success: true, data: result });
}
```

### Build Steps:
1. Create `src/lib/risk/position-sizer.ts` with pure calculation function
2. Write unit tests for edge cases (0 capital, SL above entry for BUY, etc.)
3. Create `src/components/beginner/position-calculator.tsx`
4. Integrate into `tip-card.tsx` and `tip-detail.tsx`
5. Create API route for server-side calculation
6. Persist capital in localStorage (no-auth) and user profile (auth)

---

## FEATURE 2.2: RISK LEVEL INDICATOR PER TIP

### Step 1: Risk Scoring Engine

```typescript
// src/lib/risk/risk-scorer.ts

import type { Tip, Stock, CreatorScore } from "@prisma/client";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";

export interface TipRiskAssessment {
  readonly riskLevel: RiskLevel;
  readonly riskScore: number;               // 0-100 (higher = riskier)
  readonly factors: RiskFactor[];
  readonly beginnerSuitable: boolean;
  readonly beginnerWarning?: string;
}

interface RiskFactor {
  readonly name: string;
  readonly score: number;                   // 0-100 contribution to risk
  readonly weight: number;                  // Weight in final calculation
  readonly explanation: string;             // Human-readable explanation
}

export function assessTipRisk(
  tip: Tip,
  stock: Stock,
  creatorScore: CreatorScore | null,
  currentVix?: number,
): TipRiskAssessment {
  const factors: RiskFactor[] = [];

  // Factor 1: Stop Loss Distance (weight: 25%)
  const slDistancePct = Math.abs(tip.entryPrice - tip.stopLoss) / tip.entryPrice * 100;
  const slRiskScore = Math.min(slDistancePct * 10, 100); // 10% SL distance = 100 risk
  factors.push({
    name: "Stop Loss Distance",
    score: slRiskScore,
    weight: 0.25,
    explanation: slDistancePct > 5
      ? `Wide SL (${slDistancePct.toFixed(1)}% from entry) — higher risk per trade`
      : `Tight SL (${slDistancePct.toFixed(1)}% from entry) — controlled risk`,
  });

  // Factor 2: Market Cap (weight: 20%)
  let marketCapRisk = 50; // default
  if (stock.marketCap === "LARGE") marketCapRisk = 20;
  else if (stock.marketCap === "MID") marketCapRisk = 50;
  else if (stock.marketCap === "SMALL") marketCapRisk = 80;
  else if (stock.marketCap === "MICRO") marketCapRisk = 95;
  if (stock.isIndex) marketCapRisk = 10;
  factors.push({
    name: "Stock Size",
    score: marketCapRisk,
    weight: 0.20,
    explanation: stock.marketCap === "LARGE" || stock.isIndex
      ? "Large cap / Index — generally more stable"
      : stock.marketCap === "SMALL" || stock.marketCap === "MICRO"
        ? "Small/micro cap — can be very volatile, harder to exit"
        : "Mid cap — moderate volatility",
  });

  // Factor 3: Timeframe (weight: 20%)
  let timeframeRisk = 50;
  if (tip.timeframe === "INTRADAY") timeframeRisk = 90;
  else if (tip.timeframe === "SWING") timeframeRisk = 40;
  else if (tip.timeframe === "POSITIONAL") timeframeRisk = 30;
  else if (tip.timeframe === "LONG_TERM") timeframeRisk = 20;
  factors.push({
    name: "Timeframe",
    score: timeframeRisk,
    weight: 0.20,
    explanation: tip.timeframe === "INTRADAY"
      ? "Intraday — requires full-time monitoring and quick decisions"
      : tip.timeframe === "SWING"
        ? "Swing (2-14 days) — manageable for part-time traders"
        : "Positional/Long-term — lower monitoring requirement",
  });

  // Factor 4: Creator Track Record (weight: 20%)
  let creatorRisk = 60; // default for unknown creators
  if (creatorScore) {
    // Invert accuracy — higher accuracy = lower risk
    creatorRisk = Math.max(0, 100 - creatorScore.accuracyScore);
  }
  factors.push({
    name: "Creator Track Record",
    score: creatorRisk,
    weight: 0.20,
    explanation: creatorScore
      ? creatorScore.accuracyRate > 0.7
        ? `Creator has ${(creatorScore.accuracyRate * 100).toFixed(0)}% accuracy — strong track record`
        : `Creator has ${(creatorScore.accuracyRate * 100).toFixed(0)}% accuracy — moderate track record`
      : "Creator is unrated — limited track record available",
  });

  // Factor 5: Market Volatility / VIX (weight: 15%)
  let vixRisk = 40; // default
  if (currentVix !== undefined) {
    if (currentVix < 15) vixRisk = 15;
    else if (currentVix < 20) vixRisk = 40;
    else if (currentVix < 25) vixRisk = 65;
    else vixRisk = 90;
  }
  factors.push({
    name: "Market Volatility",
    score: vixRisk,
    weight: 0.15,
    explanation: currentVix !== undefined
      ? currentVix < 15
        ? `VIX at ${currentVix.toFixed(1)} — calm market conditions`
        : currentVix > 20
          ? `VIX at ${currentVix.toFixed(1)} — elevated fear, markets are volatile`
          : `VIX at ${currentVix.toFixed(1)} — moderate volatility`
      : "Market volatility data unavailable",
  });

  // Calculate composite risk score
  const compositeRisk = factors.reduce(
    (sum, f) => sum + f.score * f.weight, 0
  );

  // Map to risk level
  let riskLevel: RiskLevel;
  if (compositeRisk < 30) riskLevel = "LOW";
  else if (compositeRisk < 50) riskLevel = "MEDIUM";
  else if (compositeRisk < 70) riskLevel = "HIGH";
  else riskLevel = "VERY_HIGH";

  // Beginner suitability
  const beginnerSuitable = riskLevel === "LOW" || riskLevel === "MEDIUM";

  let beginnerWarning: string | undefined;
  if (!beginnerSuitable) {
    const highRiskFactors = factors
      .filter(f => f.score > 60)
      .map(f => f.name.toLowerCase())
      .join(", ");
    beginnerWarning = `This tip has elevated risk due to: ${highRiskFactors}. Consider gaining more experience before following high-risk tips.`;
  }

  return {
    riskLevel,
    riskScore: Math.round(compositeRisk),
    factors,
    beginnerSuitable,
    beginnerWarning,
  };
}
```

### Step 2: Risk Badge Component

```typescript
// src/components/beginner/risk-badge.tsx

import { Shield, ShieldAlert, ShieldX, ShieldCheck } from "lucide-react";
import type { RiskLevel } from "@/lib/risk/risk-scorer";

const RISK_CONFIG: Record<RiskLevel, {
  label: string;
  color: string;
  bgColor: string;
  icon: typeof Shield;
}> = {
  LOW: { label: "Low Risk", color: "text-green-700", bgColor: "bg-green-100", icon: ShieldCheck },
  MEDIUM: { label: "Medium Risk", color: "text-yellow-700", bgColor: "bg-yellow-100", icon: Shield },
  HIGH: { label: "High Risk", color: "text-orange-700", bgColor: "bg-orange-100", icon: ShieldAlert },
  VERY_HIGH: { label: "Very High Risk", color: "text-red-700", bgColor: "bg-red-100", icon: ShieldX },
};

interface RiskBadgeProps {
  readonly riskLevel: RiskLevel;
  readonly compact?: boolean;
}

export function RiskBadge({ riskLevel, compact = false }: RiskBadgeProps): React.ReactElement {
  const config = RISK_CONFIG[riskLevel];
  const Icon = config.icon;

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bgColor}`}>
      <Icon size={16} className={config.color} />
      <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
    </div>
  );
}
```

### Step 3: Compute and Cache Risk Scores

```typescript
// In the tip-status-worker.ts or a new risk-assessment-worker.ts:
// When a tip status changes or is first approved,
// compute the risk assessment and store it in Redis cache.

// Cache key: "tip-risk:{tipId}" → TTL: 3600s (1 hour)
// Recompute when VIX changes significantly (>2 points)
```

### Build Steps:
1. Create `src/lib/risk/risk-scorer.ts`
2. Write unit tests for each risk factor and composite
3. Create `src/components/beginner/risk-badge.tsx`
4. Create `src/components/beginner/risk-explainer.tsx` (expandable detail panel)
5. Add risk badge to `tip-card.tsx` and `leaderboard-row.tsx`
6. Create API route `GET /api/v1/risk/tip-risk/:tipId`
7. Add "Beginner-friendly only" filter toggle to leaderboard (filters riskLevel to LOW/MEDIUM)
8. Cache risk assessments in Redis

---

## FEATURE 2.3: MAXIMUM DRAWDOWN DISPLAY

### Step 1: Drawdown Calculation

```typescript
// src/lib/risk/drawdown.ts

import type { Tip } from "@prisma/client";

export interface DrawdownResult {
  readonly maxDrawdownPct: number;           // Worst peak-to-trough percentage
  readonly maxDrawdownAmount: number;         // In rupees (based on 1L starting capital)
  readonly maxDrawdownStartDate: Date;
  readonly maxDrawdownEndDate: Date;
  readonly maxDrawdownRecoveryDate: Date | null; // null if not recovered yet
  readonly longestLosingStreak: number;       // Consecutive losing tips
  readonly longestLosingStreakDates: { start: Date; end: Date };
  readonly equityCurve: EquityPoint[];        // For charting
  readonly worstCaseScenario: string;         // Human-readable worst case
}

interface EquityPoint {
  readonly date: Date;
  readonly tipId: string;
  readonly cumulativeReturn: number;          // As percentage
  readonly portfolioValue: number;            // Based on 1L starting
  readonly isWin: boolean;
  readonly returnPct: number;                 // Individual tip return
}

export function calculateDrawdown(
  completedTips: Tip[],
  startingCapital: number = 100000,         // Default: Rs 1,00,000
): DrawdownResult {
  // Sort tips by closed date
  const sorted = [...completedTips]
    .filter(t => t.closedAt !== null && t.returnPct !== null)
    .sort((a, b) => a.closedAt!.getTime() - b.closedAt!.getTime());

  if (sorted.length === 0) {
    return {
      maxDrawdownPct: 0,
      maxDrawdownAmount: 0,
      maxDrawdownStartDate: new Date(),
      maxDrawdownEndDate: new Date(),
      maxDrawdownRecoveryDate: null,
      longestLosingStreak: 0,
      longestLosingStreakDates: { start: new Date(), end: new Date() },
      equityCurve: [],
      worstCaseScenario: "No completed tips to analyze.",
    };
  }

  let portfolioValue = startingCapital;
  let peak = startingCapital;
  let maxDrawdownPct = 0;
  let maxDrawdownAmount = 0;
  let drawdownStartDate = sorted[0]!.closedAt!;
  let drawdownEndDate = sorted[0]!.closedAt!;
  let currentDrawdownStart = sorted[0]!.closedAt!;
  let recoveryDate: Date | null = null;

  // Losing streak tracking
  let currentStreak = 0;
  let longestStreak = 0;
  let streakStart = sorted[0]!.closedAt!;
  let longestStreakStart = sorted[0]!.closedAt!;
  let longestStreakEnd = sorted[0]!.closedAt!;

  const equityCurve: EquityPoint[] = [];

  for (const tip of sorted) {
    const returnPct = tip.returnPct!;
    // Assume equal capital per tip (simplified)
    const positionSize = startingCapital * 0.1; // 10% per position
    const tipPnl = positionSize * (returnPct / 100);
    portfolioValue += tipPnl;

    const isWin = returnPct > 0;

    equityCurve.push({
      date: tip.closedAt!,
      tipId: tip.id,
      cumulativeReturn: ((portfolioValue - startingCapital) / startingCapital) * 100,
      portfolioValue,
      isWin,
      returnPct,
    });

    // Track peak and drawdown
    if (portfolioValue > peak) {
      peak = portfolioValue;
      currentDrawdownStart = tip.closedAt!;
      recoveryDate = tip.closedAt!;
    }

    const currentDrawdownPct = ((peak - portfolioValue) / peak) * 100;
    const currentDrawdownAmt = peak - portfolioValue;

    if (currentDrawdownPct > maxDrawdownPct) {
      maxDrawdownPct = currentDrawdownPct;
      maxDrawdownAmount = currentDrawdownAmt;
      drawdownStartDate = currentDrawdownStart;
      drawdownEndDate = tip.closedAt!;
      recoveryDate = null; // Not recovered yet at this point
    }

    // Track losing streaks
    if (!isWin) {
      if (currentStreak === 0) streakStart = tip.closedAt!;
      currentStreak++;
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
        longestStreakStart = streakStart;
        longestStreakEnd = tip.closedAt!;
      }
    } else {
      currentStreak = 0;
    }
  }

  const worstCaseScenario = `If you started following this creator at their worst possible moment with ₹${startingCapital.toLocaleString("en-IN")}, your portfolio would have dropped to ₹${Math.round(startingCapital * (1 - maxDrawdownPct / 100)).toLocaleString("en-IN")} (a ${maxDrawdownPct.toFixed(1)}% decline) over ${longestStreak} consecutive losing tips.`;

  return {
    maxDrawdownPct,
    maxDrawdownAmount,
    maxDrawdownStartDate: drawdownStartDate,
    maxDrawdownEndDate: drawdownEndDate,
    maxDrawdownRecoveryDate: recoveryDate,
    longestLosingStreak: longestStreak,
    longestLosingStreakDates: { start: longestStreakStart, end: longestStreakEnd },
    equityCurve,
    worstCaseScenario,
  };
}
```

### Step 2: Add to Creator Score Worker

In the existing `score-worker.ts`, after computing the RMT Score, also run `calculateDrawdown()` for each creator and store the results. Add fields to `CreatorScore`:

```prisma
// Add to CreatorScore model:
  maxDrawdownPct      Float?   @map("max_drawdown_pct")
  longestLosingStreak Int      @default(0) @map("longest_losing_streak")
  equityCurveData     Json?    @map("equity_curve_data")  // Stored as JSON for charting
```

### Step 3: Drawdown Chart Component

```typescript
// src/components/analytics/drawdown-chart.tsx
// Use Recharts AreaChart with the equity curve data
// Highlight drawdown periods in red shading
// Show peak-to-trough annotations
```

### Build Steps:
1. Create `src/lib/risk/drawdown.ts`
2. Write unit tests with known tip sequences
3. Add drawdown fields to `CreatorScore` Prisma model
4. Update `score-worker.ts` to calculate and store drawdown
5. Create `drawdown-chart.tsx` component
6. Add drawdown section to creator profile page
7. Add "worst-case scenario" text to creator profile

---

## FEATURE 3.1: WHO SHOULD I FOLLOW QUIZ

### Database Schema

```prisma
model UserQuizAnswer {
  id              String   @id @default(cuid())
  userId          String   @map("user_id")
  questionId      String   @map("question_id")
  answer          String
  createdAt       DateTime @default(now()) @map("created_at")

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, questionId])
  @@map("user_quiz_answers")
}
```

### Quiz Engine

```typescript
// src/lib/recommendation/quiz-engine.ts

export interface QuizQuestion {
  readonly id: string;
  readonly question: string;
  readonly options: QuizOption[];
  readonly category: "capital" | "availability" | "risk" | "timeframe" | "sector" | "experience";
}

export interface QuizOption {
  readonly value: string;
  readonly label: string;
  readonly description?: string;
  readonly icon?: string;
}

export const QUIZ_QUESTIONS: readonly QuizQuestion[] = [
  {
    id: "capital",
    question: "How much capital are you starting with?",
    options: [
      { value: "under_25k", label: "Under ₹25,000", description: "Learning phase — focus on education over returns" },
      { value: "25k_1l", label: "₹25,000 - ₹1,00,000", description: "Enough for 2-3 positions with proper sizing" },
      { value: "1l_5l", label: "₹1,00,000 - ₹5,00,000", description: "Good capital for diversified trading" },
      { value: "above_5l", label: "Above ₹5,00,000", description: "Substantial capital — more flexibility" },
    ],
    category: "capital",
  },
  {
    id: "availability",
    question: "Can you watch the market during trading hours (9:15 AM - 3:30 PM)?",
    options: [
      { value: "full_time", label: "Yes, full time", description: "I can monitor markets all day" },
      { value: "partial", label: "Partially", description: "I can check a few times during the day" },
      { value: "no", label: "No, I have a job", description: "I can only check before/after work" },
    ],
    category: "availability",
  },
  {
    id: "risk_appetite",
    question: "How would you feel if a trade lost 5% in one day?",
    options: [
      { value: "panic", label: "I'd panic and sell immediately", description: "Conservative risk profile" },
      { value: "concerned", label: "Concerned, but I'd check if SL was hit", description: "Moderate risk profile" },
      { value: "okay", label: "Fine — it's part of trading", description: "Aggressive risk profile" },
      { value: "buy_more", label: "I'd consider buying more if thesis is intact", description: "Very aggressive" },
    ],
    category: "risk",
  },
  {
    id: "holding_period",
    question: "How long do you want to hold positions?",
    options: [
      { value: "same_day", label: "Same day (Intraday)", description: "Close all positions before market close" },
      { value: "few_days", label: "Few days (Swing)", description: "Hold for 2-14 days" },
      { value: "few_weeks", label: "Few weeks (Positional)", description: "Hold for 2-12 weeks" },
      { value: "months", label: "Months+ (Long term)", description: "Hold for months or years" },
    ],
    category: "timeframe",
  },
  {
    id: "sector_interest",
    question: "Which sectors interest you most?",
    options: [
      { value: "it", label: "IT & Technology", description: "TCS, Infosys, HCL Tech" },
      { value: "banking", label: "Banking & Finance", description: "HDFC Bank, ICICI, SBI" },
      { value: "pharma", label: "Pharma & Healthcare", description: "Sun Pharma, Dr Reddy's" },
      { value: "auto", label: "Auto & Manufacturing", description: "Tata Motors, M&M, Maruti" },
      { value: "energy", label: "Oil & Energy", description: "Reliance, ONGC, NTPC" },
      { value: "no_preference", label: "No preference", description: "Open to all sectors" },
    ],
    category: "sector",
  },
  {
    id: "experience",
    question: "How long have you been trading?",
    options: [
      { value: "never", label: "Never — this is my first time", description: "Welcome! We'll help you start safely" },
      { value: "under_6m", label: "Less than 6 months", description: "Still learning the basics" },
      { value: "6m_2y", label: "6 months to 2 years", description: "Some experience, building skills" },
      { value: "above_2y", label: "More than 2 years", description: "Experienced trader" },
    ],
    category: "experience",
  },
] as const;
```

### Creator Matching Algorithm

```typescript
// src/lib/recommendation/creator-matcher.ts

import { db } from "@/lib/db";
import type { QuizQuestion } from "./quiz-engine";

interface UserProfile {
  readonly capital: string;
  readonly availability: string;
  readonly riskAppetite: string;
  readonly holdingPeriod: string;
  readonly sectorInterest: string;
  readonly experience: string;
}

interface CreatorMatch {
  readonly creator: CreatorWithScore;
  readonly matchScore: number;        // 0-100 how well they match
  readonly matchReasons: string[];     // Why this creator is recommended
  readonly warnings: string[];         // Potential concerns
}

export async function matchCreators(profile: UserProfile): Promise<CreatorMatch[]> {
  // Build query filters based on profile
  const timeframeMap: Record<string, string[]> = {
    same_day: ["INTRADAY"],
    few_days: ["SWING"],
    few_weeks: ["POSITIONAL"],
    months: ["LONG_TERM", "POSITIONAL"],
  };

  const preferredTimeframes = timeframeMap[profile.holdingPeriod] ?? ["SWING", "POSITIONAL"];

  // Fetch creators with scores, filtering by relevant criteria
  const creators = await db.creator.findMany({
    where: {
      isActive: true,
      currentScore: { isNot: null },
      tier: { not: "UNRATED" },
    },
    include: {
      currentScore: true,
      tips: {
        where: {
          status: { notIn: ["PENDING_REVIEW", "REJECTED"] },
          timeframe: { in: preferredTimeframes as any },
        },
        select: { timeframe: true, assetClass: true },
        take: 100,
      },
    },
    orderBy: { currentScore: { rmtScore: "desc" } },
    take: 100,
  });

  // Score each creator against user profile
  const matches: CreatorMatch[] = creators.map(creator => {
    let matchScore = 0;
    const matchReasons: string[] = [];
    const warnings: string[] = [];

    // 1. Score by accuracy (higher is better for beginners)
    const accuracy = creator.currentScore?.accuracyRate ?? 0;
    if (accuracy > 0.7) {
      matchScore += 30;
      matchReasons.push(`High accuracy rate (${(accuracy * 100).toFixed(0)}%)`);
    } else if (accuracy > 0.5) {
      matchScore += 15;
    }

    // 2. Score by timeframe alignment
    const creatorTimeframes = new Set(creator.tips.map(t => t.timeframe));
    const hasPreferredTimeframe = preferredTimeframes.some(tf => creatorTimeframes.has(tf as any));
    if (hasPreferredTimeframe) {
      matchScore += 25;
      matchReasons.push(`Specializes in ${preferredTimeframes.join("/")} tips — matches your preferred holding period`);
    }

    // 3. Score by risk suitability
    if (profile.riskAppetite === "panic" || profile.experience === "never") {
      // Conservative beginners need consistent, low-risk creators
      const consistency = creator.currentScore?.consistencyScore ?? 0;
      if (consistency > 60) {
        matchScore += 20;
        matchReasons.push("Consistent performance — doesn't have wild swings");
      }
      if (creatorTimeframes.has("INTRADAY")) {
        warnings.push("This creator does some intraday tips — these require full-time attention and fast decisions");
      }
    }

    // 4. Score by availability match
    if (profile.availability === "no" && creatorTimeframes.has("INTRADAY")) {
      matchScore -= 20;
      warnings.push("This creator primarily gives intraday tips, which don't suit your availability");
    }
    if (profile.availability === "no" && (creatorTimeframes.has("SWING") || creatorTimeframes.has("POSITIONAL"))) {
      matchScore += 15;
      matchReasons.push("Swing/positional tips work well for people who can't watch markets all day");
    }

    // 5. Score by tip volume (more tips = more reliable statistics)
    if (creator.totalTips > 100) {
      matchScore += 10;
      matchReasons.push(`${creator.totalTips} tips tracked — statistically reliable`);
    }

    return {
      creator: creator as CreatorWithScore,
      matchScore: Math.max(0, Math.min(100, matchScore)),
      matchReasons,
      warnings,
    };
  });

  // Sort by match score, return top 10
  return matches
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10);
}
```

### Build Steps:
1. Create `src/lib/recommendation/quiz-engine.ts` with questions
2. Create `src/lib/recommendation/creator-matcher.ts`
3. Add `UserQuizAnswer` model to Prisma schema
4. Create `src/components/onboarding/quiz-wizard.tsx` (multi-step form)
5. Create page at `src/app/(public)/quiz/page.tsx`
6. Create API route `POST /api/v1/quiz` (submit answers + return matches)
7. Store quiz results for logged-in users; use localStorage for anonymous
8. Link from leaderboard page: "Not sure who to follow? Take our 2-minute quiz"

---

## FEATURE 3.4: MARKET CONTEXT WIDGET

### Step 1: Market Data Fetcher

```typescript
// src/lib/market-context/market-mood.ts

export interface MarketContext {
  readonly nifty50: {
    value: number;
    change: number;
    changePct: number;
    trend: "UPTREND" | "DOWNTREND" | "SIDEWAYS";
  };
  readonly indiaVix: {
    value: number;
    level: "LOW" | "MODERATE" | "HIGH" | "EXTREME";
    color: string;
  };
  readonly marketMood: "BULLISH" | "NEUTRAL" | "BEARISH" | "FEAR";
  readonly fiiDii: {
    fiiNetBuySell: number;      // Positive = net buy, Negative = net sell
    diiNetBuySell: number;
    fiiConsecutiveDays: number;  // Days of consecutive buying/selling
  };
  readonly advanceDecline: {
    advances: number;
    declines: number;
    unchanged: number;
    ratio: number;              // Advances / Declines
  };
  readonly isMarketOpen: boolean;
  readonly lastUpdated: Date;
  readonly beginnerAdvice: string;    // Context-appropriate advice
}

export function classifyMarketMood(vix: number, niftyChangePct: number, adRatio: number): MarketContext["marketMood"] {
  if (vix > 25) return "FEAR";
  if (vix > 20 && niftyChangePct < -1) return "BEARISH";
  if (adRatio > 1.5 && niftyChangePct > 0.5) return "BULLISH";
  return "NEUTRAL";
}

export function generateBeginnerAdvice(context: MarketContext): string {
  if (context.indiaVix.level === "EXTREME") {
    return "The market is experiencing extreme volatility (VIX > 25). This is NOT a good time for beginners to take new positions. Wait for conditions to calm down.";
  }
  if (context.indiaVix.level === "HIGH") {
    return "Market volatility is elevated. If you're new, consider reducing your position sizes by 50% or waiting for VIX to drop below 20.";
  }
  if (context.marketMood === "BEARISH") {
    return "The market is trending down. BUY tips may face headwinds. Be extra careful with stop losses and consider smaller positions.";
  }
  if (context.marketMood === "BULLISH") {
    return "Market conditions are favorable. Still use stop losses and proper position sizing — markets can reverse quickly.";
  }
  return "Market conditions are normal. Follow your usual risk management rules.";
}
```

### Step 2: Persistent Market Bar Component

```typescript
// src/components/market-context/market-bar.tsx
"use client";

import useSWR from "swr";
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import { VixIndicator } from "./vix-indicator";
import { MarketMoodBadge } from "./market-mood-badge";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function MarketBar(): React.ReactElement {
  const { data, isLoading } = useSWR("/api/v1/market-context", fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds during market hours
  });

  if (isLoading || !data?.data) {
    return (
      <div className="h-10 bg-gray-100 animate-pulse" />
    );
  }

  const ctx = data.data;

  return (
    <div className="bg-gray-900 text-white text-xs flex items-center justify-between px-4 py-2 overflow-x-auto">
      {/* NIFTY 50 */}
      <div className="flex items-center gap-2 whitespace-nowrap">
        <span className="text-gray-400">NIFTY 50</span>
        <span className="font-mono font-semibold">{ctx.nifty50.value.toLocaleString()}</span>
        <span className={`flex items-center gap-0.5 ${ctx.nifty50.changePct >= 0 ? "text-green-400" : "text-red-400"}`}>
          {ctx.nifty50.changePct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {ctx.nifty50.changePct >= 0 ? "+" : ""}{ctx.nifty50.changePct.toFixed(2)}%
        </span>
      </div>

      {/* VIX */}
      <VixIndicator value={ctx.indiaVix.value} level={ctx.indiaVix.level} />

      {/* Market Mood */}
      <MarketMoodBadge mood={ctx.marketMood} />

      {/* FII/DII */}
      <div className="flex items-center gap-2 whitespace-nowrap">
        <span className="text-gray-400">FII</span>
        <span className={ctx.fiiDii.fiiNetBuySell >= 0 ? "text-green-400" : "text-red-400"}>
          {ctx.fiiDii.fiiNetBuySell >= 0 ? "+" : ""}₹{Math.abs(ctx.fiiDii.fiiNetBuySell).toLocaleString()} Cr
        </span>
      </div>

      {/* Market Status */}
      <div className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${ctx.isMarketOpen ? "bg-green-400 animate-pulse" : "bg-gray-500"}`} />
        <span className="text-gray-400">{ctx.isMarketOpen ? "Market Open" : "Market Closed"}</span>
      </div>
    </div>
  );
}
```

### Step 3: Add to Root Layout

```typescript
// src/app/layout.tsx — Add MarketBar above the main header
// <MarketBar />
// <Header />
// <main>{children}</main>
// <Footer />
```

### Step 4: API Route

```typescript
// src/app/api/v1/market-context/route.ts
// Fetches NIFTY 50 price, VIX, FII/DII data from existing market-data service
// Caches in Redis with 30-second TTL during market hours, 5-minute TTL after hours
// Returns MarketContext object
```

### Build Steps:
1. Create `src/lib/market-context/vix.ts` — VIX data fetcher (from NSE India)
2. Create `src/lib/market-context/fii-dii.ts` — FII/DII data fetcher
3. Create `src/lib/market-context/market-mood.ts` — mood classifier
4. Create `src/components/market-context/market-bar.tsx`
5. Create `src/components/market-context/vix-indicator.tsx`
6. Create `src/components/market-context/market-mood-badge.tsx`
7. Create API route `GET /api/v1/market-context`
8. Add `<MarketBar />` to root layout
9. Add contextual warnings to tip cards when VIX is high
10. Cache with 30s TTL during market hours

---

## FEATURE 4.2: ALERT / NOTIFICATION SYSTEM

### Database Schema

```prisma
model UserNotification {
  id          String             @id @default(cuid())
  userId      String             @map("user_id")
  type        NotificationType
  title       String
  body        String
  data        Json?              // Tip ID, creator ID, etc.
  isRead      Boolean            @default(false) @map("is_read")
  channel     NotificationChannel @default(IN_APP)
  sentAt      DateTime           @default(now()) @map("sent_at")
  readAt      DateTime?          @map("read_at")

  user        User               @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isRead])
  @@index([userId, sentAt(sort: Desc)])
  @@map("user_notifications")
}

model NotificationPreference {
  id                    String  @id @default(cuid())
  userId                String  @unique @map("user_id")

  // Channel preferences
  webPushEnabled        Boolean @default(false) @map("web_push_enabled")
  emailDigestEnabled    Boolean @default(true) @map("email_digest_enabled")
  emailDigestFrequency  String  @default("daily") @map("email_digest_frequency") // daily, weekly
  telegramEnabled       Boolean @default(false) @map("telegram_enabled")
  telegramChatId        String? @map("telegram_chat_id")

  // Event preferences
  notifyNewTip          Boolean @default(true) @map("notify_new_tip")
  notifyTargetHit       Boolean @default(true) @map("notify_target_hit")
  notifyStopLossHit     Boolean @default(true) @map("notify_stoploss_hit")
  notifyApproachingSL   Boolean @default(true) @map("notify_approaching_sl")
  notifyMarketAlert     Boolean @default(false) @map("notify_market_alert")

  // Filter preferences
  minCreatorRmtScore    Int     @default(0) @map("min_creator_rmt_score")
  onlyLowRiskTips       Boolean @default(false) @map("only_low_risk_tips")

  user                  User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("notification_preferences")
}

model PushSubscription {
  id          String   @id @default(cuid())
  userId      String   @map("user_id")
  endpoint    String   @unique
  p256dh      String
  auth        String
  createdAt   DateTime @default(now()) @map("created_at")

  @@index([userId])
  @@map("push_subscriptions")
}

enum NotificationType {
  NEW_TIP
  TARGET_HIT
  STOPLOSS_HIT
  APPROACHING_SL
  TIP_EXPIRED
  MARKET_ALERT
  WEEKLY_DIGEST
  BADGE_EARNED
  LEARNING_REMINDER
}

enum NotificationChannel {
  IN_APP
  WEB_PUSH
  EMAIL
  TELEGRAM
}
```

### Notification Dispatcher

```typescript
// src/lib/notifications/dispatcher.ts

import { db } from "@/lib/db";
import { sendWebPush } from "./web-push";
import { sendEmail } from "./email-digest";
import { sendTelegram } from "./telegram-bot";

export async function dispatchNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  const { userId, type, title, body, data } = params;

  // 1. Always create in-app notification
  await db.userNotification.create({
    data: {
      userId,
      type,
      title,
      body,
      data: data ?? undefined,
      channel: "IN_APP",
    },
  });

  // 2. Check user preferences
  const prefs = await db.notificationPreference.findUnique({
    where: { userId },
  });

  if (!prefs) return;

  // 3. Check if this notification type is enabled
  const typeEnabled = checkTypeEnabled(prefs, type);
  if (!typeEnabled) return;

  // 4. Send via enabled channels
  if (prefs.webPushEnabled) {
    const subscriptions = await db.pushSubscription.findMany({ where: { userId } });
    for (const sub of subscriptions) {
      await sendWebPush(sub, { title, body, data });
    }
  }

  if (prefs.telegramEnabled && prefs.telegramChatId) {
    await sendTelegram(prefs.telegramChatId, `${title}\n\n${body}`);
  }

  // Email is batched (daily/weekly digest), not sent immediately
  // unless it's a critical alert like approaching SL
  if (prefs.emailDigestEnabled && type === "APPROACHING_SL") {
    await sendEmail(userId, { subject: title, body });
  }
}
```

### Web Push Implementation

```typescript
// src/lib/notifications/web-push.ts
import webPush from "web-push";

webPush.setVapidDetails(
  "mailto:notifications@ratemytip.com",
  process.env.WEB_PUSH_VAPID_PUBLIC_KEY!,
  process.env.WEB_PUSH_VAPID_PRIVATE_KEY!
);

export async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: { title: string; body: string; data?: Record<string, unknown> }
): Promise<void> {
  try {
    await webPush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: "/logo.svg",
        badge: "/favicon.ico",
        data: payload.data,
      })
    );
  } catch (error: unknown) {
    // If subscription expired, remove it
    if ((error as any).statusCode === 410) {
      await db.pushSubscription.delete({ where: { endpoint: subscription.endpoint } });
    }
  }
}
```

### Telegram Bot

```typescript
// src/lib/notifications/telegram-bot.ts
import { Telegraf } from "telegraf";

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// Command: /start — Links Telegram account to RateMyTip user
bot.start(async (ctx) => {
  const chatId = ctx.chat.id.toString();
  // Return a link that user opens to connect their RateMyTip account
  await ctx.reply(
    `Welcome to RateMyTip Alerts!\n\nTo connect your account, visit:\nhttps://ratemytip.com/settings/notifications?telegram=${chatId}`
  );
});

export async function sendTelegram(chatId: string, message: string): Promise<void> {
  await bot.telegram.sendMessage(chatId, message, { parse_mode: "Markdown" });
}

export { bot };
```

### Integration with Existing Tip Status Worker

Modify the existing `tip-status-worker.ts` to dispatch notifications when tip status changes:

```typescript
// In existing tip-status-worker.ts, after updating tip status:

// When TARGET_1_HIT:
// Find all users who follow this creator AND have this tip on their watchlist
// Dispatch notification: "Target 1 Hit! RELIANCE reached ₹2,500 (+3.3%)"

// When STOPLOSS_HIT:
// Dispatch notification: "Stop Loss Hit! RELIANCE dropped to ₹2,350 (-2.9%)"

// When price approaches SL (within 1%):
// Dispatch notification: "ALERT: RELIANCE is near your stop loss (₹2,360, SL at ₹2,350)"
```

### Build Steps:
1. Add `UserNotification`, `NotificationPreference`, `PushSubscription` to Prisma schema
2. Run `prisma migrate dev`
3. Install `web-push`, `telegraf`
4. Generate VAPID keys: `npx web-push generate-vapid-keys`
5. Create `src/lib/notifications/dispatcher.ts`
6. Create `src/lib/notifications/web-push.ts`
7. Create `src/lib/notifications/telegram-bot.ts`
8. Create `src/lib/notifications/email-digest.ts`
9. Create notification components (`notification-bell.tsx`, `notification-panel.tsx`, `notification-settings.tsx`)
10. Create service worker for push notifications (`public/sw.js`)
11. Create API routes for notifications, push subscription, preferences
12. Integrate with existing `tip-status-worker.ts`
13. Add notification worker to BullMQ queue for batched processing
14. Create Telegram bot and register with BotFather

---

## FEATURE 4.3: VIRTUAL PORTFOLIO / PAPER TRADING

### Database Schema

```prisma
model PaperPortfolioEntry {
  id              String      @id @default(cuid())
  userId          String      @map("user_id")
  tipId           String      @map("tip_id")

  // Entry details (snapshot at time of paper follow)
  stockSymbol     String      @map("stock_symbol")
  direction       TipDirection
  entryPrice      Float       @map("entry_price")
  quantity        Int
  investedAmount  Float       @map("invested_amount")
  stopLoss        Float       @map("stop_loss")
  target1         Float

  // Status tracking
  status          PaperTradeStatus @default(ACTIVE)
  exitPrice       Float?      @map("exit_price")
  exitReason      String?     @map("exit_reason") // "TARGET_HIT", "STOPLOSS_HIT", "MANUAL", "EXPIRED"
  realizedPnl     Float?      @map("realized_pnl")
  realizedPnlPct  Float?      @map("realized_pnl_pct")

  // Timestamps
  enteredAt       DateTime    @default(now()) @map("entered_at")
  exitedAt        DateTime?   @map("exited_at")

  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, status])
  @@index([userId, enteredAt(sort: Desc)])
  @@map("paper_portfolio_entries")
}

enum PaperTradeStatus {
  ACTIVE
  CLOSED_PROFIT
  CLOSED_LOSS
  CLOSED_MANUAL
  EXPIRED
}
```

### Paper Trading Engine

```typescript
// src/lib/paper-trading/engine.ts

import { db } from "@/lib/db";
import { calculatePositionSize } from "@/lib/risk/position-sizer";

const STARTING_VIRTUAL_CAPITAL = 1000000; // Rs 10,00,000

export async function enterPaperTrade(params: {
  userId: string;
  tipId: string;
}): Promise<PaperPortfolioEntry> {
  const { userId, tipId } = params;

  // Get the tip
  const tip = await db.tip.findUniqueOrThrow({
    where: { id: tipId },
    include: { stock: true },
  });

  // Get user's current virtual capital
  const currentCapital = await getVirtualCapital(userId);

  // Calculate position size (2% risk, or user's preference)
  const user = await db.user.findUnique({ where: { id: userId } });
  const riskPct = user?.riskPerTrade ?? 2;

  const sizing = calculatePositionSize({
    totalCapital: currentCapital,
    riskPercentage: riskPct,
    entryPrice: tip.entryPrice,
    stopLoss: tip.stopLoss,
    direction: tip.direction,
  });

  if (sizing.maxShares === 0) {
    throw new Error("Insufficient virtual capital for this trade");
  }

  // Create paper trade entry
  return db.paperPortfolioEntry.create({
    data: {
      userId,
      tipId,
      stockSymbol: tip.stock.symbol,
      direction: tip.direction,
      entryPrice: tip.entryPrice,
      quantity: sizing.maxShares,
      investedAmount: sizing.investmentAmount,
      stopLoss: tip.stopLoss,
      target1: tip.target1,
      status: "ACTIVE",
    },
  });
}

export async function getVirtualCapital(userId: string): Promise<number> {
  // Starting capital minus all invested amounts in active positions
  // plus all realized P&L from closed positions
  const activePositions = await db.paperPortfolioEntry.findMany({
    where: { userId, status: "ACTIVE" },
  });
  const closedPositions = await db.paperPortfolioEntry.findMany({
    where: { userId, status: { not: "ACTIVE" } },
  });

  const investedInActive = activePositions.reduce((sum, p) => sum + p.investedAmount, 0);
  const realizedPnl = closedPositions.reduce((sum, p) => sum + (p.realizedPnl ?? 0), 0);

  return STARTING_VIRTUAL_CAPITAL + realizedPnl - investedInActive;
}

export async function getPortfolioSummary(userId: string) {
  const activePositions = await db.paperPortfolioEntry.findMany({
    where: { userId, status: "ACTIVE" },
  });
  const closedPositions = await db.paperPortfolioEntry.findMany({
    where: { userId, status: { not: "ACTIVE" } },
    orderBy: { exitedAt: "desc" },
  });

  const virtualCapital = await getVirtualCapital(userId);
  const totalInvested = activePositions.reduce((sum, p) => sum + p.investedAmount, 0);
  const totalRealizedPnl = closedPositions.reduce((sum, p) => sum + (p.realizedPnl ?? 0), 0);

  const wins = closedPositions.filter(p => (p.realizedPnl ?? 0) > 0).length;
  const losses = closedPositions.filter(p => (p.realizedPnl ?? 0) < 0).length;
  const winRate = closedPositions.length > 0 ? wins / closedPositions.length : 0;

  return {
    virtualCapital,
    totalInvested,
    availableCapital: virtualCapital - totalInvested,
    totalRealizedPnl,
    activePositionsCount: activePositions.length,
    closedPositionsCount: closedPositions.length,
    winRate,
    wins,
    losses,
    activePositions,
    recentClosedPositions: closedPositions.slice(0, 20),
  };
}
```

### Paper Trade Worker

Add to existing `tip-status-worker.ts`:

```typescript
// When a tip's status changes (TARGET_HIT, STOPLOSS_HIT, EXPIRED),
// also close all paper trades linked to that tip:

async function closePaperTradesForTip(tipId: string, exitPrice: number, exitReason: string) {
  const paperTrades = await db.paperPortfolioEntry.findMany({
    where: { tipId, status: "ACTIVE" },
  });

  for (const trade of paperTrades) {
    const pnl = trade.direction === "BUY"
      ? (exitPrice - trade.entryPrice) * trade.quantity
      : (trade.entryPrice - exitPrice) * trade.quantity;
    const pnlPct = (pnl / trade.investedAmount) * 100;

    await db.paperPortfolioEntry.update({
      where: { id: trade.id },
      data: {
        status: pnl > 0 ? "CLOSED_PROFIT" : "CLOSED_LOSS",
        exitPrice,
        exitReason,
        realizedPnl: pnl,
        realizedPnlPct: pnlPct,
        exitedAt: new Date(),
      },
    });

    // Notify user
    await dispatchNotification({
      userId: trade.userId,
      type: pnl > 0 ? "TARGET_HIT" : "STOPLOSS_HIT",
      title: `Paper Trade ${pnl > 0 ? "Profit" : "Loss"}: ${trade.stockSymbol}`,
      body: `Your paper trade on ${trade.stockSymbol} closed with ${pnl > 0 ? "+" : ""}₹${Math.abs(pnl).toFixed(0)} (${pnlPct > 0 ? "+" : ""}${pnlPct.toFixed(1)}%)`,
    });
  }
}
```

### Build Steps:
1. Add `PaperPortfolioEntry` to Prisma schema
2. Create `src/lib/paper-trading/engine.ts`
3. Create `src/lib/paper-trading/portfolio-tracker.ts`
4. Create `src/lib/paper-trading/pnl-calculator.ts`
5. Create paper trading components (button, portfolio dashboard, positions table, P&L chart)
6. Create page at `src/app/(public)/paper-trading/page.tsx`
7. Create API routes for paper trading CRUD
8. Integrate with `tip-status-worker.ts` to auto-close paper trades
9. Add "Paper Follow" button to `tip-card.tsx`
10. Create paper trader leaderboard (gamification)

---

## FEATURE 5.1: RED FLAG / WARNING SYSTEM

### Step 1: Red Flag Detection Rules

```typescript
// src/lib/red-flags/rules.ts

export interface RedFlag {
  readonly id: string;
  readonly severity: "WARNING" | "CAUTION" | "CRITICAL";
  readonly title: string;
  readonly description: string;
  readonly category: "behavior" | "regulatory" | "performance" | "content";
}

export interface RedFlagResult {
  readonly flags: RedFlag[];
  readonly transparencyScore: number; // 0-100
  readonly overallRisk: "LOW" | "MEDIUM" | "HIGH";
}

// Rule: Small Cap Concentration
export function checkSmallCapConcentration(tips: Tip[], stocks: Stock[]): RedFlag | null {
  const smallCapTips = tips.filter(t => {
    const stock = stocks.find(s => s.id === t.stockId);
    return stock?.marketCap === "SMALL" || stock?.marketCap === "MICRO";
  });

  const ratio = smallCapTips.length / tips.length;
  if (ratio > 0.7 && tips.length > 10) {
    return {
      id: "small-cap-concentration",
      severity: "CAUTION",
      title: "High Small-Cap Concentration",
      description: `${(ratio * 100).toFixed(0)}% of this creator's tips are on small/micro-cap stocks. These stocks are more volatile, less liquid, and more susceptible to manipulation. Exercise extra caution.`,
      category: "behavior",
    };
  }
  return null;
}

// Rule: No Stop Loss Pattern
export function checkMissingStopLoss(tips: Tip[]): RedFlag | null {
  const tipsWithoutSL = tips.filter(t => !t.stopLoss || t.stopLoss <= 0);
  const ratio = tipsWithoutSL.length / tips.length;

  if (ratio > 0.3 && tips.length > 10) {
    return {
      id: "missing-stop-loss",
      severity: "WARNING",
      title: "Often Omits Stop Loss",
      description: `${(ratio * 100).toFixed(0)}% of tips don't include a stop loss. A responsible analyst always provides risk management levels. This makes it harder to manage your risk.`,
      category: "content",
    };
  }
  return null;
}

// Rule: Performance Decline
export function checkPerformanceDecline(
  currentAccuracy: number,
  historicalAccuracy: number,
  recentWindow: number = 60
): RedFlag | null {
  const decline = historicalAccuracy - currentAccuracy;
  if (decline > 0.15 && currentAccuracy < 0.5) {
    return {
      id: "performance-decline",
      severity: "WARNING",
      title: "Significant Accuracy Decline",
      description: `This creator's accuracy dropped from ${(historicalAccuracy * 100).toFixed(0)}% to ${(currentAccuracy * 100).toFixed(0)}% in the last ${recentWindow} days. Their strategy may no longer be working in current market conditions.`,
      category: "performance",
    };
  }
  return null;
}

// Rule: Unusual Tip Clustering
export function checkTipClustering(tips: Tip[]): RedFlag | null {
  // Check if multiple tips on the same stock in a short period
  const stockTipCounts = new Map<string, number>();
  const recentTips = tips.filter(t => {
    const daysAgo = (Date.now() - new Date(t.tipTimestamp).getTime()) / (1000 * 60 * 60 * 24);
    return daysAgo < 7;
  });

  for (const tip of recentTips) {
    const count = stockTipCounts.get(tip.stockId) ?? 0;
    stockTipCounts.set(tip.stockId, count + 1);
  }

  const maxCount = Math.max(...stockTipCounts.values(), 0);
  if (maxCount >= 3) {
    return {
      id: "tip-clustering",
      severity: "CAUTION",
      title: "Unusual Tip Clustering",
      description: `This creator gave ${maxCount} tips on the same stock in the past week. This could indicate pump-and-dump behavior or excessive bias toward one stock.`,
      category: "behavior",
    };
  }
  return null;
}

// Rule: SEBI Not Registered
export function checkSebiRegistration(isSebiRegistered: boolean | null): RedFlag | null {
  if (isSebiRegistered === false) {
    return {
      id: "sebi-not-registered",
      severity: "CAUTION",
      title: "Not SEBI Registered",
      description: "This creator is not registered with SEBI as a Research Analyst or Investment Advisor. In India, providing stock market advice commercially requires SEBI registration. Unregistered advice carries no regulatory protection.",
      category: "regulatory",
    };
  }
  return null;
}
```

### Step 2: Transparency Score Calculator

```typescript
// src/lib/red-flags/transparency-score.ts

export function calculateTransparencyScore(metrics: {
  alwaysGivesSL: boolean;
  alwaysGivesTarget: boolean;
  updatesOnFailedTips: boolean;
  disclosesPositions: boolean;
  isSebiRegistered: boolean;
  tipClarity: number; // 0-1 from NLP parser confidence
  averageParseConfidence: number;
}): number {
  let score = 0;

  if (metrics.alwaysGivesSL) score += 25;
  else score += 10;

  if (metrics.alwaysGivesTarget) score += 20;
  else score += 5;

  if (metrics.isSebiRegistered) score += 20;
  if (metrics.disclosesPositions) score += 15;
  if (metrics.updatesOnFailedTips) score += 10;

  // Tip clarity from average NLP parse confidence
  score += metrics.averageParseConfidence * 10;

  return Math.min(100, Math.round(score));
}
```

### Build Steps:
1. Create `src/lib/red-flags/rules.ts` with all detection rules
2. Create `src/lib/red-flags/detector.ts` — runs all rules against a creator
3. Create `src/lib/red-flags/transparency-score.ts`
4. Add `sebiRegistrationNumber`, `isSebiRegistered`, `transparencyScore`, `redFlagCount` to Creator model
5. Create `red-flag-badge.tsx`, `red-flag-panel.tsx`, `transparency-meter.tsx` components
6. Create API route `GET /api/v1/red-flags/:creatorId`
7. Run red flag detection as part of daily score calculation worker
8. Display red flags on creator profile pages
9. Add filter to leaderboard: "Hide creators with red flags"

---

## FEATURE 7.1: GUIDED ONBOARDING EXPERIENCE

### Implementation Using react-joyride

```typescript
// src/components/onboarding/onboarding-tour.tsx
"use client";

import { useState, useEffect } from "react";
import Joyride, { Step, CallBackProps, STATUS } from "react-joyride";

const LEADERBOARD_TOUR_STEPS: Step[] = [
  {
    target: ".leaderboard-table",
    content: "This is the leaderboard — it ranks tip creators by their verified accuracy and performance. Higher score = more reliable tips.",
    disableBeacon: true,
    placement: "bottom",
  },
  {
    target: ".rmt-score-column",
    content: "The RMT Score (0-100) is our proprietary rating. It considers accuracy, risk-adjusted returns, consistency, and volume. Aim for creators above 65.",
  },
  {
    target: ".accuracy-column",
    content: "Accuracy Rate shows what percentage of their tips hit the target price. 70%+ is considered good.",
  },
  {
    target: ".tier-badge",
    content: "Tier badges show how many verified tips a creator has. Gold (200+) and Platinum (500+) tiers have the most reliable statistics.",
  },
  {
    target: ".category-tabs",
    content: "Filter by trading style. If you have a day job, focus on 'Swing' or 'Positional' creators — avoid 'Intraday'.",
  },
  {
    target: ".search-bar",
    content: "Search for any creator or stock to see their full track record. Try searching for a stock you're interested in!",
  },
];

interface OnboardingTourProps {
  readonly page: "leaderboard" | "creator" | "tip" | "stock";
}

export function OnboardingTour({ page }: OnboardingTourProps): React.ReactElement | null {
  const [run, setRun] = useState(false);

  useEffect(() => {
    // Check if user has seen this tour
    const seen = localStorage.getItem(`rmt_tour_${page}`);
    if (!seen) {
      // Delay start for page to render
      const timer = setTimeout(() => setRun(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [page]);

  const handleCallback = (data: CallBackProps) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      localStorage.setItem(`rmt_tour_${page}`, "true");
      setRun(false);
    }
  };

  const steps = page === "leaderboard" ? LEADERBOARD_TOUR_STEPS : [];

  if (steps.length === 0) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleCallback}
      styles={{
        options: {
          primaryColor: "#2B6CB0",
          zIndex: 10000,
        },
      }}
      locale={{
        back: "Back",
        close: "Got it",
        last: "Done!",
        next: "Next",
        skip: "Skip tour",
      }}
    />
  );
}
```

### Build Steps:
1. Install `react-joyride`
2. Create `src/components/onboarding/onboarding-tour.tsx`
3. Define tour steps for each page (leaderboard, creator, tip, stock)
4. Add tour trigger to page components
5. Create `src/components/onboarding/onboarding-checklist.tsx` (persistent progress bar)
6. Create `src/components/onboarding/welcome-modal.tsx` (first visit)
7. Track onboarding progress in localStorage (anonymous) and User model (logged in)
8. Add CSS classes to existing components as tour targets

---

## FEATURE 7.3: EXPERIENCE LEVEL FILTER / BEGINNER MODE

### Implementation

```typescript
// src/components/beginner/beginner-mode-toggle.tsx
"use client";

import { useExperienceLevel } from "@/hooks/use-experience-level";

export function BeginnerModeToggle(): React.ReactElement {
  const { level, setLevel } = useExperienceLevel();

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-500">Mode:</span>
      <select
        value={level}
        onChange={(e) => setLevel(e.target.value as ExperienceLevel)}
        className="border rounded px-2 py-1 text-sm"
      >
        <option value="BEGINNER">Beginner (Simplified)</option>
        <option value="INTERMEDIATE">Intermediate</option>
        <option value="ADVANCED">Advanced (Full data)</option>
      </select>
    </div>
  );
}
```

```typescript
// src/hooks/use-experience-level.ts
"use client";

import { createContext, useContext, useState, useEffect } from "react";

type ExperienceLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

const ExperienceLevelContext = createContext<{
  level: ExperienceLevel;
  setLevel: (level: ExperienceLevel) => void;
}>({
  level: "BEGINNER",
  setLevel: () => {},
});

export function ExperienceLevelProvider({ children }: { children: React.ReactNode }) {
  const [level, setLevel] = useState<ExperienceLevel>("BEGINNER");

  useEffect(() => {
    const saved = localStorage.getItem("rmt_experience_level");
    if (saved) setLevel(saved as ExperienceLevel);
  }, []);

  useEffect(() => {
    localStorage.setItem("rmt_experience_level", level);
  }, [level]);

  return (
    <ExperienceLevelContext.Provider value={{ level, setLevel }}>
      {children}
    </ExperienceLevelContext.Provider>
  );
}

export function useExperienceLevel() {
  return useContext(ExperienceLevelContext);
}
```

### Beginner Mode Effects Across the App

```typescript
// In leaderboard page — filter options based on level:
// BEGINNER: Hide intraday/options/futures, show only SWING/POSITIONAL on LARGE/MID cap
// INTERMEDIATE: Show all but with risk badges
// ADVANCED: Full data, no filtering

// In tip card — adjust display:
// BEGINNER: Show simplified tip card with risk badge, execution guide, position calculator
// INTERMEDIATE: Standard card + risk badge
// ADVANCED: Full card with all metrics

// In creator profile — adjust metrics shown:
// BEGINNER: RMT Score, Accuracy, Win Streak, Risk Level only
// INTERMEDIATE: Add risk-adjusted returns, consistency
// ADVANCED: Full metrics including confidence intervals, drawdown, etc.
```

### Build Steps:
1. Create `src/hooks/use-experience-level.ts` context provider
2. Create `src/components/beginner/beginner-mode-toggle.tsx`
3. Wrap app in `ExperienceLevelProvider` in root layout
4. Create `src/components/beginner/lite-tip-card.tsx` (simplified tip card)
5. Create `src/components/beginner/lite-leaderboard-row.tsx` (simplified row)
6. Add conditional rendering throughout existing components based on experience level
7. Add mode toggle to header/settings
8. Persist preference in user profile for logged-in users

---

## REMAINING FEATURES — CONDENSED IMPLEMENTATION GUIDES

### FEATURE 1.3: Beginner Learning Paths

**Database:** `UserLearningProgress` model (userId, moduleId, completedAt, quizScore)
**Content:** Static MDX files in `src/content/learn/` with 8 modules
**Pages:** `/learn` hub page, `/learn/[moduleSlug]` individual module
**Components:** `module-card.tsx`, `module-viewer.tsx`, `quiz-card.tsx`, `progress-bar.tsx`
**API:** `GET /api/v1/learning` (modules list), `POST /api/v1/learning/progress` (mark complete)
**Build:** MDX loader in Next.js config, progress tracked in DB for auth users / localStorage for anon

### FEATURE 1.4: Tip Post-Mortems

**Service:** `src/lib/post-mortem/generator.ts` — auto-generates analysis when tip resolves
**Data:** Uses market data at tip time vs resolution time, NIFTY/VIX levels, sector performance
**Worker:** Add post-mortem generation to score-worker after tip closes
**Storage:** Add `postMortemText` and `postMortemData` (Json) fields to Tip model
**Components:** `post-mortem-card.tsx` with annotated price chart
**API:** `GET /api/v1/post-mortem/:tipId`

### FEATURE 2.4: Capital at Risk Dashboard

**Depends on:** Feature 4.1 (Follow System) or Feature 4.3 (Paper Trading)
**Components:** Dashboard showing aggregate exposure across followed/paper-traded tips
**Calculation:** Sum of (quantity × entry_price) for active positions, sector allocation pie chart
**Correlation Warning:** Check if >60% of positions are in same sector
**Page:** Section within `/paper-trading` dashboard

### FEATURE 3.2: Creator Comparison Tool

**Page:** `/compare?creators=slug1,slug2,slug3`
**API:** `GET /api/v1/compare?creators=id1,id2,id3` — returns side-by-side data
**Components:** `compare-selector.tsx` (search + select up to 3), `compare-table.tsx`
**Data:** Pull CreatorScore, tip statistics, timeframe breakdown for each selected creator
**Build:** Client-side state management for selection, SSR for comparison page

### FEATURE 3.3: Conflicting Tip Detector

**Integration:** Add to existing stock page (`/stock/[symbol]`)
**Query:** Find active tips on same stock with opposing directions
**Component:** `conflict-banner.tsx` — shows when BUY and SELL tips exist simultaneously
**Historical:** Query past conflicts and resolution outcomes
**Build:** SQL query for conflicting tips, display in stock-consensus widget

### FEATURE 3.5: Similar Past Tips

**API:** `GET /api/v1/similar-tips/:tipId`
**Query:** Find tips by same creator, same stock, same direction, similar entry zone (±5%)
**Component:** `similar-tips-panel.tsx` — shows historical performance of similar past tips
**Integration:** Add to tip detail page

### FEATURE 4.1: Personal Watchlist / Follow System

**Database:** Already scaffolded as `Follow` model in existing schema
**Components:** Follow button (already exists), personal feed page
**Page:** `/dashboard` or `/feed` — shows tips from followed creators
**API:** `POST /api/v1/follows`, `GET /api/v1/user/following`, `GET /api/v1/feed`
**Stock Watchlist:** New `StockWatchlist` model (userId, stockId, createdAt)

### FEATURE 4.4: P&L Simulator / Backtest Tool

**Service:** `src/lib/backtester/engine.ts`
**Input:** creatorId, startDate, endDate, startingCapital, positionSizeStrategy
**Process:** Replay all completed tips chronologically, compute equity curve
**Output:** Total return, max drawdown, Sharpe ratio, comparison vs NIFTY 50 B&H
**Page:** `/creator/[slug]` — "Simulate Following" button + modal
**API:** `POST /api/v1/backtest` (computationally heavy, cache result)

### FEATURE 5.2: SEBI Registration Verification

**Data Source:** SEBI website (manual scrape of RA/RIA list, stored in DB)
**Schema:** Add `sebiRegistrationNumber`, `isSebiRegistered`, `sebiVerifiedAt` to Creator model
**Worker:** Monthly SEBI list refresh job
**Component:** SEBI badge on creator profile, filter on leaderboard
**Build:** Manual initial seeding, automated monthly refresh

### FEATURE 5.3: Creator Behavior Analytics

**Metrics to compute:**
- Tip timing distribution (histogram: hour of day)
- Average price movement post-tip (15min, 1hr, 4hr)
- SL provision rate (% of tips with explicit SL)
- Post deletion detection (compare scraped tweets vs current)
**Storage:** New `CreatorBehaviorMetrics` model or JSON field on CreatorScore
**Component:** Behavior analytics section on creator profile (for INTERMEDIATE+ users)

### FEATURE 6.1: Discussion Forums / Q&A

**Database:** `ForumPost` (id, tipId?, stockId?, userId, parentId, content, upvotes, createdAt), `ForumVote`
**Moderation:** Auto-flag posts containing specific financial advice keywords
**Components:** `forum-thread.tsx`, `forum-post.tsx`, `forum-composer.tsx`
**Integration:** Comment section on tip detail pages and stock pages
**Build:** Threaded comments with voting, admin moderation queue

### FEATURE 6.2: Mentor Matching

**Database:** `Mentorship` (mentorId, menteeId, status, matchedAt, endedAt)
**Eligibility:** Mentor must have 30+ days paper trading, 55%+ win rate
**Matching:** Based on quiz answers (similar sector interests, complementary experience)
**Components:** Mentor card, matching wizard, chat interface (or external link)
**Build:** Phase 3+ — lower priority

### FEATURE 6.3: Traders Like Me Social Proof

**Implementation:** Aggregate anonymized data from user quiz answers and follow patterns
**Queries:** "X beginners also follow this creator", "Most popular among first-time traders"
**Component:** Small social proof widget on creator profiles
**Privacy:** Only show aggregated counts, never individual user data

### FEATURE 8.1: Brokerage Cost Calculator

**Service:** `src/lib/risk/brokerage-costs.ts`
**Input:** Broker, order type (delivery/intraday), buy price, sell price, quantity
**Calculation:** Brokerage + STT + Exchange charges + GST + SEBI fees + Stamp duty
**Output:** Total cost, net profit after costs, cost as % of gross profit
**Component:** `brokerage-cost-card.tsx` — shown on tip card when expanded
**Data:** Broker fee structures (hardcoded, update periodically)

### FEATURE 8.2: Tax Implications Guide

**Service:** `src/lib/tax/india-tax-calculator.ts`
**Rules:** STCG 20% (equity delivery <1yr), LTCG 12.5% (>1yr, >₹1.25L), Intraday = business income (slab rate), F&O = business income
**Component:** Tax estimate card on tip detail and paper portfolio
**Page:** `/learn/tax-guide` — comprehensive tax guide for traders
**Disclaimer:** "Estimates only. Consult a CA."

### FEATURE 8.3: Scam Protection Guide

**Implementation:** Static content pages with educational articles
**Page:** `/protect-yourself` with sub-articles
**Content:** MDX files covering common scams, red flags, SEBI complaint process
**Integration:** Link from red flag warnings on creator profiles

### FEATURE 9.1: Creator Performance by Market Conditions

**Implementation:** Tag each completed tip with market regime at tip time (BULL/BEAR/SIDEWAYS)
**Classification:** Based on NIFTY 50 200-day SMA crossover + VIX level at tip date
**Storage:** Add `marketRegimeAtTip` enum field to Tip model
**Computation:** During score calculation, compute accuracy per regime
**Component:** Bar chart on creator profile showing accuracy in Bull vs Bear vs Sideways

### FEATURE 9.2: Sector Strength Dashboard

**Data Source:** Compute from NIFTY sectoral indices (IT, Bank, Pharma, Auto, etc.)
**API:** `GET /api/v1/sectors` — returns sector performance + strength classification
**Component:** `sector-heatmap.tsx` — color-coded grid of sectors
**Integration:** Show on market overview page and as context on stock pages
**Cache:** 5-minute TTL during market hours

### FEATURE 9.3: Entry Timing Insights

**Implementation:** On each active tip, compute: time since posting, price movement since entry
**Calculation:** Current price vs entry price, adjusted R:R at current price
**Rules:** If moved >1.5% from entry, show "entry opportunity may have passed" warning
**Component:** `entry-timing-card.tsx` on active tip cards
**API:** `GET /api/v1/entry-timing/:tipId`

### FEATURE 10.1: Multi-Language Support

**Package:** `next-intl`
**Languages:** English (default), Hindi (Phase 1)
**Structure:** `src/lib/i18n/messages/en.json`, `src/lib/i18n/messages/hi.json`
**Implementation:** Wrap app in `NextIntlClientProvider`, use `useTranslations()` hook
**Content:** Translate UI labels, glossary terms, educational content
**Build:** 2-3 weeks for full Hindi translation

### FEATURE 10.2: Voice / Audio Summaries

**Service:** Google Cloud Text-to-Speech or Web Speech API
**Content:** Daily market summary, top tips summary, creator profile audio overview
**Worker:** Generate audio files daily after market close, store in cloud storage
**Component:** Audio player widget on relevant pages
**Build:** Phase 3+ — lower priority due to cost and complexity

### FEATURE 10.3: Simplified / Lite Mode

**Implementation:** Already covered by Experience Level Filter (Feature 7.3)
**Additional:** `lite-tip-card.tsx` shows only essential info with traffic light colors
**Toggle:** Part of beginner mode system
**Build:** Create lite versions of key components, conditionally render based on mode

### FEATURE 10.4: Offline Access / PWA

**Package:** `next-pwa`
**Manifest:** `src/app/manifest.ts` — PWA manifest with icons and theme
**Service Worker:** Cache static assets + last-viewed pages
**Strategy:** Cache-first for static, network-first for API data
**Build:** Configure `next-pwa` in `next.config.ts`, add manifest, create service worker

### FEATURE 11.1: Learning Streak & Badges

**Database:** `UserBadge` (userId, badgeId, earnedAt)
**Badges:** Define 20+ badges in `src/lib/gamification/badges.ts`
**Streak:** Track in User model (currentStreak, longestStreak, lastActiveDate)
**XP:** Award XP for learning modules, paper trades, quiz completion
**Component:** Badge showcase, streak counter, XP progress bar
**Worker:** Daily streak check cron job (reset if user missed a day)

### FEATURE 11.2: Weekly Challenges

**Database:** `Challenge` (id, title, description, type, criteria, startDate, endDate), `ChallengeEntry` (userId, challengeId, status, completedAt)
**Types:** Paper trading challenges, learning challenges, analysis challenges
**Worker:** Weekly cron job to create new challenges and close completed ones
**Component:** Challenge card, challenge leaderboard
**Page:** `/challenges`

### FEATURE 12.1: Was This Useful Feedback

**Database:** `TipFeedback` (userId, tipId, isUseful, didFollow, actualResult, createdAt)
**Component:** Thumbs up/down buttons on tip cards (requires auth)
**Aggregation:** "87% found this useful" displayed on tip
**API:** `POST /api/v1/feedback` (submit), aggregated stats on tip detail

### FEATURE 12.2: Creator Review System

**Database:** `CreatorReview` (userId, creatorId, rating 1-5, categories JSON, reviewText, createdAt)
**Categories:** Clarity, Timeliness, Risk Management, Transparency (each rated 1-5)
**Verification:** Only allow reviews from users who followed the creator for 7+ days
**Component:** Review form, review list, star ratings
**API:** `POST /api/v1/reviews`, `GET /api/v1/creators/:id/reviews`

---

## IMPLEMENTATION PHASES & BUILD ORDER

### Phase 1.5A — Foundation & Safety (Weeks 1-3)
*Critical for beginner safety. Build these first.*

| # | Feature | Effort | Dependencies |
|---|---------|--------|-------------|
| 1 | User Account System (Prerequisite) | 3 days | Google OAuth, NextAuth extension |
| 2 | 1.1 Jargon Buster / Glossary | 2 days | None |
| 3 | 2.1 Position Size Calculator | 2 days | None |
| 4 | 2.2 Risk Level Indicator | 3 days | Market data service (existing) |
| 5 | 7.3 Experience Level Filter | 2 days | User context provider |
| 6 | 7.1 Guided Onboarding | 2 days | react-joyride |
| 7 | 3.4 Market Context Widget | 3 days | VIX fetcher, market data |
| 8 | 5.1 Red Flag System | 3 days | Creator data analysis |

### Phase 1.5B — Engagement & Tracking (Weeks 4-6)
*Features that keep users coming back and learning.*

| # | Feature | Effort | Dependencies |
|---|---------|--------|-------------|
| 9 | 4.2 Notification System | 5 days | Web push, Telegram bot |
| 10 | 4.1 Follow / Watchlist | 2 days | User system |
| 11 | 4.3 Paper Trading | 4 days | Position sizer, tip status worker |
| 12 | 1.2 Execution Guide | 2 days | Broker configs |
| 13 | 3.1 Quiz / Recommendation | 3 days | User system, creator matcher |
| 14 | 8.1 Brokerage Cost Calculator | 2 days | Broker fee data |
| 15 | 9.3 Entry Timing Insights | 2 days | Market data service |

### Phase 1.5C — Analytics & Decision Support (Weeks 7-9)
*Features that help users make better decisions.*

| # | Feature | Effort | Dependencies |
|---|---------|--------|-------------|
| 16 | 3.2 Creator Comparison | 3 days | Creator data |
| 17 | 2.3 Drawdown Display | 2 days | Score worker extension |
| 18 | 3.3 Conflicting Tip Detector | 1 day | Stock page integration |
| 19 | 3.5 Similar Past Tips | 2 days | Tip query engine |
| 20 | 4.4 P&L Simulator / Backtest | 3 days | Historical tip data |
| 21 | 9.1 Performance by Market Conditions | 3 days | Market regime classifier |
| 22 | 9.2 Sector Strength Dashboard | 2 days | Sectoral index data |
| 23 | 1.4 Tip Post-Mortems | 3 days | Market data, LLM for text generation |

### Phase 1.5D — Education & Community (Weeks 10-12)
*Features that build long-term engagement.*

| # | Feature | Effort | Dependencies |
|---|---------|--------|-------------|
| 24 | 1.3 Learning Paths | 4 days | MDX content, quiz engine |
| 25 | 5.2 SEBI Verification | 2 days | SEBI registry data |
| 26 | 8.3 Scam Protection Guide | 2 days | Content writing |
| 27 | 11.1 Badges / Gamification | 3 days | User system, XP engine |
| 28 | 12.1 Tip Feedback | 1 day | User system |
| 29 | 12.2 Creator Reviews | 2 days | User system |
| 30 | 6.3 Traders Like Me | 2 days | Aggregated user data |
| 31 | 10.3 Lite Mode Components | 2 days | Experience level filter |

### Phase 2+ — Advanced Features
*Build after core beginner features are stable.*

| # | Feature | Effort | Dependencies |
|---|---------|--------|-------------|
| 32 | 10.1 Multi-Language (Hindi) | 2 weeks | next-intl, translation |
| 33 | 10.4 PWA / Offline | 1 week | next-pwa |
| 34 | 6.1 Discussion Forums | 1 week | User system, moderation |
| 35 | 5.3 Creator Behavior Analytics | 1 week | Scraped data analysis |
| 36 | 8.2 Tax Calculator | 3 days | Tax rules engine |
| 37 | 11.2 Weekly Challenges | 3 days | Gamification engine |
| 38 | 2.4 Capital at Risk Dashboard | 2 days | Paper trading system |
| 39 | 6.2 Mentor Matching | 1 week | User system, matching algo |
| 40 | 10.2 Voice / Audio Summaries | 1 week | TTS API, audio player |

---

## DATABASE MIGRATION STRATEGY

### All Schema Changes Combined

```prisma
// ═══════════════════════════════════════
// ADDITIONS TO EXISTING MODELS
// ═══════════════════════════════════════

// Creator model — add fields:
//   sebiRegistrationNumber  String?
//   isSebiRegistered        Boolean?
//   sebiVerifiedAt          DateTime?
//   transparencyScore       Int?       @default(0)
//   redFlagCount            Int        @default(0)

// CreatorScore model — add fields:
//   maxDrawdownPct          Float?
//   longestLosingStreak     Int        @default(0)
//   equityCurveData         Json?
//   bullMarketAccuracy      Float?
//   bearMarketAccuracy      Float?
//   sidewaysMarketAccuracy  Float?

// Tip model — add fields:
//   riskLevel               RiskLevel?  (enum: LOW, MEDIUM, HIGH, VERY_HIGH)
//   riskScore               Int?
//   postMortemText          String?
//   postMortemData          Json?
//   marketRegimeAtTip       MarketRegime? (enum: BULL, BEAR, SIDEWAYS)

// User model — extend with fields listed in Section 0.1

// ═══════════════════════════════════════
// NEW MODELS (in addition order)
// ═══════════════════════════════════════

// 1. UserQuizAnswer         — Feature 3.1
// 2. UserLearningProgress   — Feature 1.3
// 3. UserBadge              — Feature 11.1
// 4. PaperPortfolioEntry    — Feature 4.3
// 5. UserNotification       — Feature 4.2
// 6. NotificationPreference — Feature 4.2
// 7. PushSubscription       — Feature 4.2
// 8. StockWatchlist         — Feature 4.1
// 9. TipFeedback            — Feature 12.1
// 10. CreatorReview          — Feature 12.2
// 11. ForumPost              — Feature 6.1
// 12. ForumVote              — Feature 6.1
// 13. Challenge              — Feature 11.2
// 14. ChallengeEntry         — Feature 11.2
// 15. Mentorship             — Feature 6.2
```

### Migration Order

```bash
# Migration 1: User account extensions + notification infrastructure
prisma migrate dev --name add-user-beginner-features

# Migration 2: Paper trading
prisma migrate dev --name add-paper-trading

# Migration 3: Creator safety fields (red flags, SEBI, transparency)
prisma migrate dev --name add-creator-safety-fields

# Migration 4: Tip risk and post-mortem fields
prisma migrate dev --name add-tip-risk-and-postmortem

# Migration 5: Community features (forums, reviews, feedback)
prisma migrate dev --name add-community-features

# Migration 6: Gamification (badges, challenges)
prisma migrate dev --name add-gamification
```

---

## TOTAL EFFORT ESTIMATE

| Phase | Features | Estimated Effort |
|-------|----------|-----------------|
| 1.5A — Safety | 8 features | 3 weeks (1 dev) |
| 1.5B — Engagement | 7 features | 3 weeks (1 dev) |
| 1.5C — Analytics | 8 features | 3 weeks (1 dev) |
| 1.5D — Education | 8 features | 3 weeks (1 dev) |
| Phase 2+ | 9 features | 6 weeks (1 dev) |
| **Total** | **40 features** | **~18 weeks (1 dev)** |

With 2 developers working in parallel (one on frontend, one on backend), this could be compressed to **~10-12 weeks**.

---

## KEY ARCHITECTURAL DECISIONS

1. **Client-side state for anonymous users:** Use localStorage for experience level, capital, quiz answers, and tour progress. When they create an account, migrate localStorage data to the database.

2. **Paper trading uses existing tip lifecycle:** Paper trades are linked to real tips and auto-close when the underlying tip status changes. No separate price monitoring needed.

3. **Notifications are event-driven:** Existing `tip-status-worker.ts` already detects status changes. We add notification dispatch calls after each status update.

4. **Risk assessment is pre-computed:** Risk scores are calculated when tips are approved and cached. They don't need real-time computation on every page view.

5. **Red flags run during daily score calculation:** No separate worker needed. The score-worker already iterates through all creators.

6. **Glossary is fully static:** No database needed. Terms are defined in a TypeScript file and compiled into the bundle. No API call needed for tooltip display.

7. **Market context widget uses SWR with polling:** Refreshes every 30 seconds during market hours via client-side polling. The API endpoint caches in Redis with 30s TTL to absorb load.

8. **Learning content is MDX:** Stored in the repo, compiled at build time. No CMS needed for Phase 1. Progress tracking is the only dynamic part.

---

**END OF IMPLEMENTATION GUIDE**

*This document covers the complete implementation plan for all 32 missing features
identified in `missingfeatures.md`. Each feature includes database changes, API endpoints,
components, services, and build steps. Follow the phased build order for optimal delivery.*
