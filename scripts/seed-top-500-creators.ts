// scripts/seed-top-500-creators.ts
//
// Comprehensive Indian finfluencer seed script for RateMyTip Phase 1.
// Seeds ~100 curated creators across 6 categories. This list is designed
// to be expanded to 500 over time by adding entries to the category arrays.
//
// Usage: npx tsx scripts/seed-top-500-creators.ts
//
// Idempotent: checks slug existence before creating. Safe to run multiple times.

import { PrismaClient } from "@prisma/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CreatorSeedEntry {
  readonly slug: string;
  readonly displayName: string;
  readonly bio: string;
  readonly specializations: string[];
  readonly twitterHandle?: string;
  readonly youtubeChannelId?: string;
  readonly followerEstimate?: number;
}

// ---------------------------------------------------------------------------
// Category 1: INTRADAY TRADERS (~25 entries)
// ---------------------------------------------------------------------------

const INTRADAY_TRADERS: readonly CreatorSeedEntry[] = [
  {
    slug: "pr-sundar",
    displayName: "P R Sundar",
    bio: "Options seller and intraday trader. SEBI registered research analyst with 20+ years of market experience.",
    specializations: ["INTRADAY", "OPTIONS"],
    twitterHandle: "PRSundar64",
    youtubeChannelId: "UCprs4nD3r001",
    followerEstimate: 150000,
  },
  {
    slug: "power-of-stocks",
    displayName: "Power of Stocks",
    bio: "Intraday and momentum trading specialist. Daily market analysis and live trade setups.",
    specializations: ["INTRADAY", "SWING"],
    twitterHandle: "PowerOfStocks1",
    followerEstimate: 200000,
  },
  {
    slug: "ankit-jain-trader",
    displayName: "Ankit Jain",
    bio: "Full-time intraday trader. Price action and order flow based entries on Nifty and BankNifty.",
    specializations: ["INTRADAY", "INDEX"],
    twitterHandle: "AnkitJainTrades",
    followerEstimate: 85000,
  },
  {
    slug: "scalper-raj",
    displayName: "Scalper Raj",
    bio: "Nifty scalper with a 70% win rate. Focus on first-hour momentum trades.",
    specializations: ["INTRADAY", "INDEX", "OPTIONS"],
    twitterHandle: "ScalperRaj_",
    followerEstimate: 62000,
  },
  {
    slug: "siddharth-bhanushali",
    displayName: "Siddharth Bhanushali",
    bio: "Trader, mentor, and market strategist. Teaches price action and tape reading for intraday setups.",
    specializations: ["INTRADAY", "SWING"],
    twitterHandle: "SidBhanushali",
    youtubeChannelId: "UCsidb4n002",
    followerEstimate: 180000,
  },
  {
    slug: "vivek-trader",
    displayName: "Vivek Trader",
    bio: "BTST and intraday calls on NSE equities. Strictly technical, no tips on unknown stocks.",
    specializations: ["INTRADAY", "SWING"],
    twitterHandle: "VivekTrader01",
    followerEstimate: 43000,
  },
  {
    slug: "meena-intraday",
    displayName: "Meena Intraday",
    bio: "Professional day trader focused on high-volume liquid stocks. Transparent P&L sharing.",
    specializations: ["INTRADAY", "LARGE_CAP"],
    twitterHandle: "MeenaIntraday",
    followerEstimate: 37000,
  },
  {
    slug: "rakesh-bansal-trades",
    displayName: "Rakesh Bansal",
    bio: "SEBI registered research analyst. Daily intraday and BTST stock recommendations.",
    specializations: ["INTRADAY", "SWING"],
    twitterHandle: "Abortrading",
    followerEstimate: 120000,
  },
  {
    slug: "bull-rider-dinesh",
    displayName: "Bull Rider Dinesh",
    bio: "Gap-up and gap-down opening trades. Specializes in first 30 minutes of market.",
    specializations: ["INTRADAY", "OPTIONS"],
    twitterHandle: "BullRiderDinesh",
    followerEstimate: 28000,
  },
  {
    slug: "megha-trader",
    displayName: "Megha Momentum Trades",
    bio: "Momentum breakout trader. Focus on stocks with above-average volume spikes intraday.",
    specializations: ["INTRADAY", "MID_CAP"],
    twitterHandle: "MeghaMomentum",
    followerEstimate: 51000,
  },
  {
    slug: "vwap-warrior-arjun",
    displayName: "VWAP Warrior Arjun",
    bio: "VWAP and moving average based intraday setups on NSE equities.",
    specializations: ["INTRADAY", "LARGE_CAP"],
    twitterHandle: "VWAPWarriorArjn",
    followerEstimate: 33000,
  },
  {
    slug: "kunal-saraogi",
    displayName: "Kunal Saraogi",
    bio: "SEBI registered research analyst. Regular intraday calls on Nifty 50 stocks and derivatives.",
    specializations: ["INTRADAY", "OPTIONS", "INDEX"],
    twitterHandle: "KunalSaraogi",
    followerEstimate: 95000,
  },
  {
    slug: "nifty-scalps-deepak",
    displayName: "Nifty Scalps Deepak",
    bio: "Pure Nifty index scalping. 5-minute chart setups with tight stop losses.",
    specializations: ["INTRADAY", "INDEX"],
    twitterHandle: "NiftyScalpsD",
    followerEstimate: 22000,
  },
  {
    slug: "opening-range-priya",
    displayName: "Opening Range Priya",
    bio: "Opening Range Breakout specialist. Trades only the first 90 minutes of NSE session.",
    specializations: ["INTRADAY", "LARGE_CAP"],
    twitterHandle: "ORBPriya",
    followerEstimate: 18000,
  },
  {
    slug: "tape-reader-vinay",
    displayName: "Tape Reader Vinay",
    bio: "Order flow and tape reading based intraday entries. Focuses on futures market depth.",
    specializations: ["INTRADAY", "FUTURES"],
    twitterHandle: "TapeReaderVinay",
    followerEstimate: 29000,
  },
  {
    slug: "anil-singhvi-fan",
    displayName: "Market Pulse Anil",
    bio: "Intraday cash market tips. Prefers high delivery percentage stocks for same-day trades.",
    specializations: ["INTRADAY", "LARGE_CAP"],
    twitterHandle: "MktPulseAnil",
    followerEstimate: 41000,
  },
  {
    slug: "nalini-daytrader",
    displayName: "Nalini Day Trader",
    bio: "Women in trading advocate. Intraday calls with clear risk management rules.",
    specializations: ["INTRADAY", "SWING"],
    twitterHandle: "NaliniDayTrades",
    followerEstimate: 24000,
  },
  {
    slug: "rupesh-scalper",
    displayName: "Rupesh Scalper",
    bio: "BankNifty options scalper. 15-minute expiry plays on weekly options.",
    specializations: ["INTRADAY", "OPTIONS", "INDEX"],
    twitterHandle: "RupeshScalper",
    followerEstimate: 36000,
  },
  {
    slug: "harish-gap-trader",
    displayName: "Gap Trader Harish",
    bio: "Specializes in gap trading strategies. Uses pre-market data and global cues for setups.",
    specializations: ["INTRADAY", "LARGE_CAP"],
    twitterHandle: "GapTraderHarish",
    followerEstimate: 19000,
  },
  {
    slug: "manish-shah-trader",
    displayName: "Manish Shah",
    bio: "Veteran technical analyst and intraday specialist. Frequent media commentator on market outlook.",
    specializations: ["INTRADAY", "OPTIONS"],
    twitterHandle: "ManishShahTech",
    followerEstimate: 78000,
  },
  {
    slug: "ema-crossover-sunil",
    displayName: "EMA Crossover Sunil",
    bio: "Moving average crossover system trader. Purely systematic intraday entries.",
    specializations: ["INTRADAY", "INDEX"],
    twitterHandle: "EMACrossoverS",
    followerEstimate: 15000,
  },
  {
    slug: "sagar-intraday",
    displayName: "Sagar Intraday Pro",
    bio: "Full-time intraday trader based in Ahmedabad. Equity cash segment specialist.",
    specializations: ["INTRADAY", "MID_CAP"],
    twitterHandle: "SagarIntradayP",
    followerEstimate: 26000,
  },
  {
    slug: "kavita-quick-trades",
    displayName: "Kavita Quick Trades",
    bio: "Quick entry and exit intraday calls. Average holding period under 2 hours.",
    specializations: ["INTRADAY", "LARGE_CAP"],
    twitterHandle: "KavitaQTrades",
    followerEstimate: 21000,
  },
  {
    slug: "morning-star-rajiv",
    displayName: "Morning Star Rajiv",
    bio: "Pre-market analysis and morning trade setups. Published daily before 9 AM IST.",
    specializations: ["INTRADAY", "SWING"],
    twitterHandle: "MorningStarRjv",
    followerEstimate: 32000,
  },
  {
    slug: "ashish-intraday-king",
    displayName: "Ashish Intraday King",
    bio: "Nifty and equity intraday calls with predefined risk-reward. 3+ years verified track record.",
    specializations: ["INTRADAY", "INDEX", "OPTIONS"],
    twitterHandle: "AshishIDKing",
    followerEstimate: 47000,
  },
];

