# RateMyTip — Complete Testing Guide

> This guide covers testing for the Phase 1 core platform + Phase 1.5A-D beginner features.
> Follow each section in order for a comprehensive test of the entire application.

---

## Prerequisites

### 1. Environment Setup

```bash
# Ensure services are running
docker compose up -d          # PostgreSQL + Redis

# Verify database connection
docker exec ratemytip-postgres-1 psql -U ratemytip -d ratemytip -c "SELECT 1;"

# Ensure .env is configured
cat .env | grep -E "DATABASE_URL|REDIS_URL|NEXTAUTH_URL|NEXTAUTH_SECRET"
```

### 2. Database Setup

```bash
# Apply schema
npx prisma db push

# Generate Prisma client
npx prisma generate
```

### 3. Start Dev Server

```bash
npm run dev                    # Starts Next.js on http://localhost:3000
```

### 4. Populate Data (run crawler)

```bash
npx tsx scripts/test-moneycontrol-scrape.ts --full
```

---

## SECTION A: MoneyControl Crawler Testing

### A1. Full Crawl — Fetch ALL Tips

```bash
npx tsx scripts/test-moneycontrol-scrape.ts --full
```

**Expected:**
- Logs show page-by-page progress: "Fetched page of MoneyControl recommendations"
- Continues until API returns no more data (no artificial limit)
- Final log shows total: tips created, brokerages, stocks, 0 errors

**Verify in database:**

```sql
-- Total tips created
SELECT COUNT(*) AS total_tips FROM tips;

-- Tips per brokerage (creator)
SELECT c.display_name, COUNT(*) AS tip_count
FROM tips t JOIN creators c ON t.creator_id = c.id
GROUP BY c.display_name
ORDER BY tip_count DESC;

-- Verify sourcePosition is sequential
SELECT tip_timestamp::date AS date,
       MIN(source_position) AS min_pos,
       MAX(source_position) AS max_pos,
       COUNT(*) AS count
FROM tips
GROUP BY tip_timestamp::date
ORDER BY date DESC
LIMIT 10;
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

### A3. Deduplication Test

```bash
# Run the scraper again
npx tsx scripts/test-moneycontrol-scrape.ts
```

**Expected:** 0 new tips created (all deduplicated by contentHash).

---

## SECTION B: Public Pages Testing

### B1. Homepage (http://localhost:3000/)

- [ ] Page loads without errors
- [ ] Top 10 creators leaderboard preview displays (sorted by totalTips if no scores)
- [ ] Shows "Pending" for RMT Score and "Awaiting data" for accuracy (when no scores yet)
- [ ] Stats bar shows correct numbers (tips tracked, creators scored)
- [ ] Recent tips section shows latest tips
- [ ] All links work (Leaderboard, Tips, Stocks, Search)

### B2. Leaderboard (http://localhost:3000/leaderboard)

- [ ] Table renders with all creators from crawl
- [ ] Shows "Pending" badge instead of 0 for unscored creators
- [ ] Shows "—" for accuracy and avg return when no scores
- [ ] Category tabs work (All, Intraday, Swing, Positional, Long Term)
- [ ] Pagination works (if >50 creators)
- [ ] Creator rows link to `/creator/{slug}`

### B3. Browse Tips (http://localhost:3000/tips)

- [ ] All tips display in correct order (newest first, then by sourcePosition)
- [ ] Filters work: Status, Timeframe, Direction
- [ ] Pagination works
- [ ] Each tip card shows: Stock symbol, BUY/SELL badge, Entry, T1, SL, Timeframe, Date
- [ ] Tip cards link to `/tip/{id}`
- [ ] **Beginner Mode:** switching to Beginner hides intraday tips, shows LiteTipCard

### B4. Creator Profile (http://localhost:3000/creator/{slug})

- [ ] Header shows: Name, Tier badge
- [ ] Stats grid: Total Tips, Active Tips
- [ ] Tip feed shows all tips from this creator
- [ ] **Max Drawdown Card** displays (if creator has completed tips)
- [ ] **Creator Review Form** displays below the tip feed
- [ ] **Review List** shows submitted reviews
- [ ] Share button works

### B5. Stock Page (http://localhost:3000/stock/{SYMBOL})

- [ ] Stock header shows: Symbol, Name, Exchange, Sector
- [ ] Consensus widget shows bullish vs bearish count
- [ ] **Conflicting Tips Panel** shows BUY vs SELL breakdown with proportional bar
- [ ] All tips for this stock display
- [ ] Top creators for this stock display

### B6. Search (http://localhost:3000/search)

- [ ] Typing a stock name shows autocomplete results
- [ ] Typing a creator name shows results
- [ ] Clicking a result navigates to correct page

---

## SECTION C: Phase 1.5A Beginner Features Testing

### C1. Market Context Bar

**Location:** Visible below the header on all public pages.

- [ ] Bar shows NIFTY 50 level with daily change (green/red)
- [ ] VIX indicator with color-coded badge
- [ ] Market Mood badge (BULLISH/NEUTRAL/BEARISH)
- [ ] Responsive: stacks on mobile, horizontal on desktop
- [ ] Verify API: `curl http://localhost:3000/api/v1/market-context | jq .`

