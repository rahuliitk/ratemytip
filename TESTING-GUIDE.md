# RateMyTip — Complete Testing Guide

> This guide covers testing for the Phase 1 core platform + Phase 1.5A beginner features.
> Follow each section in order for a comprehensive test of the entire application.

---

## Prerequisites

### 1. Environment Setup

```bash
# Ensure services are running
docker compose up -d          # PostgreSQL + Redis

# Verify database connection
PGPASSWORD=ratemytip psql -h localhost -p 5435 -U ratemytip -d ratemytip -c "SELECT 1;"

# Verify Redis connection
redis-cli -p 6379 ping        # Should return PONG

# Ensure .env is configured
cat .env | grep -E "DATABASE_URL|REDIS_URL|NEXTAUTH_URL|NEXTAUTH_SECRET"
```

### 2. Database Setup

```bash
# Apply schema
npx prisma db push

# Generate Prisma client
npx prisma generate

# Verify tables exist
PGPASSWORD=ratemytip psql -h localhost -p 5435 -U ratemytip -d ratemytip \
  -c "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;"
```

### 3. Start Dev Server

```bash
npm run dev                    # Starts Next.js on http://localhost:3001
```

---

## SECTION A: MoneyControl Crawler Testing

### A1. Full Crawl — Fetch ALL Tips

```bash
# Run the MoneyControl scraper
npx tsx scripts/test-moneycontrol-scrape.ts
```

**Expected:**
- Logs show page-by-page progress: "Fetched page of MoneyControl recommendations"
- Continues until API returns no more data (no artificial limit)
- Final log shows total: "API returned X items total, Y valid recommendations, Z skipped"
- Zero errors at the end

**Verify in database:**

```sql
-- Total tips created
SELECT COUNT(*) AS total_tips FROM tips;

-- Tips per brokerage (creator)
SELECT c.display_name, COUNT(*) AS tip_count
FROM tips t JOIN creators c ON t.creator_id = c.id
GROUP BY c.display_name
ORDER BY tip_count DESC;

-- Verify sourcePosition is sequential (no gaps within same date)
SELECT tip_timestamp::date AS date,
       MIN(source_position) AS min_pos,
       MAX(source_position) AS max_pos,
       COUNT(*) AS count
FROM tips
GROUP BY tip_timestamp::date
ORDER BY date DESC
LIMIT 10;

-- Verify ordering matches MoneyControl
SELECT source_position, c.display_name AS brokerage, s.symbol, t.direction,
       t.entry_price, t.target1, t.stop_loss, t.tip_timestamp::date
FROM tips t
JOIN creators c ON t.creator_id = c.id
JOIN stocks s ON t.stock_id = s.id
ORDER BY t.tip_timestamp DESC, t.source_position ASC
LIMIT 30;
```

### A2. Ordering Verification

Open https://www.moneycontrol.com/markets/stock-ideas/ in your browser and compare the first 20 entries with:

```sql
SELECT ROW_NUMBER() OVER (ORDER BY t.tip_timestamp DESC, t.source_position ASC) AS display_rank,
       c.display_name AS brokerage,
       s.symbol AS stock,
       t.direction,
       t.entry_price,
       t.target1,
       t.tip_timestamp::date AS date
FROM tips t
JOIN creators c ON t.creator_id = c.id
JOIN stocks s ON t.stock_id = s.id
ORDER BY t.tip_timestamp DESC, t.source_position ASC
LIMIT 20;
```

**Expected:** The order should match MoneyControl's page exactly (same brokerage, same stock, same date for each row).

### A3. Deduplication Test

```bash
# Run the scraper again
npx tsx scripts/test-moneycontrol-scrape.ts
```

**Expected:**
- Should report 0 new tips created (all deduplicated by contentHash)
- No duplicate tips in the database:

```sql
SELECT content_hash, COUNT(*) AS cnt
FROM tips
GROUP BY content_hash
HAVING COUNT(*) > 1;
-- Should return 0 rows
```

### A4. No Missing Tips

```sql
-- Count RawPosts vs Tips
SELECT
  (SELECT COUNT(*) FROM raw_posts) AS raw_posts,
  (SELECT COUNT(*) FROM tips) AS tips,
  (SELECT COUNT(*) FROM raw_posts) - (SELECT COUNT(*) FROM tips) AS difference;

-- The difference should only be Hold/Neutral items (check):
SELECT COUNT(*) FROM raw_posts rp
WHERE NOT EXISTS (
  SELECT 1 FROM tips t WHERE t.raw_post_id = rp.id
);
```

### A5. Hold/Neutral Handling

