# CLAUDE.md — RateMyTip Phase 1: Complete Engineering Specification

> **This is the single source of truth for building RateMyTip Phase 1.**
> Every architectural decision, database schema, API contract, scoring algorithm,
> and implementation detail is documented here. Follow this document exactly.

---

## TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Tech Stack & Architecture](#2-tech-stack--architecture)
3. [Project Structure](#3-project-structure)
4. [Coding Conventions](#4-coding-conventions)
5. [Environment & Configuration](#5-environment--configuration)
6. [Database Schema](#6-database-schema)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Scoring Algorithm](#8-scoring-algorithm--the-rmt-score)
9. [Scraping Engine](#9-scraping-engine)
10. [NLP Tip Parser](#10-nlp-tip-parser)
11. [Market Data Service](#11-market-data-service)
12. [API Specification](#12-api-specification)
13. [Frontend Pages & Components](#13-frontend-pages--components)
14. [Admin Dashboard](#14-admin-dashboard)
15. [Social Sharing](#15-social-sharing--og-images)
16. [SEO Strategy](#16-seo-strategy)
17. [Background Jobs](#17-background-jobs--queues)
18. [Caching Strategy](#18-caching-strategy)
19. [Error Handling & Logging](#19-error-handling--logging)
20. [Testing Strategy](#20-testing-strategy)
21. [Deployment](#21-deployment--infrastructure)
22. [Phase 1 Scope Boundaries](#22-phase-1-scope-boundaries)

---

## 1. PROJECT OVERVIEW

### 1.1 What Is RateMyTip?

RateMyTip (ratemytip.com) is a financial tip accountability platform that tracks, verifies, and scores stock market tips given by influencers (finfluencers), brokerages, and analysts. Phase 1 is the "Scrape & Score" phase — we build the data engine, scoring algorithm, and public-facing leaderboard.

### 1.2 Phase 1 Scope ("Scrape & Score")

Phase 1 delivers the following capabilities:

- **Auto-scraping** of top 500 Indian finfluencers from Twitter/X and YouTube
- **NLP tip parser** that extracts structured tip data from unstructured social media posts
- **Human review pipeline** for ambiguous/low-confidence parsed tips
- **Core scoring algorithm** (RMT Score) based on accuracy, risk-adjusted returns, consistency
- **Real-time market data integration** for automatic tip outcome tracking (target hit / stop-loss hit / expired)
- **Public leaderboard website** (SSR for SEO) with creator rankings
- **Stock search** showing all tips ever posted for any stock across all creators
- **Creator profile pages** (unclaimed, auto-generated from scraped data)
- **Social sharing** with auto-generated OG images for leaderboards and profiles
- **Admin dashboard** for content moderation, review queue, and platform management

### 1.3 What Phase 1 Does NOT Include

- User registration/login (public-facing site is read-only for users)
- Creator claiming/self-service (Phase 2)
- Social features — comments, likes, follows (Phase 2)
- Monetization — courses, subscriptions, payments (Phase 3)
- Mobile app (Phase 2)
- Direct messaging (Phase 3)

### 1.4 Success Criteria for Phase 1

- 500+ creators tracked with auto-generated profiles
- 10,000+ tips scraped, parsed, and scored
- Leaderboard pages ranking in Google for "best stock tip providers India" type queries
- Admin can review and approve/reject scraped tips
- Scoring algorithm produces defensible, auditable scores
- Page load times < 2 seconds (LCP) on all public pages
- Zero data integrity issues (no retroactive tip modification possible)

---

## 2. TECH STACK & ARCHITECTURE

### 2.1 Core Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| **Framework** | Next.js 14+ (App Router) | SSR for SEO, API routes, React Server Components |
| **Language** | TypeScript (strict mode) | Type safety across entire codebase |
| **Styling** | Tailwind CSS + ShadCN/UI | Rapid UI development, consistent design system |
| **Database** | PostgreSQL 16 | Relational data, JSONB for flexible fields, full-text search |
| **ORM** | Prisma | Type-safe queries, migrations, schema management |
| **Cache** | Redis 7 | Leaderboard caching, rate limiting, job queues |
| **Job Queue** | BullMQ | Redis-based reliable job processing for scrapers |
| **Search** | PostgreSQL `tsvector` + `pg_trgm` | Full-text search (Phase 1; Elasticsearch in Phase 4) |
| **Auth** | NextAuth.js v5 | Admin authentication only in Phase 1 |
| **API Style** | REST (Next.js Route Handlers) | Simple, cacheable, well-understood |
| **Validation** | Zod | Runtime validation matching TypeScript types |
| **Date Handling** | date-fns | Lightweight, tree-shakeable, timezone-aware |
| **Charts** | Recharts | React-native charting for leaderboards and profiles |
| **OG Images** | @vercel/og (Satori) | Dynamic social sharing images |
| **Deployment** | Docker Compose (local) → Vercel + Railway (prod) | Optimized for Next.js; Railway for Postgres + Redis + workers |
| **Monitoring** | Sentry + Pino logger | Error tracking + structured logging |
| **Testing** | Vitest + Playwright | Unit/integration + E2E testing |

### 2.2 Architecture Diagram (Conceptual)

```
┌─────────────────────────────────────────────────────────────────┐
│                        INTERNET / USERS                         │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                     NEXT.JS APPLICATION                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │  Public Pages │  │  API Routes  │  │  Admin Dashboard      │  │
│  │  (SSR/SSG)   │  │  /api/v1/*   │  │  /admin/* (protected) │  │
│  │              │  │              │  │                       │  │
│  │  - Home      │  │  - creators  │  │  - Review Queue       │  │
│  │  - Leaderboard│ │  - tips      │  │  - Creator Mgmt       │  │
│  │  - Creator   │  │  - stocks    │  │  - Scraper Control     │  │
│  │  - Stock     │  │  - leaderboard│ │  - Analytics           │  │
│  │  - Search    │  │  - search    │  │  - Moderation          │  │
│  └──────────────┘  └──────────────┘  └───────────────────────┘  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
          ┌───────────┼───────────────────┐
          ▼           ▼                   ▼
   ┌────────────┐ ┌────────┐     ┌──────────────┐
   │ PostgreSQL │ │ Redis  │     │  BullMQ       │
   │            │ │        │     │  Workers      │
   │ - creators │ │ - cache│     │               │
   │ - tips     │ │ - board│     │ - scraper     │
   │ - stocks   │ │ - rate │     │ - parser      │
   │ - scores   │ │ - limit│     │ - scorer      │
   │ - prices   │ │ - queue│     │ - price-feed  │
   └────────────┘ └────────┘     └──────┬───────┘
                                        │
                          ┌─────────────┼─────────────┐
                          ▼             ▼             ▼
                   ┌───────────┐ ┌──────────┐ ┌──────────────┐
                   │ Twitter/X │ │ YouTube  │ │ Market Data  │
                   │ API v2    │ │ Data API │ │ NSE/BSE/Yahoo│
                   └───────────┘ └──────────┘ └──────────────┘
```

### 2.3 Data Flow

```
SCRAPING FLOW:
Twitter/YouTube → Scraper Worker → Raw Post stored in DB
    → NLP Parser Worker → Structured Tip candidate
    → Auto-approve (high confidence) OR Human Review Queue
    → Approved Tip stored in `tips` table (immutable)
    → Price Monitor checks tip status every 5 min during market hours
    → Tip status updated: ACTIVE → TARGET_HIT / STOPLOSS_HIT / EXPIRED
    → Score Recalculation Worker (runs daily after market close)
    → Updated RMT Score stored in `creator_scores` + `score_snapshots`

REQUEST FLOW (Public Pages):
User visits /leaderboard
    → Next.js SSR checks Redis cache
    → Cache hit → serve cached HTML (TTL: 5 min)
    → Cache miss → Query PostgreSQL → Compute → Cache → Serve
    → ISR revalidation every 300 seconds
```

---

## 3. PROJECT STRUCTURE

```
ratemytip/
├── CLAUDE.md                          # THIS FILE - Engineering spec
├── README.md                          # Project setup instructions
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── .env.example                       # Environment variable template
├── .env.local                         # Local environment (git-ignored)
├── docker-compose.yml                 # Local dev: Postgres + Redis
├── Dockerfile                         # Production container
├── vitest.config.ts
├── playwright.config.ts
│
├── prisma/
│   ├── schema.prisma                  # Database schema (source of truth)
│   ├── migrations/                    # Auto-generated migrations
│   └── seed.ts                        # Seed data (NSE stocks, test creators)
│
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── layout.tsx                 # Root layout with metadata
│   │   ├── page.tsx                   # Homepage
│   │   ├── globals.css                # Global styles + Tailwind
│   │   │
│   │   ├── (public)/                  # Public-facing pages (no auth)
│   │   │   ├── leaderboard/
│   │   │   │   ├── page.tsx           # Main leaderboard (SSR)
│   │   │   │   └── [category]/
│   │   │   │       └── page.tsx       # Category leaderboards
│   │   │   ├── creator/
│   │   │   │   └── [slug]/
│   │   │   │       ├── page.tsx       # Creator profile (SSR)
│   │   │   │       └── opengraph-image.tsx  # Dynamic OG image
│   │   │   ├── stock/
│   │   │   │   └── [symbol]/
│   │   │   │       └── page.tsx       # Stock page with all tips
│   │   │   ├── tip/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx       # Individual tip detail
│   │   │   └── search/
│   │   │       └── page.tsx           # Search results page
│   │   │
│   │   ├── admin/                     # Admin dashboard (protected)
│   │   │   ├── layout.tsx             # Admin layout with sidebar
│   │   │   ├── page.tsx               # Admin overview/dashboard
│   │   │   ├── review/
│   │   │   │   └── page.tsx           # Tip review queue
│   │   │   ├── creators/
│   │   │   │   ├── page.tsx           # Creator management
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx       # Individual creator admin view
│   │   │   ├── scrapers/
│   │   │   │   └── page.tsx           # Scraper job management
│   │   │   ├── moderation/
│   │   │   │   └── page.tsx           # Moderation logs
│   │   │   └── analytics/
│   │   │       └── page.tsx           # Platform analytics
│   │   │
│   │   ├── api/                       # API Route Handlers
│   │   │   ├── v1/
│   │   │   │   ├── creators/
│   │   │   │   │   ├── route.ts       # GET /api/v1/creators (list)
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── route.ts   # GET /api/v1/creators/:id
│   │   │   │   │       ├── tips/
│   │   │   │   │       │   └── route.ts # GET tips for creator
│   │   │   │   │       └── score-history/
│   │   │   │   │           └── route.ts # GET score history
│   │   │   │   ├── tips/
│   │   │   │   │   ├── route.ts       # GET /api/v1/tips
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── route.ts   # GET /api/v1/tips/:id
│   │   │   │   ├── stocks/
│   │   │   │   │   ├── route.ts       # GET /api/v1/stocks
│   │   │   │   │   └── [symbol]/
│   │   │   │   │       ├── route.ts   # GET stock details + tips
│   │   │   │   │       └── price/
│   │   │   │   │           └── route.ts # GET price data
│   │   │   │   ├── leaderboard/
│   │   │   │   │   └── route.ts       # GET /api/v1/leaderboard
│   │   │   │   └── search/
│   │   │   │       └── route.ts       # GET /api/v1/search
│   │   │   │
│   │   │   ├── admin/                 # Admin-only API routes
│   │   │   │   ├── review/
│   │   │   │   │   ├── route.ts       # GET review queue
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── route.ts   # PATCH approve/reject tip
│   │   │   │   ├── creators/
│   │   │   │   │   └── route.ts       # CRUD creator management
│   │   │   │   ├── scrapers/
│   │   │   │   │   ├── route.ts       # GET/POST scraper jobs
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── route.ts   # Control individual scraper
│   │   │   │   └── moderation/
│   │   │   │       └── route.ts       # Moderation actions
│   │   │   │
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts       # NextAuth handlers
│   │   │   │
│   │   │   └── og/
│   │   │       ├── creator/
│   │   │       │   └── [slug]/
│   │   │       │       └── route.tsx  # Dynamic OG image for creators
│   │   │       └── leaderboard/
│   │   │           └── route.tsx      # Dynamic OG image for leaderboard
│   │   │
│   │   └── sitemap.ts                 # Dynamic sitemap generation
│   │
│   ├── components/                    # React components
│   │   ├── ui/                        # ShadCN base components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── table.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── tooltip.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── progress.tsx
│   │   │   └── pagination.tsx
│   │   │
│   │   ├── layout/                    # Layout components
│   │   │   ├── header.tsx             # Public site header
│   │   │   ├── footer.tsx             # Public site footer
│   │   │   ├── admin-sidebar.tsx      # Admin sidebar navigation
│   │   │   └── admin-header.tsx       # Admin header
│   │   │
│   │   ├── leaderboard/              # Leaderboard-specific components
│   │   │   ├── leaderboard-table.tsx  # Main leaderboard table
│   │   │   ├── leaderboard-filters.tsx # Filter controls
│   │   │   ├── leaderboard-row.tsx    # Individual creator row
│   │   │   └── category-tabs.tsx      # Category tab navigation
│   │   │
│   │   ├── creator/                   # Creator profile components
│   │   │   ├── creator-header.tsx     # Profile header with score
│   │   │   ├── creator-stats.tsx      # Stats grid
│   │   │   ├── creator-score-chart.tsx # Score history chart
│   │   │   ├── creator-tip-feed.tsx   # Tip history feed
│   │   │   ├── creator-accuracy-chart.tsx # Accuracy breakdown
│   │   │   └── creator-platforms.tsx  # Social platform links
│   │   │
│   │   ├── tip/                       # Tip-related components
│   │   │   ├── tip-card.tsx           # Tip display card
│   │   │   ├── tip-status-badge.tsx   # Status indicator
│   │   │   ├── tip-detail.tsx         # Full tip detail view
│   │   │   └── tip-price-chart.tsx    # Price chart with entry/target
│   │   │
│   │   ├── stock/                     # Stock page components
│   │   │   ├── stock-header.tsx       # Stock info header
│   │   │   ├── stock-tip-feed.tsx     # All tips for this stock
│   │   │   ├── stock-consensus.tsx    # Bull/Bear consensus
│   │   │   └── stock-price-chart.tsx  # Price chart
│   │   │
│   │   ├── search/                    # Search components
│   │   │   ├── search-bar.tsx         # Global search input
│   │   │   ├── search-results.tsx     # Results display
│   │   │   └── search-suggestions.tsx # Autocomplete dropdown
│   │   │
│   │   ├── admin/                     # Admin-specific components
│   │   │   ├── review-card.tsx        # Tip review card with actions
│   │   │   ├── review-queue-table.tsx # Review queue table
│   │   │   ├── scraper-status.tsx     # Scraper job status
│   │   │   ├── stats-cards.tsx        # Dashboard stat cards
│   │   │   ├── analytics-charts.tsx   # Admin analytics charts
│   │   │   └── moderation-log.tsx     # Moderation action log
│   │   │
│   │   └── shared/                    # Shared/utility components
│   │       ├── score-badge.tsx        # RMT Score display badge
│   │       ├── score-ring.tsx         # Circular score visualization
│   │       ├── share-button.tsx       # Social share button
│   │       ├── data-table.tsx         # Generic data table with sort/filter
│   │       ├── empty-state.tsx        # Empty state placeholder
│   │       ├── loading-skeleton.tsx   # Loading skeletons
│   │       ├── error-boundary.tsx     # Error boundary wrapper
│   │       ├── time-ago.tsx           # Relative time display
│   │       └── format-number.tsx      # Number formatting utility
│   │
│   ├── lib/                           # Core library code
│   │   ├── db.ts                      # Prisma client singleton
│   │   ├── redis.ts                   # Redis client singleton
│   │   ├── auth.ts                    # NextAuth configuration
│   │   ├── constants.ts               # Application constants
│   │   ├── errors.ts                  # Custom error classes
│   │   │
│   │   ├── scoring/                   # Scoring algorithm
│   │   │   ├── index.ts              # Main scoring orchestrator
│   │   │   ├── accuracy.ts           # Accuracy rate calculation
│   │   │   ├── risk-adjusted.ts      # Risk-adjusted return calculation
│   │   │   ├── consistency.ts        # Consistency score calculation
│   │   │   ├── volume-factor.ts      # Volume factor calculation
│   │   │   ├── composite.ts          # Composite RMT Score
│   │   │   └── types.ts              # Scoring types
│   │   │
│   │   ├── scraper/                   # Scraping engine
│   │   │   ├── index.ts              # Scraper orchestrator
│   │   │   ├── twitter.ts            # Twitter/X scraper
│   │   │   ├── youtube.ts            # YouTube scraper
│   │   │   ├── rate-limiter.ts       # API rate limit manager
│   │   │   └── types.ts              # Scraper types
│   │   │
│   │   ├── parser/                    # NLP Tip Parser
│   │   │   ├── index.ts              # Parser orchestrator
│   │   │   ├── extractor.ts          # Entity extraction (stock, price, target)
│   │   │   ├── normalizer.ts         # Stock name normalization
│   │   │   ├── confidence.ts         # Confidence scoring
│   │   │   ├── templates.ts          # Common tip format templates
│   │   │   └── types.ts              # Parser types
│   │   │
│   │   ├── market-data/               # Market data service
│   │   │   ├── index.ts              # Market data orchestrator
│   │   │   ├── nse.ts                # NSE India data feed
│   │   │   ├── bse.ts                # BSE India data feed
│   │   │   ├── yahoo-finance.ts      # Yahoo Finance fallback
│   │   │   ├── price-monitor.ts      # Active tip price monitoring
│   │   │   └── types.ts              # Market data types
│   │   │
│   │   ├── queue/                     # Job queue management
│   │   │   ├── index.ts              # Queue setup and exports
│   │   │   ├── queues.ts             # Queue definitions
│   │   │   └── workers/              # Worker implementations
│   │   │       ├── scrape-worker.ts  # Scraping job processor
│   │   │       ├── parse-worker.ts   # NLP parsing job processor
│   │   │       ├── score-worker.ts   # Score calculation processor
│   │   │       ├── price-worker.ts   # Price feed processor
│   │   │       └── tip-status-worker.ts # Tip status update processor
│   │   │
│   │   ├── validators/                # Zod validation schemas
│   │   │   ├── tip.ts                # Tip validation
│   │   │   ├── creator.ts            # Creator validation
│   │   │   ├── query.ts              # Query parameter validation
│   │   │   └── admin.ts              # Admin action validation
│   │   │
│   │   └── utils/                     # Utility functions
│   │       ├── format.ts             # Number/date formatting
│   │       ├── slug.ts               # URL slug generation
│   │       ├── crypto.ts             # Hashing for immutable records
│   │       ├── pagination.ts         # Cursor-based pagination helpers
│   │       └── stock-lookup.ts       # Stock symbol/name lookup
│   │
│   ├── hooks/                         # React hooks
│   │   ├── use-debounce.ts
│   │   ├── use-search.ts
│   │   └── use-leaderboard-filters.ts
│   │
│   └── types/                         # Global TypeScript types
│       ├── index.ts                   # Re-exports
│       ├── creator.ts                 # Creator types
│       ├── tip.ts                     # Tip types
│       ├── score.ts                   # Score types
│       ├── stock.ts                   # Stock types
│       └── api.ts                     # API response types
│
├── workers/                           # Standalone worker process
│   ├── index.ts                       # Worker entry point
│   └── start.ts                       # Worker startup script
│
├── scripts/                           # Utility scripts
│   ├── seed-stocks.ts                 # Seed NSE/BSE stock master
│   ├── seed-creators.ts              # Seed initial 500 creators
│   ├── backfill-prices.ts            # Backfill historical prices
│   ├── recalculate-scores.ts         # Force recalculate all scores
│   └── generate-sitemap.ts           # Generate static sitemap
│
├── public/
│   ├── favicon.ico
│   ├── logo.svg
│   ├── og-default.png                # Default OG image
│   └── robots.txt
│
└── tests/
    ├── unit/
    │   ├── scoring/                   # Scoring algorithm tests
    │   │   ├── accuracy.test.ts
    │   │   ├── risk-adjusted.test.ts
    │   │   ├── consistency.test.ts
    │   │   └── composite.test.ts
    │   ├── parser/                    # NLP parser tests
    │   │   ├── extractor.test.ts
    │   │   └── normalizer.test.ts
    │   └── utils/                     # Utility tests
    ├── integration/
    │   ├── api/                       # API endpoint tests
    │   └── scoring/                   # End-to-end scoring tests
    └── e2e/
        ├── leaderboard.spec.ts
        ├── creator-profile.spec.ts
        └── search.spec.ts
```

---

## 4. CODING CONVENTIONS

### 4.1 TypeScript Rules

```typescript
// tsconfig.json strict mode is MANDATORY
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "forceConsistentCasingInFileNames": true,
    "exactOptionalPropertyTypes": false // Too strict for Prisma
  }
}
```

**Rules:**
- NEVER use `any`. Use `unknown` and narrow with type guards.
- ALWAYS define return types for exported functions.
- Use `interface` for object shapes, `type` for unions/intersections.
- Use `as const` for constant arrays and objects.
- Prefer `readonly` arrays and properties where mutation is not needed.
- All API responses must use a consistent envelope type (see Section 12).

### 4.2 Naming Conventions

| Entity | Convention | Example |
|--------|-----------|---------|
| Files/folders | kebab-case | `tip-card.tsx`, `score-worker.ts` |
| React components | PascalCase | `LeaderboardTable`, `ScoreBadge` |
| Functions | camelCase | `calculateAccuracy`, `fetchCreator` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_TIPS_PER_PAGE`, `CACHE_TTL` |
| Types/Interfaces | PascalCase | `Creator`, `TipStatus`, `RMTScore` |
| Database tables | snake_case (plural) | `creators`, `tips`, `score_snapshots` |
| Database columns | snake_case | `entry_price`, `created_at`, `rmt_score` |
| API routes | kebab-case | `/api/v1/score-history` |
| Environment vars | SCREAMING_SNAKE_CASE | `DATABASE_URL`, `REDIS_URL` |
| CSS classes | Tailwind utilities only | No custom CSS classes unless absolutely necessary |

### 4.3 Code Style Rules

- **Max file length:** 300 lines. If longer, split into smaller modules.
- **Max function length:** 50 lines. Extract helpers.
- **Imports:** Group in order: (1) Node built-ins, (2) External packages, (3) Internal `@/` imports. Blank line between groups.
- **Error handling:** Always use typed errors. Never catch and swallow.
- **Comments:** Explain WHY, not WHAT. No commented-out code.
- **Console.log:** NEVER in production code. Use the Pino logger.
- **Magic numbers:** Extract to named constants in `constants.ts`.

### 4.4 Component Patterns

```typescript
// ALWAYS: Server Components by default (no "use client" unless needed)
// ALWAYS: Props interface defined before component
// ALWAYS: Loading states with Skeleton components
// ALWAYS: Error boundaries around data-fetching components

// Example pattern:
interface CreatorHeaderProps {
  readonly creator: CreatorWithScore;
}

export function CreatorHeader({ creator }: CreatorHeaderProps): React.ReactElement {
  return (
    <div className="flex items-center gap-4">
      {/* component content */}
    </div>
  );
}
```

### 4.5 Data Fetching Patterns

```typescript
// SERVER COMPONENTS: Fetch directly in the component
// Use Next.js caching with revalidation
async function LeaderboardPage() {
  const data = await getLeaderboard({ revalidate: 300 }); // 5 min cache
  return <LeaderboardTable data={data} />;
}

// CLIENT COMPONENTS: Use SWR for client-side data
"use client";
import useSWR from "swr";
function SearchResults({ query }: { query: string }) {
  const { data, isLoading } = useSWR(`/api/v1/search?q=${query}`, fetcher);
  // ...
}
```

---

## 5. ENVIRONMENT & CONFIGURATION

### 5.1 Environment Variables

```bash
# .env.example — Copy to .env.local for development

# ──── Database ────
DATABASE_URL="postgresql://ratemytip:ratemytip@localhost:5432/ratemytip?schema=public"
DIRECT_URL="postgresql://ratemytip:ratemytip@localhost:5432/ratemytip?schema=public"

# ──── Redis ────
REDIS_URL="redis://localhost:6379"

# ──── NextAuth ────
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-32-char-secret-here"
# Admin credentials (Phase 1: simple credential-based auth)
ADMIN_EMAIL="admin@ratemytip.com"
ADMIN_PASSWORD_HASH="bcrypt-hash-here"

# ──── Twitter/X API ────
TWITTER_BEARER_TOKEN="your-twitter-api-v2-bearer-token"
TWITTER_API_KEY="your-api-key"
TWITTER_API_SECRET="your-api-secret"
TWITTER_RATE_LIMIT_PER_15MIN=300

# ──── YouTube Data API ────
YOUTUBE_API_KEY="your-youtube-data-api-v3-key"
YOUTUBE_RATE_LIMIT_PER_DAY=10000

# ──── Market Data ────
# Yahoo Finance (no key needed, but rate limited)
YAHOO_FINANCE_RATE_LIMIT=5  # requests per second

# Alpha Vantage (backup/extended data)
ALPHA_VANTAGE_API_KEY="your-key"

# ──── OpenAI (for NLP tip parsing) ────
OPENAI_API_KEY="your-openai-api-key"
OPENAI_MODEL="gpt-4o-mini"  # Cost-effective for parsing

# ──── Application ────
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="RateMyTip"
NODE_ENV="development"

# ──── Sentry ────
SENTRY_DSN="your-sentry-dsn"
NEXT_PUBLIC_SENTRY_DSN="your-sentry-dsn"

# ──── Feature Flags ────
ENABLE_TWITTER_SCRAPER="true"
ENABLE_YOUTUBE_SCRAPER="true"
ENABLE_PRICE_MONITOR="true"
ENABLE_SCORE_CALCULATION="true"
```

### 5.2 Docker Compose (Local Development)

```yaml
# docker-compose.yml
version: "3.9"
services:
  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: ratemytip
      POSTGRES_USER: ratemytip
      POSTGRES_PASSWORD: ratemytip
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ratemytip"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
  redisdata:
```

### 5.3 Application Constants

```typescript
// src/lib/constants.ts

// ──── Scoring ────
export const SCORING = {
  WEIGHTS: {
    ACCURACY: 0.40,
    RISK_ADJUSTED_RETURN: 0.30,
    CONSISTENCY: 0.20,
    VOLUME_FACTOR: 0.10,
  },
  MIN_TIPS_FOR_RATING: 20,
  MIN_TIPS_FOR_DISPLAY: 5,
  SCORE_MAX: 100,
  SCORE_MIN: 0,
  ROLLING_WINDOWS: {
    SHORT: 30,   // 30-day window
    MEDIUM: 90,  // 90-day window
    LONG: 365,   // 1-year window
  },
  RECENCY_DECAY_HALFLIFE_DAYS: 90,
  CONFIDENCE_Z_SCORE: 1.96, // 95% confidence interval
} as const;

// ──── Tip Status ────
export const TIP_STATUS = {
  PENDING_REVIEW: "PENDING_REVIEW",
  ACTIVE: "ACTIVE",
  TARGET_1_HIT: "TARGET_1_HIT",
  TARGET_2_HIT: "TARGET_2_HIT",
  TARGET_3_HIT: "TARGET_3_HIT",
  ALL_TARGETS_HIT: "ALL_TARGETS_HIT",
  STOPLOSS_HIT: "STOPLOSS_HIT",
  EXPIRED: "EXPIRED",
  REJECTED: "REJECTED",
} as const;

// ──── Tip Direction ────
export const TIP_DIRECTION = {
  BUY: "BUY",
  SELL: "SELL",
} as const;

// ──── Tip Timeframe ────
export const TIP_TIMEFRAME = {
  INTRADAY: "INTRADAY",       // Same day
  SWING: "SWING",             // 2-14 days
  POSITIONAL: "POSITIONAL",   // 15-90 days
  LONG_TERM: "LONG_TERM",     // 90+ days
} as const;

// Timeframe expiry in days
export const TIMEFRAME_EXPIRY_DAYS: Record<string, number> = {
  INTRADAY: 1,
  SWING: 14,
  POSITIONAL: 90,
  LONG_TERM: 365,
};

// ──── Asset Classes ────
export const ASSET_CLASS = {
  EQUITY_NSE: "EQUITY_NSE",
  EQUITY_BSE: "EQUITY_BSE",
  INDEX: "INDEX",
  FUTURES: "FUTURES",
  OPTIONS: "OPTIONS",
  CRYPTO: "CRYPTO",
  COMMODITY: "COMMODITY",
} as const;

// ──── Creator Tiers ────
export const CREATOR_TIER = {
  UNRATED: "UNRATED",        // < MIN_TIPS_FOR_RATING tips
  BRONZE: "BRONZE",          // 20-49 tips
  SILVER: "SILVER",          // 50-199 tips
  GOLD: "GOLD",              // 200-499 tips
  PLATINUM: "PLATINUM",      // 500-999 tips
  DIAMOND: "DIAMOND",        // 1000+ tips
} as const;

// ──── Pagination ────
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  LEADERBOARD_PAGE_SIZE: 50,
} as const;

// ──── Cache TTLs (in seconds) ────
export const CACHE_TTL = {
  LEADERBOARD: 300,          // 5 minutes
  CREATOR_PROFILE: 600,      // 10 minutes
  STOCK_PAGE: 300,           // 5 minutes
  SEARCH_RESULTS: 60,        // 1 minute
  MARKET_PRICE: 30,          // 30 seconds during market hours
  CREATOR_SCORE: 3600,       // 1 hour (updated daily)
} as const;

// ──── Scraper ────
export const SCRAPER = {
  TWITTER_BATCH_SIZE: 100,
  YOUTUBE_BATCH_SIZE: 50,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 5000,
  SCRAPE_INTERVAL_HOURS: 6,
} as const;

// ──── NLP Parser ────
export const PARSER = {
  HIGH_CONFIDENCE_THRESHOLD: 0.85,  // Auto-approve above this
  LOW_CONFIDENCE_THRESHOLD: 0.40,   // Auto-reject below this
  // Between LOW and HIGH → Human review queue
} as const;

// ──── Market Hours (IST) ────
export const MARKET_HOURS = {
  NSE_OPEN: { hour: 9, minute: 15 },
  NSE_CLOSE: { hour: 15, minute: 30 },
  TIMEZONE: "Asia/Kolkata",
  PRICE_CHECK_INTERVAL_MS: 300_000, // 5 minutes
} as const;
```

---

## 6. DATABASE SCHEMA

### 6.1 Prisma Schema

This is the COMPLETE schema for Phase 1. Copy exactly into `prisma/schema.prisma`:

```prisma
// prisma/schema.prisma

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "fullTextIndex"]
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ════════════════════════════════════════
// ADMIN USERS (Phase 1: only admins have accounts)
// ════════════════════════════════════════

model AdminUser {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String   @map("password_hash")
  name          String
  role          AdminRole @default(MODERATOR)
  isActive      Boolean  @default(true) @map("is_active")
  lastLoginAt   DateTime? @map("last_login_at")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  // Relations
  moderationActions ModerationAction[]
  reviewActions     ReviewAction[]

  @@map("admin_users")
}

enum AdminRole {
  SUPER_ADMIN
  ADMIN
  MODERATOR
}

// ════════════════════════════════════════
// CREATORS (Influencers / Analysts being tracked)
// ════════════════════════════════════════

model Creator {
  id              String        @id @default(cuid())
  slug            String        @unique  // URL-friendly identifier
  displayName     String        @map("display_name")
  bio             String?
  profileImageUrl String?       @map("profile_image_url")
  isVerified      Boolean       @default(false) @map("is_verified")
  isClaimed       Boolean       @default(false) @map("is_claimed") // Phase 2
  isActive        Boolean       @default(true) @map("is_active")
  tier            CreatorTier   @default(UNRATED)

  // Specialization tags (stored as array)
  specializations String[]      @default([])  // e.g., ["INTRADAY", "LARGE_CAP", "OPTIONS"]

  // Aggregated stats (denormalized for performance — recalculated by score worker)
  totalTips       Int           @default(0) @map("total_tips")
  activeTips      Int           @default(0) @map("active_tips")
  completedTips   Int           @default(0) @map("completed_tips")
  followerCount   Int           @default(0) @map("follower_count") // Aggregated from platforms

  // Timestamps
  firstTipAt      DateTime?     @map("first_tip_at")
  lastTipAt       DateTime?     @map("last_tip_at")
  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")

  // Relations
  platforms       CreatorPlatform[]
  tips            Tip[]
  currentScore    CreatorScore?    @relation("CurrentScore")
  scoreSnapshots  ScoreSnapshot[]
  moderationActions ModerationAction[]

  // Indexes
  @@index([slug])
  @@index([tier])
  @@index([totalTips])
  @@index([isActive])
  @@index([createdAt])
  @@map("creators")
}

enum CreatorTier {
  UNRATED
  BRONZE
  SILVER
  GOLD
  PLATINUM
  DIAMOND
}

// ════════════════════════════════════════
// CREATOR PLATFORMS (Social media accounts)
// ════════════════════════════════════════

model CreatorPlatform {
  id              String      @id @default(cuid())
  creatorId       String      @map("creator_id")
  platform        Platform
  platformUserId  String      @map("platform_user_id")  // Twitter ID, YouTube channel ID
  platformHandle  String      @map("platform_handle")    // @username or channel name
  platformUrl     String      @map("platform_url")       // Full URL to profile
  followerCount   Int         @default(0) @map("follower_count")
  isActive        Boolean     @default(true) @map("is_active")
  lastScrapedAt   DateTime?   @map("last_scraped_at")
  createdAt       DateTime    @default(now()) @map("created_at")
  updatedAt       DateTime    @updatedAt @map("updated_at")

  // Relations
  creator         Creator     @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  rawPosts        RawPost[]

  @@unique([platform, platformUserId])
  @@index([creatorId])
  @@index([platform])
  @@map("creator_platforms")
}

enum Platform {
  TWITTER
  YOUTUBE
  TELEGRAM
  WEBSITE
}

// ════════════════════════════════════════
// RAW POSTS (Scraped social media posts before parsing)
// ════════════════════════════════════════

model RawPost {
  id                String    @id @default(cuid())
  creatorPlatformId String    @map("creator_platform_id")
  platformPostId    String    @map("platform_post_id")  // Tweet ID, Video ID
  content           String    // Raw text content
  mediaUrls         String[]  @default([]) @map("media_urls")
  postedAt          DateTime  @map("posted_at")  // Original post timestamp
  scrapedAt         DateTime  @default(now()) @map("scraped_at")
  isParsed          Boolean   @default(false) @map("is_parsed")
  isTipContent      Boolean?  @map("is_tip_content")  // null = not classified yet
  parseConfidence   Float?    @map("parse_confidence")
  metadata          Json?     // Platform-specific metadata (likes, retweets, etc.)

  // Relations
  creatorPlatform   CreatorPlatform @relation(fields: [creatorPlatformId], references: [id], onDelete: Cascade)
  tips              Tip[]

  @@unique([creatorPlatformId, platformPostId])
  @@index([isParsed])
  @@index([isTipContent])
  @@index([postedAt])
  @@map("raw_posts")
}

// ════════════════════════════════════════
// STOCKS (Master stock list)
// ════════════════════════════════════════

model Stock {
  id            String      @id @default(cuid())
  symbol        String      @unique  // e.g., "RELIANCE", "TCS", "NIFTY"
  exchange      Exchange
  name          String               // Full name: "Reliance Industries Limited"
  sector        String?              // e.g., "Oil & Gas", "IT"
  industry      String?
  marketCap     MarketCap?  @map("market_cap")  // LARGE, MID, SMALL
  isIndex       Boolean     @default(false) @map("is_index")
  isActive      Boolean     @default(true) @map("is_active")
  lastPrice     Float?      @map("last_price")
  lastPriceAt   DateTime?   @map("last_price_at")
  createdAt     DateTime    @default(now()) @map("created_at")
  updatedAt     DateTime    @updatedAt @map("updated_at")

  // Relations
  tips          Tip[]
  priceHistory  StockPrice[]

  // Full-text search
  @@index([symbol])
  @@index([exchange])
  @@index([isActive])
  @@map("stocks")
}

enum Exchange {
  NSE
  BSE
  MCX
  CRYPTO
  INDEX
}

enum MarketCap {
  LARGE
  MID
  SMALL
  MICRO
}

// ════════════════════════════════════════
// STOCK PRICES (Historical price data)
// ════════════════════════════════════════

model StockPrice {
  id        String   @id @default(cuid())
  stockId   String   @map("stock_id")
  date      DateTime @db.Date  // Trading date
  open      Float
  high      Float
  low       Float
  close     Float
  volume    BigInt?
  source    String   @default("YAHOO")  // Data source

  // Relations
  stock     Stock    @relation(fields: [stockId], references: [id], onDelete: Cascade)

  @@unique([stockId, date])
  @@index([stockId, date(sort: Desc)])
  @@map("stock_prices")
}

// ════════════════════════════════════════
// TIPS (The core entity — IMMUTABLE after creation)
// ════════════════════════════════════════

model Tip {
  id              String      @id @default(cuid())
  creatorId       String      @map("creator_id")
  stockId         String      @map("stock_id")
  rawPostId       String?     @map("raw_post_id")  // Source post (null if manually entered)

  // ──── Immutable Tip Data (NEVER modified after creation) ────
  direction       TipDirection
  assetClass      AssetClass  @map("asset_class")
  entryPrice      Float       @map("entry_price")
  target1         Float       // Primary target
  target2         Float?      // Secondary target (optional)
  target3         Float?      // Tertiary target (optional)
  stopLoss        Float       @map("stop_loss")
  timeframe       TipTimeframe
  conviction      Conviction  @default(MEDIUM)
  rationale       String?     // Creator's reasoning (optional)
  sourceUrl       String?     @map("source_url")  // Link to original post

  // ──── Integrity Fields ────
  contentHash     String      @unique @map("content_hash")  // SHA-256 hash of tip data
  tipTimestamp    DateTime    @map("tip_timestamp")  // When the tip was originally posted
  priceAtTip      Float?      @map("price_at_tip")  // CMP when tip was recorded

  // ──── Mutable Status Fields (updated by price monitor) ────
  status          TipStatus   @default(PENDING_REVIEW)
  statusUpdatedAt DateTime?   @map("status_updated_at")
  target1HitAt    DateTime?   @map("target1_hit_at")
  target2HitAt    DateTime?   @map("target2_hit_at")
  target3HitAt    DateTime?   @map("target3_hit_at")
  stopLossHitAt   DateTime?   @map("stoploss_hit_at")
  expiresAt       DateTime    @map("expires_at")  // Calculated from timeframe
  closedPrice     Float?      @map("closed_price")  // Price when tip was resolved
  closedAt        DateTime?   @map("closed_at")

  // ──── Computed Performance (set when tip is resolved) ────
  returnPct       Float?      @map("return_pct")   // Actual return percentage
  riskRewardRatio Float?      @map("risk_reward_ratio")  // Actual R:R achieved
  maxDrawdownPct  Float?      @map("max_drawdown_pct")  // Max adverse move during tip

  // ──── Review Fields ────
  reviewStatus    ReviewStatus @default(PENDING) @map("review_status")
  reviewedAt      DateTime?   @map("reviewed_at")
  reviewNote      String?     @map("review_note")
  parseConfidence Float?      @map("parse_confidence")  // NLP confidence 0-1

  // ──── Timestamps ────
  createdAt       DateTime    @default(now()) @map("created_at")
  updatedAt       DateTime    @updatedAt @map("updated_at")

  // Relations
  creator         Creator     @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  stock           Stock       @relation(fields: [stockId], references: [id])
  rawPost         RawPost?    @relation(fields: [rawPostId], references: [id])
  amendments      TipAmendment[]
  reviewActions   ReviewAction[]

  // Indexes
  @@index([creatorId, status])
  @@index([creatorId, tipTimestamp(sort: Desc)])
  @@index([stockId, tipTimestamp(sort: Desc)])
  @@index([status])
  @@index([reviewStatus])
  @@index([expiresAt])
  @@index([tipTimestamp(sort: Desc)])
  @@map("tips")
}

enum TipDirection {
  BUY
  SELL
}

enum AssetClass {
  EQUITY_NSE
  EQUITY_BSE
  INDEX
  FUTURES
  OPTIONS
  CRYPTO
  COMMODITY
}

enum TipTimeframe {
  INTRADAY
  SWING
  POSITIONAL
  LONG_TERM
}

enum Conviction {
  LOW
  MEDIUM
  HIGH
}

enum TipStatus {
  PENDING_REVIEW
  ACTIVE
  TARGET_1_HIT
  TARGET_2_HIT
  TARGET_3_HIT
  ALL_TARGETS_HIT
  STOPLOSS_HIT
  EXPIRED
  REJECTED
}

enum ReviewStatus {
  PENDING
  AUTO_APPROVED
  MANUALLY_APPROVED
  REJECTED
  NEEDS_EDIT
}

// ════════════════════════════════════════
// TIP AMENDMENTS (Logged changes — for transparency)
// ════════════════════════════════════════

model TipAmendment {
  id          String   @id @default(cuid())
  tipId       String   @map("tip_id")
  field       String   // Which field was amended
  oldValue    String   @map("old_value")
  newValue    String   @map("new_value")
  reason      String?
  amendedAt   DateTime @default(now()) @map("amended_at")

  // Relations
  tip         Tip      @relation(fields: [tipId], references: [id], onDelete: Cascade)

  @@index([tipId])
  @@map("tip_amendments")
}

// ════════════════════════════════════════
// CREATOR SCORES (Current score — one per creator)
// ════════════════════════════════════════

model CreatorScore {
  id                  String   @id @default(cuid())
  creatorId           String   @unique @map("creator_id")

  // ──── Component Scores (0-100 each) ────
  accuracyScore       Float    @map("accuracy_score")
  riskAdjustedScore   Float    @map("risk_adjusted_score")
  consistencyScore    Float    @map("consistency_score")
  volumeFactorScore   Float    @map("volume_factor_score")

  // ──── Composite Score ────
  rmtScore            Float    @map("rmt_score")  // THE score: 0-100
  confidenceInterval  Float    @map("confidence_interval")  // +/- range

  // ──── Raw Metrics ────
  accuracyRate        Float    @map("accuracy_rate")        // 0-1 (percentage as decimal)
  avgReturnPct        Float    @map("avg_return_pct")       // Average return per tip
  avgRiskRewardRatio  Float    @map("avg_risk_reward_ratio")
  winStreak           Int      @default(0) @map("win_streak")
  lossStreak          Int      @default(0) @map("loss_streak")
  bestTipReturnPct    Float?   @map("best_tip_return_pct")
  worstTipReturnPct   Float?   @map("worst_tip_return_pct")

  // ──── Breakdown by Timeframe ────
  intradayAccuracy    Float?   @map("intraday_accuracy")
  swingAccuracy       Float?   @map("swing_accuracy")
  positionalAccuracy  Float?   @map("positional_accuracy")
  longTermAccuracy    Float?   @map("long_term_accuracy")

  // ──── Metadata ────
  totalScoredTips     Int      @map("total_scored_tips")
  scorePeriodStart    DateTime @map("score_period_start")
  scorePeriodEnd      DateTime @map("score_period_end")
  calculatedAt        DateTime @map("calculated_at")

  // Relations
  creator             Creator  @relation("CurrentScore", fields: [creatorId], references: [id], onDelete: Cascade)

  @@index([rmtScore(sort: Desc)])
  @@index([accuracyRate(sort: Desc)])
  @@map("creator_scores")
}

// ════════════════════════════════════════
// SCORE SNAPSHOTS (Daily score history for charts)
// ════════════════════════════════════════

model ScoreSnapshot {
  id              String   @id @default(cuid())
  creatorId       String   @map("creator_id")
  date            DateTime @db.Date
  rmtScore        Float    @map("rmt_score")
  accuracyRate    Float    @map("accuracy_rate")
  totalScoredTips Int      @map("total_scored_tips")

  // Relations
  creator         Creator  @relation(fields: [creatorId], references: [id], onDelete: Cascade)

  @@unique([creatorId, date])
  @@index([creatorId, date(sort: Desc)])
  @@map("score_snapshots")
}

// ════════════════════════════════════════
// SCRAPE JOBS (Job tracking for scrapers)
// ════════════════════════════════════════

model ScrapeJob {
  id              String      @id @default(cuid())
  platform        Platform
  jobType         ScrapeJobType @map("job_type")
  status          JobStatus   @default(QUEUED)
  creatorPlatformId String?   @map("creator_platform_id")
  postsFound      Int         @default(0) @map("posts_found")
  tipsExtracted   Int         @default(0) @map("tips_extracted")
  errorMessage    String?     @map("error_message")
  startedAt       DateTime?   @map("started_at")
  completedAt     DateTime?   @map("completed_at")
  createdAt       DateTime    @default(now()) @map("created_at")
  metadata        Json?       // Additional job metadata

  @@index([status])
  @@index([platform])
  @@index([createdAt(sort: Desc)])
  @@map("scrape_jobs")
}

enum ScrapeJobType {
  FULL_SCRAPE
  INCREMENTAL
  SINGLE_CREATOR
  BACKFILL
}

enum JobStatus {
  QUEUED
  RUNNING
  COMPLETED
  FAILED
  CANCELLED
}

// ════════════════════════════════════════
// REVIEW ACTIONS (Audit trail for human reviews)
// ════════════════════════════════════════

model ReviewAction {
  id          String       @id @default(cuid())
  tipId       String       @map("tip_id")
  adminId     String       @map("admin_id")
  action      ReviewActionType
  note        String?
  createdAt   DateTime     @default(now()) @map("created_at")

  // Relations
  tip         Tip          @relation(fields: [tipId], references: [id], onDelete: Cascade)
  admin       AdminUser    @relation(fields: [adminId], references: [id])

  @@index([tipId])
  @@index([adminId])
  @@map("review_actions")
}

enum ReviewActionType {
  APPROVED
  REJECTED
  EDITED_AND_APPROVED
  SENT_BACK_FOR_REVIEW
}

// ════════════════════════════════════════
// MODERATION ACTIONS (Creator-level moderation)
// ════════════════════════════════════════

model ModerationAction {
  id          String          @id @default(cuid())
  creatorId   String          @map("creator_id")
  adminId     String          @map("admin_id")
  action      ModerationType
  reason      String
  createdAt   DateTime        @default(now()) @map("created_at")

  // Relations
  creator     Creator         @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  admin       AdminUser       @relation(fields: [adminId], references: [id])

  @@index([creatorId])
  @@map("moderation_actions")
}

enum ModerationType {
  ACTIVATED
  DEACTIVATED
  FLAGGED
  UNFLAGGED
  NOTE_ADDED
}
```

### 6.2 Key Schema Design Decisions

1. **Immutability of Tips:** Once a tip is created and approved, the core fields (entryPrice, target1/2/3, stopLoss, direction, timeframe) are NEVER modified. The `contentHash` field stores a SHA-256 hash of these fields at creation time for integrity verification.

2. **Separation of Raw Posts and Tips:** Raw scraped posts (`raw_posts`) are stored separately from parsed tips (`tips`). A single raw post might contain multiple tips, or might not contain a tip at all.

3. **Denormalized Counts on Creator:** `totalTips`, `activeTips`, `completedTips` are denormalized onto the creator record for query performance. These are recalculated by the scoring worker.

4. **Score as Separate Table:** `CreatorScore` is a separate one-to-one table (not columns on Creator) because scores are fully recomputed on each calculation cycle. `ScoreSnapshot` stores daily history for charting.

5. **Review Audit Trail:** Every human review action is logged in `review_actions` with the admin who performed it. This creates a complete audit trail.

---

## 7. AUTHENTICATION & AUTHORIZATION

### 7.1 Phase 1 Auth Model

Phase 1 has a simple auth model:
- **Public pages:** No authentication. All leaderboard, creator, stock, and search pages are publicly accessible.
- **Admin dashboard:** Credential-based login for admin users.
- **API routes:** Public endpoints are open (rate-limited). Admin endpoints require valid session.

### 7.2 NextAuth Configuration

```typescript
// src/lib/auth.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const admin = await db.adminUser.findUnique({
          where: { email: credentials.email as string, isActive: true },
        });
        if (!admin) return null;

        const isValid = await compare(credentials.password as string, admin.passwordHash);
        if (!isValid) return null;

        await db.adminUser.update({
          where: { id: admin.id },
          data: { lastLoginAt: new Date() },
        });

        return { id: admin.id, email: admin.email, name: admin.name, role: admin.role };
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.adminId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role as string;
      session.user.adminId = token.adminId as string;
      return session;
    },
  },
});
```

### 7.3 Admin Route Protection

```typescript
// Middleware pattern for admin routes
// src/middleware.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
  const isAdminApi = req.nextUrl.pathname.startsWith("/api/admin");
  const isLoginPage = req.nextUrl.pathname === "/admin/login";

  if ((isAdminRoute || isAdminApi) && !isLoginPage && !req.auth) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
```

---

## 8. SCORING ALGORITHM — THE RMT SCORE

### 8.1 Overview

The RMT Score is a composite score from 0-100 that quantifies a tip creator's performance. It is calculated daily after market close for all creators with at least `MIN_TIPS_FOR_RATING` (20) completed tips.

```
RMT Score = (0.40 × Accuracy Score)
          + (0.30 × Risk-Adjusted Return Score)
          + (0.20 × Consistency Score)
          + (0.10 × Volume Factor Score)
```

All component scores are normalized to 0-100 before weighting.

### 8.2 Component 1: Accuracy Score (Weight: 40%)

```
Accuracy Rate = Σ(tips where target1 was hit) / Σ(completed tips)

A completed tip is one with status: TARGET_1_HIT, TARGET_2_HIT, TARGET_3_HIT,
ALL_TARGETS_HIT, STOPLOSS_HIT, or EXPIRED.

A "hit" is any tip where at least Target 1 was reached before
stop-loss was hit AND before expiry.

Accuracy Score = accuracy_rate × 100

Recency-weighted version:
  weight(tip) = e^(-λ × days_since_tip)
  where λ = ln(2) / RECENCY_DECAY_HALFLIFE_DAYS (90 days)

  Weighted Accuracy = Σ(weight × hit) / Σ(weight)
```

**Implementation:**

```typescript
// src/lib/scoring/accuracy.ts
interface AccuracyInput {
  tips: CompletedTip[];
  halfLifeDays: number;
}

interface AccuracyOutput {
  accuracyRate: number;         // 0-1
  weightedAccuracyRate: number; // 0-1 (recency-weighted)
  accuracyScore: number;        // 0-100
  totalCompleted: number;
  totalHit: number;
}

function calculateAccuracy(input: AccuracyInput): AccuracyOutput {
  const now = new Date();
  const lambda = Math.LN2 / input.halfLifeDays;
  let weightedHits = 0;
  let weightedTotal = 0;
  let totalHit = 0;

  for (const tip of input.tips) {
    const daysAgo = differenceInDays(now, tip.closedAt);
    const weight = Math.exp(-lambda * daysAgo);
    const isHit = isTargetHit(tip.status);

    weightedTotal += weight;
    if (isHit) {
      weightedHits += weight;
      totalHit++;
    }
  }

  const accuracyRate = input.tips.length > 0 ? totalHit / input.tips.length : 0;
  const weightedAccuracyRate = weightedTotal > 0 ? weightedHits / weightedTotal : 0;

  return {
    accuracyRate,
    weightedAccuracyRate,
    accuracyScore: weightedAccuracyRate * 100,
    totalCompleted: input.tips.length,
    totalHit,
  };
}
```

### 8.3 Component 2: Risk-Adjusted Return Score (Weight: 30%)

```
For each completed tip:
  IF tip hit target:
    return_pct = (target1 - entry_price) / entry_price × 100  (for BUY)
    risk_pct   = (entry_price - stop_loss) / entry_price × 100
    risk_reward = return_pct / risk_pct
  IF tip hit stop-loss:
    return_pct = -(entry_price - stop_loss) / entry_price × 100 (negative)
    risk_reward = -1 (full risk realized)
  IF tip expired:
    return_pct = (closing_price - entry_price) / entry_price × 100
    risk_reward = return_pct / risk_pct

Average Risk-Adjusted Return = mean(risk_reward for all completed tips)

Normalize to 0-100:
  Raw range is typically -2 to +5.
  score = clamp((avg_rr + 2) / 7 × 100, 0, 100)

  Where:
    avg_rr = -2 → score = 0
    avg_rr = 0  → score = 28.6
    avg_rr = 1  → score = 42.9
    avg_rr = 2  → score = 57.1
    avg_rr = 5  → score = 100
```

**Tip return calculation for multi-target tips:**

```
If only target1 hit: return = (target1 - entry) / entry
If target2 also hit: return = weighted average
  = 0.5 × (target1 - entry)/entry + 0.5 × (target2 - entry)/entry
If all 3 targets hit: return = weighted average
  = 0.33 × T1_return + 0.33 × T2_return + 0.34 × T3_return
```

### 8.4 Component 3: Consistency Score (Weight: 20%)

```
Measures performance variance over rolling windows.

1. Calculate monthly accuracy rates for last 12 months (or available period)
2. Compute coefficient of variation: CV = std_dev(monthly_accuracy) / mean(monthly_accuracy)
3. Lower CV = more consistent = higher score

Consistency Score = clamp((1 - CV) × 100, 0, 100)

Edge cases:
  - If < 3 months of data: Consistency Score = 50 (neutral default)
  - If mean accuracy = 0: Consistency Score = 0
  - If CV > 1 (very inconsistent): Score = 0
```

### 8.5 Component 4: Volume Factor Score (Weight: 10%)

```
Rewards creators with more rated tips (higher statistical significance).

volume_factor = log10(total_scored_tips) / log10(MAX_EXPECTED_TIPS)

Where MAX_EXPECTED_TIPS = 2000 (Diamond tier threshold)

Volume Factor Score = clamp(volume_factor × 100, 0, 100)

Effect:
  20 tips  → score = 39.4
  50 tips  → score = 51.5
  100 tips → score = 60.6
  500 tips → score = 81.8
  1000 tips → score = 90.9
  2000 tips → score = 100
```

### 8.6 Confidence Interval

```
Standard error = sqrt(p × (1-p) / n)
  where p = accuracy_rate, n = total_scored_tips

Confidence Interval = Z × standard_error × 100
  where Z = 1.96 (95% confidence)

Display: "RMT Score: 73 ± 5"
```

### 8.7 Tier Calculation

```
Tier is based on total completed (scored) tips:
  < 20 tips  → UNRATED (no RMT Score displayed)
  20-49      → BRONZE
  50-199     → SILVER
  200-499    → GOLD
  500-999    → PLATINUM
  1000+      → DIAMOND
```

### 8.8 Score Recalculation Schedule

- **When:** Daily, 30 minutes after NSE market close (16:00 IST)
- **How:** BullMQ cron job triggers `score-worker` for ALL active creators
- **Order:** Process creators in parallel (batch of 50)
- **Duration target:** Full recalculation for 500 creators < 5 minutes
- **Storage:** Current score updates `creator_scores`, daily snapshot added to `score_snapshots`

---

## 9. SCRAPING ENGINE

### 9.1 Twitter/X Scraper

```typescript
// src/lib/scraper/twitter.ts

// Uses Twitter API v2 with Bearer Token authentication
// Endpoints used:
//   GET /2/users/:id/tweets — Get user's recent tweets
//   GET /2/tweets/search/recent — Search for financial tip patterns

// Rate Limits (App-only auth):
//   /users/:id/tweets: 1500 requests / 15 min (100 tweets per request)
//   /tweets/search/recent: 450 requests / 15 min

// Scraping strategy:
// 1. Maintain list of 500 creator Twitter accounts in creator_platforms
// 2. Every 6 hours, iterate through all creators
// 3. For each creator, fetch tweets since last_scraped_at
// 4. Store raw tweets in raw_posts table
// 5. Queue each raw post for NLP parsing

// Tweet fields to request:
//   tweet.fields: created_at, text, public_metrics, entities
//   Includes: retweet count, like count, hashtags, mentions

// Filtering rules:
// - Skip retweets (unless quote tweets with commentary)
// - Skip replies (unless self-replies / threads)
// - Only process tweets with financial keywords (see FINANCIAL_KEYWORDS)
// - Store ALL tweets but only parse tip-like content

const FINANCIAL_KEYWORDS = [
  // English
  "buy", "sell", "target", "tgt", "sl", "stop loss", "stoploss",
  "entry", "cmp", "nifty", "banknifty", "sensex",
  "bullish", "bearish", "breakout", "breakdown",
  "long", "short", "call", "put",
  // Hindi/Hinglish (common in Indian finfluencer space)
  "kharidein", "bechein", "profit", "loss",
  // Stock-like patterns
  "₹", "rs", "rs.", "inr",
];

// Implementation must handle:
// 1. Pagination (for creators with many tweets)
// 2. Rate limit tracking and backoff
// 3. Deduplication (don't re-scrape same tweet)
// 4. Error handling with retry logic
// 5. Metrics logging (tweets found, tips extracted)
```

### 9.2 YouTube Scraper

```typescript
// src/lib/scraper/youtube.ts

// Uses YouTube Data API v3
// Endpoints used:
//   GET /youtube/v3/search — Find recent videos from channel
//   GET /youtube/v3/videos — Get video details and description
//   GET /youtube/v3/commentThreads — Get comments (tip info often in comments)

// Quota: 10,000 units/day
//   search.list: 100 units per call
//   videos.list: 1 unit per call
//   commentThreads.list: 1 unit per call

// Strategy:
// 1. For each creator's YouTube channel, search for recent videos
// 2. Extract tip content from:
//    a. Video title (e.g., "RELIANCE Target 3000! Buy Now")
//    b. Video description (often contains structured tips)
//    c. Pinned comments (creators pin their tip summaries)
// 3. Store video metadata as raw_post, queue for parsing
// 4. Priority: Title + Description parsing (cheap on quota)
//    Secondary: Comment parsing (expensive, only for high-value creators)

// Quota management:
// With 500 creators and 10,000 daily quota:
//   - 20 units per creator per day
//   - = 1 search (100 units/50 per batch) + details for top 10 videos
//   - Scrape top 100 creators daily, rotate through rest weekly
```

### 9.3 Scrape Job Queue Architecture

```
Queues (BullMQ):
  1. scrape-twitter     — Twitter scraping jobs
  2. scrape-youtube     — YouTube scraping jobs
  3. parse-tip          — NLP parsing jobs
  4. update-price       — Price monitoring jobs
  5. calculate-score    — Score recalculation jobs
  6. tip-status-check   — Tip expiry/status check jobs

Job flow:
  [Cron: every 6hrs] → Creates scrape jobs for each creator
  scrape-twitter/youtube → Creates raw_posts → Enqueues parse-tip jobs
  parse-tip → Extracts structured tip → Auto-approve or add to review queue
  [Cron: every 5min during market hours] → update-price for active tips
  update-price → Checks if target/stoploss hit → Updates tip status
  [Cron: daily 16:00 IST] → calculate-score for all creators
  [Cron: every 1hr] → tip-status-check for expired tips

Worker concurrency:
  scrape-twitter:  concurrency 2 (rate limit sensitive)
  scrape-youtube:  concurrency 2 (quota sensitive)
  parse-tip:       concurrency 10 (CPU-bound, fast)
  update-price:    concurrency 5 (API calls)
  calculate-score: concurrency 10 (DB-heavy, parallelizable)
  tip-status-check: concurrency 5
```

---

## 10. NLP TIP PARSER

### 10.1 Two-Stage Parser Architecture

```
Stage 1: Rule-Based Pre-Filter (fast, free)
  - Regex patterns to detect if a post contains tip-like content
  - Extract obvious structured tips (common formats)
  - Confidence: HIGH for structured formats, LOW for free-form

Stage 2: LLM-Based Parser (accurate, costs money)
  - Only invoked for posts that pass Stage 1 but have LOW confidence
  - Uses GPT-4o-mini for entity extraction
  - Extracts: stock name, direction, entry, targets, stoploss, timeframe
```

### 10.2 Stage 1: Rule-Based Extraction

```typescript
// src/lib/parser/templates.ts

// Common structured tip formats seen in Indian finfluencer space:

// Format 1: Tabular
// BUY RELIANCE
// Entry: 2400-2420
// Target 1: 2500
// Target 2: 2600
// SL: 2350
// Timeframe: Swing

// Format 2: Inline
// RELIANCE Buy above 2420 TGT 2500/2600 SL 2350

// Format 3: Hashtag-heavy
// #RELIANCE Buy CMP 2415 🎯2500 🎯2600 ⛔2350 #StockTips #NSE

// Format 4: Hinglish
// RELIANCE kharidein 2400 ke paas, target 2500, stoploss 2350

// Regex patterns to extract:
const PATTERNS = {
  stockSymbol: /\b([A-Z]{2,20})\b/g,  // Uppercase words (potential stock symbols)
  price: /₹?\s*(\d{1,6}(?:\.\d{1,2})?)/g,  // Number patterns (prices)
  target: /(?:target|tgt|🎯)\s*[:\-]?\s*₹?\s*(\d{1,6}(?:\.\d{1,2})?)/gi,
  stopLoss: /(?:stop\s*loss|sl|⛔)\s*[:\-]?\s*₹?\s*(\d{1,6}(?:\.\d{1,2})?)/gi,
  entry: /(?:entry|buy\s*(?:above|near|at|@)?|cmp)\s*[:\-]?\s*₹?\s*(\d{1,6}(?:\.\d{1,2})?)/gi,
  direction: /\b(buy|sell|long|short|bullish|bearish)\b/gi,
  timeframe: /\b(intraday|swing|positional|long\s*term|short\s*term|btst|stbt)\b/gi,
};

// Confidence scoring:
// - All 4 fields extracted (stock, entry, target, SL) → confidence 0.90+
// - 3 of 4 fields → confidence 0.70
// - 2 of 4 fields → confidence 0.50
// - 1 or fewer → confidence 0.30 (likely not a tip)
```

### 10.3 Stage 2: LLM-Based Parser

```typescript
// src/lib/parser/extractor.ts

// ONLY called for posts with Stage 1 confidence between 0.40 and 0.85

const LLM_PROMPT = `
You are a financial tip parser. Extract structured tip data from the following social media post.
The post is from an Indian financial influencer and may contain Hindi/English mixed text.

Extract the following fields:
- stock_name: Full stock name or symbol (e.g., "RELIANCE", "TCS", "NIFTY")
- exchange: NSE, BSE, or INDEX
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

Post: "{post_content}"

Creator: {creator_name} (known for: {specializations})
`;

// Response parsing:
// - Validate all extracted fields
// - Cross-reference stock_name against stocks table
// - Verify price sanity (entry should be between 52-week high and low)
// - Set parseConfidence based on number of fields successfully extracted
```

### 10.4 Stock Name Normalization

```typescript
// src/lib/parser/normalizer.ts

// Maps common aliases to canonical stock symbols
const STOCK_ALIASES: Record<string, string> = {
  "RELIANCE": "RELIANCE",
  "RIL": "RELIANCE",
  "RELIANCE INDUSTRIES": "RELIANCE",
  "TCS": "TCS",
  "TATA CONSULTANCY": "TCS",
  "INFY": "INFY",
  "INFOSYS": "INFY",
  "HDFCBANK": "HDFCBANK",
  "HDFC BANK": "HDFCBANK",
  "ICICIBANK": "ICICIBANK",
  "ICICI BANK": "ICICIBANK",
  "NIFTY": "NIFTY 50",
  "NIFTY50": "NIFTY 50",
  "BANKNIFTY": "NIFTY BANK",
  "BANK NIFTY": "NIFTY BANK",
  // ... 500+ entries loaded from stocks table at startup
};

// Fuzzy matching as fallback:
// Use pg_trgm similarity matching against stocks table
// Threshold: similarity > 0.6
// If no match found, add to review queue for manual mapping
```

---

## 11. MARKET DATA SERVICE

### 11.1 Data Sources (Priority Order)

1. **Yahoo Finance API** (free, reliable, 5 req/sec) — Primary for historical + current prices
2. **NSE India website** (free, rate-limited) — Backup for Indian equities
3. **Alpha Vantage** (free tier: 25 req/day) — Backup for extended data

### 11.2 Price Monitoring Flow

```
During Market Hours (9:15 AM - 3:30 PM IST, Mon-Fri):
  Every 5 minutes:
    1. Fetch all ACTIVE tips from database
    2. Group by stock (deduplicate API calls)
    3. For each unique stock, fetch current price
    4. For each active tip on that stock:
       a. Check if current_price >= target1 → Update status to TARGET_1_HIT
       b. Check if current_price >= target2 → Update status to TARGET_2_HIT
       c. Check if current_price >= target3 → Update status to ALL_TARGETS_HIT
       d. Check if current_price <= stop_loss → Update status to STOPLOSS_HIT
       e. Check if current_date > expires_at → Update status to EXPIRED
       (Reverse logic for SELL direction tips)
    5. Log all status changes
    6. Calculate and store return_pct for resolved tips

After Market Close (3:30 PM IST):
  1. Fetch closing prices for all stocks with active tips
  2. Store in stock_prices table
  3. Run final status check for intraday tips
  4. Trigger score recalculation for all creators with resolved tips today
```

### 11.3 Historical Price Backfill

```
On initial setup and when new stocks are added:
  1. Fetch 1 year of daily OHLCV data from Yahoo Finance
  2. Store in stock_prices table
  3. Used for:
     - Validating tip entry prices (was this price realistic at tip time?)
     - Backtesting tip outcomes
     - Price charts on stock pages
     - 52-week high/low display
```

---

## 12. API SPECIFICATION

### 12.1 API Response Envelope

ALL API responses use this consistent format:

```typescript
// Success response
interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    hasMore?: boolean;
    cursor?: string;
  };
}

// Error response
interface ApiError {
  success: false;
  error: {
    code: string;          // Machine-readable: "CREATOR_NOT_FOUND"
    message: string;       // Human-readable: "Creator not found"
    details?: unknown;     // Additional context
  };
}

// HTTP Status codes used:
// 200 - Success
// 400 - Bad Request (validation error)
// 401 - Unauthorized (admin routes)
// 404 - Not Found
// 429 - Rate Limited
// 500 - Internal Server Error
```

### 12.2 Public API Endpoints

```
GET /api/v1/leaderboard
  Query params:
    category?: "all" | "intraday" | "swing" | "positional" | "long_term" | "options" | "crypto"
    timeRange?: "30d" | "90d" | "1y" | "all"  (default: "all")
    minTips?: number  (default: 20)
    page?: number  (default: 1)
    pageSize?: number  (default: 50, max: 100)
    sortBy?: "rmt_score" | "accuracy" | "return" | "total_tips"  (default: "rmt_score")
    sortOrder?: "asc" | "desc"  (default: "desc")
  Response: ApiResponse<LeaderboardEntry[]>
    LeaderboardEntry: {
      rank: number;
      creator: CreatorSummary;
      score: { rmtScore, accuracyRate, avgReturnPct, confidenceInterval };
      totalTips: number;
      tier: CreatorTier;
    }

GET /api/v1/creators
  Query params:
    search?: string  (fuzzy search on name)
    tier?: CreatorTier
    specialization?: string
    page?: number
    pageSize?: number
  Response: ApiResponse<CreatorSummary[]>

GET /api/v1/creators/:idOrSlug
  Response: ApiResponse<CreatorDetail>
    CreatorDetail: {
      id, slug, displayName, bio, profileImageUrl,
      tier, specializations, platforms[],
      score: CreatorScore | null,
      stats: { totalTips, activeTips, completedTips, winStreak, lossStreak },
      recentTips: Tip[] (last 10),
      scoreHistory: ScoreSnapshot[] (last 90 days),
    }

GET /api/v1/creators/:idOrSlug/tips
  Query params:
    status?: TipStatus
    timeframe?: TipTimeframe
    assetClass?: AssetClass
    page?: number
    pageSize?: number
    sortBy?: "tip_timestamp" | "return_pct"  (default: "tip_timestamp")
  Response: ApiResponse<TipSummary[]>

GET /api/v1/creators/:idOrSlug/score-history
  Query params:
    days?: number  (default: 90, max: 365)
  Response: ApiResponse<ScoreSnapshot[]>

GET /api/v1/tips
  Query params:
    creatorId?: string
    stockSymbol?: string
    status?: TipStatus
    direction?: TipDirection
    timeframe?: TipTimeframe
    dateFrom?: ISO date
    dateTo?: ISO date
    page?: number
    pageSize?: number
  Response: ApiResponse<TipSummary[]>

GET /api/v1/tips/:id
  Response: ApiResponse<TipDetail>
    TipDetail: {
      ...all tip fields,
      creator: CreatorSummary,
      stock: StockSummary,
      amendments: TipAmendment[],
      priceAtTip: number,
      currentPrice: number,
    }

GET /api/v1/stocks
  Query params:
    search?: string  (symbol or name fuzzy search)
    exchange?: Exchange
    sector?: string
    marketCap?: MarketCap
    page?: number
    pageSize?: number
  Response: ApiResponse<StockSummary[]>

GET /api/v1/stocks/:symbol
  Response: ApiResponse<StockDetail>
    StockDetail: {
      ...stock fields,
      tipCount: number,
      activeTipCount: number,
      consensus: { bullish: number, bearish: number },
      avgAccuracy: number,  (accuracy of all tips on this stock)
      topCreators: CreatorSummary[] (top 5 by accuracy on this stock),
      recentTips: TipSummary[],
      priceHistory: StockPrice[] (last 90 days),
    }

GET /api/v1/search
  Query params:
    q: string  (search query, required)
    type?: "all" | "creator" | "stock" | "tip"  (default: "all")
    limit?: number  (default: 10)
  Response: ApiResponse<SearchResults>
    SearchResults: {
      creators: CreatorSummary[],
      stocks: StockSummary[],
      tips: TipSummary[],
    }
```

### 12.3 Admin API Endpoints

```
All admin endpoints require authentication (NextAuth session).

GET    /api/admin/review
  Query: status?, page?, pageSize?
  Returns tips in review queue

PATCH  /api/admin/review/:tipId
  Body: { action: "approve" | "reject" | "edit_and_approve", note?, edits?: {...} }
  Approves/rejects tip from review queue

GET    /api/admin/creators
  Full creator management list with moderation status

PATCH  /api/admin/creators/:id
  Body: { isActive?, displayName?, bio?, specializations? }
  Update creator details

POST   /api/admin/creators/:id/moderate
  Body: { action: ModerationType, reason: string }
  Apply moderation action to creator

GET    /api/admin/scrapers
  Returns all scrape job statuses and stats

POST   /api/admin/scrapers/trigger
  Body: { platform: "TWITTER" | "YOUTUBE", type: "FULL" | "INCREMENTAL", creatorId?: string }
  Manually trigger a scrape job

GET    /api/admin/analytics
  Returns platform-wide analytics (tips count, creators, accuracy, etc.)

GET    /api/admin/moderation
  Query: creatorId?, page?
  Returns moderation action history
```

### 12.4 Rate Limiting

```
Public API endpoints:
  - 60 requests per minute per IP (general)
  - 10 requests per minute per IP (search endpoint)
  - Return 429 with Retry-After header when exceeded

Implementation: Redis sliding window counter
  Key: "ratelimit:{ip}:{endpoint}"
  TTL: 60 seconds
```

---

## 13. FRONTEND PAGES & COMPONENTS

### 13.1 Design System

```
Color Palette:
  Primary:    #1A365D (deep navy — trust, finance)
  Accent:     #2B6CB0 (blue — interactive elements)
  Success:    #276749 (green — profits, target hits)
  Danger:     #C53030 (red — losses, stop-loss hits)
  Warning:    #C05621 (orange — caution, pending)
  Background: #F7FAFC (light gray)
  Surface:    #FFFFFF (white cards)
  Text:       #1A202C (near black)
  Muted:      #718096 (gray)

Typography:
  Font: Inter (Google Fonts) — clean, modern, highly readable
  Headings: Font-weight 700 (bold)
  Body: Font-weight 400 (regular)
  Numbers/Scores: Font-variant-numeric: tabular-nums (monospaced digits)

Score Color Coding:
  90-100: #276749 (green) — Excellent
  75-89:  #2F855A (green) — Very Good
  60-74:  #2B6CB0 (blue) — Good
  45-59:  #C05621 (orange) — Average
  30-44:  #C53030 (red) — Below Average
  0-29:   #9B2C2C (dark red) — Poor

Tip Status Colors:
  ACTIVE:          #2B6CB0 (blue)
  TARGET_1_HIT:    #38A169 (green)
  TARGET_2_HIT:    #276749 (darker green)
  ALL_TARGETS_HIT: #22543D (darkest green)
  STOPLOSS_HIT:    #C53030 (red)
  EXPIRED:         #718096 (gray)
  PENDING_REVIEW:  #C05621 (orange)
```

### 13.2 Page Specifications

#### Homepage (/)
```
Layout:
  - Hero section: "The Truth Behind Every Financial Tip" with search bar
  - Top 10 creators leaderboard preview (table format)
  - Stats bar: "12,450 tips tracked | 487 creators scored | 73.2% avg accuracy"
  - Recent notable tips (tips that hit targets today)
  - Category quick links (Intraday, Swing, Options, etc.)
  - SEO content section explaining RateMyTip

Data fetching: SSR with 5-minute revalidation
```

#### Leaderboard (/leaderboard, /leaderboard/[category])
```
Layout:
  - Category tabs: All, Intraday, Swing, Positional, Long Term, Options, Crypto
  - Filter bar: Min tips, time range, sort by
  - Leaderboard table with columns:
    Rank | Creator (avatar + name + tier badge) | RMT Score (with confidence) |
    Accuracy | Avg Return | Total Tips | Trend (sparkline of last 30 days)
  - Pagination (50 per page)

Table rows are clickable → navigate to creator profile
Share button generates OG image of current leaderboard state

Data fetching: SSR with 5-minute revalidation
```

#### Creator Profile (/creator/[slug])
```
Layout:
  - Header: Avatar, Name, Tier Badge, RMT Score (large ring visualization),
    Platforms (Twitter/YouTube links), Specialization tags
  - Stats grid (4 cards): Accuracy Rate, Avg Return, Total Tips, Win Streak
  - Score History Chart: Line chart of RMT Score over last 90 days
  - Accuracy Breakdown: Bar chart by timeframe (intraday/swing/etc.)
  - Tip Feed: Paginated list of all tips with status indicators
    Filters: Status, Timeframe, Asset Class, Date Range
  - Each tip shows: Stock, Direction, Entry, Targets, SL, Status, Return

Share button generates OG image with creator's score and stats

Data fetching: SSR with 10-minute revalidation
```

#### Stock Page (/stock/[symbol])
```
Layout:
  - Header: Stock name, Symbol, Exchange, Sector, Market Cap, Current Price
  - Consensus widget: "Bullish: 23 tips | Bearish: 7 tips" (visual bar)
  - Price chart (90-day line chart with tip entry points marked)
  - All tips for this stock: Sorted by most recent
    Shows: Creator (with their RMT Score), Direction, Entry, Target, SL, Status
  - Top creators for this stock (by accuracy on this specific stock)

Data fetching: SSR with 5-minute revalidation
```

#### Search (/search)
```
Layout:
  - Large search input (autofocus)
  - Autocomplete dropdown (searches creators and stocks simultaneously)
  - Results page: Tabbed results (All, Creators, Stocks, Tips)
  - Each result type has appropriate card format

Data fetching: Client-side with SWR (real-time search)
```

#### Individual Tip (/tip/[id])
```
Layout:
  - Tip card (full detail): All fields displayed
  - Creator info sidebar (mini profile with RMT Score)
  - Stock price chart with entry point, targets, stop-loss marked as lines
  - Amendment history (if any)
  - Social sharing button

Data fetching: SSR with 10-minute revalidation
```

---

## 14. ADMIN DASHBOARD

### 14.1 Admin Layout

```
Sidebar navigation:
  - Dashboard (overview stats)
  - Review Queue (pending tips)
  - Creators (creator management)
  - Scrapers (job management)
  - Moderation (moderation log)
  - Analytics (platform metrics)

Header: Admin name, role, logout button
```

### 14.2 Review Queue (/admin/review)

```
This is the MOST CRITICAL admin page. Moderators spend most time here.

Layout:
  - Stats bar: Pending count, Approved today, Rejected today, Avg review time
  - Filterable table of tips in PENDING_REVIEW status
  - Each row expands to show:
    - Original raw post content (tweet/video description)
    - NLP-parsed structured tip data
    - Confidence score
    - Stock current price for context
    - Creator's existing profile and score
  - Actions per tip:
    - Approve (tip goes ACTIVE)
    - Reject (tip goes REJECTED with reason)
    - Edit & Approve (correct parsing errors, then approve)
    - Flag for re-review

Keyboard shortcuts:
  A = Approve selected
  R = Reject selected
  E = Edit mode
  N = Next tip
  P = Previous tip
```

---

## 15. SOCIAL SHARING & OG IMAGES

### 15.1 Dynamic OG Images

```typescript
// Generate dynamic OG images using @vercel/og (Satori)
// Route: /api/og/creator/[slug]/route.tsx

// Creator OG Image (1200x630):
// ┌──────────────────────────────────────────┐
// │  RateMyTip                    ratemytip.com│
// │                                           │
// │  [Avatar]  Creator Name                   │
// │            ★★★ Gold Tier                  │
// │                                           │
// │  ┌─────────┐  Accuracy: 72.3%            │
// │  │   78    │  Avg Return: 4.2%           │
// │  │ RMT    │  Total Tips: 156            │
// │  │ Score  │  Win Streak: 8              │
// │  └─────────┘                              │
// │                                           │
// │  "Every Call. Rated."                     │
// └──────────────────────────────────────────┘

// Leaderboard OG Image (1200x630):
// Shows top 5 creators with scores in a mini-table format

// Implementation:
// - Use @vercel/og with React JSX templates
// - Cache generated images in Redis (TTL: 1 hour)
// - Invalidate when scores update
```

---

## 16. SEO STRATEGY

### 16.1 URL Structure (SEO-Optimized)

```
/                                    — Homepage
/leaderboard                         — Main leaderboard
/leaderboard/intraday                — Category leaderboard
/creator/finance-guru-123            — Creator profile (slug)
/stock/RELIANCE                      — Stock page
/stock/NIFTY-50                      — Index page
/tip/clx1234abcdef                   — Individual tip
/search?q=reliance                   — Search
```

### 16.2 Meta Tags

```typescript
// Every page must have unique, descriptive meta tags.

// Creator page example:
export function generateMetadata({ params }): Metadata {
  return {
    title: `${creator.displayName} Stock Tips Track Record | RMT Score: ${score.rmtScore}/100 | RateMyTip`,
    description: `${creator.displayName} has a ${score.accuracyRate}% accuracy rate across ${creator.totalTips} stock tips. Track record verified by RateMyTip. View detailed performance analytics.`,
    openGraph: {
      title: `${creator.displayName} — RMT Score: ${score.rmtScore}/100`,
      description: `Verified track record: ${score.accuracyRate}% accuracy, ${creator.totalTips} tips tracked`,
      images: [`/api/og/creator/${creator.slug}`],
    },
  };
}

// Stock page example:
// title: "RELIANCE Stock Tips — 47 Tips Tracked, 68% Accuracy | RateMyTip"
// description: "See all stock tips for Reliance Industries across 23 analysts. Average accuracy: 68%. Top analyst: @FinanceGuru (82% accuracy). Verified by RateMyTip."
```

### 16.3 Structured Data (JSON-LD)

```typescript
// Add to creator profile pages for rich snippets:
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": creator.displayName,
  "url": `https://ratemytip.com/creator/${creator.slug}`,
  "image": creator.profileImageUrl,
  "description": `Financial analyst with ${score.accuracyRate}% accuracy`,
  "sameAs": creator.platforms.map(p => p.platformUrl),
}

// Add to stock pages:
{
  "@context": "https://schema.org",
  "@type": "FinancialProduct",
  "name": stock.name,
  "identifier": stock.symbol,
}
```

### 16.4 Sitemap

```typescript
// src/app/sitemap.ts
// Dynamic sitemap generation:
// - All creator profile URLs
// - All stock page URLs
// - Leaderboard category URLs
// - Homepage
// Updated daily, submitted to Google Search Console
```

---

## 17. BACKGROUND JOBS & QUEUES

### 17.1 Job Definitions

```typescript
// BullMQ queue definitions with cron schedules

const QUEUES = {
  "scrape-twitter": {
    cron: "0 */6 * * *",  // Every 6 hours
    description: "Scrape Twitter for new posts from tracked creators",
    concurrency: 2,
    retries: 3,
  },
  "scrape-youtube": {
    cron: "0 2,14 * * *",  // Twice daily (2 AM, 2 PM IST)
    description: "Scrape YouTube for new videos from tracked creators",
    concurrency: 2,
    retries: 3,
  },
  "parse-tip": {
    cron: null,  // Event-driven (triggered by scraper)
    description: "Parse raw posts into structured tips",
    concurrency: 10,
    retries: 2,
  },
  "update-prices": {
    cron: "*/5 9-16 * * 1-5",  // Every 5 min, 9 AM-4 PM, Mon-Fri (IST)
    description: "Fetch current prices and check active tips",
    concurrency: 5,
    retries: 2,
  },
  "calculate-scores": {
    cron: "0 16 * * 1-5",  // 4 PM IST, Mon-Fri (after market close)
    description: "Recalculate RMT scores for all creators",
    concurrency: 10,
    retries: 1,
  },
  "check-expirations": {
    cron: "0 * * * *",  // Every hour
    description: "Mark expired tips",
    concurrency: 5,
    retries: 1,
  },
  "daily-snapshot": {
    cron: "30 16 * * 1-5",  // 4:30 PM IST (after score calculation)
    description: "Store daily score snapshots",
    concurrency: 10,
    retries: 1,
  },
};
```

### 17.2 Worker Process

```typescript
// workers/index.ts
// This runs as a SEPARATE process from the Next.js app
// Start with: npx tsx workers/start.ts

// In development: Run alongside Next.js dev server
// In production: Separate Railway/Render service

// Worker startup:
// 1. Connect to Redis
// 2. Register all queue processors
// 3. Set up cron schedules
// 4. Start processing jobs
// 5. Handle graceful shutdown (SIGTERM)
```

---

## 18. CACHING STRATEGY

```
Redis cache keys and TTLs:

leaderboard:{category}:{timeRange}:{page}  → TTL: 300s (5 min)
creator:{slug}                              → TTL: 600s (10 min)
creator:{slug}:tips:{page}                  → TTL: 300s (5 min)
creator:{slug}:score-history                → TTL: 3600s (1 hour)
stock:{symbol}                              → TTL: 300s (5 min)
stock:{symbol}:price                        → TTL: 30s (during market hours)
search:{hash(query)}                        → TTL: 60s (1 min)
og:creator:{slug}                           → TTL: 3600s (1 hour)

Cache invalidation:
  - Score recalculation → invalidate leaderboard:* and creator:{slug}
  - Tip status change → invalidate creator:{id}:tips:* and stock:{symbol}
  - New tip approved → invalidate creator:{id} and stock:{symbol}

Implementation: Cache-aside pattern
  1. Check Redis for cached data
  2. Cache miss → Query PostgreSQL
  3. Store result in Redis with TTL
  4. Return data
```

---

## 19. ERROR HANDLING & LOGGING

### 19.1 Error Classes

```typescript
// src/lib/errors.ts
class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: unknown
  ) { super(message); }
}

class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, `${resource.toUpperCase()}_NOT_FOUND`, 404);
  }
}

class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "VALIDATION_ERROR", 400, details);
  }
}