### C2. Welcome Modal (First Visit)

- [ ] Clear localStorage: `localStorage.clear()` in browser console
- [ ] Refresh the page
- [ ] Welcome modal appears with backdrop blur
- [ ] "Take a Quick Tour" button starts guided tour
- [ ] "Skip" closes modal
- [ ] Modal does NOT appear on subsequent visits

### C3. Guided Onboarding Tour

- [ ] Clear localStorage and refresh → Welcome modal → Click "Take a Quick Tour"
- [ ] Step 1-5 highlight different page elements
- [ ] Next/Previous buttons work
- [ ] Tour does NOT appear on subsequent visits

### C4. Getting Started Checklist (NEW)

**Location:** Floating widget in bottom-right corner.

- [ ] Clear localStorage and refresh
- [ ] Checklist widget appears with 5 items:
  - Visit the leaderboard
  - View a creator profile
  - Read a tip detail page
  - Try the position size calculator
  - Set your experience level
- [ ] Progress bar shows 0/5 initially
- [ ] Navigate to `/leaderboard` → "Visit the leaderboard" gets checked
- [ ] Navigate to `/creator/{slug}` → "View a creator profile" gets checked
- [ ] Navigate to `/tip/{id}` → "Read a tip detail page" gets checked
- [ ] Use position size calculator → "Try the position size calculator" gets checked
- [ ] Change experience level toggle → "Set your experience level" gets checked
- [ ] Checklist can be minimized to a compact pill
- [ ] Shows congratulations when all 5 are done
- [ ] State persists across page refreshes

### C5. Beginner Mode Toggle

**Location:** In the header navigation bar.

- [ ] Three options: Beginner (green), Standard (blue), Advanced (gray)
- [ ] Selection persists after page refresh (localStorage)
- [ ] **In Beginner mode on /tips page:**
  - Intraday tips are hidden
  - Info banner shows "X intraday tips hidden in Beginner mode"
  - LiteTipCard renders instead of regular TipCard

### C6. Transparency Meter (NEW)

**Location:** Creator profile pages.

- [ ] Shows shield icon with score (0-100)
- [ ] Color-coded: Excellent (80+), Good (60+), Fair (40+), Poor (<40)
- [ ] Click to expand → shows 5 criteria breakdown:
  - Provides stop loss (0-25)
  - Provides rationale (0-20)
  - Frequency consistency (0-20)
  - Stock variety (0-20)
  - Clean record (0-15)
- [ ] Each criterion has individual progress bar

---

## SECTION D: Tip Detail Page Features

Navigate to any tip: http://localhost:3000/tip/{tipId}

### D1. Glossary Tooltips

- [ ] "Entry Price", "Stop Loss", "Target", "Timeframe", "Conviction" labels have dashed underline
- [ ] Hovering shows tooltip with definition + example
- [ ] Tapping on mobile toggles the tooltip

### D2. Contextual Explanations ("What does this mean?")

- [ ] Blue info box shows below the price grid
- [ ] Stop Loss explanation with actual ₹ amounts
- [ ] Target 1 explanation with profit calculation
- [ ] **Target 2 / Target 3 explanations** (if tip has multiple targets) (NEW)
- [ ] **10-Share Scenario**: "If you buy 10 shares at ₹X, your investment is ₹Y, max loss ₹Z, profit at T1 ₹W" (NEW)
- [ ] Risk-Reward explanation with ratio
- [ ] Position Size Hint with 2% rule

### D3. Risk Badge