// ---------------------------------------------------------------------------
// Category 2: SWING TRADERS (~20 entries)
// ---------------------------------------------------------------------------

const SWING_TRADERS: readonly CreatorSeedEntry[] = [
  {
    slug: "ravi-kumar-swing",
    displayName: "Ravi Kumar Swing Trades",
    bio: "2-10 day swing setups on NSE equities. Chart pattern and volume analysis based entries.",
    specializations: ["SWING", "MID_CAP"],
    twitterHandle: "RaviSwingTrades",
    followerEstimate: 72000,
  },
  {
    slug: "swing-master-karan",
    displayName: "Swing Master Karan",
    bio: "Pure swing trader. Weekly chart breakouts with trailing stop loss management.",
    specializations: ["SWING", "LARGE_CAP"],
    twitterHandle: "SwingMasterK",
    followerEstimate: 89000,
  },
  {
    slug: "positional-picks-neelam",
    displayName: "Positional Picks Neelam",
    bio: "Swing to positional trade ideas. Mix of technical breakouts and fundamental catalysts.",
    specializations: ["SWING", "POSITIONAL"],
    twitterHandle: "PosPicksNeelam",
    followerEstimate: 45000,
  },
  {
    slug: "breakout-hunter-amit",
    displayName: "Breakout Hunter Amit",
    bio: "Trendline and resistance breakout specialist. Focuses on stocks near 52-week highs.",
    specializations: ["SWING", "LARGE_CAP", "MID_CAP"],
    twitterHandle: "BreakoutAmit",
    followerEstimate: 64000,
  },
  {
    slug: "weekly-charts-guru",
    displayName: "Weekly Charts Guru",
    bio: "Weekly timeframe swing analysis. Low frequency, high conviction trades.",
    specializations: ["SWING", "POSITIONAL"],
    twitterHandle: "WeeklyChartsG",
    followerEstimate: 53000,
  },
  {
    slug: "hemant-swing-setup",
    displayName: "Hemant Swing Setup",
    bio: "Swing trade setups based on RSI divergence and candlestick reversal patterns.",
    specializations: ["SWING", "MID_CAP"],
    twitterHandle: "HemantSwingSU",
    followerEstimate: 31000,
  },
  {
    slug: "pooja-chartist",
    displayName: "Pooja The Chartist",
    bio: "Technical analyst publishing daily swing trade ideas. Cup and handle, flag pattern expert.",
    specializations: ["SWING", "LARGE_CAP"],
    twitterHandle: "PoojaChartist",
    followerEstimate: 40000,
  },
  {
    slug: "btst-king-rohit",
    displayName: "BTST King Rohit",
    bio: "Buy Today Sell Tomorrow specialist. Late afternoon entries based on delivery data.",
    specializations: ["SWING", "INTRADAY"],
    twitterHandle: "BTSTKingRohit",
    followerEstimate: 55000,
  },
  {
    slug: "atul-reversal-trader",
    displayName: "Atul Reversal Trader",
    bio: "Contrarian swing trader. Buys oversold dips and shorts overbought rallies.",
    specializations: ["SWING", "MID_CAP"],
    twitterHandle: "AtulReversals",
    followerEstimate: 27000,
  },
  {
    slug: "smallcap-swings-girish",
    displayName: "Smallcap Swings Girish",
    bio: "Swing trades focused on small cap breakouts. Higher risk, higher reward philosophy.",
    specializations: ["SWING", "SMALL_CAP"],
    twitterHandle: "SmallSwingsG",
    followerEstimate: 38000,
  },
  {
    slug: "fibonacci-trader-jaya",
    displayName: "Fibonacci Trader Jaya",
    bio: "Fibonacci retracement and extension based swing entries. Clean chart setups only.",
    specializations: ["SWING", "LARGE_CAP"],
    twitterHandle: "FibTraderJaya",
    followerEstimate: 22000,
  },
  {
    slug: "swing-sniper-vijay",
    displayName: "Swing Sniper Vijay",
    bio: "High conviction swing calls, maximum 3 open positions at any time. Quality over quantity.",
    specializations: ["SWING", "MID_CAP", "LARGE_CAP"],
    twitterHandle: "SwingSniperVij",
    followerEstimate: 34000,
  },
  {
    slug: "neeraj-swing-pro",
    displayName: "Neeraj Swing Pro",
    bio: "Sector rotation based swing trades. Tracks FII/DII flows for sector selection.",
    specializations: ["SWING", "POSITIONAL"],
    twitterHandle: "NeerajSwingPro",
    followerEstimate: 48000,
  },
  {
    slug: "macd-signals-shreya",
    displayName: "MACD Signals Shreya",
    bio: "MACD histogram and signal line crossover based swing entries. Systematic rule-based trader.",
    specializations: ["SWING", "LARGE_CAP"],
    twitterHandle: "MACDShreya",
    followerEstimate: 19000,
  },
  {
    slug: "darvas-box-pankaj",
    displayName: "Darvas Box Pankaj",
    bio: "Darvas Box breakout method adapted for Indian markets. Equity swing trades only.",
    specializations: ["SWING", "MID_CAP"],
    twitterHandle: "DarvasBoxPankaj",
    followerEstimate: 16000,
  },
  {
    slug: "trend-following-yash",
    displayName: "Trend Following Yash",
    bio: "Pure trend follower. Buys strength, sells weakness. Never tries to catch falling knives.",
    specializations: ["SWING", "POSITIONAL", "LARGE_CAP"],
    twitterHandle: "TrendFollowYash",
    followerEstimate: 60000,
  },
  {
    slug: "moving-avg-trader-reena",
    displayName: "Moving Average Reena",
    bio: "200-DMA and 50-DMA based swing setups. Long-only strategy on NSE stocks.",
    specializations: ["SWING", "LARGE_CAP"],
    twitterHandle: "MATraderReena",
    followerEstimate: 25000,
  },
  {
    slug: "volume-breakout-tarun",
    displayName: "Volume Breakout Tarun",
    bio: "Volume-confirmed breakout swing trades. Requires 2x average volume for entry signals.",
    specializations: ["SWING", "MID_CAP"],
    twitterHandle: "VolBrkoutTarun",
    followerEstimate: 30000,
  },
  {
    slug: "support-zone-swati",
    displayName: "Support Zone Swati",
    bio: "Swing buy calls near key support zones. Demand-supply zone analysis specialist.",
    specializations: ["SWING", "LARGE_CAP", "MID_CAP"],
    twitterHandle: "SupportZoneSwt",
    followerEstimate: 23000,
  },
  {
    slug: "pattern-trader-gopal",
    displayName: "Pattern Trader Gopal",
    bio: "Classical chart pattern trader. Head and shoulders, double bottoms, ascending triangles.",
    specializations: ["SWING", "POSITIONAL"],
    twitterHandle: "PatternGopal",
    followerEstimate: 35000,
  },
];