class RateLimitError extends AppError {
  constructor() {
    super("Rate limit exceeded", "RATE_LIMIT_EXCEEDED", 429);
  }
}
```

### 19.2 Logging

```typescript
// Use Pino for structured logging
// Log levels: trace, debug, info, warn, error, fatal

// Log format:
{
  "level": "info",
  "timestamp": "2026-08-15T10:30:00.000Z",
  "service": "ratemytip",
  "component": "scraper/twitter",
  "message": "Scraped tweets for creator",
  "creatorId": "clx123",
  "tweetsFound": 15,
  "tipsExtracted": 3,
  "durationMs": 1240
}

// Rules:
// - ALWAYS log: API requests, scraper runs, score calculations, errors
// - NEVER log: Passwords, API keys, full request bodies with PII
// - Use correlation IDs for request tracing
// - Log structured data (JSON), never concatenated strings
```

---

## 20. TESTING STRATEGY

### 20.1 Test Coverage Requirements

```
Scoring algorithm:     100% unit test coverage (this is the core IP)
NLP parser:            90% unit test coverage
API endpoints:         80% integration test coverage
Critical user flows:   E2E tests for leaderboard, creator profile, search
```

### 20.2 Key Test Cases for Scoring

```typescript
// tests/unit/scoring/accuracy.test.ts
describe("Accuracy Score", () => {
  it("calculates 100% accuracy when all tips hit target");
  it("calculates 0% accuracy when no tips hit target");
  it("handles mixed results correctly");
  it("applies recency weighting (recent tips weighted more)");
  it("returns 0 for creator with no completed tips");
  it("excludes PENDING_REVIEW and ACTIVE tips from calculation");
  it("correctly classifies EXPIRED tips (no target/SL hit) as misses");
  it("handles edge case of exactly MIN_TIPS_FOR_RATING tips");
});