- [ ] Color-coded: green (LOW), yellow (MEDIUM), orange (HIGH), red (VERY_HIGH)
- [ ] Breakdown shows: SL Distance, Timeframe, Market Cap factors

### D4. Position Size Calculator

- [ ] Collapsible section — click to expand
- [ ] Input: Capital, Risk Per Trade (1-5%)
- [ ] Output: Max Shares, Total Investment, Max Loss, Risk/Reward
- [ ] Capital usage bar with color coding
- [ ] Capital persists in localStorage

### D5. Brokerage Cost Calculator (NEW)

- [ ] Collapsible section — click to expand
- [ ] 5 broker tabs: Zerodha, Groww, Angel One, Upstox, ICICI Direct
- [ ] Trade type toggle: Intraday / Delivery CNC
- [ ] Quantity input
- [ ] Breakdown table: Brokerage, STT, Exchange charges, GST, SEBI, Stamp duty, Total
- [ ] Net profit after costs displayed
- [ ] "Costs eat X% of your profit" with color coding
- [ ] Warning if costs > 10% of profit
- [ ] Selected broker persists in localStorage

### D6. Execution Guide (ACTIVE tips only)

- [ ] 5 broker step-by-step guides
- [ ] Steps include actual stock symbol and prices
- [ ] Preferred broker persists in localStorage

### D7. Entry Timing Insights (NEW — ACTIVE tips only)

- [ ] Shows "This tip was posted X hours/days ago"
- [ ] Shows stock movement from entry: "+Y% from suggested entry"
- [ ] Risk-reward recalculation at current price
- [ ] Color-coded guidance:
  - Green: "Good timing — stock is near entry"
  - Yellow: "Caution — stock moved below entry"
  - Red: "May have passed — stock moved >1.5% above entry"

### D8. Similar Past Tips (NEW)

- [ ] Collapsible panel: "Similar Past Tips from {Creator}"
- [ ] Click to expand → fetches from `/api/v1/similar-tips/{tipId}`
- [ ] Shows mini-table: Date, Direction, Entry, Target, Status, Return%
- [ ] Summary: "Y of X hit target (Z%), avg return W%"
- [ ] If no similar tips: "This is the first tip from this creator on this stock"

### D9. Tip Feedback (NEW)

- [ ] Thumbs up / thumbs down buttons
- [ ] "Did you follow this tip?" checkbox
- [ ] Feedback persists in localStorage
- [ ] Shows "X% found this helpful"

### D10. Tip Post-Mortem (NEW — resolved tips only)

- [ ] Only shows for TARGET_HIT, STOPLOSS_HIT, or EXPIRED tips
- [ ] "What Happened?" card with:
  - Summary of what occurred
  - Return % prominently displayed
  - Educational "Takeaway" box
- [ ] Color-coded: green border (profit), red (loss), gray (expired)

---

## SECTION E: New Pages Testing

### E1. Quiz — Who Should I Follow (http://localhost:3000/quiz) (NEW)

- [ ] Page loads with title "Find Your Ideal Creators"
- [ ] 6-step quiz:
  1. Capital amount (4 options)
  2. Market availability (3 options)
  3. Risk appetite (3 options)
  4. Holding period (4 options)
  5. Sectors (multi-select with "No preference")
  6. Trading experience (4 options)
- [ ] Progress bar advances with each step
- [ ] Back/Next buttons work
- [ ] On submit → shows matched creators with explanations
- [ ] "Retake Quiz" and "View Full Leaderboard" buttons work
- [ ] Answers persist in localStorage

### E2. Creator Comparison (http://localhost:3000/compare) (NEW)

- [ ] Page loads with creator search/selector
- [ ] Search input finds creators by name
- [ ] Can select 2-3 creators
- [ ] "Compare" button generates comparison table
- [ ] Table shows side-by-side: RMT Score, Accuracy, Total Tips, Tier, Preferred Timeframe, Avg SL Distance
- [ ] Best value highlighted in each row
- [ ] Creator names link to profiles

### E3. Market Overview / Sector Strength (http://localhost:3000/market) (NEW)

- [ ] Page loads with stats summary (active tips, creators, stocks)
- [ ] Sector heatmap grid shows 10 sectors:
  - IT, Banking, Pharma, Auto, FMCG, Oil & Gas, Metals, Realty, Infra, Telecom