```sql
-- Verify Hold/Neutral are stored as RawPosts but NOT as Tips
SELECT rp.content, rp.metadata->>'recommendationType' AS rec_type
FROM raw_posts rp
WHERE rp.metadata->>'recommendationType' ILIKE '%hold%'
   OR rp.metadata->>'recommendationType' ILIKE '%neutral%'
LIMIT 10;
-- Should return rows (stored as RawPosts)

-- But no Tips should have Hold/Neutral
SELECT * FROM tips WHERE rationale ILIKE '%hold%' OR rationale ILIKE '%neutral%';
-- Should return 0 rows
```

---

## SECTION B: Public Pages Testing

### B1. Homepage (http://localhost:3001/)

**Test:**
- [ ] Page loads without errors
- [ ] Top 10 creators leaderboard preview displays
- [ ] Stats bar shows correct numbers (tips tracked, creators scored)
- [ ] Recent tips section shows latest tips
- [ ] All links work (Leaderboard, Tips, Stocks, Search)

### B2. Leaderboard (http://localhost:3001/leaderboard)

**Test:**
- [ ] Table renders with all creators from crawl
- [ ] Columns: Rank, Creator, RMT Score, Accuracy, Avg Return, Total Tips
- [ ] Sorting works (click column headers)
- [ ] Category tabs work (All, Intraday, Swing, Positional, Long Term)
- [ ] Pagination works (if >50 creators)
- [ ] `data-tour="leaderboard"` attribute present on table (inspect element)
- [ ] Creator rows link to `/creator/{slug}`

### B3. Browse Tips (http://localhost:3001/tips)

**Test:**
- [ ] All tips display in correct order (newest first, then by sourcePosition)
- [ ] Filters work: Status, Timeframe, Direction, Date Range
- [ ] Pagination works
- [ ] Each tip card shows: Stock symbol, BUY/SELL badge, Entry, T1, T2, SL, Timeframe, Date
- [ ] Tip cards link to `/tip/{id}`
- [ ] `data-tour="tip-card"` attribute present on first tip card

### B4. Creator Profile (http://localhost:3001/creator/{slug})

Replace `{slug}` with an actual brokerage slug from the crawl (e.g., `motilal-oswal`, `hdfc-securities`).

**Test:**
- [ ] Header shows: Name, Tier badge, Bio
- [ ] Stats grid: Accuracy, Avg Return, Total Tips, Win Streak
- [ ] Score chart renders (if enough data for scoring)
- [ ] Tip feed shows all tips from this creator
- [ ] Tips ordered by date DESC, sourcePosition ASC
- [ ] Share button works
- [ ] SEO metadata correct (view page source)

### B5. Stock Page (http://localhost:3001/stock/{SYMBOL})

Replace `{SYMBOL}` with a stock from the crawl (e.g., `RELIANCE`, `TCS`, `INFY`).

**Test:**
- [ ] Stock header shows: Symbol, Name, Exchange, Sector
- [ ] Consensus widget shows bullish vs bearish count
- [ ] All tips for this stock display
- [ ] Top creators for this stock display
- [ ] Price chart renders (if price data available)

### B6. Search (http://localhost:3001/search)

**Test:**
- [ ] Search bar has `data-tour="search-bar"` attribute
- [ ] Typing a stock name (e.g., "Reliance") shows autocomplete results
- [ ] Typing a creator name (e.g., "Motilal") shows results
- [ ] Clicking a result navigates to correct page
- [ ] Empty state displays for no-match queries

---

## SECTION C: Phase 1.5A Beginner Features Testing

### C1. Market Context Bar

**Location:** Visible below the header on all public pages.

**Test:**
- [ ] Bar shows NIFTY 50 level with daily change (green/red)
- [ ] VIX indicator with color-coded badge (LOW/MODERATE/HIGH/EXTREME)
- [ ] Market Mood badge (BULLISH/NEUTRAL/BEARISH)
- [ ] "Market Closed" indicator shows outside IST 9:15-15:30 Mon-Fri
- [ ] Responsive: stacks on mobile, horizontal on desktop
- [ ] Verify API: `curl http://localhost:3001/api/v1/market-context | jq .`

### C2. Welcome Modal (First Visit)

**Test:**
- [ ] Clear localStorage: `localStorage.removeItem('ratemytip-welcome-shown')` in browser console
- [ ] Refresh the page
- [ ] Welcome modal appears with backdrop blur
- [ ] Title: "Welcome to RateMyTip!"
- [ ] Three bullet points about the platform
- [ ] "Take a Quick Tour" button starts the guided tour
- [ ] "Skip, I'll explore on my own" closes modal
- [ ] Modal does NOT appear on subsequent visits (localStorage persisted)