// tests/unit/scoring/composite.test.ts
describe("Composite RMT Score", () => {
  it("produces score between 0-100");
  it("weights components correctly (40/30/20/10)");
  it("returns null for creators below MIN_TIPS_FOR_RATING");
  it("produces higher score for more accurate creators");
  it("penalizes inconsistent creators even with high accuracy");
  it("rewards higher volume with volume factor");
});
```

### 20.3 Test Data Fixtures

```typescript
// tests/fixtures/
// - creators.ts: 10 test creators with varying profiles
// - tips.ts: 100 test tips with known outcomes
// - prices.ts: Price data for test stocks
// - expected-scores.ts: Pre-calculated expected scores for fixtures

// IMPORTANT: Test fixtures must produce DETERMINISTIC scores
// so tests are not flaky. Pin all dates and prices.
```

---

## 21. DEPLOYMENT & INFRASTRUCTURE

### 21.1 Development Workflow

```bash
# Initial setup
git clone <repo>
cp .env.example .env.local
docker compose up -d            # Start Postgres + Redis
npm install
npx prisma migrate dev          # Apply migrations
npx tsx scripts/seed-stocks.ts  # Seed NSE/BSE stock master
npx tsx scripts/seed-creators.ts # Seed test creators
npm run dev                     # Start Next.js dev server
npx tsx workers/start.ts        # Start background workers (separate terminal)
```

### 21.2 Production Architecture

```
Vercel:
  - Next.js application (auto-scaling)
  - Edge functions for OG image generation
  - ISR for public pages