- [ ] Cards colored: green (>65% BUY), red (>65% SELL), gray (neutral)
- [ ] Each card shows: sector name, tip count, BUY/SELL ratio bar
- [ ] "Most Active Stocks" section below

### E4. Learning Hub (http://localhost:3000/learn) (NEW)

- [ ] Page shows grid of 6 learning modules
- [ ] Each card shows: title, description, estimated time, difficulty badge
- [ ] Progress tracking: "X of 6 completed"
- [ ] Click a module → opens module page with content sections
- [ ] Quiz at end of each module
- [ ] "Mark as Complete" button saves to localStorage
- [ ] Modules:
  1. Understanding Stock Tips in 10 Minutes
  2. What Makes a Good Tip Creator? Reading the RMT Score
  3. Risk Management 101: Why Stop Loss is Your Best Friend
  4. Intraday vs Swing vs Positional
  5. How to Read a Stock Chart (Basics)
  6. Common Scams in the Finfluencer Space

### E5. Scam Protection Guide (http://localhost:3000/protect-yourself) (NEW)

- [ ] Page loads with 7 detailed sections:
  1. 10 Most Common Stock Market Scams in India
  2. How to Spot a Fake Trading Screenshot
  3. Why Free Telegram Groups Are Not Really Free
  4. What Is Front-Running and How It Hurts You
  5. Red Flags: When a Finfluencer is Probably Lying
  6. How to File a SEBI Complaint
  7. Cyber Crime Reporting Guide
- [ ] Links to external resources (SEBI, cybercrime portals) work
- [ ] Well-formatted with readable typography

---

## SECTION F: API Endpoint Testing

### F1. Existing Endpoints

```bash
# Leaderboard
curl -s http://localhost:3000/api/v1/leaderboard | jq '.data | length'

# Tips list
curl -s http://localhost:3000/api/v1/tips | jq '.data | length'

# Search
curl -s "http://localhost:3000/api/v1/search?q=reliance" | jq '.'

# Market context
curl -s http://localhost:3000/api/v1/market-context | jq '.'
```

### F2. New Endpoints (NEW)

```bash
# Quiz — submit quiz answers
curl -s -X POST http://localhost:3000/api/v1/quiz \
  -H "Content-Type: application/json" \
  -d '{"capital":"25k_1l","availability":"partial","risk":"moderate","holdingPeriod":"few_days","sectors":["no_preference"],"experience":"less_6m"}' | jq '.'

# Similar tips (replace TIP_ID with actual tip ID)
curl -s http://localhost:3000/api/v1/similar-tips/TIP_ID | jq '.'

# Post-mortem (replace TIP_ID — only works for resolved tips)
curl -s http://localhost:3000/api/v1/post-mortem/TIP_ID | jq '.'
```

**Expected:** All return `{ "success": true, "data": ... }` with correct data.

---

## SECTION G: Lite Mode / Beginner Experience Testing (NEW)

### G1. Full Beginner Flow

1. [ ] Clear all localStorage: `localStorage.clear()`
2. [ ] Visit http://localhost:3000
3. [ ] Welcome modal appears → click "Take a Quick Tour"
4. [ ] Complete the 5-step tour
5. [ ] Getting Started checklist appears in bottom-right
6. [ ] Set experience to "Beginner" in header toggle
7. [ ] Navigate to `/tips` → intraday tips hidden, LiteTipCard shown
8. [ ] LiteTipCard shows: creator, stock, BUY/SELL, entry/target/SL, risk level, one-sentence summary
9. [ ] Navigate to `/quiz` → complete quiz → see recommended creators
10. [ ] Navigate to `/learn` → start a learning module → complete quiz → mark complete
11. [ ] Navigate to `/protect-yourself` → read through scam guide
12. [ ] Check Getting Started checklist → items should be checked off
13. [ ] Visit a tip → see contextual explanations with real numbers
14. [ ] Try position calculator → brokerage cost calculator → execution guide
15. [ ] Submit tip feedback (thumbs up)
16. [ ] Visit creator profile → submit a review

---

## SECTION H: UI Responsive Testing

### H1. Mobile (375px width)

- [ ] Header collapses to hamburger menu
- [ ] Market bar stacks vertically
- [ ] Leaderboard table scrolls horizontally
- [ ] LiteTipCard fits on small screen
- [ ] Quiz wizard steps fit on mobile
- [ ] Getting Started checklist minimizes to pill
- [ ] Brokerage cost calculator scrolls properly