### C3. Guided Onboarding Tour

**Test:**
- [ ] Clear localStorage: `localStorage.removeItem('ratemytip-onboarding-done')` and `localStorage.removeItem('ratemytip-welcome-shown')`
- [ ] Refresh → Welcome modal → Click "Take a Quick Tour"
- [ ] Step 1: Highlights leaderboard area with explanation
- [ ] Step 2: Highlights RMT Score badge with explanation
- [ ] Step 3: Highlights a tip card with explanation
- [ ] Step 4: Highlights search bar with explanation
- [ ] Step 5: Highlights beginner mode toggle with explanation
- [ ] Next/Previous buttons work
- [ ] Skip button ends tour
- [ ] Step dots indicator shows current step
- [ ] Keyboard: ArrowRight = next, ArrowLeft = prev, Escape = skip
- [ ] Tour does NOT appear on subsequent visits

### C4. Beginner Mode Toggle

**Location:** In the header navigation bar.

**Test:**
- [ ] Toggle visible in the header (desktop nav)
- [ ] Three options: Beginner (green), Standard (blue), Advanced (gray)
- [ ] Selecting a level changes the chip color/text
- [ ] Selection persists after page refresh (localStorage `ratemytip-experience-level`)
- [ ] Default is INTERMEDIATE (Standard)
- [ ] Toggle has `id="beginner-mode-toggle"` for the onboarding tour

### C5. Tip Detail Page — Beginner Features

Navigate to any tip: http://localhost:3001/tip/{tipId}

Get a tip ID:
```sql
SELECT id FROM tips LIMIT 1;
```

**Test Glossary Tooltips:**
- [ ] "Entry Price" label has dashed underline
- [ ] Hovering shows tooltip with definition + example
- [ ] "Stop Loss" label has tooltip
- [ ] "Target 1" / "Target 2" labels have tooltips
- [ ] "Timeframe" label has tooltip (maps to correct term: intraday/swing/positional)
- [ ] "Conviction" label has tooltip
- [ ] Tooltips position above the trigger text
- [ ] Tooltips have a small arrow/caret pointing down
- [ ] Tapping on mobile toggles the tooltip

**Test Risk Badge:**
- [ ] Risk badge visible next to the status badge (e.g., "LOW", "MEDIUM", "HIGH", "VERY_HIGH")
- [ ] Color-coded: green (LOW), yellow (MEDIUM), orange (HIGH), red (VERY_HIGH)
- [ ] "Risk Assessment Breakdown" section shows factor bars
- [ ] Three factors: SL Distance, Timeframe, Market Cap
- [ ] Each bar colored by severity and shows a 0-100 score

**Test Contextual Explanations ("What does this mean?"):**
- [ ] Blue info box shows below the price grid
- [ ] "Stop Loss" explanation with actual tip numbers (e.g., "Your stop loss is ₹70 below entry...")
- [ ] "Target 1" explanation with profit calculation
- [ ] "Risk-Reward" explanation with ratio
- [ ] "Position Size Hint" with 2% rule example

**Test Position Size Calculator:**
- [ ] Collapsible section with "Position Size Calculator" header
- [ ] Click to expand
- [ ] Input: "Your Capital" field (number input)
- [ ] Input: "Risk Per Trade" slider (1-5%, default 2%)
- [ ] Output displays: Max Shares, Total Investment, Max Loss, Risk/Reward
- [ ] Capital usage bar: green (<20%), yellow (20-50%), red (>50%)
- [ ] Warnings appear for high concentration
- [ ] "Save my capital" persists to localStorage
- [ ] Reloading the page shows previously saved capital
- [ ] Values update in real-time as inputs change

**Test Execution Guide (only on ACTIVE tips):**
- [ ] Collapsible section "How to Execute This Tip"
- [ ] Click to expand
- [ ] Broker dropdown: Zerodha, Groww, Angel One, Upstox, ICICI Direct
- [ ] Steps change per broker
- [ ] Step text includes actual stock symbol and prices from the tip
- [ ] Warning footer about risk
- [ ] Preferred broker persists in localStorage
- [ ] Only visible when tip status is ACTIVE

### C6. Red Flag Badge (on Creator Profiles)

The red flag system computes flags based on creator data. For testing, verify the detection logic:

```bash
# Check if any creator has red flag data
PGPASSWORD=ratemytip psql -h localhost -p 5435 -U ratemytip -d ratemytip \
  -c "SELECT slug, display_name, transparency_score, red_flag_count FROM creators LIMIT 10;"
```