// ---------------------------------------------------------------------------
// Category 3: OPTIONS SPECIALISTS (~15 entries)
// ---------------------------------------------------------------------------

const OPTIONS_SPECIALISTS: readonly CreatorSeedEntry[] = [
  {
    slug: "optionalpha-india",
    displayName: "OptionAlpha India",
    bio: "Nifty and BankNifty options strategies. Iron condors, strangles, and calendar spreads.",
    specializations: ["OPTIONS", "INDEX"],
    twitterHandle: "OptAlphaIndia",
    followerEstimate: 130000,
  },
  {
    slug: "theta-decay-nikhil",
    displayName: "Theta Decay Nikhil",
    bio: "Options selling specialist. Writes weekly Nifty strangles and adjusts based on Greeks.",
    specializations: ["OPTIONS", "INDEX", "INTRADAY"],
    twitterHandle: "ThetaDecayNik",
    followerEstimate: 75000,
  },
  {
    slug: "straddle-queen-anusha",
    displayName: "Straddle Queen Anusha",
    bio: "Straddle and strangle strategies for event-based and expiry day trading.",
    specializations: ["OPTIONS", "INDEX"],
    twitterHandle: "StraddleAnusha",
    followerEstimate: 52000,
  },
  {
    slug: "greek-master-sandeep",
    displayName: "Greek Master Sandeep",
    bio: "Options Greeks educator and live trader. Focuses on delta-neutral strategies.",
    specializations: ["OPTIONS", "INDEX", "FUTURES"],
    twitterHandle: "GreekMasterSP",
    youtubeChannelId: "UCgrkm4st3r003",
    followerEstimate: 98000,
  },
  {
    slug: "banknifty-warrior",
    displayName: "BankNifty Warrior",
    bio: "Dedicated BankNifty options trader. Weekly expiry directional and non-directional plays.",
    specializations: ["OPTIONS", "INDEX", "INTRADAY"],
    twitterHandle: "BNWarrior_",
    followerEstimate: 68000,
  },
  {
    slug: "iron-condor-vishal",
    displayName: "Iron Condor Vishal",
    bio: "Non-directional options income strategies. Monthly iron condors and jade lizards on Nifty.",
    specializations: ["OPTIONS", "INDEX"],
    twitterHandle: "IronCondorVish",
    followerEstimate: 42000,
  },
  {
    slug: "expiry-day-traders",
    displayName: "Expiry Day Traders",
    bio: "Expiry day options scalping group. Thursday BankNifty and Nifty zero-day option plays.",
    specializations: ["OPTIONS", "INTRADAY", "INDEX"],
    twitterHandle: "ExpiryDayTrdrs",
    followerEstimate: 87000,
  },
  {
    slug: "option-chain-analyst",
    displayName: "Option Chain Analyst Ritika",
    bio: "Option chain data analysis for support/resistance levels. OI-based directional views.",
    specializations: ["OPTIONS", "INDEX"],
    twitterHandle: "OChainRitika",
    followerEstimate: 56000,
  },
  {
    slug: "premium-seller-ajay",
    displayName: "Premium Seller Ajay",
    bio: "Consistent option premium selling. Far OTM option writing with strict adjustment rules.",
    specializations: ["OPTIONS", "INDEX", "POSITIONAL"],
    twitterHandle: "PremiumSellerAj",
    followerEstimate: 39000,
  },
  {
    slug: "butterfly-spread-mona",
    displayName: "Butterfly Spread Mona",
    bio: "Complex multi-leg options strategies. Butterfly and ratio spreads for low-risk entries.",
    specializations: ["OPTIONS", "INDEX"],
    twitterHandle: "ButterflyMona",
    followerEstimate: 28000,
  },
  {
    slug: "nifty-puts-raghav",
    displayName: "Nifty Puts Raghav",
    bio: "Hedging specialist. Uses Nifty put options as portfolio insurance. Publishes hedge ratios weekly.",
    specializations: ["OPTIONS", "INDEX", "LARGE_CAP"],
    twitterHandle: "NiftyPutsRaghav",
    followerEstimate: 33000,
  },
  {
    slug: "iv-crush-trader-dev",
    displayName: "IV Crush Trader Dev",
    bio: "Plays implied volatility expansion and crush around earnings and events.",
    specializations: ["OPTIONS", "SWING"],
    twitterHandle: "IVCrushDev",
    followerEstimate: 25000,
  },
  {
    slug: "weekly-options-guru",
    displayName: "Weekly Options Guru Pranav",
    bio: "Weekly options strategy specialist. Publishes end-of-week Nifty strategy guides.",
    specializations: ["OPTIONS", "INDEX", "INTRADAY"],
    twitterHandle: "WeeklyOptsGuru",
    youtubeChannelId: "UCwklyopt5004",
    followerEstimate: 71000,
  },
  {
    slug: "collar-strategy-sneha",
    displayName: "Collar Strategy Sneha",
    bio: "Protective collar and covered call strategies on large cap stocks.",
    specializations: ["OPTIONS", "LARGE_CAP", "POSITIONAL"],
    twitterHandle: "CollarSneha",
    followerEstimate: 18000,
  },
  {
    slug: "debit-spread-lakshmi",
    displayName: "Debit Spread Lakshmi",
    bio: "Bull call spreads and bear put spreads. Defined risk directional option trades.",
    specializations: ["OPTIONS", "INDEX", "SWING"],
    twitterHandle: "DebitSpreadL",
    followerEstimate: 21000,
  },
];