### H2. Desktop (1440px width)

- [ ] Max-width container centers content
- [ ] No horizontal scrollbar
- [ ] Comparison table renders fully
- [ ] Sector heatmap shows in grid layout

---

## SECTION I: Performance

### I1. Page Load Times

| Page | Target LCP |
|------|-----------|
| Homepage | < 2.0s |
| Leaderboard | < 2.5s |
| Tip Detail | < 2.0s |
| Learn Hub | < 1.5s |
| Market Overview | < 2.5s |
| Compare | < 2.0s |

### I2. API Response Times

```bash
curl -s -o /dev/null -w "Leaderboard: %{time_total}s\n" http://localhost:3000/api/v1/leaderboard
curl -s -o /dev/null -w "Tips: %{time_total}s\n" http://localhost:3000/api/v1/tips
curl -s -o /dev/null -w "Market: %{time_total}s\n" http://localhost:3000/api/v1/market-context
curl -s -o /dev/null -w "Quiz: %{time_total}s\n" -X POST http://localhost:3000/api/v1/quiz -H "Content-Type: application/json" -d '{"capital":"25k_1l","availability":"partial","risk":"moderate","holdingPeriod":"few_days","sectors":["no_preference"],"experience":"less_6m"}'
```

**Expected:** All < 500ms on local development.

---

## SECTION J: Error Handling

### J1. 404 Pages

- [ ] `/creator/nonexistent-slug` shows 404 page
- [ ] `/stock/XXXXXXX` shows 404 page
- [ ] `/tip/nonexistent-id` shows 404 page
- [ ] `/learn/nonexistent-module` shows 404 or "module not found"

### J2. Invalid API Requests

```bash
# Invalid quiz data
curl -s -X POST http://localhost:3000/api/v1/quiz \
  -H "Content-Type: application/json" \
  -d '{"capital":"invalid"}' | jq '.error'

# Non-existent similar tips
curl -s http://localhost:3000/api/v1/similar-tips/nonexistent-id | jq '.'

# Post-mortem on active tip (should fail)
# Replace TIP_ID with an active tip's ID
curl -s http://localhost:3000/api/v1/post-mortem/TIP_ID | jq '.error'
```

---

## SECTION K: Quick Smoke Test Checklist

Run through this 10-minute checklist for a quick sanity check:

1. [ ] `npm run dev` starts without errors
2. [ ] Homepage loads with creators in leaderboard
3. [ ] Market bar visible below header
4. [ ] Welcome modal appears (clear localStorage first)
5. [ ] Getting Started checklist appears
6. [ ] Leaderboard shows creators with "Pending" or actual scores
7. [ ] Click a creator → profile page loads with drawdown card and review form
8. [ ] Click a tip → tip detail loads with all beginner tools
9. [ ] Glossary tooltips work on hover
10. [ ] Risk badge visible, position calculator works
11. [ ] Brokerage cost calculator shows charge breakdown
12. [ ] Entry timing card shows on active tips
13. [ ] Similar tips panel loads data
14. [ ] Tip feedback (thumbs up/down) works
15. [ ] Beginner Mode toggle hides intraday tips on /tips
16. [ ] `/quiz` → complete quiz → see recommendations
17. [ ] `/compare` → select 2 creators → see comparison table
18. [ ] `/market` → sector heatmap displays
19. [ ] `/learn` → module cards display, can open a module
20. [ ] `/protect-yourself` → scam guide renders
21. [ ] No console errors in browser DevTools

---

## Troubleshooting

### Common Issues

| Issue | Fix |
|-------|-----|
| `ECONNREFUSED` on DB | `docker compose up -d` to start PostgreSQL |
| `ECONNREFUSED` on Redis | `docker compose up -d` to start Redis |
| Prisma client outdated | `npx prisma generate` |
| Schema mismatch | `npx prisma db push` |
| Port 3000 in use | `lsof -i :3000` then kill the process |
| Stale cache | Clear Redis: `redis-cli FLUSHALL` |
| Welcome modal won't appear | `localStorage.clear()` in browser console |
| Crawler timeout | MoneyControl may be blocked on your network — run on EC2 instead |
| 0 tips after crawl | Check Docker postgres is running: `docker compose ps` |
| Leaderboard shows 0 creators | All creators have 0 tips — run the crawler first |

---

*Last updated: 2026-03-17*