**Manual test of detection logic:**
```typescript
// In a Node REPL or test script:
import { detectRedFlags } from "@/lib/red-flags/detector";

const report = detectRedFlags("test-id", {
  totalTips: 50,
  recentAccuracy30d: 0.30,  // Low recent accuracy
  allTimeAccuracy: 0.70,    // Much higher all-time
  smallCapPct: 0.80,        // 80% small cap
  tipsWithoutSLPct: 0.40,   // 40% missing SL
  avgTipsPerDay: 8,         // Very high frequency
  avgStockVolumeLakhs: 5,   // Low volume
  buyPct: 0.95,             // Almost all BUY
});
// Should return multiple red flags
```

---

## SECTION D: API Endpoint Testing

### D1. Public API Endpoints

```bash
# Leaderboard
curl -s http://localhost:3001/api/v1/leaderboard | jq '.data | length'

# Creators list
curl -s http://localhost:3001/api/v1/creators | jq '.data | length'

# Single creator (replace with actual slug)
curl -s http://localhost:3001/api/v1/creators/motilal-oswal | jq '.data.displayName'

# Tips list
curl -s http://localhost:3001/api/v1/tips | jq '.data | length'

# Tips with filters
curl -s "http://localhost:3001/api/v1/tips?status=ACTIVE&timeframe=POSITIONAL&direction=BUY" | jq '.data | length'

# Search
curl -s "http://localhost:3001/api/v1/search?q=reliance" | jq '.'

# Market context
curl -s http://localhost:3001/api/v1/market-context | jq '.'

# Stock details (replace with actual symbol)
curl -s http://localhost:3001/api/v1/stocks/RELIANCE | jq '.data.symbol'
```

**Expected:** All return `{ "success": true, "data": ... }` with correct data.

### D2. Response Format Validation

Every API response should have:
- `success: true` for 200 responses
- `data` field with the payload
- `meta` field for paginated responses (page, pageSize, total, hasMore)
- `success: false` and `error: { code, message }` for error responses

### D3. Rate Limiting

```bash
# Fire 70 requests rapidly — should get 429 after 60
for i in $(seq 1 70); do
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/api/v1/tips &
done
wait
```

**Expected:** First 60 return 200, remaining return 429.

---

## SECTION E: Database Integrity

### E1. Schema Validation

```sql
-- Verify new Phase 1.5A columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'tips' AND column_name IN ('risk_level', 'risk_score');

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'creators' AND column_name IN ('transparency_score', 'red_flag_count', 'red_flag_data');
```

### E2. Tip Immutability

```sql
-- Verify content hashes are unique
SELECT COUNT(*) AS total, COUNT(DISTINCT content_hash) AS unique_hashes FROM tips;
-- total should equal unique_hashes

-- Verify no tip has been modified after creation (updatedAt close to createdAt)
SELECT COUNT(*) FROM tips
WHERE updated_at > created_at + INTERVAL '1 minute';
-- Should be 0 or very small
```

### E3. Foreign Key Integrity

```sql
-- All tips reference valid creators
SELECT COUNT(*) FROM tips t
WHERE NOT EXISTS (SELECT 1 FROM creators c WHERE c.id = t.creator_id);
-- Should be 0

-- All tips reference valid stocks
SELECT COUNT(*) FROM tips t
WHERE NOT EXISTS (SELECT 1 FROM stocks s WHERE s.id = t.stock_id);
-- Should be 0
```

### E4. Source Position Integrity

```sql
-- Verify sourcePosition values are assigned
SELECT COUNT(*) AS with_position FROM tips WHERE source_position IS NOT NULL;
SELECT COUNT(*) AS without_position FROM tips WHERE source_position IS NULL;
-- without_position should be 0 for MoneyControl-scraped tips

-- Verify no duplicate positions within same scrape batch
SELECT tip_timestamp::date, source_position, COUNT(*)
FROM tips
GROUP BY tip_timestamp::date, source_position
HAVING COUNT(*) > 1;
-- May have some duplicates across different dates (that's OK)
```

---

## SECTION F: UI Responsive Testing

### F1. Mobile (375px width)

Open Chrome DevTools → Toggle device toolbar → iPhone SE (375px)

- [ ] Header collapses to hamburger menu
- [ ] Market bar stacks vertically
- [ ] Leaderboard table scrolls horizontally
- [ ] Tip cards stack vertically
- [ ] Position calculator fits on screen
- [ ] Glossary tooltips open on tap (not hover)
- [ ] Welcome modal fits screen with no overflow

### F2. Tablet (768px width)

