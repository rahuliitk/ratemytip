# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-21

### Added

- Phase 1: Scrape & Score — complete platform implementation
- Scraping engine for Twitter/X and YouTube
- Two-stage NLP tip parser (rule-based + LLM)
- RMT Score algorithm (accuracy, risk-adjusted return, consistency, volume)
- Market data integration (Yahoo Finance, NSE, BSE)
- Real-time tip monitoring with automatic status updates
- Public leaderboard with category filters and pagination
- Creator profile pages with score history charts
- Stock pages with tip consensus and price charts
- Individual tip detail pages
- Global search across creators, stocks, and tips
- Admin dashboard with review queue, creator management, and scraper control
- Admin authentication (NextAuth.js v5 with credentials)
- Background job queue (BullMQ) for scraping, parsing, scoring, and price monitoring
- Redis caching layer for leaderboard and profile pages
- Dynamic OG image generation for social sharing
- SEO optimization with structured data, sitemaps, and meta tags
- Rate limiting on public API endpoints
- Docker Compose for local development (PostgreSQL 16 + Redis 7)
- Unit tests for scoring algorithm
- Prisma schema with 14 models and full migration support
- Seed scripts for NSE/BSE stocks and creator data

[0.1.0]: https://github.com/rahuliitk/ratemytip/releases/tag/v0.1.0