// ---------------------------------------------------------------------------
// Category 4: FUNDAMENTAL ANALYSTS (~15 entries)
// ---------------------------------------------------------------------------

const FUNDAMENTAL_ANALYSTS: readonly CreatorSeedEntry[] = [
  {
    slug: "basant-maheshwari",
    displayName: "Basant Maheshwari",
    bio: "Value investor and author. Long-term equity portfolio focused on growth at reasonable price.",
    specializations: ["LONG_TERM", "LARGE_CAP", "MID_CAP"],
    twitterHandle: "BasantMaheshwri",
    followerEstimate: 250000,
  },
  {
    slug: "shankar-sharma-views",
    displayName: "Shankar Sharma Views",
    bio: "Vice Chairman of First Global. Contrarian investor with macro-driven long term stock picks.",
    specializations: ["LONG_TERM", "LARGE_CAP"],
    twitterHandle: "ShankarSharmaVw",
    followerEstimate: 180000,
  },
  {
    slug: "safal-niveshak",
    displayName: "Safal Niveshak",
    bio: "Value investing education and long-term stock analysis. Focus on mental models and margin of safety.",
    specializations: ["LONG_TERM", "MID_CAP", "SMALL_CAP"],
    twitterHandle: "SafalNiveshak",
    youtubeChannelId: "UCsfln1v3sh005",
    followerEstimate: 140000,
  },
  {
    slug: "valupickr-community",
    displayName: "ValuPickr Community",
    bio: "Deep-dive fundamental research on undervalued Indian companies. Community-driven analysis.",
    specializations: ["LONG_TERM", "SMALL_CAP", "MID_CAP"],
    twitterHandle: "ValuPickr",
    followerEstimate: 95000,
  },
  {
    slug: "dividend-investor-raman",
    displayName: "Dividend Investor Raman",
    bio: "Dividend growth investing focused. Tracks high-yield consistent dividend payers on NSE.",
    specializations: ["LONG_TERM", "LARGE_CAP"],
    twitterHandle: "DivInvestRaman",
    followerEstimate: 48000,
  },
  {
    slug: "smallcap-gems-rohan",
    displayName: "Smallcap Gems Rohan",
    bio: "Discovers undervalued small cap companies before institutional interest. Deep scuttlebutt research.",
    specializations: ["LONG_TERM", "SMALL_CAP"],
    twitterHandle: "SmallCapRohan",
    followerEstimate: 67000,
  },
  {
    slug: "quality-compounder-mita",
    displayName: "Quality Compounder Mita",
    bio: "Invests in high-ROCE, low-debt compounders. Prefers businesses with pricing power and moats.",
    specializations: ["LONG_TERM", "LARGE_CAP", "MID_CAP"],
    twitterHandle: "QualityCompMita",
    followerEstimate: 54000,
  },
  {
    slug: "quarterly-results-analyst",
    displayName: "Quarterly Results Analyst",
    bio: "Publishes detailed quarterly earnings analysis for top 200 NSE companies. Data-driven research.",
    specializations: ["LONG_TERM", "LARGE_CAP"],
    twitterHandle: "QtrResultsAnlst",
    followerEstimate: 80000,
  },
  {
    slug: "multi-bagger-hunter-sanjay",
    displayName: "Multi Bagger Hunter Sanjay",
    bio: "Seeks 10x return potential stocks. Focus on emerging sectors and disruptive business models.",
    specializations: ["LONG_TERM", "SMALL_CAP", "MID_CAP"],
    twitterHandle: "MultiBaggerSJ",
    followerEstimate: 73000,
  },
  {
    slug: "balance-sheet-detective",
    displayName: "Balance Sheet Detective",
    bio: "Forensic accounting and red flag detection in Indian listed companies. Helps avoid value traps.",
    specializations: ["LONG_TERM", "LARGE_CAP"],
    twitterHandle: "BSDetective_",
    followerEstimate: 41000,
  },
  {
    slug: "growth-equity-aisha",
    displayName: "Growth Equity Aisha",
    bio: "PEG ratio driven stock selection. Seeks growth stocks available at reasonable valuations.",
    specializations: ["LONG_TERM", "MID_CAP"],
    twitterHandle: "GrowthEqAisha",
    followerEstimate: 36000,
  },
  {
    slug: "moat-investor-sudhir",
    displayName: "Moat Investor Sudhir",
    bio: "Competitive advantage focused investing. Identifies companies with durable economic moats.",
    specializations: ["LONG_TERM", "LARGE_CAP"],
    twitterHandle: "MoatSudhir",
    followerEstimate: 45000,
  },
  {
    slug: "turnaround-stories-manoj",
    displayName: "Turnaround Stories Manoj",
    bio: "Identifies turnaround opportunities in stressed companies. Focus on promoter intent and deleveraging.",
    specializations: ["POSITIONAL", "MID_CAP", "SMALL_CAP"],
    twitterHandle: "TurnaroundManoj",
    followerEstimate: 29000,
  },
  {
    slug: "pe-ratio-analyst-sumit",
    displayName: "PE Ratio Analyst Sumit",
    bio: "Valuation-focused stock analysis. Historical PE band analysis and sector PE comparison.",
    specializations: ["LONG_TERM", "LARGE_CAP", "MID_CAP"],
    twitterHandle: "PEAnalystSumit",
    followerEstimate: 32000,
  },
  {
    slug: "ipo-watcher-tanya",
    displayName: "IPO Watcher Tanya",
    bio: "IPO analysis and listing day predictions. Tracks grey market premiums and subscription data.",
    specializations: ["POSITIONAL", "MID_CAP"],
    twitterHandle: "IPOWatcherTanya",
    followerEstimate: 58000,
  },
];