Railway (or Render):
  - PostgreSQL database (managed)
  - Redis (managed)
  - Worker service (Docker container running workers/start.ts)

Domain:
  - ratemytip.com → Vercel
  - api.ratemytip.com → Same Vercel (or separate if needed)
```

### 21.3 Environment Parity

```
Development → Staging → Production

All environments use:
  - Same Prisma schema (migrations applied in order)
  - Same environment variable structure
  - Same Docker base images
  - Staging uses anonymized copy of production data
```

---

## 22. PHASE 1 SCOPE BOUNDARIES

### 22.1 IN SCOPE (Build This)

- [x] Database schema and migrations
- [x] Twitter scraper + YouTube scraper
- [x] NLP tip parser (rule-based + LLM)
- [x] Human review queue for ambiguous tips
- [x] Scoring algorithm (accuracy, risk-adjusted, consistency, volume)
- [x] Market data integration (price monitoring, tip status updates)
- [x] Public leaderboard (SSR, paginated, filterable)
- [x] Creator profile pages (auto-generated, unclaimed)
- [x] Stock pages (all tips for a stock, consensus)
- [x] Search (creators + stocks)
- [x] Individual tip detail pages
- [x] Social sharing with dynamic OG images
- [x] SEO (meta tags, structured data, sitemap)
- [x] Admin dashboard (review queue, creator management, scraper control)
- [x] Admin authentication (credential-based)
- [x] Background job queue (BullMQ)
- [x] Caching (Redis)
- [x] Error handling and logging
- [x] Rate limiting on public API
- [x] Unit tests for scoring algorithm
- [x] Docker Compose for local development

### 22.2 OUT OF SCOPE (Phase 2+)

- [ ] User registration/login (public users)
- [ ] Creator self-service (claiming profiles, posting tips directly)
- [ ] Social features (comments, likes, follows, feed)
- [ ] Mobile app (React Native)
- [ ] Monetization (courses, subscriptions, payments)
- [ ] Premium user features
- [ ] Brokerage integrations
- [ ] Telegram scraper (complex, requires channel access)
- [ ] Options/futures-specific tip structures
- [ ] AI recommendations
- [ ] Portfolio tracker
- [ ] Elasticsearch (use PostgreSQL full-text search for Phase 1)
- [ ] Internationalization (English only for Phase 1)
- [ ] Web push notifications
- [ ] A/B testing framework

### 22.3 Build Order (Recommended Sequence)

```
Week 1-2: Foundation
  1. Project setup (Next.js, TypeScript, Tailwind, ShadCN)
  2. Docker Compose (Postgres + Redis)
  3. Prisma schema + migrations
  4. Seed scripts (stocks, test creators)
  5. Core types and constants
  6. Prisma client singleton + Redis client
  7. Admin auth (NextAuth)