- [ ] Header shows full navigation
- [ ] Market bar fits in one row
- [ ] Leaderboard shows all columns
- [ ] Tip detail page has comfortable spacing

### F3. Desktop (1440px width)

- [ ] Max-width container (7xl = 1280px) centers content
- [ ] No horizontal scrollbar
- [ ] All features visible without scrolling excessively

---

## SECTION G: Performance

### G1. Page Load Times

Test with Lighthouse (Chrome DevTools → Lighthouse tab):

| Page | Target LCP | Target FID |
|------|-----------|-----------|
| Homepage | < 2.0s | < 100ms |
| Leaderboard | < 2.5s | < 100ms |
| Creator Profile | < 2.5s | < 100ms |
| Tip Detail | < 2.0s | < 100ms |
| Search | < 1.5s | < 50ms |

### G2. API Response Times

```bash
# Measure response time for key endpoints
curl -s -o /dev/null -w "Leaderboard: %{time_total}s\n" http://localhost:3001/api/v1/leaderboard
curl -s -o /dev/null -w "Tips: %{time_total}s\n" http://localhost:3001/api/v1/tips
curl -s -o /dev/null -w "Market: %{time_total}s\n" http://localhost:3001/api/v1/market-context
curl -s -o /dev/null -w "Search: %{time_total}s\n" "http://localhost:3001/api/v1/search?q=reliance"
```

**Expected:** All < 500ms on local development.

---

## SECTION H: SEO Verification

### H1. Meta Tags

```bash
# Check homepage meta
curl -s http://localhost:3001 | grep -E '<title>|<meta name="description"|og:title|og:description'

# Check creator page meta (replace slug)
curl -s http://localhost:3001/creator/motilal-oswal | grep -E '<title>|<meta name="description"'

# Check stock page meta (replace symbol)
curl -s http://localhost:3001/stock/RELIANCE | grep -E '<title>|<meta name="description"'
```

### H2. Sitemap

```bash
curl -s http://localhost:3001/sitemap.xml | head -30
```

**Expected:** XML sitemap with URLs for all creators, stocks, and leaderboard pages.

### H3. Robots.txt

```bash
curl -s http://localhost:3001/robots.txt
```

**Expected:** Allows search engine crawling with sitemap reference.

---

## SECTION I: Error Handling

### I1. 404 Pages

- [ ] `/creator/nonexistent-slug` shows 404 page
- [ ] `/stock/XXXXXXX` shows 404 page
- [ ] `/tip/nonexistent-id` shows 404 page

### I2. Invalid API Requests

```bash
# Invalid pagination
curl -s "http://localhost:3001/api/v1/tips?page=-1" | jq '.error'

# Invalid filter value
curl -s "http://localhost:3001/api/v1/tips?status=INVALID" | jq '.error'

# Missing required param
curl -s "http://localhost:3001/api/v1/search" | jq '.error'
```

---

## SECTION J: Quick Smoke Test Checklist

Run through this 5-minute checklist for a quick sanity check:

1. [ ] `npm run dev` starts without errors
2. [ ] Homepage loads at http://localhost:3001
3. [ ] Market bar visible below header
4. [ ] Welcome modal appears (clear localStorage first)
5. [ ] Leaderboard shows creators with scores
6. [ ] Click a creator → profile page loads
7. [ ] Click a tip → tip detail page loads
8. [ ] Glossary tooltips appear on hover (Entry Price, Stop Loss)
9. [ ] Risk badge visible on tip detail
10. [ ] Position calculator expands and calculates
11. [ ] Beginner Mode toggle works in header
12. [ ] Search finds a stock by name
13. [ ] `curl http://localhost:3001/api/v1/market-context` returns JSON
14. [ ] No console errors in browser DevTools
15. [ ] No TypeScript errors: `npx tsc --noEmit`

---

## Troubleshooting

### Common Issues

| Issue | Fix |
|-------|-----|
| `ECONNREFUSED` on DB | `docker compose up -d` to start PostgreSQL |
| `ECONNREFUSED` on Redis | `docker compose up -d` to start Redis |
| Prisma client outdated | `npx prisma generate` |
| Schema mismatch | `npx prisma db push` |
| Port 3001 in use | `lsof -i :3001` then kill the process |
| Stale cache | Clear Redis: `redis-cli FLUSHALL` |
| Welcome modal won't appear | Clear `ratemytip-welcome-shown` from localStorage |
| Tour won't start | Clear `ratemytip-onboarding-done` from localStorage |
| Crawler fetches 0 tips | Check `ENABLE_MONEYCONTROL_SCRAPER=true` in .env |

---

*Last updated: 2026-03-17*