// ---------------------------------------------------------------------------
// Category 5: YOUTUBE FINFLUENCERS (~15 entries)
// ---------------------------------------------------------------------------

const YOUTUBE_FINFLUENCERS: readonly CreatorSeedEntry[] = [
  {
    slug: "ca-rachana-ranade",
    displayName: "CA Rachana Ranade",
    bio: "Chartered Accountant and popular finance educator. Simplifies stock market concepts for beginners.",
    specializations: ["LONG_TERM", "LARGE_CAP"],
    youtubeChannelId: "UCrchn4r4n006",
    twitterHandle: "CArachanaranade",
    followerEstimate: 5000000,
  },
  {
    slug: "akshat-shrivastava",
    displayName: "Akshat Shrivastava",
    bio: "Finance content creator and Stanford MBA. Covers macro investing and Indian stock market analysis.",
    specializations: ["LONG_TERM", "LARGE_CAP", "MID_CAP"],
    youtubeChannelId: "UCaksh4tshr007",
    twitterHandle: "aksaborhivestia",
    followerEstimate: 4000000,
  },
  {
    slug: "pranjal-kamra",
    displayName: "Pranjal Kamra",
    bio: "Long-term investing advocate. Fundamental analysis videos with clear buy/sell recommendations.",
    specializations: ["LONG_TERM", "MID_CAP"],
    youtubeChannelId: "UCpr4njlkm008",
    twitterHandle: "PranjalKamra",
    followerEstimate: 3000000,
  },
  {
    slug: "vivek-bajaj-facetoface",
    displayName: "Vivek Bajaj",
    bio: "Co-founder of Elearnmarkets. Face2Face interviews with top traders and deep-dive stock analysis.",
    specializations: ["SWING", "LONG_TERM"],
    youtubeChannelId: "UCvvkb4j4z009",
    twitterHandle: "vivaborajaz",
    followerEstimate: 2000000,
  },
  {
    slug: "market-guru-show",
    displayName: "Market Guru Show",
    bio: "Daily stock market analysis videos. Technical and fundamental coverage of trending stocks.",
    specializations: ["SWING", "INTRADAY", "LARGE_CAP"],
    youtubeChannelId: "UCmktgr0sh010",
    followerEstimate: 800000,
  },
  {
    slug: "neeraj-arora-finance",
    displayName: "Neeraj Arora",
    bio: "CA and finance educator. Detailed company analysis with focus on financial statement reading.",
    specializations: ["LONG_TERM", "LARGE_CAP"],
    youtubeChannelId: "UCnrj4r0r4011",
    twitterHandle: "CaNeerajArora",
    followerEstimate: 1500000,
  },
  {
    slug: "pushkar-raj-thakur",
    displayName: "Pushkar Raj Thakur",
    bio: "Business and stock market educator. Covers IPOs, mutual funds, and direct equity analysis.",
    specializations: ["LONG_TERM", "MID_CAP"],
    youtubeChannelId: "UCpshkr4jth012",
    followerEstimate: 6000000,
  },
  {
    slug: "asset-yogi",
    displayName: "Asset Yogi",
    bio: "Personal finance and wealth creation content. Mutual fund and stock investment education.",
    specializations: ["LONG_TERM", "LARGE_CAP"],
    youtubeChannelId: "UC4ss3ty0g1013",
    followerEstimate: 3500000,
  },
  {
    slug: "market-sathi-show",
    displayName: "Market Sathi",
    bio: "Hindi stock market education channel. Daily share market tips and analysis in simple language.",
    specializations: ["SWING", "MID_CAP"],
    youtubeChannelId: "UCmkts4th1014",
    followerEstimate: 1200000,
  },
  {
    slug: "power-of-compounding",
    displayName: "Power of Compounding",
    bio: "Long-term wealth creation through equity investing. Patient investing philosophy with case studies.",
    specializations: ["LONG_TERM", "LARGE_CAP", "MID_CAP"],
    youtubeChannelId: "UCpwr0fc0mp015",
    followerEstimate: 700000,
  },
  {
    slug: "stock-market-telugu",
    displayName: "Stock Market Telugu",
    bio: "Telugu language stock market education and daily tips. Covers NSE mid and small cap stocks.",
    specializations: ["SWING", "MID_CAP", "SMALL_CAP"],
    youtubeChannelId: "UCstkmkttel016",
    followerEstimate: 900000,
  },
  {
    slug: "invest-aaj-kal",
    displayName: "Invest Aaj Kal",
    bio: "Millennial-focused investing content. Covers stocks, crypto, and new-age investment instruments.",
    specializations: ["LONG_TERM", "CRYPTO", "MID_CAP"],
    youtubeChannelId: "UC1nv3st44k017",
    twitterHandle: "InvestAajKal",
    followerEstimate: 1800000,
  },
  {
    slug: "trading-chanakya",
    displayName: "Trading Chanakya",
    bio: "Technical analysis education on YouTube. Live market sessions with real-time chart walkthroughs.",
    specializations: ["INTRADAY", "SWING"],
    youtubeChannelId: "UCtrdchnky4018",
    followerEstimate: 600000,
  },
  {
    slug: "fin-baba-talks",
    displayName: "FinBaba Talks",
    bio: "Financial advisor and YouTuber. Weekly stock picks with detailed fundamental reasoning.",
    specializations: ["POSITIONAL", "LONG_TERM", "MID_CAP"],
    youtubeChannelId: "UCf1nb4b4tk019",
    twitterHandle: "FinBabaTalks",
    followerEstimate: 500000,
  },
  {
    slug: "charting-wealth-india",
    displayName: "Charting Wealth India",
    bio: "Technical analysis education and daily chart analysis for Nifty, BankNifty, and top 50 stocks.",
    specializations: ["SWING", "INDEX", "LARGE_CAP"],
    youtubeChannelId: "UCchrtw3lth020",
    followerEstimate: 400000,
  },
];

