# Contributing to RateMyTip

Thank you for your interest in contributing to RateMyTip! This guide will help you get started.

## Getting Started

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- npm
- Git

### Development Setup

1. Fork the repository on GitHub
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ratemytip.git
   cd ratemytip
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/rahuliitk/ratemytip.git
   ```
4. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```
5. Start services and install:
   ```bash
   docker compose up -d
   npm install --legacy-peer-deps
   npx prisma generate
   npx prisma migrate dev
   ```
6. Start the dev server:
   ```bash
   npm run dev
   ```

## How to Contribute

### Reporting Bugs

Open a [bug report](https://github.com/rahuliitk/ratemytip/issues/new?template=bug_report.yml) with:
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Your environment (OS, Node.js version, browser)

### Suggesting Features

Open a [feature request](https://github.com/rahuliitk/ratemytip/issues/new?template=feature_request.yml) describing:
- The problem you're trying to solve
- Your proposed solution
- Alternatives you've considered

### Submitting Code

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Make your changes
3. Run checks:
   ```bash
   npm run lint
   npx tsc --noEmit
   npm test
   ```
4. Commit using [conventional commits](https://www.conventionalcommits.org/):
   ```
   feat: add new leaderboard filter
   fix: correct accuracy calculation for expired tips
   docs: update API documentation
   refactor: simplify score worker logic
   test: add edge cases for consistency score
   ```
5. Push and open a pull request against `main`

### Scoring Algorithm Proposals

The RMT Score is the core of RateMyTip. If you want to propose changes to the scoring algorithm:

1. Open a [Discussion](https://github.com/rahuliitk/ratemytip/discussions) in the Ideas category
2. Include: rationale, mathematical formulation, impact analysis
3. Provide test cases showing how scores would change
4. Community discussion happens before any PR is opened

## Branch Naming

| Prefix | Use |
|--------|-----|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `docs/` | Documentation |
| `refactor/` | Code refactoring |
| `test/` | Tests |
| `chore/` | Maintenance |

## Code Style

- **TypeScript strict mode** — no `any`, always define return types for exports
- **Tailwind CSS** — no custom CSS classes unless absolutely necessary
- **Max 300 lines per file** — split into smaller modules if longer
- **Max 50 lines per function** — extract helpers
- **Structured logging** — use Pino, never `console.log`
- **Explain WHY, not WHAT** — in comments

See [CLAUDE.md](CLAUDE.md#4-coding-conventions) for the complete coding conventions.

## Architecture Overview

For new contributors, here's how the system fits together:

```
Scrapers (Twitter/YouTube) → Raw Posts → NLP Parser → Structured Tips
    → Auto-approve (high confidence) OR Human Review Queue
    → Approved tips tracked against live market data
    → Daily score recalculation after market close
    → Leaderboard and profile pages updated
```

Key directories:
- `src/lib/scoring/` — The RMT Score algorithm (start here to understand the core)
- `src/lib/parser/` — NLP tip extraction
- `src/lib/scraper/` — Social media scrapers
- `src/lib/market-data/` — NSE/BSE price feeds
- `src/app/api/` — REST API endpoints

## Pull Request Process

1. Fill out the PR template completely
2. Ensure all checks pass (lint, typecheck, tests)
3. Request review from a maintainer
4. Address review feedback
5. A maintainer will merge once approved

## Good First Issues

Look for issues labeled [`good first issue`](https://github.com/rahuliitk/ratemytip/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) — these are scoped, well-defined tasks ideal for new contributors.

## Questions?

- Open a [Discussion](https://github.com/rahuliitk/ratemytip/discussions) for general questions
- Check [CLAUDE.md](CLAUDE.md) for detailed technical documentation

Thank you for helping make financial advice more transparent!
