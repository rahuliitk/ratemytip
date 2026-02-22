# RateMyTip v2 — Feature Requirements

> **Builds on Phase 1 (Scrape & Score) with user-facing interactivity,
> tip discovery feed, creator self-service, and social features.**

---

## TABLE OF CONTENTS

1. [Tips Discovery Feed (Homepage Redesign)](#1-tips-discovery-feed)
2. [Tip Detail Page (Enhanced)](#2-tip-detail-page-enhanced)
3. [Creator & Brokerage Profile Pages (Enhanced)](#3-creator--brokerage-profile-pages)
4. [User Accounts](#4-user-accounts)
5. [Rating & Comment System](#5-rating--comment-system)
6. [Tip Ranking Algorithm (Feed Scoring)](#6-tip-ranking-algorithm)
7. [New Database Models](#7-new-database-models)
8. [New API Endpoints](#8-new-api-endpoints)
9. [Navigation & Information Architecture](#9-navigation--information-architecture)
10. [Scope Summary & Priorities](#10-scope-summary--priorities)

---

## 1. TIPS DISCOVERY FEED

### 1.1 Overview

The homepage transforms from a leaderboard preview into a **ranked, filterable tip feed** — the primary surface where users discover and evaluate tips. Think of it as a "financial tip timeline" where every tip from every tracked creator appears, ranked by a composite feed score.

### 1.2 Feed Ranking Factors

Each tip in the feed receives a **Feed Score** that determines its position. The feed score is NOT the RMT Score — it's a separate ranking that combines multiple signals:

| Factor | Weight | Description |
|--------|--------|-------------|
| **Creator RMT Score** | 30% | Higher-rated creators' tips rank higher |
| **Freshness** | 25% | Recent tips rank higher; exponential decay over 48 hours |
| **User Rating** | 20% | Tips with more upvotes / higher star ratings rank higher |
| **Tip Performance** | 15% | Active tips near target rank higher; resolved tips with high returns rank higher |
| **Engagement** | 10% | Tips with more comments/views get a small boost |

```
Feed Score = (0.30 x normalized_rmt_score)
           + (0.25 x freshness_decay(hours_since_posted))
           + (0.20 x normalized_user_rating)
           + (0.15 x performance_signal)
           + (0.10 x engagement_signal)
```

Freshness decay function:
```
freshness(hours) = e^(-0.03 * hours)
  0 hours  → 1.00
  6 hours  → 0.84
  24 hours → 0.49
  48 hours → 0.24
  72 hours → 0.12
```

### 1.3 Filters

The feed page must support the following filters (all optional, combinable):

| Filter | Type | Options |
|--------|------|---------|
| **Stock / Symbol** | Search autocomplete | Any tracked stock |
| **Direction** | Toggle | BUY, SELL, All |
| **Timeframe** | Multi-select chips | Intraday, Swing, Positional, Long Term |
| **Asset Class** | Multi-select chips | Equity NSE, Equity BSE, Index, F&O, Crypto, Commodity |
| **Creator / Brokerage** | Search autocomplete | Any tracked creator or brokerage |
| **Creator Type** | Multi-select chips | Individual, Brokerage, Research Firm, News Outlet |
| **Tip Status** | Multi-select chips | Active, Target Hit, Stoploss Hit, Expired, All |
| **Date Range** | Date picker | Today, This Week, This Month, Custom Range |
| **Conviction** | Multi-select chips | High, Medium, Low |
| **Min Creator Rating** | Slider or dropdown | 0-100 (RMT Score threshold) |
| **Sector** | Dropdown | IT, Banking, Pharma, Auto, etc. |

### 1.4 Sort Options

Users can override the default feed ranking with explicit sorts:

| Sort | Description |
|------|-------------|
| **Recommended** (default) | Feed Score algorithm described above |
| **Newest First** | Chronological, most recent tip first |
| **Highest Rated** | By user rating (avg stars or upvote count) |
| **Best Performers** | By return % (resolved tips only) |
| **Top Creators** | Group by creator RMT Score, then by freshness within |
| **Most Discussed** | By comment count |

### 1.5 Feed UI Specification

```
┌─────────────────────────────────────────────────────────────────┐
│  RateMyTip Logo                    [Search Bar]     [Login/Signup]│
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─ Filter Bar ───────────────────────────────────────────────┐ │
│  │ [Direction ▾] [Timeframe ▾] [Asset Class ▾] [Status ▾]    │ │
│  │ [Stock Search...] [Creator Search...] [Date Range ▾]      │ │
│  │ [More Filters ▾]                                           │ │
│  │                                              [Sort: Recommended ▾] │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─ Tip Card ─────────────────────────────────────────────────┐ │
│  │ [Creator Avatar] Creator Name  ★ RMT: 78  Gold Tier       │ │
│  │ BUY RELIANCE  ₹2,420 → ₹2,600  SL: ₹2,350               │ │
│  │ Timeframe: Swing | Conviction: High | 2 hours ago         │ │
│  │ "Breakout above resistance with strong volume..."          │ │
│  │                                                             │ │
│  │ [⭐ 4.2 (34)] [💬 12 comments] [📤 Share] [🔖 Save]      │ │
│  │ Status: ACTIVE  |  Current: ₹2,445 (+1.03%)               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─ Tip Card ─────────────────────────────────────────────────┐ │
│  │ [Brokerage Logo] HDFC Securities  ★ RMT: 82  Platinum     │ │
│  │ BUY TCS  ₹3,850 → ₹4,100  SL: ₹3,750                    │ │
│  │ Timeframe: Positional | Conviction: Medium | 5 hours ago  │ │
│  │                                                             │ │
│  │ [⭐ 3.8 (12)] [💬 4 comments] [📤 Share] [🔖 Save]       │ │
│  │ Status: TARGET_1_HIT ✅  |  Return: +6.5%                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  [Load More...]                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.6 Feed Behavior

- **Pagination:** Infinite scroll with cursor-based pagination (load 20 tips at a time)
- **Real-time updates:** New tips appear at the top with a "X new tips" banner (poll every 60s or use SSE)
- **Filter persistence:** Active filters are reflected in the URL query string for shareability
- **Responsive:** On mobile, filters collapse into a slide-out drawer
- **Empty state:** When filters return no results, show "No tips match your filters" with suggested adjustments
- **Anonymous access:** Feed is fully viewable without login. Rating/commenting/saving requires an account.

---

## 2. TIP DETAIL PAGE (ENHANCED)

### 2.1 Current State

The existing tip detail page (`/tip/[id]`) shows: direction, status, entry/target/SL prices, timeframe, conviction, rationale, source URL, content hash, creator mini-profile, and amendment history.

### 2.2 New Additions

#### 2.2.1 Creator Explanation Section

The tip creator (individual or brokerage) can add and edit a **detailed explanation** for their tip. This is separate from the immutable `rationale` field (which is scraped from the original post).

```
┌─ Creator's Analysis ─────────────────────────────────────────┐
│                                                               │
│  [Creator Avatar] Posted by HDFC Securities                  │
│                                                               │
│  ## Why We Recommend RELIANCE at ₹2,420                      │
│                                                               │
│  Reliance Industries has formed a strong base around the      │
│  ₹2,400 level with increasing volume on the buy side...      │
│                                                               │
│  **Key Catalysts:**                                           │
│  1. Jio platform subscriber growth exceeding estimates        │
│  2. Refining margins improving quarter-on-quarter             │
│  3. Technical breakout above 200-DMA                          │
│                                                               │
│  **Risk Factors:**                                            │
│  - Global crude oil price volatility                          │
│  - Regulatory changes in telecom sector                       │
│                                                               │
│  [Chart Image/Screenshot]                                     │
│                                                               │
│  Last updated: 2 hours ago                                    │
│  [Edit] (visible only to tip creator)                         │
└───────────────────────────────────────────────────────────────┘
```

**Requirements:**
- Rich text editor (Markdown support) for the explanation
- Support for image uploads (charts, screenshots) — max 5 images, max 2MB each
- Only the tip's creator (claimed account) can add/edit the explanation
- Explanation has its own `updated_at` timestamp (separate from tip creation)
- Explanation edits are versioned (history visible to admins)
- Explanation is optional — tips without explanations show the scraped `rationale` field or nothing

#### 2.2.2 Rating Widget

```
┌─ Rate This Tip ──────────────────────────────────────────────┐
│                                                               │
│  How useful is this tip?                                      │
│  ★ ★ ★ ★ ☆  (4.2 average from 34 ratings)                   │
│                                                               │
│  [Rate] (requires login)                                      │
└───────────────────────────────────────────────────────────────┘
```

- 1-5 star rating system
- Each user can rate a tip once (can update their rating)
- Display: average rating + total count
- Anonymous users see ratings but cannot rate (prompted to login)

#### 2.2.3 Comments Section

```
┌─ Discussion (12 comments) ───────────────────────────────────┐
│                                                               │
│  [Sort: Newest | Top Rated | Oldest]                         │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ [Avatar] User Name  •  2 hours ago                      │ │
│  │ Great call! I entered at ₹2,425. Holding for target 2.  │ │
│  │ [👍 5] [👎 1] [Reply] [Report]                          │ │
│  │                                                          │ │
│  │  ┌─ Reply ────────────────────────────────────────────┐ │ │
│  │  │ [Avatar] Creator Name ✓  •  1 hour ago             │ │
│  │  │ Glad to hear! Volume is confirming the move.       │ │
│  │  │ [👍 8] [👎 0] [Reply] [Report]                     │ │
│  │  └────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─ Add Comment ───────────────────────────────────────────┐ │
│  │ [Text area: Share your thoughts...]                     │ │
│  │                                        [Post Comment]    │ │
│  └─────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

**Requirements:**
- Threaded comments (1 level of nesting — replies to top-level comments)
- Comments support plain text (no markdown in v1 for simplicity)
- Max comment length: 1,000 characters
- Upvote/downvote on each comment
- Creator's comments highlighted with a "Creator" badge
- Sort options: Newest, Top Rated (by net upvotes), Oldest
- Requires login to comment
- Report button for abuse/spam
- Paginated: 20 comments per page, "Load more" for additional

#### 2.2.4 Related Tips Section

Below the comments, show:
- **Same stock, other creators:** "Other tips for RELIANCE" (top 5 by creator RMT Score)
- **Same creator, recent tips:** "More from HDFC Securities" (last 5 tips)

#### 2.2.5 Live Price Tracker

- If tip is ACTIVE, show a real-time mini price chart
- Mark entry price, target levels, and stop-loss as horizontal lines
- Show current price with % change from entry
- Visual indicator of how close the price is to target vs stop-loss (progress bar)

---

## 3. CREATOR & BROKERAGE PROFILE PAGES

### 3.1 Current State

Creator profiles exist at `/creator/[slug]` with: header, stats grid, score ring, tip feed. All auto-generated from scraped data. No self-service.

### 3.2 Enhanced Creator Page

#### 3.2.1 Creator Types

The platform supports multiple creator types, each with a slightly different profile layout:

| Type | Description | Example |
|------|-------------|---------|
| **Individual** | Independent finfluencer / trader | @FinanceGuru on Twitter |
| **Brokerage** | Licensed brokerage firm | HDFC Securities, Motilal Oswal |
| **Research Firm** | Independent research house | ICICI Direct Research |
| **News Outlet** | Financial media organization | CNBC TV18, ET Markets |

#### 3.2.2 Profile Sections (All Creator Types)

```
┌─────────────────────────────────────────────────────────────────┐
│ PROFILE HEADER                                                   │
│ [Avatar/Logo]  Creator Name  [Verified ✓] [Tier Badge]          │
│ Bio / Tagline                                                    │
│ [Twitter] [YouTube] [Website]      [Follow] [Share Profile]     │
│                                                                  │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│ │ RMT Score│ │ Accuracy │ │Avg Return│ │Total Tips│            │
│ │   78     │ │  72.3%   │ │  +4.2%   │ │   156    │            │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
├─────────────────────────────────────────────────────────────────┤
│ [Overview] [All Tips] [Performance] [Reviews] [About]           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ OVERVIEW TAB (default):                                          │
│ - Score history chart (line, 90 days)                            │
│ - Accuracy breakdown by timeframe (bar chart)                    │
│ - Recent 10 tips                                                 │
│ - User reviews summary (avg rating, recent reviews)              │
│                                                                  │
│ ALL TIPS TAB:                                                    │
│ - Full paginated tip feed with filters                           │
│ - Same filter set as homepage feed (stock, direction, etc.)      │
│                                                                  │
│ PERFORMANCE TAB:                                                 │
│ - Detailed performance analytics                                 │
│ - Monthly accuracy trend (bar chart)                             │
│ - Best/worst tips                                                │
│ - Sector-wise accuracy breakdown                                 │
│ - Win/loss streak history                                        │
│ - Risk-reward distribution chart                                 │
│                                                                  │
│ REVIEWS TAB:                                                     │
│ - User reviews/testimonials for this creator                     │
│ - Star rating breakdown (5★: 45%, 4★: 30%, etc.)               │
│ - Individual review cards with text                              │
│ - "Write a Review" button (requires login + following ≥30 days) │
│                                                                  │
│ ABOUT TAB:                                                       │
│ - Full bio (editable by claimed creator)                         │
│ - Specializations                                                │
│ - Platforms with follower counts                                 │
│ - Account creation date, first/last tip dates                    │
│ - Disclaimer / SEBI registration (if applicable)                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 3.2.3 Brokerage-Specific Features

Brokerage profiles get additional sections:

- **Analysts roster:** List of individual analysts under the brokerage, each with their own accuracy stats
- **Coverage universe:** Stocks this brokerage covers, with accuracy per stock
- **Research reports:** Links to recent published research (pulled from scraper)
- **SEBI registration number:** Displayed prominently for trust

#### 3.2.4 "Follow" System

- Logged-in users can "Follow" a creator
- Following shows the creator's tips in a personalized "Following" tab on the feed
- Follower count displayed on profile (internal platform followers, not social media)
- No notification system in this phase (just feed filtering)

---

## 4. USER ACCOUNTS

### 4.1 Account Types

The platform has two account types with different capabilities:

| Capability | Consumer (Tip Follower) | Creator (Tip Giver) |
|-----------|------------------------|---------------------|
| View tips feed | Yes | Yes |
| Filter & search tips | Yes | Yes |
| Rate tips (1-5 stars) | Yes | Yes |
| Comment on tips | Yes | Yes |
| Upvote/downvote comments | Yes | Yes |
| Save/bookmark tips | Yes | Yes |
| Follow creators | Yes | Yes |
| Claim a creator profile | No | Yes (one-time) |
| Post tips directly | No | Yes |
| Add/edit tip explanations | No | Yes (own tips only) |
| Edit profile bio/info | No | Yes (own profile) |
| View own analytics dashboard | No | Yes |
| Respond to reviews | No | Yes |

### 4.2 Consumer Account

#### 4.2.1 Registration & Login

- **Methods:** Email + password, Google OAuth, Twitter/X OAuth
- **Required fields:** Display name, email
- **Optional fields:** Phone (for future OTP), profile photo
- **Verification:** Email verification required before commenting

#### 4.2.2 Consumer Profile Page (`/user/[username]`)

```
┌─────────────────────────────────────────────────────────────────┐
│ [Avatar] Display Name                                            │
│ Member since: Jan 2026                                           │
│                                                                  │
│ [Saved Tips] [My Comments] [Following] [Settings]               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ SAVED TIPS:                                                      │
│ - Bookmarked tips organized by date                              │
│ - Filter: Active, Resolved, All                                  │
│                                                                  │
│ MY COMMENTS:                                                     │
│ - History of all comments posted                                 │
│ - Link to parent tip for context                                 │
│                                                                  │
│ FOLLOWING:                                                       │
│ - List of creators being followed                                │
│ - Quick unfollow action                                          │
│ - Each entry shows creator name, RMT score, recent accuracy     │
│                                                                  │
│ SETTINGS:                                                        │
│ - Edit display name, email, password                             │
│ - Notification preferences (future)                              │
│ - Delete account                                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Privacy:** Consumer profiles are private by default. Only the user can see their saved tips, comments, and following list. Display name and avatar are visible on their comments.

### 4.3 Creator Account

#### 4.3.1 Claiming a Profile

Existing scraped creator profiles can be "claimed" by the real person/entity:

1. Creator signs up as a Consumer first
2. Navigates to their unclaimed creator profile
3. Clicks "Claim This Profile"
4. Verification process:
   - **Twitter:** Post a specific verification phrase (e.g., "Verifying my @RateMyTip profile #RMT-abc123")
   - **YouTube:** Add a verification code to their channel description
   - **Email:** If brokerage, verify with company email domain
5. Admin reviews and approves the claim
6. Account is upgraded to Creator type
7. Creator profile is marked as "Claimed" with a checkmark

#### 4.3.2 Creator Dashboard (`/dashboard`)

Only visible to claimed creators:

```
┌─────────────────────────────────────────────────────────────────┐
│ CREATOR DASHBOARD                                                │
│                                                                  │
│ ┌─ Overview Stats ─────────────────────────────────────────────┐│
│ │ RMT Score: 78 (+2 this month)                                ││
│ │ Accuracy: 72.3% | Avg Return: +4.2% | Total Tips: 156       ││
│ │ Followers: 342 | Profile Views (30d): 2,156                  ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│ [Post New Tip] [Edit Profile] [View Public Profile]             │
│                                                                  │
│ ┌─ Recent Tip Performance ─────────────────────────────────────┐│
│ │ Table of last 10 tips with live status                       ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌─ User Engagement ────────────────────────────────────────────┐│
│ │ Recent ratings received, recent comments, reviews            ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌─ Score Trends ───────────────────────────────────────────────┐│
│ │ Chart: RMT Score and accuracy over last 90 days             ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.3.3 Posting Tips Directly

Claimed creators can submit tips through the platform (in addition to scraped tips):

```
┌─ Post New Tip ───────────────────────────────────────────────────┐
│                                                                   │
│ Stock:       [Search autocomplete for stock]                     │
│ Direction:   (●) BUY  ( ) SELL                                   │
│ Entry Price: [₹ ________]                                        │
│ Target 1:    [₹ ________]                                        │
│ Target 2:    [₹ ________] (optional)                             │
│ Target 3:    [₹ ________] (optional)                             │
│ Stop Loss:   [₹ ________]                                        │
│ Timeframe:   [Intraday ▾]                                        │
│ Conviction:  ( ) Low  (●) Medium  ( ) High                      │
│                                                                   │
│ Explanation (optional):                                           │
│ ┌───────────────────────────────────────────────────────────────┐│
│ │ [Rich text editor - Markdown]                                 ││
│ │ Add your analysis, charts, reasoning...                       ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                   │
│ [Upload Chart Images] (max 5, max 2MB each)                     │
│                                                                   │
│ ⚠ Once submitted, the tip's price data (entry, targets, SL)     │
│   becomes immutable and cannot be changed.                       │
│                                                                   │
│                                              [Preview] [Submit]  │
└───────────────────────────────────────────────────────────────────┘
```

**Rules for directly posted tips:**
- Same immutability rules as scraped tips (contentHash generated on creation)
- Directly posted tips are auto-approved (no review queue) for claimed creators
- But subject to post-hoc audit — admin can flag/remove
- Creator-posted tips are tagged as `source: "DIRECT"` vs scraped tips tagged as `source: "SCRAPED"`
- Entry price is validated against current market price (must be within 5% of CMP)

---

## 5. RATING & COMMENT SYSTEM

### 5.1 Tip Ratings

#### 5.1.1 Rating Model

- **Scale:** 1-5 stars (integer only)
- **One rating per user per tip** (can update, tracked with timestamp)
- **Display:** Average rating to 1 decimal place + total count
- **Aggregation:** Stored as `avg_rating` and `rating_count` on the tip (denormalized)
- **Minimum ratings to display average:** 3 (below 3, show "Not enough ratings")

#### 5.1.2 Rating Interpretation

| Stars | Meaning |
|-------|---------|
| 5 | Excellent tip — clear, well-reasoned, accurate |
| 4 | Good tip — useful analysis, reasonable targets |
| 3 | Average — some value but missing details |
| 2 | Below average — unclear or poorly reasoned |
| 1 | Poor — misleading, unrealistic, or harmful |

#### 5.1.3 Anti-Gaming Rules

- Account must be verified (email confirmed) to rate
- Account must be at least 24 hours old to rate
- Rate limit: max 50 ratings per user per day
- Creator cannot rate their own tips
- Suspicious patterns flagged for admin review (e.g., same user rating all tips from one creator 1-star)

### 5.2 Comments

#### 5.2.1 Comment Model

- **Plain text** (no markdown/HTML in v1 to reduce moderation complexity)
- **Max length:** 1,000 characters
- **Threading:** One level deep (top-level comments can have replies, but replies cannot have sub-replies)
- **Voting:** Upvote / downvote on each comment (net score displayed)
- **Edit window:** Comments can be edited within 15 minutes of posting
- **Delete:** Users can delete their own comments at any time (soft delete, content replaced with "[deleted]")

#### 5.2.2 Comment Sorting

| Sort | Algorithm |
|------|-----------|
| **Top** (default) | By net upvotes (upvotes - downvotes), descending |
| **Newest** | By creation timestamp, descending |
| **Oldest** | By creation timestamp, ascending |

#### 5.2.3 Creator Engagement

- Creator's comments on their own tips are highlighted with a "Creator" badge
- Creator responses to comments appear pinned at the top of the reply thread
- Creators can pin ONE top-level comment per tip (e.g., an update or clarification)

#### 5.2.4 Moderation

- **Report button** on every comment (reasons: Spam, Harassment, Misleading, Other)
- **Auto-moderation:** Block comments containing known spam patterns, excessive URLs, or profanity
- **Admin review queue:** Reported comments appear in admin moderation queue
- **Moderation actions:** Hide (soft remove), Delete (hard remove), Warn user, Ban user
- **Banned users:** Cannot comment but can still view. Ban is reversible by admin.

### 5.3 Creator Reviews

Separate from tip-level ratings, users can leave **reviews** on a creator's profile:

- **Eligibility:** Must have followed the creator for at least 30 days
- **One review per user per creator** (can update)
- **Fields:** 1-5 star rating + free-text review (max 2,000 characters)
- **Display:** On the "Reviews" tab of the creator profile
- **Aggregated rating:** Separate from the algorithmic RMT Score — this is a "community rating"
- **Not factored into RMT Score** — the RMT Score remains purely data-driven

---

## 6. TIP RANKING ALGORITHM

### 6.1 Feed Score Calculation (Detailed)

```typescript
interface FeedScoreInput {
  tip: Tip;
  creatorRmtScore: number;       // 0-100
  hoursSincePosted: number;
  avgUserRating: number | null;  // 1-5 or null if no ratings
  ratingCount: number;
  commentCount: number;
  viewCount: number;
  tipReturnPct: number | null;   // null if still active
  tipStatus: TipStatus;
}

function calculateFeedScore(input: FeedScoreInput): number {
  // 1. Creator quality signal (30%)
  const creatorSignal = input.creatorRmtScore / 100;

  // 2. Freshness signal (25%)
  const freshnessSignal = Math.exp(-0.03 * input.hoursSincePosted);

  // 3. User rating signal (20%)
  // Wilson score lower bound for confidence-weighted rating
  let ratingSignal = 0.5; // neutral default
  if (input.ratingCount >= 3 && input.avgUserRating !== null) {
    ratingSignal = (input.avgUserRating - 1) / 4; // normalize 1-5 to 0-1
  }

  // 4. Performance signal (15%)
  let performanceSignal = 0.5; // neutral for active tips
  if (input.tipStatus === "ALL_TARGETS_HIT") performanceSignal = 1.0;
  else if (input.tipStatus === "TARGET_2_HIT") performanceSignal = 0.9;
  else if (input.tipStatus === "TARGET_1_HIT") performanceSignal = 0.8;
  else if (input.tipStatus === "EXPIRED") performanceSignal = 0.3;
  else if (input.tipStatus === "STOPLOSS_HIT") performanceSignal = 0.1;

  // 5. Engagement signal (10%)
  const engagementSignal = Math.min(
    1.0,
    Math.log10(input.commentCount + input.viewCount + 1) / 4
  );

  return (
    0.30 * creatorSignal +
    0.25 * freshnessSignal +
    0.20 * ratingSignal +
    0.15 * performanceSignal +
    0.10 * engagementSignal
  );
}
```

### 6.2 Feed Score Caching

- Feed scores are recalculated on a schedule (every 15 minutes)
- Stored as a materialized column `feed_score` on the tips table
- Indexed for fast sorting: `@@index([feed_score(sort: Desc)])`
- Freshness component means scores naturally decay, requiring periodic recalculation

---

## 7. NEW DATABASE MODELS

The following models must be added to the Prisma schema to support v2 features:

### 7.1 User Model (Consumer + Creator)

```prisma
model User {
  id              String      @id @default(cuid())
  email           String      @unique
  emailVerified   DateTime?   @map("email_verified")
  passwordHash    String?     @map("password_hash")  // null for OAuth-only users
  displayName     String      @map("display_name")
  username        String      @unique                  // URL-safe, unique
  avatarUrl       String?     @map("avatar_url")
  role            UserRole    @default(CONSUMER)
  isActive        Boolean     @default(true) @map("is_active")
  isBanned        Boolean     @default(false) @map("is_banned")
  banReason       String?     @map("ban_reason")

  // Link to Creator profile (null for consumers)
  claimedCreatorId String?    @unique @map("claimed_creator_id")

  createdAt       DateTime    @default(now()) @map("created_at")
  updatedAt       DateTime    @updatedAt @map("updated_at")

  // Relations
  claimedCreator  Creator?    @relation("ClaimedBy", fields: [claimedCreatorId], references: [id])
  oauthAccounts   OAuthAccount[]
  tipRatings      TipRating[]
  comments        Comment[]
  commentVotes    CommentVote[]
  savedTips       SavedTip[]
  follows         Follow[]
  creatorReviews  CreatorReview[]

  @@index([username])
  @@index([email])
  @@map("users")
}

enum UserRole {
  CONSUMER
  CREATOR
}
```

### 7.2 OAuth Account

```prisma
model OAuthAccount {
  id            String   @id @default(cuid())
  userId        String   @map("user_id")
  provider      String   // "google", "twitter"
  providerAccountId String @map("provider_account_id")
  accessToken   String?  @map("access_token")
  refreshToken  String?  @map("refresh_token")
  expiresAt     DateTime? @map("expires_at")
  createdAt     DateTime @default(now()) @map("created_at")

  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("oauth_accounts")
}
```

### 7.3 Tip Rating

```prisma
model TipRating {
  id        String   @id @default(cuid())
  tipId     String   @map("tip_id")
  userId    String   @map("user_id")
  rating    Int      // 1-5
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  tip       Tip      @relation(fields: [tipId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([tipId, userId])  // one rating per user per tip
  @@index([tipId])
  @@map("tip_ratings")
}
```

### 7.4 Comment

```prisma
model Comment {
  id          String    @id @default(cuid())
  tipId       String    @map("tip_id")
  userId      String    @map("user_id")
  parentId    String?   @map("parent_id")   // null = top-level, non-null = reply
  content     String    // max 1000 chars
  isPinned    Boolean   @default(false) @map("is_pinned")
  isDeleted   Boolean   @default(false) @map("is_deleted")
  isHidden    Boolean   @default(false) @map("is_hidden")  // admin-hidden
  upvotes     Int       @default(0)
  downvotes   Int       @default(0)
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  tip         Tip       @relation(fields: [tipId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  parent      Comment?  @relation("CommentReplies", fields: [parentId], references: [id])
  replies     Comment[] @relation("CommentReplies")
  votes       CommentVote[]
  reports     CommentReport[]

  @@index([tipId, createdAt(sort: Desc)])
  @@index([tipId, upvotes(sort: Desc)])
  @@index([parentId])
  @@map("comments")
}
```

### 7.5 Comment Vote

```prisma
model CommentVote {
  id        String   @id @default(cuid())
  commentId String   @map("comment_id")
  userId    String   @map("user_id")
  voteType  VoteType @map("vote_type")
  createdAt DateTime @default(now()) @map("created_at")

  comment   Comment  @relation(fields: [commentId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([commentId, userId])  // one vote per user per comment
  @@map("comment_votes")
}

enum VoteType {
  UPVOTE
  DOWNVOTE
}
```

### 7.6 Comment Report

```prisma
model CommentReport {
  id        String       @id @default(cuid())
  commentId String       @map("comment_id")
  reporterId String      @map("reporter_id")
  reason    ReportReason
  details   String?
  status    ReportStatus @default(PENDING)
  createdAt DateTime     @default(now()) @map("created_at")

  comment   Comment      @relation(fields: [commentId], references: [id], onDelete: Cascade)

  @@index([status])
  @@map("comment_reports")
}

enum ReportReason {
  SPAM
  HARASSMENT
  MISLEADING
  OTHER
}

enum ReportStatus {
  PENDING
  REVIEWED
  ACTIONED
  DISMISSED
}
```

### 7.7 Saved Tip (Bookmark)

```prisma
model SavedTip {
  id        String   @id @default(cuid())
  tipId     String   @map("tip_id")
  userId    String   @map("user_id")
  createdAt DateTime @default(now()) @map("created_at")

  tip       Tip      @relation(fields: [tipId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([tipId, userId])
  @@map("saved_tips")
}
```

### 7.8 Follow

```prisma
model Follow {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")       // the follower
  creatorId String   @map("creator_id")    // the followed creator
  createdAt DateTime @default(now()) @map("created_at")

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  creator   Creator  @relation(fields: [creatorId], references: [id], onDelete: Cascade)

  @@unique([userId, creatorId])
  @@index([creatorId])
  @@map("follows")
}
```

### 7.9 Creator Review

```prisma
model CreatorReview {
  id        String   @id @default(cuid())
  creatorId String   @map("creator_id")
  userId    String   @map("user_id")
  rating    Int      // 1-5
  content   String?  // max 2000 chars, optional text review
  isHidden  Boolean  @default(false) @map("is_hidden")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  creator   Creator  @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([creatorId, userId])  // one review per user per creator
  @@index([creatorId, createdAt(sort: Desc)])
  @@map("creator_reviews")
}
```

### 7.10 Tip Explanation (Creator-Written Analysis)

```prisma
model TipExplanation {
  id          String   @id @default(cuid())
  tipId       String   @unique @map("tip_id")
  creatorId   String   @map("creator_id")   // must match tip's creator
  content     String   // Markdown content
  imageUrls   String[] @default([]) @map("image_urls")
  version     Int      @default(1)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  tip         Tip      @relation(fields: [tipId], references: [id], onDelete: Cascade)

  @@map("tip_explanations")
}
```

### 7.11 Fields Added to Existing Models

**Tip model — add these columns:**
```prisma
// Denormalized engagement stats (updated by background job)
avgRating       Float?   @default(0) @map("avg_rating")
ratingCount     Int      @default(0) @map("rating_count")
commentCount    Int      @default(0) @map("comment_count")
viewCount       Int      @default(0) @map("view_count")
saveCount       Int      @default(0) @map("save_count")
feedScore       Float?   @map("feed_score")   // Computed feed ranking score
source          TipSource @default(SCRAPED)    // How the tip was created

// Relations
ratings         TipRating[]
comments        Comment[]
savedBy         SavedTip[]
explanation     TipExplanation?
```

```prisma
enum TipSource {
  SCRAPED     // Auto-scraped from social media
  DIRECT      // Posted directly by claimed creator
  MANUAL      // Manually entered by admin
}
```

**Creator model — add these columns:**
```prisma
// Creator type
creatorType     CreatorType @default(INDIVIDUAL) @map("creator_type")

// Community engagement stats
followerCount   Int        @default(0) @map("platform_follower_count") // Rename existing
internalFollows Int        @default(0) @map("internal_follows")  // RateMyTip followers
avgCommunityRating Float?  @map("avg_community_rating")  // From CreatorReviews
reviewCount     Int        @default(0) @map("review_count")

// Relations
claimedBy       User?      @relation("ClaimedBy")
follows         Follow[]
reviews         CreatorReview[]
```

```prisma
enum CreatorType {
  INDIVIDUAL
  BROKERAGE
  RESEARCH_FIRM
  NEWS_OUTLET
}
```

---

## 8. NEW API ENDPOINTS

### 8.1 Authentication Endpoints

```
POST   /api/auth/register        — Email/password registration
POST   /api/auth/login            — Email/password login
POST   /api/auth/logout           — Logout (clear session)
GET    /api/auth/session          — Get current session
POST   /api/auth/verify-email     — Verify email with token
POST   /api/auth/forgot-password  — Request password reset
POST   /api/auth/reset-password   — Reset password with token
GET    /api/auth/oauth/google     — Google OAuth initiation
GET    /api/auth/oauth/twitter    — Twitter OAuth initiation
GET    /api/auth/callback/:provider — OAuth callback handler
```

### 8.2 User Endpoints

```
GET    /api/v1/users/me                — Get current user profile
PATCH  /api/v1/users/me                — Update profile (name, avatar)
DELETE /api/v1/users/me                — Delete account (soft delete)
GET    /api/v1/users/me/saved-tips     — Get saved/bookmarked tips
GET    /api/v1/users/me/comments       — Get own comment history
GET    /api/v1/users/me/following      — Get followed creators
GET    /api/v1/users/me/ratings        — Get own rating history
```

### 8.3 Feed Endpoint (Replaces/Augments Leaderboard)

```
GET    /api/v1/feed
  Query params:
    sort?: "recommended" | "newest" | "highest_rated" | "best_performers"
           | "top_creators" | "most_discussed"  (default: "recommended")
    direction?: "BUY" | "SELL"
    timeframe?: "INTRADAY" | "SWING" | "POSITIONAL" | "LONG_TERM" (comma-separated)
    assetClass?: AssetClass (comma-separated)
    creatorType?: CreatorType (comma-separated)
    status?: TipStatus (comma-separated)
    stock?: string (stock symbol)
    creator?: string (creator slug)
    dateFrom?: ISO date
    dateTo?: ISO date
    conviction?: "LOW" | "MEDIUM" | "HIGH" (comma-separated)
    minCreatorRating?: number (0-100)
    sector?: string
    cursor?: string (for pagination)
    limit?: number (default: 20, max: 50)
    following?: boolean (if true, only show tips from followed creators)
  Response: ApiResponse<FeedTip[]>
    FeedTip: TipSummary + { feedScore, avgRating, ratingCount, commentCount, isSaved, userRating }
```

### 8.4 Rating Endpoints

```
POST   /api/v1/tips/:id/rate      — Rate a tip (body: { rating: 1-5 })
DELETE /api/v1/tips/:id/rate      — Remove own rating
GET    /api/v1/tips/:id/ratings   — Get rating breakdown for a tip
```

### 8.5 Comment Endpoints

```
GET    /api/v1/tips/:id/comments          — Get comments for a tip (paginated)
  Query: sort?: "top" | "newest" | "oldest", cursor?, limit?
POST   /api/v1/tips/:id/comments          — Post a comment (body: { content, parentId? })
PATCH  /api/v1/comments/:id               — Edit own comment (within 15 min)
DELETE /api/v1/comments/:id               — Delete own comment
POST   /api/v1/comments/:id/vote          — Upvote/downvote (body: { type: "UPVOTE" | "DOWNVOTE" })
DELETE /api/v1/comments/:id/vote          — Remove vote
POST   /api/v1/comments/:id/report        — Report a comment
POST   /api/v1/comments/:id/pin           — Pin comment (creator only, own tips only)
```

### 8.6 Follow Endpoints

```
POST   /api/v1/creators/:slug/follow      — Follow a creator
DELETE /api/v1/creators/:slug/follow      — Unfollow a creator
GET    /api/v1/creators/:slug/followers   — Get follower count (public)
```

### 8.7 Save/Bookmark Endpoints

```
POST   /api/v1/tips/:id/save              — Save/bookmark a tip
DELETE /api/v1/tips/:id/save              — Remove bookmark
```

### 8.8 Creator Review Endpoints

```
GET    /api/v1/creators/:slug/reviews     — Get reviews for a creator
POST   /api/v1/creators/:slug/reviews     — Post a review (body: { rating, content? })
PATCH  /api/v1/creators/:slug/reviews     — Update own review
DELETE /api/v1/creators/:slug/reviews     — Delete own review
```

### 8.9 Creator Self-Service Endpoints

```
POST   /api/v1/creators/:slug/claim       — Initiate claim process
POST   /api/v1/creators/:slug/verify      — Submit verification proof
POST   /api/v1/tips                        — Post a new tip (creator only)
PUT    /api/v1/tips/:id/explanation        — Add/update tip explanation (creator only)
GET    /api/v1/dashboard                   — Creator dashboard data
PATCH  /api/v1/dashboard/profile           — Update creator profile (bio, specializations)
```

---

## 9. NAVIGATION & INFORMATION ARCHITECTURE

### 9.1 Updated Site Map

```
Public Pages (no auth required, but enhanced with auth):
  /                            — Tips discovery feed (NEW homepage)
  /leaderboard                 — Creator leaderboard rankings (still exists)
  /leaderboard/[category]      — Category leaderboards
  /creator/[slug]              — Creator/brokerage profile (ENHANCED)
  /stock/[symbol]              — Stock page with all tips
  /tip/[id]                    — Tip detail page (ENHANCED)
  /search                      — Global search

Auth Pages:
  /login                       — User login (NEW)
  /register                    — User registration (NEW)
  /forgot-password             — Password reset (NEW)
  /verify-email                — Email verification (NEW)

User Pages (auth required):
  /user/[username]             — Public user mini-profile (NEW)
  /settings                    — Account settings (NEW)
  /saved                       — Saved tips (NEW)

Creator Pages (creator auth required):
  /dashboard                   — Creator dashboard (NEW)
  /dashboard/post-tip          — Post new tip form (NEW)
  /dashboard/tips              — Manage own tips (NEW)
  /dashboard/analytics         — Creator analytics (NEW)

Admin Pages (unchanged):
  /admin/login
  /admin/*
```

### 9.2 Header Navigation

```
Logged out:
  [Logo] [Feed] [Leaderboard] [Search]              [Login] [Sign Up]

Logged in (Consumer):
  [Logo] [Feed] [Leaderboard] [Search]    [Saved 🔖] [Avatar ▾]
                                                        ├─ Profile
                                                        ├─ Settings
                                                        └─ Logout

Logged in (Creator):
  [Logo] [Feed] [Leaderboard] [Search]  [+ Post Tip] [Dashboard] [Avatar ▾]
                                                                     ├─ My Profile
                                                                     ├─ Dashboard
                                                                     ├─ Settings
                                                                     └─ Logout
```

---

## 10. SCOPE SUMMARY & PRIORITIES

### 10.1 Feature Priority Tiers

#### P0 — Must Have (Launch Blockers)

| # | Feature | Complexity | Notes |
|---|---------|-----------|-------|
| 1 | Tips discovery feed with ranking algorithm | High | Core new page, replaces homepage |
| 2 | Feed filters (all 11 filter types) | Medium | URL-driven, shareable |
| 3 | Feed sorting (6 sort options) | Medium | Server-side sorting |
| 4 | User registration (email + OAuth) | High | Foundation for all interactivity |
| 5 | User login / session management | High | NextAuth expansion |
| 6 | Tip rating (1-5 stars) | Medium | Core interaction |
| 7 | Tip comments (post, reply, vote) | High | Core social feature |
| 8 | Enhanced tip detail page | Medium | Ratings + comments integration |
| 9 | Enhanced creator profile (tabs, reviews tab) | Medium | Reorganize existing page |

#### P1 — Should Have (Important but not blocking)

| # | Feature | Complexity | Notes |
|---|---------|-----------|-------|
| 10 | Save/bookmark tips | Low | Simple CRUD |
| 11 | Follow creators | Low | Simple CRUD + feed filtering |
| 12 | Creator claiming & verification | High | Multi-step process |
| 13 | Creator dashboard | Medium | Stats + management |
| 14 | Direct tip posting (by creators) | Medium | Form + validation |
| 15 | Tip explanation editing (by creators) | Medium | Rich text + images |
| 16 | Creator reviews (by users) | Medium | Separate from tip ratings |
| 17 | Comment moderation (reporting, admin tools) | Medium | Abuse prevention |

#### P2 — Nice to Have (Post-Launch Iteration)

| # | Feature | Complexity | Notes |
|---|---------|-----------|-------|
| 18 | "Following" feed tab | Low | Filter feed by followed creators |
| 19 | Brokerage-specific profile layout | Medium | Analyst roster, coverage universe |
| 20 | Live price tracker on tip detail | Medium | Real-time mini chart |
| 21 | Related tips section | Low | Same stock / same creator |
| 22 | Consumer profile page | Low | Comment history, saved tips |
| 23 | Feed score caching & background recalculation | Medium | Performance optimization |
| 24 | Anti-gaming detection for ratings | Medium | Pattern detection |

### 10.2 Technical Dependencies

```
User Auth (P0 #4-5) ──→ blocks everything interactive
  ├── Tip Rating (#6)
  ├── Comments (#7)
  ├── Save/Bookmark (#10)
  ├── Follow (#11)
  ├── Creator Reviews (#16)
  └── Creator Claiming (#12) ──→ blocks
        ├── Creator Dashboard (#13)
        ├── Direct Tip Posting (#14)
        └── Tip Explanation Editing (#15)

Feed Ranking Algorithm (#1) ──→ needs
  ├── Tip Ratings aggregation (#6)
  └── Comment counts (#7)
```

### 10.3 Migration Notes

- Existing `AdminUser` auth remains separate from new `User` auth
- Existing `Creator` model gets new columns but no breaking changes
- Existing `Tip` model gets new denormalized columns (nullable, backward compatible)
- All new features are additive — no existing functionality is removed
- The `/leaderboard` page remains as-is; the homepage changes to the feed
- URL structure is preserved — no existing URLs break

---

**END OF REQUIREMENTS-V2.md**

*This document captures the full scope of interactive features.
Implementation should follow the priority tiers (P0 → P1 → P2)
and respect the technical dependency chain.*