// ---------------------------------------------------------------------------
// Category 6: SECTOR SPECIALISTS (~10 entries)
// ---------------------------------------------------------------------------

const SECTOR_SPECIALISTS: readonly CreatorSeedEntry[] = [
  {
    slug: "pharma-pulse-dr-arun",
    displayName: "Pharma Pulse Dr. Arun",
    bio: "Former pharma executive turned stock analyst. Deep sector knowledge of Indian pharma and healthcare.",
    specializations: ["POSITIONAL", "LONG_TERM"],
    twitterHandle: "PharmaPulseDrA",
    followerEstimate: 62000,
  },
  {
    slug: "banking-sector-expert-ramesh",
    displayName: "Banking Sector Expert Ramesh",
    bio: "Tracks NPA cycles, credit growth, and NIM trends. Covers PSU and private banks exclusively.",
    specializations: ["POSITIONAL", "LARGE_CAP"],
    twitterHandle: "BankSectorRmsh",
    followerEstimate: 48000,
  },
  {
    slug: "it-sector-analyst-divya",
    displayName: "IT Sector Analyst Divya",
    bio: "IT services and SaaS sector coverage. Tracks deal wins, attrition, and margin commentary.",
    specializations: ["POSITIONAL", "LARGE_CAP"],
    twitterHandle: "ITSectorDivya",
    followerEstimate: 35000,
  },
  {
    slug: "auto-analyst-naveen",
    displayName: "Auto Analyst Naveen",
    bio: "Automobile and EV sector specialist. Monthly sales data analysis and stock recommendations.",
    specializations: ["SWING", "POSITIONAL", "MID_CAP"],
    twitterHandle: "AutoAnalystNav",
    followerEstimate: 41000,
  },
  {
    slug: "fmcg-tracker-seema",
    displayName: "FMCG Tracker Seema",
    bio: "Consumer goods sector analyst. Tracks rural vs urban demand, distribution expansion, and pricing power.",
    specializations: ["LONG_TERM", "LARGE_CAP"],
    twitterHandle: "FMCGTrackerSma",
    followerEstimate: 29000,
  },
  {
    slug: "metal-commodity-bharath",
    displayName: "Metal & Commodity Bharath",
    bio: "Metals, mining, and commodity sector expert. Tracks global commodity cycles and Indian metal stocks.",
    specializations: ["SWING", "COMMODITY", "MID_CAP"],
    twitterHandle: "MetalCmdtyBhrt",
    followerEstimate: 37000,
  },
  {
    slug: "realty-infra-gaurav",
    displayName: "Realty Infra Gaurav",
    bio: "Real estate and infrastructure sector specialist. Tracks order books, land banks, and housing demand.",
    specializations: ["POSITIONAL", "MID_CAP"],
    twitterHandle: "RealtyInfraGrv",
    followerEstimate: 32000,
  },
  {
    slug: "energy-power-mahesh",
    displayName: "Energy Power Mahesh",
    bio: "Power, renewable energy, and oil & gas sector coverage. Tracks policy changes and capex cycles.",
    specializations: ["LONG_TERM", "LARGE_CAP", "MID_CAP"],
    twitterHandle: "EnergyPowerMhsh",
    followerEstimate: 27000,
  },
  {
    slug: "chemical-sector-smita",
    displayName: "Chemical Sector Smita",
    bio: "Specialty chemicals and agrochemicals sector specialist. Tracks China+1 beneficiaries and capacity expansions.",
    specializations: ["POSITIONAL", "MID_CAP", "SMALL_CAP"],
    twitterHandle: "ChemSectorSmita",
    followerEstimate: 24000,
  },
  {
    slug: "defence-psu-tracker",
    displayName: "Defence PSU Tracker Amar",
    bio: "Defence and PSU sector coverage. Tracks order inflows, Atmanirbhar Bharat beneficiaries, and HAL/BEL/BDL.",
    specializations: ["POSITIONAL", "LONG_TERM", "MID_CAP"],
    twitterHandle: "DefPSUTracker",
    followerEstimate: 55000,
  },
];

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const prisma = new PrismaClient();

  try {
    const allCreators: readonly CreatorSeedEntry[] = [
      ...INTRADAY_TRADERS,
      ...SWING_TRADERS,
      ...OPTIONS_SPECIALISTS,
      ...FUNDAMENTAL_ANALYSTS,
      ...YOUTUBE_FINFLUENCERS,
      ...SECTOR_SPECIALISTS,
    ];

    console.log(`\nRateMyTip — Top Creator Seed Script`);
    console.log(`===================================`);
    console.log(`Total entries to process: ${allCreators.length}`);
    console.log(`  Intraday Traders:      ${INTRADAY_TRADERS.length}`);
    console.log(`  Swing Traders:         ${SWING_TRADERS.length}`);
    console.log(`  Options Specialists:   ${OPTIONS_SPECIALISTS.length}`);
    console.log(`  Fundamental Analysts:  ${FUNDAMENTAL_ANALYSTS.length}`);
    console.log(`  YouTube Finfluencers:  ${YOUTUBE_FINFLUENCERS.length}`);
    console.log(`  Sector Specialists:    ${SECTOR_SPECIALISTS.length}`);
    console.log(`\nSeeding...\n`);

    let created = 0;
    let skipped = 0;

    for (const entry of allCreators) {
      // Idempotency: skip if slug already exists
      const existing = await prisma.creator.findUnique({
        where: { slug: entry.slug },
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Create Creator record
      const creator = await prisma.creator.create({
        data: {
          slug: entry.slug,
          displayName: entry.displayName,
          bio: entry.bio,
          specializations: entry.specializations,
          followerCount: entry.followerEstimate ?? 0,
        },
      });

      // Create Twitter platform record if handle is provided
      if (entry.twitterHandle) {
        await prisma.creatorPlatform.create({
          data: {
            creatorId: creator.id,
            platform: "TWITTER",
            platformUserId: entry.twitterHandle.toLowerCase(),
            platformHandle: `@${entry.twitterHandle}`,
            platformUrl: `https://twitter.com/${entry.twitterHandle}`,
            followerCount: entry.followerEstimate ?? 0,
          },
        });
      }

      // Create YouTube platform record if channel ID is provided
      if (entry.youtubeChannelId) {
        await prisma.creatorPlatform.create({
          data: {
            creatorId: creator.id,
            platform: "YOUTUBE",
            platformUserId: entry.youtubeChannelId,
            platformHandle: entry.displayName,
            platformUrl: `https://youtube.com/channel/${entry.youtubeChannelId}`,
            followerCount: entry.youtubeChannelId ? Math.floor((entry.followerEstimate ?? 0) * 0.7) : 0,
          },
        });
      }

      created++;
      if (created % 10 === 0) {
        console.log(`  ...created ${created} creators so far`);
      }
    }

    console.log(`\n===================================`);
    console.log(`Seed complete!`);
    console.log(`  Created: ${created}`);
    console.log(`  Skipped (already exist): ${skipped}`);
    console.log(`  Total processed: ${created + skipped}`);
    console.log(`===================================\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