Week 3-4: Data Engine
  8. Twitter scraper
  9. YouTube scraper
  10. NLP tip parser (rule-based)
  11. NLP tip parser (LLM-based for low confidence)
  12. Stock name normalizer
  13. Market data service (Yahoo Finance integration)
  14. Price monitoring worker
  15. Tip status update logic

Week 5-6: Scoring & Admin
  16. Accuracy score calculation
  17. Risk-adjusted return calculation
  18. Consistency score calculation
  19. Volume factor calculation
  20. Composite RMT Score
  21. Score snapshot system
  22. Admin dashboard layout
  23. Review queue page
  24. Creator management page
  25. Scraper control page

Week 7-8: Public Frontend
  26. Design system setup (colors, typography, components)
  27. Homepage
  28. Leaderboard page (with filters, pagination)
  29. Creator profile page (with charts, tip feed)
  30. Stock page (with consensus, tip list)
  31. Search page (with autocomplete)
  32. Individual tip page

Week 9-10: Polish & Launch
  33. Dynamic OG images
  34. SEO meta tags and structured data
  35. Sitemap generation
  36. Social share buttons
  37. Caching layer (Redis)
  38. Rate limiting
  39. Error handling and logging
  40. Testing (scoring algorithm unit tests)
  41. Performance optimization (Core Web Vitals)
  42. Production deployment (Vercel + Railway)
  43. Seed initial 500 creators
  44. First full scrape + score calculation
  45. Soft launch

