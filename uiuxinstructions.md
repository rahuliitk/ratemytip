# UI/UX Design System Overhaul — RateMyTip

> **Design Philosophy:** "The Rotten Tomatoes of Stock Tips — built for people who are
> just getting started, not for people who already know everything."
>
> Every design decision must pass one test: **Would a 22-year-old first-time investor
> in Bangalore feel confident, not confused, when they land on this page?**

---

## TABLE OF CONTENTS

1. [Design Diagnosis: What's Wrong Now](#1-design-diagnosis-whats-wrong-now)
2. [Design Vision & Principles](#2-design-vision--principles)
3. [Target Audience & Personas](#3-target-audience--personas)
4. [Brand Identity Overhaul](#4-brand-identity-overhaul)
5. [Color System](#5-color-system)
6. [Typography System](#6-typography-system)
7. [Spacing, Layout & Grid](#7-spacing-layout--grid)
8. [Iconography & Illustration](#8-iconography--illustration)
9. [Component Design System](#9-component-design-system)
10. [Motion & Interaction Design](#10-motion--interaction-design)
11. [Page-by-Page Redesign](#11-page-by-page-redesign)
12. [Mobile-First Design](#12-mobile-first-design)
13. [Navigation & Information Architecture](#13-navigation--information-architecture)
14. [Gamification & Engagement Loops](#14-gamification--engagement-loops)
15. [Accessibility & Inclusive Design](#15-accessibility--inclusive-design)
16. [Dark Mode](#16-dark-mode)
17. [Micro-Copy & Tone of Voice](#17-micro-copy--tone-of-voice)
18. [Performance & Perceived Speed](#18-performance--perceived-speed)
19. [Implementation Priority](#19-implementation-priority)

---

## 1. DESIGN DIAGNOSIS: WHAT'S WRONG NOW

### 1.1 Problems Identified

| Problem | Severity | Current State |
|---------|----------|---------------|
| **Corporate/Intimidating** | Critical | Navy-blue gradient hero, dense tables, uppercase headers — feels like a Bloomberg terminal, not a social platform |
| **Information Overload** | Critical | Every metric shown simultaneously. No progressive disclosure. First-time investors see "RMT Score", "Risk-Adjusted Return", "Coefficient of Variation" with no context |
| **No Emotional Connection** | High | Zero personality. No illustrations, no warmth. Could be any fintech SaaS landing page |
| **Not Social-Feeling** | High | Table-based layouts scream "database viewer", not "social network where I discover people to trust" |
| **Jargon-Heavy** | High | "RMT Score", "Positional", "Conviction", "Asset Class" — none of these mean anything to a beginner |
| **Weak Visual Hierarchy** | Medium | Everything is the same visual weight. Score ring competes with stats grid competes with tip feed |
| **Generic Aesthetic** | Medium | Navy-to-blue gradient is used by 90% of fintech apps. Zero memorability |
| **Hover-Dependent Interactions** | Medium | Card-hover, gradient-border-hover — none work on mobile where 70%+ of traffic will come from |
| **Monochrome Score System** | Medium | Score colors range from dark navy to dark red — subtle differences hard to distinguish at a glance |
| **Passive Experience** | Medium | No CTAs beyond "View Full Leaderboard". No engagement hooks, no reason to come back |

### 1.2 What the Current Design Gets Right (Keep These)

- Tabular numbers for financial data — maintain this
- Score ring visualization concept — refine, don't discard
- Tier system (Bronze through Diamond) — great gamification foundation
- Glass morphism on header — subtle and modern
- ShadCN component base — solid foundation to build on
- Server-side rendering approach — keep for SEO

---

## 2. DESIGN VISION & PRINCIPLES

### 2.1 The Vision

**RateMyTip should feel like the love child of Instagram's visual clarity, Robinhood's approachability, and Rotten Tomatoes' trusted scoring system.**

When a first-time investor lands on RateMyTip, they should immediately understand three things:
1. "This shows me which stock tip-givers are actually good"
2. "I can trust this — it's transparent and data-backed"
3. "I want to explore more — this is interesting and easy to navigate"

### 2.2 Five Core Design Principles

#### Principle 1: Clarity Over Cleverness
Every element earns its space. If a first-time investor can't understand something in 3 seconds, simplify it or add context. No financial jargon without explanation.

**Applied:**
- Replace "RMT Score" with "Trust Score" in user-facing UI (keep RMT Score in the API/backend)
- Add one-line explainers beneath every metric
- Use familiar language: "Win Rate" not "Accuracy Rate", "Avg Profit" not "Risk-Adjusted Return"

#### Principle 2: Progressive Disclosure
Show the simple version first. Let curious users drill deeper. The homepage should feel like a magazine cover, not a spreadsheet.

**Applied:**
- Leaderboard shows 3 metrics by default (Trust Score, Win Rate, Total Calls). Full breakdown on tap/click
- Tip cards show the headline (Stock, Direction, Result) with expandable detail
- Creator profiles lead with the human story, not the data table

#### Principle 3: Social First, Data Second
People trust people, not numbers. Center the experience around creators as personalities, not rows in a table.

**Applied:**
- Replace table-based leaderboard with card-based creator showcase
- Creator profiles lead with avatar, bio, and social proof before diving into stats
- Add social signals: "Followed by 2,340 investors", community ratings

#### Principle 4: Confidence Through Transparency
Every score should be explainable. Every tip should be traceable. Transparency builds trust.

**Applied:**
- "How is this score calculated?" expandable on every score display
- Tip cards show the original source post (screenshot/link)
- Score history charts visible on every creator profile

#### Principle 5: Delight in the Details
Micro-interactions, celebration moments, and thoughtful transitions make the app feel alive — not a dead data dump.

**Applied:**
- Confetti/sparkle animation when viewing a creator with 90+ Trust Score
- Smooth number counting animations on stats
- Playful empty states with illustrations
- Haptic-feeling button presses on mobile

---

## 3. TARGET AUDIENCE & PERSONAS

### 3.1 Primary Persona: "Curious Priya"

- **Age:** 23, Bangalore
- **Occupation:** Software engineer at a startup
- **Investing experience:** 6 months. Has a Zerodha account. Bought NIFTY 50 ETF.
- **Behavior:** Follows 5-6 finfluencers on Twitter/YouTube. Confused about who to trust. Wants to invest in individual stocks but scared of losing money.
- **Device:** iPhone 14 / Samsung Galaxy S23. Browses during commute and lunch break.
- **Emotional needs:** Confidence, simplicity, social validation
- **Pain points:** "Everyone claims they're the best. I can't verify anyone's track record."

**Design implications for Priya:**
- Mobile-first, thumb-friendly navigation
- Simple language, no jargon
- Social proof elements (other investors follow this person)
- Quick, scannable content (she's on a lunch break)
- Clear visual indicators of good vs bad (red/green, thumbs up/down)

### 3.2 Secondary Persona: "Methodical Arjun"

- **Age:** 31, Mumbai
- **Occupation:** Product manager at a bank
- **Investing experience:** 3 years. Does his own research. Uses Screener.in.
- **Behavior:** Wants data to validate his existing choices. Follows 20+ analysts. Wants to compare them objectively.
- **Device:** MacBook Pro (primary), iPhone (secondary)
- **Emotional needs:** Authority, depth, customization
- **Pain points:** "I want to see the actual numbers — win rate by timeframe, consistency over time."

**Design implications for Arjun:**
- Desktop experience should allow side-by-side comparison
- Deep drill-down available (but hidden by default)
- Export/share capabilities
- Filters and sorting that feel powerful without being overwhelming

---

## 4. BRAND IDENTITY OVERHAUL

### 4.1 Brand Personality

**Before:** Serious. Corporate. "We are a financial data platform."
**After:** Confident. Friendly. Trustworthy. "We help you find tip-givers you can actually trust."

Think: **The confident, approachable friend who happens to know a lot about finance** — not the intimidating analyst in a suit.

### 4.2 Logo Direction

Keep the "RateMyTip" name. Refresh the logo treatment:

- **Icon:** Move away from the generic BarChart3 icon. Use a stylized checkmark + star hybrid — represents "verified quality"
- **Typography:** Keep bold weight but use a friendlier typeface (see Typography section). Slightly rounded letterforms.
- **Color:** Use the new Emerald/Teal primary (see Color section) instead of navy

### 4.3 Tagline

**Before:** "Every Call. Rated."
**After:** "Know Before You Follow." or "See the Real Track Record."

The new tagline speaks to the user's need (knowing who to trust) rather than the platform's feature (rating calls).

---

## 5. COLOR SYSTEM

### 5.1 Why the Current Colors Fail

The current palette (`#1A365D` navy primary, `#2B6CB0` accent blue) creates a cold, corporate, "traditional finance" feel. This is exactly the aesthetic that intimidates new investors. Navy-to-blue gradients are also the most overused pattern in fintech — zero differentiation.

### 5.2 New Color Philosophy

**Warm Confidence.** The new palette should feel:
- Trustworthy but approachable (not corporate)
- Modern and distinctive (not "yet another fintech")
- High-contrast for accessibility
- Energetic enough for a social platform

### 5.3 New Primary Palette

```css
:root {
  /* ──── Primary: Deep Teal ──── */
  /* Teal conveys trust + growth simultaneously. Unlike navy, it feels
     modern and energetic. Used for primary brand elements. */
  --color-primary-50:  #F0FDFA;
  --color-primary-100: #CCFBF1;
  --color-primary-200: #99F6E4;
  --color-primary-300: #5EEAD4;
  --color-primary-400: #2DD4BF;
  --color-primary-500: #14B8A6;  /* Main primary */
  --color-primary-600: #0D9488;  /* Primary hover / pressed */
  --color-primary-700: #0F766E;  /* Dark primary for text on light bg */
  --color-primary-800: #115E59;
  --color-primary-900: #134E4A;
  --color-primary-950: #042F2E;

  /* ──── Secondary: Warm Slate ──── */
  /* Warm gray instead of cool gray. Adds approachability to text/backgrounds. */
  --color-slate-50:  #F8FAFC;
  --color-slate-100: #F1F5F9;
  --color-slate-200: #E2E8F0;
  --color-slate-300: #CBD5E1;
  --color-slate-400: #94A3B8;
  --color-slate-500: #64748B;
  --color-slate-600: #475569;
  --color-slate-700: #334155;
  --color-slate-800: #1E293B;
  --color-slate-900: #0F172A;
  --color-slate-950: #020617;

  /* ──── Accent: Violet ──── */
  /* A pop of energy. Used sparingly for CTAs, badges, premium features.
     Violet is unexpected in fintech — creates memorability. */
  --color-accent-50:  #F5F3FF;
  --color-accent-100: #EDE9FE;
  --color-accent-200: #DDD6FE;
  --color-accent-300: #C4B5FD;
  --color-accent-400: #A78BFA;
  --color-accent-500: #8B5CF6;  /* Main accent */
  --color-accent-600: #7C3AED;  /* Accent hover */
  --color-accent-700: #6D28D9;
  --color-accent-800: #5B21B6;
  --color-accent-900: #4C1D95;

  /* ──── Semantic Colors ──── */

  /* Success / Profit / Target Hit */
  --color-success-50:  #F0FDF4;
  --color-success-100: #DCFCE7;
  --color-success-200: #BBF7D0;
  --color-success-400: #4ADE80;
  --color-success-500: #22C55E;
  --color-success-600: #16A34A;
  --color-success-700: #15803D;

  /* Danger / Loss / Stop-Loss Hit */
  --color-danger-50:  #FFF1F2;
  --color-danger-100: #FFE4E6;
  --color-danger-200: #FECDD3;
  --color-danger-400: #FB7185;
  --color-danger-500: #F43F5E;  /* Rose instead of pure red — softer, modern */
  --color-danger-600: #E11D48;
  --color-danger-700: #BE123C;

  /* Warning / Pending / Caution */
  --color-warning-50:  #FFFBEB;
  --color-warning-100: #FEF3C7;
  --color-warning-400: #FBBF24;
  --color-warning-500: #F59E0B;
  --color-warning-600: #D97706;

  /* Info / Active / Neutral Action */
  --color-info-50:  #EFF6FF;
  --color-info-100: #DBEAFE;
  --color-info-400: #60A5FA;
  --color-info-500: #3B82F6;
  --color-info-600: #2563EB;
}
```

### 5.4 Score Color System (Simplified & Bolder)

The current score colors are subtle dark-to-dark transitions. New system uses bright, unmistakable colors:

```css
:root {
  /* Trust Score Color Bands — immediately recognizable */

  /* 80-100: Emerald Green — "Excellent" */
  --score-excellent-bg: #ECFDF5;
  --score-excellent-text: #065F46;
  --score-excellent-fill: #10B981;
  --score-excellent-ring: #34D399;

  /* 60-79: Blue — "Good" */
  --score-good-bg: #EFF6FF;
  --score-good-text: #1E40AF;
  --score-good-fill: #3B82F6;
  --score-good-ring: #60A5FA;

  /* 40-59: Amber — "Average" */
  --score-avg-bg: #FFFBEB;
  --score-avg-text: #92400E;
  --score-avg-fill: #F59E0B;
  --score-avg-ring: #FBBF24;

  /* 20-39: Orange — "Below Average" */
  --score-below-bg: #FFF7ED;
  --score-below-text: #9A3412;
  --score-below-fill: #F97316;
  --score-below-ring: #FB923C;

  /* 0-19: Rose — "Poor" */
  --score-poor-bg: #FFF1F2;
  --score-poor-text: #9F1239;
  --score-poor-fill: #F43F5E;
  --score-poor-ring: #FB7185;
}
```

### 5.5 Tip Direction Colors

```css
:root {
  /* BUY = Green (universally understood) */
  --tip-buy-bg: #F0FDF4;
  --tip-buy-border: #86EFAC;
  --tip-buy-text: #166534;
  --tip-buy-badge: #22C55E;

  /* SELL = Rose/Red */
  --tip-sell-bg: #FFF1F2;
  --tip-sell-border: #FDA4AF;
  --tip-sell-text: #9F1239;
  --tip-sell-badge: #F43F5E;
}
```

### 5.6 Background System

```css
:root {
  /* Page background: warm off-white with subtle cool undertone */
  --bg-page: #FAFBFD;

  /* Surface levels (card stacking) */
  --bg-surface-0: #FFFFFF;     /* Base cards */
  --bg-surface-1: #F8FAFC;     /* Nested cards, table headers */
  --bg-surface-2: #F1F5F9;     /* Deeply nested, filter bars */
  --bg-surface-3: #E2E8F0;     /* Disabled/muted areas */

  /* Colored surfaces (subtle tints for section backgrounds) */
  --bg-primary-subtle: #F0FDFA;    /* Hero sections, feature highlights */
  --bg-accent-subtle: #F5F3FF;     /* Premium/special sections */
  --bg-success-subtle: #F0FDF4;    /* Positive stat cards */
  --bg-danger-subtle: #FFF1F2;     /* Negative stat cards */
}
```

### 5.7 Gradient System

```css
:root {
  /* Hero gradient: Teal-to-Slate — dramatic but warm */
  --gradient-hero: linear-gradient(135deg, #0F766E 0%, #134E4A 50%, #0F172A 100%);

  /* Primary gradient: Teal */
  --gradient-primary: linear-gradient(135deg, #14B8A6 0%, #0D9488 100%);

  /* Accent gradient: Violet-to-Purple */
  --gradient-accent: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);

  /* Success gradient */
  --gradient-success: linear-gradient(135deg, #22C55E 0%, #16A34A 100%);

  /* Danger gradient */
  --gradient-danger: linear-gradient(135deg, #F43F5E 0%, #E11D48 100%);

  /* Gold/Premium gradient */
  --gradient-gold: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);

  /* Mesh gradient for hero (modern, unique) */
  --gradient-mesh: radial-gradient(
    ellipse at 20% 50%,
    rgba(20, 184, 166, 0.15) 0%,
    transparent 50%
  ),
  radial-gradient(
    ellipse at 80% 20%,
    rgba(139, 92, 246, 0.10) 0%,
    transparent 50%
  ),
  radial-gradient(
    ellipse at 50% 80%,
    rgba(244, 63, 94, 0.05) 0%,
    transparent 50%
  );

  /* Card shimmer (on hover, premium feel) */
  --gradient-shimmer: linear-gradient(
    110deg,
    transparent 25%,
    rgba(255, 255, 255, 0.1) 50%,
    transparent 75%
  );
}
```

---

## 6. TYPOGRAPHY SYSTEM

### 6.1 Font Selection

**Before:** Inter (good, but generic)
**After:** **Plus Jakarta Sans** for headings + **Inter** for body

**Why Plus Jakarta Sans?**
- Geometric but with softened terminals (not cold like pure geometric fonts)
- Excellent numeric design (tabular figures available)
- Feels modern, confident, and slightly playful
- Strong personality that differentiates from the sea of Inter-only fintech apps
- Free on Google Fonts, excellent language support

```css
/* Font imports */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;600&display=swap');

:root {
  --font-heading: 'Plus Jakarta Sans', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
}
```

### 6.2 Type Scale

Use a **modular scale** with a ratio of 1.25 (Major Third) for harmonious sizing.

```
/* Heading scale — Plus Jakarta Sans */
Display:    48px / 56px line-height / -0.02em tracking / 800 weight
H1:         36px / 44px / -0.02em / 800
H2:         28px / 36px / -0.01em / 700
H3:         22px / 30px / -0.01em / 700
H4:         18px / 26px / 0em / 600
H5:         16px / 24px / 0em / 600

/* Body scale — Inter */
Body Large:  18px / 28px / 0em / 400
Body:        16px / 24px / 0em / 400
Body Small:  14px / 20px / 0em / 400
Caption:     12px / 16px / 0.01em / 500
Overline:    11px / 16px / 0.08em / 600 / UPPERCASE

/* Numeric scale — JetBrains Mono */
Score XL:    40px / 48px / -0.02em / 700  (Trust Score main display)
Score LG:    28px / 36px / -0.01em / 600  (Stat cards)
Score MD:    20px / 28px / 0em / 600      (Table cells)
Score SM:    14px / 20px / 0em / 500      (Inline scores)
Price:       16px / 24px / 0em / 500      (Stock prices)
```

### 6.3 Typography Rules

1. **Headings** always use Plus Jakarta Sans. Never use it for body text.
2. **Body text** always uses Inter. Never for headings.
3. **All financial numbers** (prices, scores, percentages, counts) use JetBrains Mono. This creates a distinct "data" feel while being highly readable.
4. **Line length:** Max 65 characters per line for body text. Use `max-w-prose` or `max-w-2xl`.
5. **Responsive scaling:** Headings scale down by one step on mobile (Display -> H1, H1 -> H2, etc.)
6. **Color hierarchy:**
   - Primary text: `slate-900` (headings, important content)
   - Secondary text: `slate-600` (body, descriptions)
   - Tertiary text: `slate-400` (captions, timestamps, helper text)
   - Link text: `primary-600` with `primary-700` on hover

---

## 7. SPACING, LAYOUT & GRID

### 7.1 Spacing Scale

Use an **8px base unit** system. Every spacing value is a multiple of 8.

```
4px   — 0.5 unit (micro gaps: between icon and label)
8px   — 1 unit   (tight: between related inline elements)
12px  — 1.5 unit (compact: between form label and input)
16px  — 2 units  (standard: between paragraphs, card padding mobile)
24px  — 3 units  (comfortable: between card sections, card padding desktop)
32px  — 4 units  (spacious: between distinct content blocks)
48px  — 6 units  (section: between major page sections)
64px  — 8 units  (large section: between hero and content)
96px  — 12 units (hero: top/bottom padding of hero sections)
```

### 7.2 Border Radius System

The current `rounded-2xl` (24px) on everything is too uniform. Create hierarchy:

```
Radius system:
  4px   (--radius-xs)   — Small inline elements (badges text, mini tags)
  6px   (--radius-sm)   — Buttons (sm), inputs, inline badges
  8px   (--radius-md)   — Standard buttons, dropdowns
  12px  (--radius-lg)   — Cards, dialogs, popovers
  16px  (--radius-xl)   — Large cards, main content areas
  20px  (--radius-2xl)  — Hero cards, featured sections
  9999px (--radius-full) — Avatars, circular buttons, pills
```

**Key change:** Cards use `12px` (not 24px). This is more refined and modern. The over-rounded look of 24px feels dated/toy-like.

### 7.3 Layout Grid

```
Container max widths:
  --container-sm:  640px   (text-heavy pages like blog, about)
  --container-md:  768px   (forms, settings)
  --container-lg:  1024px  (content pages with sidebar)
  --container-xl:  1280px  (main pages: leaderboard, search)
  --container-2xl: 1440px  (never exceed this)

Standard page layout:
  <main class="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">

Sidebar layout (creator profile, stock page):
  Main content: 2/3 width (col-span-8)
  Sidebar: 1/3 width (col-span-4)
  Gap: 32px

Card grid (leaderboard cards):
  Mobile: 1 column, full width
  Tablet: 2 columns, 16px gap
  Desktop: 3 columns, 24px gap
```

### 7.4 Card Elevation System

Replace the current flat shadow system with a clear elevation hierarchy:

```
Level 0 (Flat):     No shadow, 1px border (slate-200)
                    Use for: table rows, list items, inline cards

Level 1 (Raised):   shadow-sm + 1px border (slate-100)
                    Use for: standard cards, dropdowns, tooltips

Level 2 (Floating): shadow-md + no border
                    Use for: modals, popovers, sticky headers

Level 3 (Prominent): shadow-lg
                    Use for: hero cards, featured content, toast notifications

Level 4 (Elevated):  shadow-xl
                    Use for: Mobile bottom sheets, command palette, spotlight search
```

---

## 8. ICONOGRAPHY & ILLUSTRATION

### 8.1 Icon System

**Keep:** Lucide React icons (clean, consistent, lightweight)

**Change:** How icons are used.

**Icon usage rules:**
1. **Size:** Use only 3 sizes: 16px (inline), 20px (standard), 24px (prominent)
2. **Color:** Icons should always be `slate-400` (muted) or match text color. Never colored independently except for semantic meaning (green checkmark, red X).
3. **Stroke width:** Always 1.5px (not the default 2px). Thinner strokes feel more refined.
4. **Paired with text:** Icons should almost always appear alongside text labels. Icon-only buttons need `aria-label` AND a tooltip.

### 8.2 Illustrations

**Add custom illustrations for:**

1. **Empty states** — Friendly, hand-drawn style illustrations:
   - "No results found" — Confused telescope looking at empty sky
   - "No tips yet" — Seedling in a pot with a growth arrow
   - "Creator not rated" — Star outline with a "coming soon" badge

2. **Onboarding moments:**
   - "How Trust Score works" — Simple 3-step visual (We collect tips -> Track results -> Calculate score)
   - "What makes a good creator" — Visual comparison of good vs bad track record

3. **Celebration moments:**
   - Score above 80: Subtle sparkle/confetti particles
   - All targets hit: Small firework micro-animation

**Illustration style:** Line art with 2-3 accent colors (primary teal + accent violet). Think: Linear app, Notion illustrations, Stripe's style.

### 8.3 Emoji Usage

Emojis are allowed and encouraged in specific contexts:
- Tip direction: Use alongside text — not replacing it
- Tier badges: Can pair with tier name
- Empty states: Adds friendliness
- Score labels: Subtle emphasis

```
Trust Score Labels:
  80-100: "Excellent" with subtle star icon
  60-79:  "Good"
  40-59:  "Average"
  20-39:  "Below Average"
  0-19:   "Poor"
```

---

## 9. COMPONENT DESIGN SYSTEM

### 9.1 Creator Card (The Star Component)

This replaces the current table row as the primary way to see a creator. It should feel like an Instagram profile preview or a Tinder card — immediate visual appeal, key info at a glance.

```
┌──────────────────────────────────────────────────┐
│  ┌────┐                                          │
│  │    │  Rakesh Jhunjhunwala            ⭐ 84    │
│  │ AV │  @rakesh_jj · 142K followers             │
│  │    │  Swing Trading · Large Cap                │
│  └────┘                                          │
│                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │ Win Rate │ │ Avg Gain │ │ 234 calls rated  │  │
│  │  72.3%   │ │  +4.2%   │ │  Gold Tier       │  │
│  └──────────┘ └──────────┘ └──────────────────┘  │
│                                                  │
│  Recent: RELIANCE ✅ +6.2% · TCS ❌ -2.1% ·     │
│          INFY ✅ +3.8%                           │
│                                                  │
│  ┌─────────────────────────────────────────────┐ │
│  │           View Full Profile →                │ │
│  └─────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

**Design specs:**
- Card: `bg-white`, `rounded-xl` (12px), `border border-slate-100`, Level 1 shadow
- Avatar: 48px, `rounded-full`, ring-2 with tier color
- Name: Plus Jakarta Sans, 16px, 700 weight, `slate-900`
- Handle/followers: Inter, 13px, 400 weight, `slate-400`
- Tags: Pill badges, `rounded-full`, 11px, `bg-primary-50 text-primary-700`
- Score: JetBrains Mono, 24px, 700 weight. Circular badge with score color bg.
- Stats row: 3 equal columns, `bg-slate-50 rounded-lg`, 12px/14px mono numbers
- Recent calls: Horizontal scroll or truncated line, small text, emoji status indicators
- CTA: Full-width ghost button, `text-primary-600 hover:bg-primary-50`

**Interaction:** On hover, card lifts 2px with shadow increase. On tap (mobile), navigates to full profile.

### 9.2 Trust Score Display

Replace the current ScoreRing with a cleaner, more versatile system:

**Variant A: Score Badge (Inline)**
```
For use in tables, lists, compact spaces.

┌──────────┐
│  ⭐ 84   │   (Score color bg, white text, rounded-full)
└──────────┘

- Size sm: 28px height, 12px font
- Size md: 32px height, 14px font
- Size lg: 40px height, 18px font
```

**Variant B: Score Card (Profile/Feature)**
```
For creator profiles and featured sections.

┌───────────────────────┐
│                       │
│        ⭐ 84          │   (Large centered score, JetBrains Mono 40px)
│    Trust Score        │   (Label, 12px, slate-400)
│                       │
│   ████████████░░      │   (Progress bar, score-color fill)
│                       │
│   "Excellent" · ±3    │   (Label + confidence, 13px)
│                       │
│   How is this          │
│   calculated? →       │   (Expandable explainer link)
│                       │
└───────────────────────┘

- Card: bg-white, rounded-xl, border, p-6
- Score number: score-color, JetBrains Mono, 40px, 700
- Progress bar: 8px height, rounded-full, bg-slate-100 track, score-color fill
- Label: Plus Jakarta Sans, 13px, 600, score-color
- Confidence: JetBrains Mono, 12px, slate-400
- "How calculated" link: 12px, primary-600, with chevron-right icon
```

**Variant C: Score Ring (Kept but refined)**
```
Keep the SVG ring concept but refine it:
- Thinner ring stroke (8px, not 12px)
- Single color (no gradient on the ring — too complex)
- Clean label inside
- Animate on scroll-into-view, not on page load
- Sizes: 64px (sm), 96px (md), 128px (lg)
```

### 9.3 Tip Card

The tip card is where trust is built or broken. It needs to tell a complete story at a glance.

```
┌─────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────────┐   │
│  │  🟢 BUY                              14 Jan 2026    │   │
│  │  RELIANCE · NSE                       Swing Trade   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│   Entry     Target    Stop Loss     Status                  │
│   ₹2,420    ₹2,600    ₹2,350       ✅ Target Hit           │
│                                                             │
│   ┌───────────────────────────────────────────────────┐     │
│   │  █████████████████████████████░░░░░░░░  +7.4%    │     │
│   └───────────────────────────────────────────────────┘     │
│                                                             │
│   📎 View original post    👤 By Rakesh J. (⭐ 84)         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Design specs:**
- Card: `bg-white rounded-xl border border-slate-100` Level 1 shadow
- Top section: Direction pill badge (green BUY / rose SELL), stock name as heading, date right-aligned
- Price row: 4 columns, JetBrains Mono numbers, `slate-600` labels above
- Status: Color-coded badge with icon
- Return bar: Horizontal progress bar, green fill for gain, rose fill for loss, percentage at end
- Source link: Small, `text-primary-600`, links to original tweet/video
- Creator attribution: Small avatar (20px) + name + score badge (sm)
- Left border: 3px, direction color (green for BUY, rose for SELL) — keep this current pattern

**Expandable detail (on tap):**
- Shows Target 2, Target 3 if applicable
- Shows price chart with entry/target/SL lines
- Shows full rationale text
- Shows amendment history
- Shows time-to-resolution

### 9.4 Stat Card

```
┌─────────────────────────┐
│  Win Rate               │   (Label: 12px, slate-400, uppercase)
│                         │
│  72.3%                  │   (Value: JetBrains Mono, 28px, score-color)
│                         │
│  ↑ 3.2% from last      │   (Trend: 12px, success/danger color with arrow)
│  month                  │
└─────────────────────────┘
```

**Design specs:**
- Card: `bg-white rounded-xl border border-slate-100 p-5`
- No icons. The number IS the visual. (Current design uses icon circles that add visual noise without adding information.)
- Label: Inter 12px 600 uppercase tracking-wider slate-400
- Value: JetBrains Mono 28px 700, colored by semantic meaning (green if good, default if neutral)
- Trend: Inter 12px 500, green with up-arrow for improvement, rose with down-arrow for decline
- Optional: Subtle sparkline (32px tall) behind the number for last 30 days trend

### 9.5 Buttons

```
Primary:
  bg: gradient-primary (teal)
  text: white
  radius: 8px
  padding: 12px 20px (md), 10px 16px (sm), 14px 24px (lg)
  shadow: sm
  hover: brightness-110, shadow-md
  active: brightness-95

Secondary:
  bg: white
  text: slate-700
  border: 1px slate-200
  radius: 8px
  hover: bg-slate-50, border-slate-300

Ghost:
  bg: transparent
  text: slate-600
  radius: 8px
  hover: bg-slate-100

Danger:
  bg: gradient-danger (rose)
  text: white
  Same specs as Primary

Link:
  bg: none
  text: primary-600
  underline on hover
  No padding, no border
```

**Key change:** Remove the "glow" variant. Glowing buttons feel gimmicky and reduce trust. Replace with a subtle `shadow-md` on hover for the primary button.

### 9.6 Badges / Pills

```
Tier badges:
  DIAMOND:  bg-violet-100  text-violet-800   border-violet-200
  PLATINUM: bg-blue-100    text-blue-800     border-blue-200
  GOLD:     bg-amber-100   text-amber-800    border-amber-200
  SILVER:   bg-slate-100   text-slate-600    border-slate-200
  BRONZE:   bg-orange-100  text-orange-800   border-orange-200
  UNRATED:  bg-slate-50    text-slate-400    border-slate-100

Status badges:
  ACTIVE:          bg-info-100     text-info-700     dot: info-500
  TARGET_HIT:      bg-success-100  text-success-700  dot: success-500
  STOPLOSS_HIT:    bg-danger-100   text-danger-700   dot: danger-500
  EXPIRED:         bg-slate-100    text-slate-500    dot: slate-400
  PENDING_REVIEW:  bg-warning-100  text-warning-700  dot: warning-500

Category pills:
  bg-primary-50 text-primary-700 border-primary-200 rounded-full px-3 py-1 text-xs font-medium

Tag specs:
  All badges: rounded-full, px-2.5 py-0.5, text-[11px] leading-4, font-semibold
  Include a 6px colored dot (circle) before text for status badges
```

### 9.7 Tables (When Needed)

Tables should only be used for the detailed leaderboard view and admin pages. For public discovery, always prefer cards.

```
Table design:
  Container: rounded-xl border border-slate-200 overflow-hidden
  Header row: bg-slate-50, text-[11px] uppercase tracking-wider font-semibold text-slate-400
  Body rows: bg-white, hover:bg-slate-50, transition-colors 150ms
  Cell padding: px-4 py-3
  Borders: border-b border-slate-100 between rows (no vertical borders)
  Sticky header: position sticky top-0 z-10 bg-slate-50
  Row highlight for top 3: Left border 3px (gold, silver, bronze)
  Sort indicators: Chevron icons, primary-500 color when active

  Mobile behavior: Horizontally scrollable with fade-out gradient on right edge
```

### 9.8 Search / Command Palette

Replace the current search bar with a Spotlight-style command palette:

```
Trigger: Click search icon in header, OR press Cmd/Ctrl + K

┌──────────────────────────────────────────────────────────┐
│  🔍  Search creators, stocks, or tips...                 │
│─────────────────────────────────────────────────────────  │
│                                                          │
│  TRENDING NOW                                            │
│  ┌──────────────────────────────────────────────────┐    │
│  │  📈 RELIANCE · ₹2,847 · 5 active tips           │    │
│  │  👤 Market Guru · ⭐ 91 · +8.2% avg return      │    │
│  │  📈 TCS · ₹3,456 · 3 active tips                │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  As user types, show filtered results grouped by:        │
│  CREATORS | STOCKS | RECENT TIPS                         │
│                                                          │
│  Keyboard nav: Arrow keys + Enter to select              │
│  ESC or click outside to close                           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Design specs:**
- Overlay: `bg-slate-900/40 backdrop-blur-sm`, full screen
- Dialog: `bg-white rounded-2xl shadow-2xl`, max-width 640px, centered vertically in top third
- Input: Large, 18px, no border, full width, placeholder `text-slate-300`
- Results: Grouped with section labels, items have icon + primary text + secondary text
- Active item: `bg-primary-50 rounded-lg`
- Animation: Scale 0.95 -> 1.0 + opacity 0 -> 1, 200ms ease-out

### 9.9 Navigation Header (Redesigned)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ✦ RateMyTip    Explore   Rankings   Discover       🔍   [Sign up] │
└─────────────────────────────────────────────────────────────────────┘
```

**Design specs:**
- Height: 56px (reduce from 64px — tighter is more modern)
- Background: `bg-white/90 backdrop-blur-xl border-b border-slate-100`
- Position: Sticky top-0 z-50
- Logo: Custom icon (not BarChart3) + "RateMyTip" in Plus Jakarta Sans 700 `primary-700`
- Nav links: Inter 14px 500 `slate-500`, hover `slate-900`, active `primary-700` with underline-offset-8
- Search icon: 20px, `slate-400`, hover `slate-600`. Clicking opens command palette.
- CTA button: Primary style (teal gradient), "Sign up" if logged out
- User avatar: 32px circle, click opens dropdown

**Key changes from current:**
- Remove "Pricing" and "GitHub" from main nav (move to footer)
- Rename "Leaderboard" to "Rankings" (simpler, more social)
- Rename "Tips" to "Explore" (browse-oriented language)
- Add "Discover" link (algorithmic discovery of creators for you)
- Remove Search text label — just the icon (opens command palette)
- Reduce visual weight of header (it's currently too heavy with gradient logo)

**Mobile header:**
```
┌─────────────────────────────────────────────┐
│  ✦ RateMyTip              🔍  ☰             │
└─────────────────────────────────────────────┘
```
- Logo left, search + hamburger right
- Mobile menu slides in from right as a full-height drawer (not accordion)

---

## 10. MOTION & INTERACTION DESIGN

### 10.1 Motion Philosophy

**"Purposeful, not performative."**

Every animation must serve one of three purposes:
1. **Orient:** Help the user understand spatial relationships (where did this come from, where is it going)
2. **Focus:** Draw attention to important state changes (score updated, tip resolved)
3. **Delight:** Create a moment of pleasure (but never delay the user)

### 10.2 Transition Specifications

```css
/* Duration scale */
--duration-instant: 100ms;   /* Button active state, color changes */
--duration-fast: 150ms;      /* Hover effects, badge appearances */
--duration-normal: 250ms;    /* Card transitions, panel open/close */
--duration-slow: 400ms;      /* Page transitions, large element movements */
--duration-dramatic: 600ms;  /* Score ring fill, celebration animations */

/* Easing curves */
--ease-default: cubic-bezier(0.25, 0.1, 0.25, 1);     /* Standard — for most transitions */
--ease-in: cubic-bezier(0.42, 0, 1, 1);                /* Accelerating — for exits */
--ease-out: cubic-bezier(0, 0, 0.58, 1);               /* Decelerating — for entrances */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);      /* Overshoot — for playful elements */
--ease-bounce: cubic-bezier(0.34, 1.3, 0.64, 1);       /* Gentle bounce — for score updates */
```

### 10.3 Specific Animations

**Page enter:**
- Content fades in and slides up 16px over 400ms ease-out
- Stagger children by 50ms (max 5 children, then rest appear together)

**Card hover (desktop):**
- translateY(-2px) over 150ms ease-default
- Shadow transitions from Level 1 to Level 2

**Score number count-up:**
- When Trust Score becomes visible (scroll into view), count from 0 to actual value
- Duration: 600ms ease-bounce
- Use requestAnimationFrame, not CSS animation (smoother on varying numbers)

**Score ring fill:**
- Draws clockwise from 12 o'clock position
- Duration: 800ms ease-out
- Triggered on scroll-into-view (Intersection Observer)

**Tip status change (live):**
- Old status badge scales down (0.9) and fades out
- New badge scales up from 0.9 and fades in
- Include a brief pulse glow in the status color
- Duration: 300ms total

**Command palette open:**
- Backdrop fades in 200ms
- Dialog scales from 0.95 to 1.0 and fades in over 200ms ease-out
- Close reverses (150ms ease-in)

**Celebration (score >= 80):**
- Subtle sparkle particles (6-8 small dots) burst from the score element
- Each particle: random trajectory, 500ms duration, fade out
- ONLY plays once per page visit, not on every re-render
- Use CSS animations (not a heavy confetti library)

**Skeleton loading:**
- Shimmer gradient sweeps left-to-right
- Duration: 1.5s ease-in-out infinite
- Color: `slate-100` to `slate-200` to `slate-100`

**Pull-to-refresh (mobile):**
- Custom spinner using the RateMyTip logo icon (rotating)
- Appears at top, pushes content down max 80px
- Spring-back animation on release

### 10.4 Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  /* Disable all decorative animations */
  .animate-fade-in-up,
  .animate-score-ring,
  .animate-count-up,
  .animate-pulse-glow,
  .animate-celebration {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }

  /* Keep functional transitions but make them instant */
  * {
    transition-duration: 0.01ms !important;
  }
}
```

---

## 11. PAGE-BY-PAGE REDESIGN

### 11.1 Homepage

**Current problem:** Dense, data-heavy, feels like a dashboard. The hero tries to do too much. Tables are the primary content format.

**New approach:** Magazine-style editorial layout. The homepage is a "cover story" that sells the platform's value, not a data dump.

#### Section 1: Hero (Above the fold)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  Header (sticky, transparent on hero, white after scroll)                   │
│                                                                             │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                                                             │
│                    Know Before You Follow.                                   │
│                                                                             │
│           See the verified track record of every                            │
│           stock tip creator. Data-backed. Transparent.                      │
│                                                                             │
│            [ 🔍 Search a creator or stock... ]                              │
│                                                                             │
│            [Explore Rankings]    [How It Works]                              │
│                                                                             │
│                                                                             │
│   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                       │
│   │ 12,450       │ │ 487          │ │ 73%          │                       │
│   │ Tips Tracked │ │ Creators     │ │ Avg Win Rate │                       │
│   └──────────────┘ └──────────────┘ └──────────────┘                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Hero specs:**
- Background: `bg-slate-950` (near black) with the mesh gradient overlay (subtle teal, violet, and rose radial gradients)
- NO heavy gradient like the current navy-to-blue
- Text: White, Plus Jakarta Sans, Display size (48px) for heading
- Subtext: `text-slate-300`, Inter, Body Large (18px)
- Search bar: Large (56px height), white bg, `rounded-xl`, prominent
- Two CTAs: Primary (teal, solid) + Secondary (ghost, white outline)
- Stats: 3 columns below CTAs, `text-white` numbers (JetBrains Mono 28px), `text-slate-400` labels
- Stats should count up on page load (animation)
- Total height: 100vh minus header, or minimum 600px
- Pattern overlay: Subtle dot grid (current implementation) but at 3% opacity

#### Section 2: Featured Creators (Social Proof)

```
Heading: "Top Rated This Month"
Subheading: "Based on verified performance data. Updated daily."

3-column grid of Creator Cards (see Section 9.1)
Show top 3 creators.

Below: "View all rankings →" link
```

**Specs:**
- Section bg: `bg-white`
- Padding: 64px top/bottom
- Creator cards in a 3-column grid (1 on mobile, 2 on tablet, 3 on desktop)
- First card can have a "🏆 #1 This Month" badge

#### Section 3: How It Works (Educational)

```
Heading: "How RateMyTip Works"
Subheading: "Three steps to find tip creators you can actually trust."

1. We Collect    →    2. We Track    →    3. We Score
[Illustration]        [Illustration]       [Illustration]

Tips from 500+        Every tip is         Our algorithm
creators across       monitored against    rates creators
Twitter & YouTube     real market data     on accuracy,
are tracked daily.    for target hits      consistency, and
                      and stop-loss        risk management.
                      triggers.
```

**Specs:**
- Section bg: `bg-slate-50`
- 3-column layout with large step numbers (Plus Jakarta Sans 80px, `primary-100`)
- Line illustrations for each step
- Subtle connector arrows between steps (hidden on mobile)
- On mobile: Vertical stack with numbers on left

#### Section 4: Recent Winning Tips

```
Heading: "Recent Calls That Hit 🎯"
Subheading: "Tips that reached their target. Verified by real market data."

Horizontal scrollable row of Tip Cards (compact variant)
Each showing: Stock, Creator, Return %, Days to hit
```

**Specs:**
- Section bg: `bg-white`
- Horizontally scrollable card row (not a grid) with snap points
- Show 5-8 recent winning tips
- Each card is the compact tip card variant (stock + direction + return + creator)
- Fade-out gradient on right edge to indicate scrollability
- On desktop: Show 4 cards visible, arrows for scroll

#### Section 5: Browse by Category

```
Heading: "Find Your Style"
Subheading: "Different strategies for different goals."

┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│            │ │            │ │            │ │            │ │            │
│  ⚡        │ │  📈        │ │  🎯        │ │  🏔         │ │  📊        │
│ Intraday   │ │ Swing      │ │ Positional │ │ Long Term  │ │ Options    │
│            │ │            │ │            │ │            │ │            │
│ Same-day   │ │ 2-14 day   │ │ 2 week to  │ │ 3+ month   │ │ F&O        │
│ trades     │ │ holds      │ │ 3 month    │ │ holdings   │ │ strategies │
│            │ │            │ │            │ │            │ │            │
│ 87 creators│ │ 124 crtrs  │ │ 56 crtrs   │ │ 43 crtrs   │ │ 31 crtrs   │
│            │ │            │ │            │ │            │ │            │
└────────────┘ └────────────┘ └────────────┘ └────────────┘ └────────────┘
```

**Specs:**
- 5 cards in a horizontally scrollable row (mobile) or 5-column grid (desktop)
- Each card: `bg-white rounded-xl border border-slate-100 p-5`
- Large emoji/icon at top, category name (H4), one-line description, creator count
- Hover: `bg-primary-50 border-primary-200`
- Click navigates to `/rankings/[category]`

#### Section 6: Trust Banner

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  Every score is backed by real data. Every tip is tracked               │
│  against real market prices. No paid promotions. No fake reviews.       │
│                                                                         │
│  [Read Our Methodology]                                                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Specs:**
- Section bg: `bg-primary-50` with a subtle border top/bottom
- Centered text, Inter 16px 400, `text-primary-800`
- CTA link to methodology/about page
- Builds trust for skeptical users

#### Section 7: Footer

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ✦ RateMyTip                                                            │
│  Know Before You Follow.                                                │
│                                                                         │
│  Product           Resources           Company                          │
│  Rankings          How It Works        About                            │
│  Explore Tips      Methodology         Privacy Policy                   │
│  Discover          Blog                Terms of Service                 │
│  API Docs          Help Center         Contact                          │
│                                                                         │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─            │
│  © 2026 RateMyTip. All rights reserved.        𝕏   YouTube   GitHub    │
└─────────────────────────────────────────────────────────────────────────┘
```

**Specs:**
- `bg-slate-900`, full width
- Logo + tagline: Plus Jakarta Sans 700, `text-white`
- Link columns: Inter 14px 400, `text-slate-400`, hover `text-white`
- Section headings: Inter 12px 600, uppercase, tracking-wider, `text-slate-500`
- Bottom bar: `border-t border-slate-800`, `text-slate-500` copyright, social icons right-aligned


### 11.2 Rankings Page (Formerly "Leaderboard")

**Current problem:** Dense table that feels like an admin panel. Category tabs are hidden behind small pill buttons. No visual excitement.

**New approach:** A two-mode view — Card Mode (default, discoverable) and Table Mode (for power users like Arjun).

#### Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Header                                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Rankings                                                               │
│  See who's really delivering results, backed by verified data.          │
│                                                                         │
│  ┌────┐ ┌─────────┐ ┌───────┐ ┌────────────┐ ┌───────────┐ ┌──────┐   │
│  │ All│ │Intraday │ │ Swing │ │ Positional │ │ Long Term │ │ F&O  │   │
│  └────┘ └─────────┘ └───────┘ └────────────┘ └───────────┘ └──────┘   │
│                                                                         │
│  Filters:  [Last 30 days ▾]  [Min 20 calls ▾]   View: [◻️ Cards | ☰]  │
│                                                                         │
│  ── TOP 3 ────────────────────────────────────────────────────────────  │
│                                                                         │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐        │
│  │  🥇 #1           │ │  🥈 #2           │ │  🥉 #3           │        │
│  │  Creator Card    │ │  Creator Card    │ │  Creator Card    │        │
│  │  (featured)      │ │                  │ │                  │        │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘        │
│                                                                         │
│  ── ALL RANKINGS ─────────────────────────────────────────────────────  │
│                                                                         │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐        │
│  │  #4 Creator Card │ │  #5 Creator Card │ │  #6 Creator Card │        │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘        │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐        │
│  │  #7 Creator Card │ │  #8 Creator Card │ │  #9 Creator Card │        │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘        │
│                                                                         │
│  [Load More]                                                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Category tabs:**
- Horizontal scroll on mobile (with active indicator bar below active tab)
- `bg-white rounded-full` pills on desktop
- Active state: `bg-primary-600 text-white`
- Inactive: `bg-transparent text-slate-500 hover:bg-slate-100`

**View toggle:**
- Cards view (default): Creator Cards in a 3-column grid
- Table view: Traditional leaderboard table (for power users)
- Toggle persists in localStorage

**Top 3 treatment:**
- Slightly larger cards than the rest
- Medal emoji/icon in the rank badge (gold, silver, bronze)
- Optional: Subtle golden/silver/bronze card border

**Pagination:**
- Use "Load More" button (not traditional pagination)
- Loads 12 more on each click (4 rows of 3)
- Infinite scroll as secondary (if user keeps scrolling past load more)

**Table mode:**
```
Rank | Creator          | Trust Score | Win Rate | Avg Return | Total Calls | Tier
1    | [Avatar] Name    | ⭐ 91      | 78.3%    | +5.2%      | 342         | Diamond
2    | [Avatar] Name    | ⭐ 88      | 74.1%    | +4.8%      | 267         | Platinum
...
```
- Sortable columns (click header to sort)
- Sticky header on scroll
- Row hover highlight
- Click row to navigate to profile


### 11.3 Creator Profile Page

**Current problem:** Data-first layout. Gradient banner + avatar feels template-like. Stats grid competes with score ring. Tip feed is a flat list. No personality.

**New approach:** Tell a story. Who is this person? Can I trust them? Show me the evidence.

#### Layout (Desktop)

```
┌──────────────────────────────────────────────────────────────────────┐
│  Header                                                              │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  MAIN CONTENT (8/12)                     SIDEBAR (4/12)              │
│                                                                      │
│  ┌────────────────────────────────┐     ┌────────────────────────┐   │
│  │  [Avatar 64px]                 │     │  Trust Score Card      │   │
│  │  Rakesh Jhunjhunwala          │     │  (Variant B, see 9.2)  │   │
│  │  @rakesh_jj                   │     │                        │   │
│  │  Gold Tier · Swing Trading    │     │  Score: 84             │   │
│  │  · Large Cap                  │     │  "Excellent"           │   │
│  │                               │     │  ± 3 confidence        │   │
│  │  Veteran investor with 15+    │     │                        │   │
│  │  years of experience in the   │     │  [How is this scored?] │   │
│  │  Indian equity market...      │     │                        │   │
│  │                               │     └────────────────────────┘   │
│  │  🐦 @rakesh_jj · 142K        │                                  │
│  │  📺 youtube.com/... · 89K    │     ┌────────────────────────┐   │
│  │                               │     │  Quick Stats           │   │
│  │  [Follow] [Share]             │     │                        │   │
│  └────────────────────────────────┘     │  Win Rate    72.3%    │   │
│                                         │  Avg Return  +4.2%    │   │
│  ┌────────────────────────────────┐     │  Total Calls 234      │   │
│  │  Performance Summary          │     │  Win Streak  8        │   │
│  │  (4 stat cards in a row)      │     │  Since       Mar 2024 │   │
│  └────────────────────────────────┘     │                        │   │
│                                         │  [Compare Creators]    │   │
│  ┌────────────────────────────────┐     └────────────────────────┘   │
│  │  Score History (Chart)        │                                  │
│  │  Line chart: 90 days          │     ┌────────────────────────┐   │
│  │  Trust Score + Win Rate       │     │  Accuracy Breakdown    │   │
│  └────────────────────────────────┘     │  by Timeframe          │   │
│                                         │                        │   │
│  ┌────────────────────────────────┐     │  Intraday   ████  68% │   │
│  │  Tab Bar:                     │     │  Swing      ██████ 78% │  │
│  │  [All Calls] [Active] [Hit]   │     │  Positional ███── 52% │   │
│  │  [Missed]                     │     │                        │   │
│  │                               │     └────────────────────────┘   │
│  │  Tip Card 1                   │                                  │
│  │  Tip Card 2                   │     ┌────────────────────────┐   │
│  │  Tip Card 3                   │     │  Top Stocks            │   │
│  │  ...                          │     │  RELIANCE  (12 calls)  │   │
│  │  [Load More]                  │     │  TCS       (8 calls)   │   │
│  └────────────────────────────────┘     │  INFY      (6 calls)  │   │
│                                         └────────────────────────┘   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Key design decisions:**
1. **No banner gradient.** The current navy gradient banner adds nothing. Replace with a clean, spacious header with just avatar, name, and meta.
2. **Trust Score in sidebar, not header.** Give it its own dedicated card. This creates the "Rotten Tomatoes score" effect — it's the first thing your eye goes to in the sidebar.
3. **Bio is prominent.** First-time investors want to know who this person IS, not just their numbers.
4. **Platform links visible.** Show Twitter/YouTube with follower counts. Social proof matters.
5. **Tabs for tip feed.** Allow filtering between All / Active / Hit Target / Missed.
6. **Score History chart is prominent.** This is the "consistency over time" visual that builds trust.
7. **Sidebar sticks on scroll** (desktop). As user scrolls through tips, the Trust Score card stays visible.

**Mobile layout:**
- Single column, Trust Score card above the fold after name/bio
- Stat cards in 2x2 grid
- Horizontal scrollable category pills for tip filters
- Bottom sticky bar: [Follow] [Share] buttons


### 11.4 Stock Page

```
┌──────────────────────────────────────────────────────────────────────┐
│  Header                                                              │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  RELIANCE INDUSTRIES                                NSE · Large Cap  │
│  ₹2,847.50 · +1.2% today                                           │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  What creators are saying                                    │    │
│  │                                                              │    │
│  │  Bullish ████████████████████████░░░░░░░░░░ Bearish          │    │
│  │  23 tips (77%)                          7 tips (23%)        │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  MAIN (8/12)                              SIDEBAR (4/12)             │
│                                                                      │
│  All Tips for RELIANCE                    Top Creators               │
│  Sort: [Most Recent ▾]                    (by accuracy on this       │
│                                           stock)                     │
│  Tip Card (with creator)                                            │
│  Tip Card (with creator)                  1. Name ⭐ 91  80% acc    │
│  Tip Card (with creator)                  2. Name ⭐ 84  75% acc    │
│  ...                                      3. Name ⭐ 78  71% acc    │
│                                                                      │
│  [Load More]                              Price Info                 │
│                                           52W High: ₹3,024          │
│                                           52W Low:  ₹2,108          │
│                                           Sector: Oil & Gas         │
└──────────────────────────────────────────────────────────────────────┘
```

**Key changes:**
- Consensus bar is prominent — this is the "social proof" signal for the stock
- Price info is cleaner: Current price large, daily change percentage
- Tip cards include creator attribution (avatar + name + Trust Score)
- Sidebar shows "Top Creators for this stock" — who to trust for THIS stock
- No heavy price chart on initial view (add as expandable or tab)


### 11.5 Individual Tip Detail Page

```
┌──────────────────────────────────────────────────────────────────────┐
│  Header                                                              │
│  ← Back to Creator / Back to Stock                                   │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                                                                │  │
│  │  🟢 BUY · RELIANCE · NSE                     14 Jan 2026     │  │
│  │                                                                │  │
│  │  By [Avatar] Rakesh J.  ⭐ 84  ·  Swing Trade  ·  Gold Tier  │  │
│  │                                                                │  │
│  │ ───────────────────────────────────────────────────────────── │  │
│  │                                                                │  │
│  │  Entry         Target 1       Target 2       Stop Loss        │  │
│  │  ₹2,420        ₹2,600 ✅     ₹2,750         ₹2,350          │  │
│  │                Hit 21 Jan     Pending        Not hit          │  │
│  │                                                                │  │
│  │ ───────────────────────────────────────────────────────────── │  │
│  │                                                                │  │
│  │  Result:  ✅ Target 1 Hit  ·  +7.4% return  ·  7 days        │  │
│  │                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────┐ │  │
│  │  │  Price Chart with Entry/Target/SL horizontal lines      │ │  │
│  │  │  Area chart showing price movement during tip period     │ │  │
│  │  └──────────────────────────────────────────────────────────┘ │  │
│  │                                                                │  │
│  │  Rationale (if provided):                                     │  │
│  │  "Reliance showing bullish breakout pattern above 2400        │  │
│  │   with strong volume. Channel breakout on daily chart..."     │  │
│  │                                                                │  │
│  │  Source: 📎 View original tweet                               │  │
│  │                                                                │  │
│  │  Content hash: a8f3b2... (verified immutable)                 │  │
│  │                                                                │  │
│  │  [Share this tip]                                             │  │
│  │                                                                │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  More from this creator ──────────────────────                       │
│  [Tip Card] [Tip Card] [Tip Card]                                    │
│                                                                      │
│  More tips on RELIANCE ──────────────────────                        │
│  [Tip Card] [Tip Card] [Tip Card]                                    │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Key features:**
- Clear visual story: What was recommended -> What happened -> How it performed
- Price chart with entry/target/SL lines is the visual centerpiece
- Content hash displayed (builds trust — the data hasn't been tampered with)
- Source link to original post (transparency)
- Related tips at bottom (engagement)


### 11.6 Browse/Explore Page

A new page that doesn't exist currently — the social discovery experience.

```
┌──────────────────────────────────────────────────────────────────────┐
│  Header                                                              │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Explore                                                             │
│  Browse the latest stock calls from verified creators.               │
│                                                                      │
│  ┌────────┐ ┌────────────┐ ┌──────┐ ┌────────┐ ┌─────────────┐     │
│  │ All    │ │ Winning 🎯 │ │ New  │ │Active  │ │ Big Movers  │     │
│  └────────┘ └────────────┘ └──────┘ └────────┘ └─────────────┘     │
│                                                                      │
│  [BUY only ▾]  [NSE ▾]  [Any timeframe ▾]  [Clear filters]         │
│                                                                      │
│  ┌─────────────────────────────────┐  ┌───────────────────────────┐  │
│  │  Tip Card (with Creator)       │  │  Tip Card (with Creator) │  │
│  └─────────────────────────────────┘  └───────────────────────────┘  │
│  ┌─────────────────────────────────┐  ┌───────────────────────────┐  │
│  │  Tip Card (with Creator)       │  │  Tip Card (with Creator) │  │
│  └─────────────────────────────────┘  └───────────────────────────┘  │
│  ┌─────────────────────────────────┐  ┌───────────────────────────┐  │
│  │  Tip Card (with Creator)       │  │  Tip Card (with Creator) │  │
│  └─────────────────────────────────┘  └───────────────────────────┘  │
│                                                                      │
│  [Load More]                                                         │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Tabs:**
- All: Chronological feed of all approved tips
- Winning: Tips that recently hit their targets (celebration feed)
- New: Tips posted in the last 24 hours
- Active: Currently open tips
- Big Movers: Tips with highest return percentages

**Two-column grid on desktop, single column on mobile.**

---

## 12. MOBILE-FIRST DESIGN

### 12.1 Mobile Design Principles

1. **Thumb zone:** All primary actions within thumb reach (bottom 2/3 of screen)
2. **One-handed use:** No horizontal stretching required
3. **Generous tap targets:** Minimum 44px x 44px for all interactive elements
4. **Swipe gestures:** Horizontal swipe on cards to bookmark/share
5. **Bottom navigation:** Replace top nav with bottom tab bar on mobile (see below)

### 12.2 Mobile Bottom Navigation Bar

```
┌───────────────────────────────────────────────────────────┐
│  🏠 Home    📊 Rankings    🔍 Search    👤 Profile        │
└───────────────────────────────────────────────────────────┘
```

**Specs:**
- Height: 56px + safe area inset (iPhone notch)
- Background: `bg-white border-t border-slate-100`
- Active icon: `text-primary-600`, with filled variant
- Inactive icon: `text-slate-400`, outline variant
- Active label: `text-primary-600 text-[10px] font-semibold`
- Inactive label: `text-slate-400 text-[10px]`
- Haptic feedback on tap (if available via API)

**Show bottom nav only on mobile (< 768px).** Hide the desktop header nav items and show the hamburger + bottom tab bar.

### 12.3 Mobile Creator Card (Compact)

```
┌─────────────────────────────────────────────────────┐
│  [Avatar] Rakesh J. · Gold    │        ⭐ 84       │
│  Swing · Large Cap            │     Trust Score    │
│  72% Win · +4.2% Avg · 234   │                    │
└─────────────────────────────────────────────────────┘
```

On mobile, Creator Cards become horizontal (landscape) instead of vertical. Avatar left, name/meta center, Trust Score right. Stats as a single line below.

### 12.4 Mobile Tip Card (Compact)

```
┌─────────────────────────────────────────────────────┐
│  🟢 BUY RELIANCE              ✅ +7.4%             │
│  Entry ₹2,420 → Target ₹2,600    Jan 14 · 7 days  │
│  By Rakesh J. ⭐ 84                                │
└─────────────────────────────────────────────────────┘
```

Single-row compact layout. Direction color on left border. Return percentage prominent on right.

### 12.5 Swipe Gestures (Mobile)

- **Swipe right on tip card:** Bookmark the tip (green flash)
- **Swipe left on tip card:** Share the tip (blue flash)
- **Pull down on any feed:** Refresh content

### 12.6 Mobile Sheet Pattern

For filters, settings, and detailed views on mobile, use a **bottom sheet** pattern instead of dropdowns:

```
[Content is pushed up / dimmed background]
┌──────────────────────────────────────────────┐
│  ──── (drag handle)                          │
│                                              │
│  Filter Tips                                 │
│                                              │
│  Direction:  ○ All  ● Buy  ○ Sell            │
│  Timeframe:  ● All  ○ Intraday  ○ Swing ... │
│  Status:     ● All  ○ Active  ○ Completed    │
│                                              │
│  [Apply Filters]     [Reset]                 │
│                                              │
└──────────────────────────────────────────────┘
```

**Specs:**
- Rounded top corners (20px)
- Drag handle: 40px wide, 4px tall, `bg-slate-300 rounded-full` centered
- Max height: 85vh
- Spring animation on open/close
- Backdrop: `bg-black/30 backdrop-blur-sm`

---

## 13. NAVIGATION & INFORMATION ARCHITECTURE

### 13.1 Simplified Site Map

```
Home (/)
├── Rankings (/rankings)
│   ├── All (/rankings)
│   ├── Intraday (/rankings/intraday)
│   ├── Swing (/rankings/swing)
│   ├── Positional (/rankings/positional)
│   ├── Long Term (/rankings/long-term)
│   └── Options (/rankings/options)
├── Explore (/explore)  [formerly /tips or Browse Tips]
├── Creator Profile (/creator/[slug])
├── Stock Page (/stock/[symbol])
├── Tip Detail (/tip/[id])
├── Search (Command Palette, no dedicated page for simple searches)
│   └── Search Results (/search?q=...) (for SEO and deep results)
├── How It Works (/how-it-works)
├── Methodology (/methodology)
└── Auth
    ├── Sign In (/login)
    ├── Sign Up (/register)
    └── Dashboard (/dashboard)
```

### 13.2 URL Changes

| Current | New | Reason |
|---------|-----|--------|
| `/leaderboard` | `/rankings` | More social, less corporate |
| `/leaderboard/[category]` | `/rankings/[category]` | Consistent |
| `/tips` | `/explore` | Browse-oriented language |
| `/creator/[slug]` | `/creator/[slug]` | Keep (good) |
| `/stock/[symbol]` | `/stock/[symbol]` | Keep (good) |

Add 301 redirects from old URLs to new ones.

### 13.3 Breadcrumb Pattern

```
Rankings > Intraday > Creator Name
Stock > RELIANCE > Tip #12345
```

Show breadcrumbs on desktop only. On mobile, use a back arrow + parent page name.

---

## 14. GAMIFICATION & ENGAGEMENT LOOPS

### 14.1 Creator Tiers (Visual Redesign)

The tier system is great but needs better visual treatment. Each tier should feel like an achievement, not a database label.

```
Tier Visual Design:

UNRATED:   Gray outline badge. "Not yet rated (need 20+ calls)"
           Icon: Empty star outline
           No special treatment

BRONZE:    Warm bronze/copper badge
           Icon: Shield with 1 star
           Card border: subtle bronze tint

SILVER:    Cool silver badge
           Icon: Shield with 2 stars
           Card border: subtle silver tint

GOLD:      Rich gold badge
           Icon: Shield with 3 stars
           Card border: subtle gold tint
           Special: Gold shimmer on hover

PLATINUM:  Blue/platinum badge
           Icon: Crown with blue gem
           Card border: subtle blue tint
           Special: Blue shimmer on hover

DIAMOND:   Purple/violet badge (most premium)
           Icon: Diamond shape
           Card border: violet tint
           Special: Prismatic shimmer on hover + "Top 1%" label
```

### 14.2 Achievement Badges (Future Enhancement)

Small badges displayed on creator profiles:
- "10-Win Streak" — 10 consecutive targets hit
- "Sniper" — 90%+ accuracy on 50+ tips
- "Marathon" — Active for 1+ year
- "Volume King" — 500+ rated tips
- "Nifty Master" — Highest accuracy on NIFTY calls

### 14.3 User Engagement Hooks

For logged-in users:
- **Follow creators:** Get notified when they post new tips
- **Bookmark tips:** Save for later review
- **Compare creators:** Side-by-side comparison view
- **Weekly digest email:** "Top 3 creators of the week + their best calls"
- **Daily quiz:** "This creator gave 5 calls last week. How many hit?" (gamified learning)

---

## 15. ACCESSIBILITY & INCLUSIVE DESIGN

### 15.1 Color Accessibility

All color combinations must pass **WCAG AA** (minimum 4.5:1 contrast for normal text, 3:1 for large text):

```
Verified combinations:
  slate-900 on white:      15.4:1 ✅
  slate-600 on white:       5.7:1 ✅
  slate-400 on white:       3.5:1 ✅ (large text only)
  primary-700 on primary-50: 6.8:1 ✅
  success-700 on success-50: 5.2:1 ✅
  danger-700 on danger-50:   5.8:1 ✅
  white on primary-600:      4.8:1 ✅
  white on danger-500:       4.5:1 ✅
```

**Never rely on color alone.** Always pair color with:
- Icons (checkmark for success, X for failure)
- Text labels
- Patterns or shapes

### 15.2 Focus Management

```css
/* Custom focus ring for keyboard navigation */
:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* Remove default outline when not keyboard navigating */
:focus:not(:focus-visible) {
  outline: none;
}
```

### 15.3 Screen Reader Considerations

- All score badges have `aria-label="Trust Score: 84 out of 100, rated Excellent"`
- Tip status badges: `aria-label="Status: Target 1 hit"`
- Tier badges: `aria-label="Gold tier creator"`
- Charts have `aria-label` with text description of the trend
- Data tables use proper `<th scope="col">` headers
- Loading skeletons have `aria-busy="true"` on parent
- Command palette: `role="combobox"` with proper ARIA attributes

### 15.4 Keyboard Navigation

- Tab order follows visual order
- Skip-to-content link as first focusable element
- Command palette accessible via Ctrl/Cmd + K
- Escape closes all modals/sheets/dropdowns
- Arrow keys navigate within tables and lists
- Enter/Space activates buttons and links

---

## 16. DARK MODE

### 16.1 Dark Mode Strategy

Implement dark mode as a **user preference** (toggle in settings + system preference detection).

### 16.2 Dark Mode Color Mapping

```css
@media (prefers-color-scheme: dark) {
  :root {
    /* Backgrounds */
    --bg-page: #0B0F1A;
    --bg-surface-0: #111827;
    --bg-surface-1: #1F2937;
    --bg-surface-2: #374151;
    --bg-surface-3: #4B5563;

    /* Text */
    --text-primary: #F9FAFB;
    --text-secondary: #D1D5DB;
    --text-tertiary: #9CA3AF;

    /* Borders */
    --border-default: #374151;
    --border-subtle: #1F2937;

    /* Primary: Brighten teal for dark backgrounds */
    --color-primary-500: #2DD4BF;
    --color-primary-600: #14B8A6;
    --color-primary-700: #99F6E4;

    /* Keep semantic colors but adjust brightness */
    --color-success-500: #34D399;
    --color-danger-500: #FB7185;
    --color-warning-500: #FBBF24;

    /* Score colors: brighter for dark bg readability */
    --score-excellent-fill: #34D399;
    --score-good-fill: #60A5FA;
    --score-avg-fill: #FBBF24;
    --score-below-fill: #FB923C;
    --score-poor-fill: #FB7185;

    /* Shadows: use opacity instead of color-based shadows */
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
    --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
  }
}
```

### 16.3 Dark Mode Rules

1. Never use pure black (`#000000`) for backgrounds. Use `#0B0F1A` (slate-950 with blue tint).
2. Never use pure white (`#FFFFFF`) for text. Use `#F9FAFB`.
3. Cards in dark mode: `bg-surface-0` with `border-slate-800` (1px border more important than shadow in dark mode).
4. Reduce shadow intensity by 50% in dark mode.
5. Increase text opacity for secondary content (dark mode needs more contrast for readability).
6. Charts: Use lighter line colors and gridlines.
7. Score ring: Use the brightened score colors defined above.

---

## 17. MICRO-COPY & TONE OF VOICE

### 17.1 Language Principles

1. **Simple English.** Write at a 6th-grade reading level. No jargon without explanation.
2. **Conversational.** "We track their calls" not "Tips are monitored by our system."
3. **Confident but not arrogant.** "See the data" not "We're the best platform ever."
4. **Helpful.** Always assume the user doesn't know what something means.

### 17.2 Terminology Mapping

| Technical Term | User-Facing Term | Reason |
|---------------|-----------------|--------|
| RMT Score | Trust Score | "Trust" is universally understood. "RMT" means nothing to new users. |
| Accuracy Rate | Win Rate | Sports analogy, instantly understood |
| Risk-Adjusted Return | Avg Profit per Call | Simple, direct |
| Tips | Calls | More natural in Indian market context ("calls" is the colloquial term) |
| Creators | Creators | Keep (clear enough) |
| PENDING_REVIEW | Under Review | More human |
| STOPLOSS_HIT | Stop Loss Hit | Keep (add tooltip: "The stock dropped to the safety exit price") |
| TARGET_1_HIT | Target Hit | Simplify to just "Target Hit" |
| ALL_TARGETS_HIT | All Targets Hit | Keep |
| EXPIRED | Expired | Keep (add tooltip: "The time window for this call ended without hitting target or stop loss") |
| Conviction | Confidence Level | More commonly understood |
| Timeframe | Holding Period | More descriptive for beginners |
| Asset Class | Market Type | Simpler |
| Composite Score | Overall Score | Plain English |
| Confidence Interval | Accuracy Range | "±3 means the actual score could be 81-87" |
| Recency-Weighted | Recent Performance Matters More | Explain the concept, don't name the algorithm |

### 17.3 Tooltip Patterns

Every metric on creator profiles and tip cards should have an `(i)` icon that shows a tooltip:

```
Win Rate (i)
↓
"Win Rate is the percentage of calls where at least the first target price
was reached before the stop-loss was hit or the time expired.
This creator hit their target 72.3% of the time."
```

```
Trust Score (i)
↓
"The Trust Score (0-100) combines win rate, average profit,
consistency over time, and number of tracked calls.
Higher is better. 80+ is excellent."
```

### 17.4 Empty State Copy

```
No calls yet:
  "This creator hasn't made any stock calls yet. Check back soon."

No results:
  "We couldn't find anything matching '[query]'. Try a different search."

Creator not rated:
  "We need at least 20 completed calls to calculate a Trust Score.
   This creator has [N] so far. Almost there!"

No active tips:
  "No active calls right now. Here are their most recent completed calls:"
```

### 17.5 Error State Copy

```
Page not found:
  "Looks like this page doesn't exist. Let's get you back on track."
  [Go to Rankings] [Search]

Server error:
  "Something went wrong on our end. We're looking into it.
   Please try again in a few minutes."
  [Refresh] [Go Home]

Rate limited:
  "Slow down! You're making requests too fast.
   Please wait a moment and try again."
```

---

## 18. PERFORMANCE & PERCEIVED SPEED

### 18.1 Loading Strategy

**Skeleton screens over spinners.** Show the shape of the content before it loads. This makes perceived load time ~40% faster.

```
Creator Card Skeleton:
┌──────────────────────────────────────────────────┐
│  ┌────┐  ████████████████                        │
│  │░░░░│  ████████████                            │
│  │░░░░│  ████████                                │
│  └────┘                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │░░░░░░░░░░│ │░░░░░░░░░░│ │░░░░░░░░░░░░░░░░░░│  │
│  └──────────┘ └──────────┘ └──────────────────┘  │
└──────────────────────────────────────────────────┘
```

### 18.2 Image Optimization

- Creator avatars: 48px (1x), 96px (2x) — served as WebP with AVIF fallback
- Use `<Image>` from next/image with `sizes` prop
- Lazy load all images below the fold
- Blur placeholder for avatars (10px blurred version)

### 18.3 Font Loading

```
Strategy: Swap with metric-compatible fallback

1. Plus Jakarta Sans: preload the 700 weight (headings appear first)
2. Inter: preload 400 weight (body text)
3. JetBrains Mono: load async (numbers appear slightly after text — acceptable)

<link rel="preload" href="/fonts/PlusJakartaSans-Bold.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/Inter-Regular.woff2" as="font" type="font/woff2" crossorigin>

Use font-display: swap for all fonts.
Use size-adjust on fallback to minimize CLS.
```

### 18.4 Optimistic UI

- **Bookmark action:** Show bookmarked state immediately, sync in background
- **Follow action:** Show followed state immediately, sync in background
- **Filter changes:** Show updated URL and skeleton immediately, data loads behind

### 18.5 Core Web Vitals Targets

```
LCP (Largest Contentful Paint):  < 1.5s (target) / < 2.5s (acceptable)
FID (First Input Delay):          < 50ms
CLS (Cumulative Layout Shift):    < 0.05
INP (Interaction to Next Paint):  < 100ms
```

**How to achieve:**
- Server-side render all public pages
- Inline critical CSS for above-the-fold content
- Defer non-critical JavaScript (charts, animations)
- Use `loading="lazy"` on below-fold images
- Avoid layout shifts: Set explicit dimensions on all images, embeds, and dynamic content
- Preconnect to API domains: `<link rel="preconnect" href="...">`

---

## 19. IMPLEMENTATION PRIORITY

### Phase A: Foundation (Week 1-2)

1. **New color system** — Update CSS variables, Tailwind config
2. **Typography** — Add Plus Jakarta Sans + JetBrains Mono, update font classes
3. **Spacing & radius** — Update to 8px system, reduce card radius to 12px
4. **Shadow system** — Implement new elevation levels
5. **Button redesign** — New primary (teal), remove glow variant
6. **Badge redesign** — New tier colors, new status colors

### Phase B: Core Components (Week 2-3)

7. **Creator Card** — New card-based design (replacing table row dominance)
8. **Trust Score display** — New Badge, Card, and Ring variants
9. **Tip Card** — Redesigned with progressive disclosure
10. **Stat Card** — Simplified (no icons, number-forward)
11. **Search/Command Palette** — Spotlight-style Cmd+K search

### Phase C: Page Redesigns (Week 3-5)

12. **Header** — New navigation, command palette trigger, simpler layout
13. **Footer** — New multi-column layout
14. **Homepage** — Complete redesign per Section 11.1
15. **Rankings page** — Card + Table dual-mode per Section 11.2
16. **Creator Profile** — New layout per Section 11.3
17. **Stock Page** — New layout per Section 11.4
18. **Tip Detail Page** — New layout per Section 11.5
19. **Explore Page** — New page per Section 11.6

### Phase D: Mobile & Polish (Week 5-6)

20. **Mobile bottom navigation** — Tab bar implementation
21. **Mobile card variants** — Compact horizontal cards
22. **Bottom sheet filters** — Replace dropdowns on mobile
23. **Swipe gestures** — Bookmark/share on mobile tip cards
24. **Animations** — Count-up, score ring, page transitions
25. **Skeleton screens** — For all major components
26. **Dark mode** — Full implementation

### Phase E: Copy & A11y (Week 6-7)

27. **Terminology update** — Apply all term renames across UI
28. **Tooltips** — Add explainer tooltips on all metrics
29. **Empty states** — Custom illustrations and copy
30. **Error states** — Custom pages and copy
31. **Accessibility audit** — WCAG AA compliance check
32. **Keyboard navigation** — Full keyboard support
33. **Screen reader testing** — Verify all ARIA labels

---

## APPENDIX A: DESIGN TOKEN REFERENCE (QUICK COPY)

```css
/* Paste into globals.css to bootstrap new design system */

:root {
  /* Primary */
  --primary: #14B8A6;
  --primary-hover: #0D9488;
  --primary-light: #F0FDFA;
  --primary-dark: #0F766E;

  /* Accent */
  --accent: #8B5CF6;
  --accent-hover: #7C3AED;
  --accent-light: #F5F3FF;

  /* Semantic */
  --success: #22C55E;
  --danger: #F43F5E;
  --warning: #F59E0B;
  --info: #3B82F6;

  /* Neutrals */
  --text-primary: #0F172A;
  --text-secondary: #475569;
  --text-tertiary: #94A3B8;
  --bg-page: #FAFBFD;
  --bg-card: #FFFFFF;
  --border: #E2E8F0;
  --border-subtle: #F1F5F9;

  /* Fonts */
  --font-heading: 'Plus Jakarta Sans', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 20px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.04);
  --shadow-md: 0 4px 6px rgba(15, 23, 42, 0.06), 0 2px 4px rgba(15, 23, 42, 0.04);
  --shadow-lg: 0 10px 15px rgba(15, 23, 42, 0.06), 0 4px 6px rgba(15, 23, 42, 0.04);
  --shadow-xl: 0 20px 25px rgba(15, 23, 42, 0.08), 0 8px 10px rgba(15, 23, 42, 0.04);
}
```

## APPENDIX B: COMPONENT CHECKLIST

When implementing each component, verify:

- [ ] Works on mobile (320px minimum)
- [ ] Works on tablet (768px)
- [ ] Works on desktop (1280px)
- [ ] Hover state (desktop)
- [ ] Active/pressed state
- [ ] Focus-visible state (keyboard)
- [ ] Loading/skeleton state
- [ ] Empty state
- [ ] Error state
- [ ] Dark mode
- [ ] Screen reader accessible
- [ ] Meets WCAG AA contrast
- [ ] Uses correct font family (heading/body/mono)
- [ ] Uses 8px spacing grid
- [ ] Uses correct radius from scale
- [ ] Animations respect prefers-reduced-motion

---

**END OF UI/UX INSTRUCTIONS**

*This document should be referenced alongside CLAUDE.md for all frontend implementation work.
When CLAUDE.md specifies backend behavior and this document specifies visual design,
both should be followed. In case of conflict on visual matters, this document takes precedence.*
