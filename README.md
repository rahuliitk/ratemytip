# RateMyTip

**The truth behind every financial tip.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

RateMyTip is an open source platform that tracks, verifies, and scores stock and crypto tips from financial influencers, brokerages, and analysts worldwide. We bring transparency and accountability to financial advice on social media.

**Website:** [ratemytip.com](https://ratemytip.com)

---

## The Problem

Millions of retail investors follow financial influencers on Twitter/X and YouTube for stock and crypto tips. But nobody tracks whether those tips actually make money. Influencers with flashy thumbnails and 50k followers can have a 30% accuracy rate — and nobody knows until they've already lost money following the advice.

## How RateMyTip Works

```
1. SCRAPE    Auto-collect tips from Twitter/X and YouTube (500+ creators)
2. PARSE     NLP engine extracts structured data (stock, entry, targets, stop-loss)
3. TRACK     Monitor real-time prices across global exchanges and crypto
4. SCORE     Calculate RMT Score — a composite of accuracy, risk-adjusted
             returns, consistency, and volume
5. RANK      Public leaderboard so anyone can see who's actually good
```

## Features

- **Leaderboard** — Rank 500+ creators by RMT Score with filters for category, timeframe, and minimum tips
- **Creator Profiles** — Full track record for every tracked finfluencer with score history charts
- **Scoring Algorithm** — Transparent, auditable composite score (accuracy 40% + risk-adjusted return 30% + consistency 20% + volume 10%)
- **Stock Pages** — See every tip ever posted for any stock or crypto asset with bull/bear consensus
- **Tip Tracking** — Real-time monitoring of active tips against market data (target hit / stop-loss hit / expired)
- **NLP Parser** — Two-stage parser (rule-based + LLM) extracts structured tips from unstructured social posts
- **Human Review Queue** — Admin pipeline for reviewing ambiguous/low-confidence parsed tips
- **Immutable Tips** — SHA-256 content hashing prevents retroactive tip modification
- **Social Sharing** — Dynamic OG images for leaderboards and creator profiles
- **SEO Optimized** — Server-side rendered pages with structured data and dynamic sitemaps

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, React Server Components) |
| Language | [TypeScript](https://www.typescriptlang.org/) (strict mode) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/) |
| Database | [PostgreSQL 16](https://www.postgresql.org/) |
| ORM | [Prisma](https://www.prisma.io/) |
| Cache | [Redis 7](https://redis.io/) |
| Job Queue | [BullMQ](https://bullmq.io/) |
| Auth | [NextAuth.js v5](https://authjs.dev/) (admin-only in Phase 1) |
| Charts | [Recharts](https://recharts.org/) |
| Validation | [Zod](https://zod.dev/) |
| Testing | [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/) |

## Quick Start

### Prerequisites

- Node.js 18+
- Docker and Docker Compose (for PostgreSQL and Redis)
- npm

### Setup

```bash
# Clone the repository
git clone https://github.com/rahuliitk/ratemytip.git
cd ratemytip

# Copy environment variables
cp .env.example .env.local

# Start PostgreSQL and Redis
docker compose up -d

# Install dependencies
npm install --legacy-peer-deps

# Generate Prisma client and run migrations
npx prisma generate
npx prisma migrate dev

# Seed the database with stocks (global exchanges + crypto)
npm run seed:stocks

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Running Workers

Background workers handle scraping, parsing, price monitoring, and score calculation. Run them in a separate terminal:

```bash
npm run workers
```

### Running Tests

```bash
# Unit and integration tests
npm test

# End-to-end tests
npm run test:e2e
```

## The RMT Score

The RMT Score is a composite score from 0-100 that quantifies a tip creator's performance:

```
RMT Score = (0.40 x Accuracy) + (0.30 x Risk-Adjusted Return) + (0.20 x Consistency) + (0.10 x Volume)
```

| Component | Weight | What It Measures |
|-----------|--------|-----------------|
| **Accuracy** | 40% | % of tips where target was hit (recency-weighted) |
| **Risk-Adjusted Return** | 30% | Average return relative to risk taken (reward-to-risk ratio) |
| **Consistency** | 20% | Low variance in monthly performance (coefficient of variation) |
| **Volume Factor** | 10% | Statistical significance — more tips = higher confidence |

Creators need a minimum of 20 completed tips to receive a score. See [CLAUDE.md](CLAUDE.md#8-scoring-algorithm--the-rmt-score) for the full algorithm specification.

## Project Structure

```
src/
  app/              # Next.js App Router (pages + API routes)
    (public)/       # Public pages (leaderboard, creator, stock, search)
    admin/          # Admin dashboard (protected)
    api/            # REST API endpoints
  components/       # React components (ui/, layout/, shared/, feature-specific)
  lib/              # Core business logic
    scoring/        # RMT Score algorithm
    scraper/        # Twitter/X and YouTube scrapers
    parser/         # NLP tip parser (rule-based + LLM)
    market-data/    # NSE/BSE/Yahoo Finance integration
    queue/          # BullMQ job definitions and workers
    validators/     # Zod schemas
  types/            # TypeScript type definitions
workers/            # Standalone worker process
prisma/             # Database schema and migrations
scripts/            # Seed and utility scripts
tests/              # Unit, integration, and E2E tests
```

## Roadmap

### Phase 1: Scrape & Score (current)
- [x] Scraping engine (Twitter/X + YouTube)
- [x] NLP tip parser with human review pipeline
- [x] RMT Score algorithm
- [x] Market data integration + real-time tip tracking
- [x] Public leaderboard, creator profiles, stock pages
- [x] Admin dashboard
- [x] Social sharing with dynamic OG images

### Phase 2: Community
- [ ] User accounts and authentication
- [ ] Creator self-service (claim profiles, post tips directly)
- [ ] Comments, likes, follows
- [ ] Mobile app

### Phase 3: Monetization
- [ ] Premium features
- [ ] Brokerage integrations
- [ ] Course marketplace
- [ ] Portfolio tracker

## Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) to get started.

Some good places to start:
- Browse [open issues](https://github.com/rahuliitk/ratemytip/issues) labeled `good first issue`
- Improve the scoring algorithm — proposals welcome in [Discussions](https://github.com/rahuliitk/ratemytip/discussions)
- Add support for new data sources (Telegram, websites)
- Improve the NLP parser accuracy

## Documentation

The complete engineering specification lives in [CLAUDE.md](CLAUDE.md) — it covers the database schema, API contracts, scoring algorithm, scraping engine, and every architectural decision in detail.

## License

This project is licensed under the [MIT License](LICENSE).

## Links

- **Website:** [ratemytip.com](https://ratemytip.com)
- **Issues:** [GitHub Issues](https://github.com/rahuliitk/ratemytip/issues)
- **Discussions:** [GitHub Discussions](https://github.com/rahuliitk/ratemytip/discussions)

---

*Every Call. Rated.*