Week 11-12: Iteration
  46. Bug fixes from soft launch
  47. Performance tuning
  48. Additional creator seeding
  49. Content for SEO
  50. Monitoring and alerting setup
```

---

## APPENDIX A: Content Hash Calculation

```typescript
// src/lib/utils/crypto.ts
import { createHash } from "crypto";

// The content hash is a SHA-256 hash of the immutable tip fields.
// This proves that the tip data has not been modified after creation.

export function calculateTipContentHash(tip: {
  creatorId: string;
  stockSymbol: string;
  direction: string;
  entryPrice: number;
  target1: number;
  target2: number | null;
  target3: number | null;
  stopLoss: number;
  timeframe: string;
  tipTimestamp: Date;
}): string {
  const content = [
    tip.creatorId,
    tip.stockSymbol,
    tip.direction,
    tip.entryPrice.toFixed(2),
    tip.target1.toFixed(2),
    tip.target2?.toFixed(2) ?? "null",
    tip.target3?.toFixed(2) ?? "null",
    tip.stopLoss.toFixed(2),
    tip.timeframe,
    tip.tipTimestamp.toISOString(),
  ].join("|");

  return createHash("sha256").update(content).digest("hex");
}
```

---

## APPENDIX B: NSE Stock Master

```
Seed the stocks table with all actively traded NSE stocks.
Source: NSE India website CSV download (https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv)

Required fields per stock:
  - symbol: NSE symbol (e.g., "RELIANCE")
  - exchange: "NSE"
  - name: Full company name
  - sector: GICS sector
  - industry: GICS sub-industry
  - marketCap: Classify based on market cap (LARGE: >20K Cr, MID: 5K-20K Cr, SMALL: <5K Cr)
  - isActive: true

Also seed major indices:
  - NIFTY 50
  - NIFTY BANK
  - NIFTY IT
  - NIFTY PHARMA
  - NIFTY MIDCAP 50
  - SENSEX (BSE)
```

---

## APPENDIX C: Initial 500 Creators Seed List

```
Strategy for identifying initial 500 Indian finfluencers to track:

1. Twitter/X: Search for accounts with:
   - 10K+ followers
   - Bio contains: "trader", "investor", "analyst", "stock", "market", "nifty"
   - Regular posting about stocks (at least 1 tip-like tweet per week)
   - Sources: Follow lists of known finfluencers, #StockMarket hashtag regulars

2. YouTube: Search for channels with:
   - 50K+ subscribers
   - Regular stock tip videos (at least 1 per week)
   - Categories: "Finance", "Education"
   - Search terms: "stock tips India", "intraday tips", "swing trade ideas"

3. Store in a seed CSV with columns:
   display_name, twitter_handle, youtube_channel_id, bio, specializations

4. The seed script creates Creator + CreatorPlatform records
   and triggers initial scrape jobs for all 500 creators.
```

---

**END OF CLAUDE.md**

*This document is the complete engineering specification for RateMyTip Phase 1.
Follow it exactly. When in doubt, refer back to this document.
Any deviation from this spec should be documented and justified.*
