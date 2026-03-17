// ═══════════════════════════════════════════════════════════
// GLOSSARY — Financial terms commonly seen in Indian stock
// market tip content, designed for beginner-friendly tooltips
// ═══════════════════════════════════════════════════════════

export type GlossaryCategory =
  | "trading"
  | "risk"
  | "analysis"
  | "platform"
  | "market";

export type GlossaryDifficulty = "beginner" | "intermediate" | "advanced";

export interface GlossaryTerm {
  readonly id: string;
  readonly term: string;
  readonly shortDefinition: string;
  readonly fullDefinition: string;
  readonly example: string;
  readonly category: GlossaryCategory;
  readonly difficulty: GlossaryDifficulty;
  readonly relatedTerms: readonly string[];
}

// ──── Complete Term Definitions ────

const GLOSSARY_TERMS: readonly GlossaryTerm[] = [
  {
    id: "entry-price",
    term: "Entry Price",
    shortDefinition:
      "The price at which you are recommended to buy or sell the stock.",
    fullDefinition:
      "Entry price is the suggested price level at which you should enter a trade. A tip creator will specify this so you know the ideal buy/sell level. If the stock has already moved past the entry price, the risk-reward of the trade changes significantly.",
    example:
      "Entry Price: ₹2,450 means you should buy the stock when it is trading near ₹2,450.",
    category: "trading",
    difficulty: "beginner",
    relatedTerms: ["cmp", "limit-order", "market-order"],
  },
  {
    id: "stop-loss",
    term: "Stop Loss (SL)",
    shortDefinition:
      "A safety price level where you exit the trade to limit your loss.",
    fullDefinition:
      "A stop loss is a predefined price at which you sell your position to prevent further losses. It is the single most important risk management tool. If a stock falls to your stop-loss level, you exit immediately — no questions asked. Never trade without a stop loss.",
    example:
      "If you buy at ₹500 with SL at ₹480, your maximum loss per share is ₹20 (4%).",
    category: "risk",
    difficulty: "beginner",
    relatedTerms: [
      "entry-price",
      "risk-reward-ratio",
      "target-price",
    ],
  },
  {
    id: "target-price",
    term: "Target Price",
    shortDefinition:
      "The expected price level where the stock should reach for you to book profit.",
    fullDefinition:
      "Target price is the price level a tip creator expects the stock to reach. Tips often have multiple targets (Target 1, Target 2, Target 3) with increasing profit levels. You may choose to book partial profits at each target. Reaching Target 1 is counted as a successful tip on RateMyTip.",
    example:
      "Target 1: ₹550, Target 2: ₹600 means you can book partial profit at ₹550 and hold the rest for ₹600.",
    category: "trading",
    difficulty: "beginner",
    relatedTerms: [
      "entry-price",
      "stop-loss",
      "risk-reward-ratio",
    ],
  },
  {
    id: "rmt-score",
    term: "RMT Score",
    shortDefinition:
      "RateMyTip's proprietary score (0-100) that rates a tip creator's overall performance.",
    fullDefinition:
      "The RMT Score combines four factors: accuracy (40%), risk-adjusted returns (30%), consistency (20%), and volume of tips (10%). A higher score means the creator has a better verified track record. Scores are recalculated daily after market close using all completed tips.",
    example:
      "A creator with RMT Score 78 has a strong track record. Scores above 75 are considered 'Very Good'.",
    category: "platform",
    difficulty: "beginner",
    relatedTerms: [
      "accuracy-rate",
      "risk-reward-ratio",
      "conviction",
    ],
  },
  {
    id: "risk-reward-ratio",
    term: "Risk-Reward Ratio (R:R)",
    shortDefinition:
      "Compares how much you could lose (risk) versus how much you could gain (reward) on a trade.",
    fullDefinition:
      "The risk-reward ratio is calculated by dividing the potential profit by the potential loss. A ratio of 1:2 means you risk ₹1 to potentially make ₹2. Good tips generally have a risk-reward ratio of at least 1:2. The higher the reward relative to risk, the more attractive the trade — even if accuracy is not perfect.",
    example:
      "Buy at ₹100, SL ₹95, Target ₹110. Risk = ₹5, Reward = ₹10. R:R = 1:2.",
    category: "risk",
    difficulty: "beginner",
    relatedTerms: ["stop-loss", "target-price", "entry-price"],
  },
  {
    id: "swing-trade",
    term: "Swing Trade",
    shortDefinition:
      "A trade meant to be held for 2 to 14 days, capturing short-term price movements.",
    fullDefinition:
      "Swing trading involves holding a position for several days to a couple of weeks. It sits between intraday (same day) and positional (months) trading. Swing traders try to capture a 'swing' in price — a move from support to resistance. This is one of the most popular strategies among Indian finfluencers.",
    example:
      "A swing trade on Tata Motors at ₹640 with a 10-day target of ₹690 and SL at ₹620.",
    category: "trading",
    difficulty: "beginner",
    relatedTerms: [
      "intraday",
      "positional",
      "long-term",
      "btst",
    ],
  },
  {
    id: "intraday",
    term: "Intraday",
    shortDefinition:
      "A trade that is opened and closed on the same trading day.",
    fullDefinition:
      "Intraday trading means you buy and sell the same stock within the same market session (9:15 AM to 3:30 PM IST). You cannot carry intraday positions overnight. This style requires quick decisions and tight stop losses. Brokers offer higher leverage for intraday trades, which increases both potential profit and loss.",
    example:
      "Buy Infosys at ₹1,520 at 10 AM, sell at ₹1,545 by 2 PM. Profit: ₹25/share in a single day.",
    category: "trading",
    difficulty: "beginner",
    relatedTerms: [
      "swing-trade",
      "delivery",
      "market-order",
      "btst",
    ],
  },
  {
    id: "positional",
    term: "Positional Trade",
    shortDefinition:
      "A trade held for weeks to a few months based on medium-term price trends.",
    fullDefinition:
      "Positional trading is for those who do not want to watch the screen all day. Positions are held for 15 to 90 days, relying on broader market trends and fundamentals. Stop losses are wider than in swing or intraday trades, and targets are correspondingly larger. This style suits people with full-time jobs.",
    example:
      "Buy HDFC Bank at ₹1,580, hold for 2 months, target ₹1,750, SL ₹1,500.",
    category: "trading",
    difficulty: "intermediate",
    relatedTerms: ["swing-trade", "long-term", "delivery"],
  },
  {
    id: "long-term",
    term: "Long Term Investment",
    shortDefinition:
      "Holding a stock for several months to years, focusing on fundamental value.",
    fullDefinition:
      "Long-term investing means buying a stock with the intention of holding it for 90 days or more — often years. This approach relies on company fundamentals, earnings growth, and market position rather than short-term price patterns. Long-term capital gains above ₹1 lakh are taxed at 10% in India.",
    example:
      "Buying Reliance at ₹2,400 with a 1-year target of ₹3,200 based on Jio's growth.",
    category: "trading",
    difficulty: "beginner",
    relatedTerms: [
      "positional",
      "large-cap",
      "delivery",
      "sector",
    ],
  },
  {
    id: "cmp",
    term: "CMP (Current Market Price)",
    shortDefinition:
      "The price at which the stock is currently trading in the market right now.",
    fullDefinition:
      "CMP stands for Current Market Price — the last traded price of a stock on the exchange. When a tip says 'Buy at CMP', it means buy immediately at whatever the stock is trading at. This is different from a specific entry price, where you may need to wait for the stock to come down to that level.",
    example:
      "If Wipro CMP is ₹445, and a tip says 'Buy at CMP ₹445', you buy right away.",
    category: "market",
    difficulty: "beginner",
    relatedTerms: ["entry-price", "market-order", "limit-order"],
  },
  {
    id: "nifty-50",
    term: "Nifty 50",
    shortDefinition:
      "India's benchmark stock market index, representing the top 50 companies listed on NSE.",
    fullDefinition:
      "The Nifty 50 is the flagship index of the National Stock Exchange (NSE) of India. It tracks the performance of 50 of the largest and most liquid Indian companies across 13 sectors. When people say 'the market is up', they usually mean the Nifty 50 is up. It is the most widely followed indicator of the Indian stock market's health.",
    example:
      "If Nifty 50 is at 22,500, it means the weighted average price of the top 50 stocks represents that level.",
    category: "market",
    difficulty: "beginner",
    relatedTerms: ["india-vix", "fii-dii", "large-cap", "sector"],
  },
  {
    id: "india-vix",
    term: "India VIX",
    shortDefinition:
      "A 'fear gauge' that measures expected market volatility over the next 30 days.",
    fullDefinition:
      "India VIX (Volatility Index) is calculated by NSE and reflects expected market volatility. A high VIX (above 20) means the market expects big moves — usually during uncertainty or panic. A low VIX (below 13) means the market is calm. Traders use VIX to assess overall market risk before taking positions.",
    example:
      "India VIX at 25 suggests high fear in the market — traders might tighten stop losses or reduce position sizes.",
    category: "market",
    difficulty: "intermediate",
    relatedTerms: ["nifty-50", "beta", "risk-reward-ratio"],
  },
  {
    id: "accuracy-rate",
    term: "Accuracy Rate",
    shortDefinition:
      "The percentage of a creator's tips that successfully hit at least Target 1.",
    fullDefinition:
      "Accuracy rate measures how often a tip creator's calls are correct. On RateMyTip, a tip is counted as 'accurate' if the stock reaches Target 1 before the stop loss is hit or the tip expires. An accuracy rate of 65% or above is considered good for most trading styles. Note: accuracy alone does not tell the full story — risk-reward ratio matters just as much.",
    example:
      "A creator with 70% accuracy means 7 out of every 10 tips hit their first target.",
    category: "platform",
    difficulty: "beginner",
    relatedTerms: [
      "rmt-score",
      "target-price",
      "risk-reward-ratio",
    ],
  },
  {
    id: "conviction",
    term: "Conviction",
    shortDefinition:
      "How confident the tip creator is about a particular trade — Low, Medium, or High.",
    fullDefinition:
      "Conviction indicates the creator's confidence level in their tip. High conviction means they believe strongly in the trade based on their analysis. On RateMyTip, conviction is inferred from the language used in the original tip. High conviction tips are not necessarily more accurate, but they indicate the creator is putting more weight on that particular call.",
    example:
      "A 'High Conviction' BUY on ITC might mean the creator sees a strong breakout pattern with multiple confirming signals.",
    category: "platform",
    difficulty: "intermediate",
    relatedTerms: ["rmt-score", "accuracy-rate", "breakout"],
  },
  {
    id: "market-order",
    term: "Market Order",
    shortDefinition:
      "An order to buy or sell immediately at the best currently available price.",
    fullDefinition:
      "A market order executes instantly at the current market price. You get the stock immediately, but you might not get the exact price you saw — especially in fast-moving or illiquid stocks. Use market orders when speed is more important than getting a specific price. For most beginner trades, limit orders are safer.",
    example:
      "Placing a market order to buy TCS when CMP is ₹3,600 — you might get filled at ₹3,601 or ₹3,599.",
    category: "trading",
    difficulty: "beginner",
    relatedTerms: ["limit-order", "cmp", "entry-price"],
  },
  {
    id: "limit-order",
    term: "Limit Order",
    shortDefinition:
      "An order to buy or sell at a specific price or better — it only executes if the price is reached.",
    fullDefinition:
      "A limit order lets you set the exact price at which you want to buy or sell. A buy limit order only executes at or below your specified price; a sell limit order only at or above. If the stock never reaches your price, the order stays pending. This gives you price control but no guarantee of execution.",
    example:
      "Set a limit buy at ₹480 for SBI. If SBI drops to ₹480, your order executes. If it stays above ₹480, nothing happens.",
    category: "trading",
    difficulty: "beginner",
    relatedTerms: ["market-order", "entry-price", "cmp"],
  },
  {
    id: "delivery",
    term: "Delivery Trade",
    shortDefinition:
      "Buying a stock and taking actual ownership, holding it in your demat account.",
    fullDefinition:
      "In a delivery trade, you buy shares and they are credited to your demat account after T+1 settlement. Unlike intraday trading, there is no time limit to sell — you can hold for days, months, or years. Delivery trades do not use leverage, so you pay the full share price. This is the safest form of stock trading for beginners.",
    example:
      "Buying 10 shares of Reliance at ₹2,450 in delivery mode costs you ₹24,500 and shares appear in your demat next day.",
    category: "trading",
    difficulty: "beginner",
    relatedTerms: [
      "intraday",
      "demat",
      "positional",
      "long-term",
    ],
  },
  {
    id: "large-cap",
    term: "Large Cap",
    shortDefinition:
      "Companies with a market capitalization above ₹20,000 crore — the biggest and most stable.",
    fullDefinition:
      "Large-cap companies are the top 100 companies by market capitalization on Indian exchanges. They include household names like Reliance, TCS, HDFC Bank, and Infosys. Large-cap stocks are generally less volatile, more liquid, and considered safer investments. They form the core of most portfolios and indices like Nifty 50.",
    example:
      "Reliance Industries with a market cap of ₹17 lakh crore is a classic large-cap stock.",
    category: "market",
    difficulty: "beginner",
    relatedTerms: ["mid-cap", "small-cap", "nifty-50", "sector"],
  },
  {
    id: "mid-cap",
    term: "Mid Cap",
    shortDefinition:
      "Companies with a market capitalization between ₹5,000 and ₹20,000 crore.",
    fullDefinition:
      "Mid-cap companies sit between large-cap and small-cap in terms of size. They are typically growing companies that offer a balance of stability and growth potential. Mid-caps tend to be more volatile than large-caps but offer higher return potential. The Nifty Midcap 50 index tracks the top mid-cap stocks in India.",
    example:
      "A company like Persistent Systems with market cap around ₹55,000 crore is tracked in the mid-cap space.",
    category: "market",
    difficulty: "beginner",
    relatedTerms: ["large-cap", "small-cap", "beta"],
  },
  {
    id: "small-cap",
    term: "Small Cap",
    shortDefinition:
      "Companies with a market capitalization below ₹5,000 crore — high risk, high reward potential.",
    fullDefinition:
      "Small-cap stocks represent smaller companies that can deliver explosive returns but also carry significant risk. They tend to be less liquid (harder to buy/sell quickly), more volatile, and more susceptible to market downturns. Many successful multi-baggers (stocks that multiply in value) start as small-caps, but many also fail.",
    example:
      "A company with ₹2,000 crore market cap could double quickly but could also fall 50% in a downturn.",
    category: "market",
    difficulty: "beginner",
    relatedTerms: ["mid-cap", "large-cap", "beta", "volume"],
  },
  {
    id: "beta",
    term: "Beta",
    shortDefinition:
      "A measure of how much a stock moves compared to the overall market (Nifty 50).",
    fullDefinition:
      "Beta measures a stock's volatility relative to the broader market. A beta of 1 means the stock moves in line with the market. Beta above 1 means the stock is more volatile — it rises more in up markets and falls more in down markets. Beta below 1 means the stock is less volatile. High-beta stocks can amplify both your gains and losses.",
    example:
      "A stock with beta 1.5 will typically move 1.5% for every 1% move in Nifty. So if Nifty rises 2%, expect the stock to rise ~3%.",
    category: "analysis",
    difficulty: "intermediate",
    relatedTerms: [
      "india-vix",
      "nifty-50",
      "large-cap",
      "small-cap",
    ],
  },
  {
    id: "sector",
    term: "Sector",
    shortDefinition:
      "A category of companies that operate in the same industry (e.g., IT, Banking, Pharma).",
    fullDefinition:
      "Sectors group companies by the industry they operate in. Common Indian market sectors include IT (TCS, Infosys), Banking (HDFC Bank, ICICI), Pharma (Sun Pharma, Dr. Reddy's), and FMCG (HUL, ITC). Sector rotation — money moving from one sector to another — is a key market dynamic. Knowing which sectors are 'in play' helps evaluate tips.",
    example:
      "If the Banking sector is rallying, tip creators may issue multiple BUY calls on bank stocks like SBI, Axis Bank.",
    category: "market",
    difficulty: "beginner",
    relatedTerms: ["nifty-50", "large-cap", "fii-dii"],
  },
  {
    id: "breakout",
    term: "Breakout",
    shortDefinition:
      "When a stock's price moves above a resistance level with increased volume, signaling a potential upward move.",
    fullDefinition:
      "A breakout occurs when a stock price moves above a key resistance level — a price ceiling that the stock has struggled to cross. Breakouts with high volume are considered more reliable. Traders often place BUY orders on breakouts, expecting the stock to continue rising. False breakouts (where the price falls back) are a common trap.",
    example:
      "Tata Steel breaks above ₹130 resistance with 3x average volume — this is a strong breakout signal.",
    category: "analysis",
    difficulty: "intermediate",
    relatedTerms: [
      "breakdown",
      "support",
      "resistance",
      "volume",
    ],
  },
  {
    id: "breakdown",
    term: "Breakdown",
    shortDefinition:
      "When a stock's price falls below a support level, signaling a potential further decline.",
    fullDefinition:
      "A breakdown is the opposite of a breakout — the stock price drops below a key support level. This signals that selling pressure has overwhelmed buyers, and the stock may fall further. Short sellers or tip creators with SELL calls often look for breakdown patterns. Breakdowns on high volume are more significant.",
    example:
      "If HDFC Bank drops below ₹1,500 support on high volume, it is considered a breakdown with potential to fall to ₹1,420.",
    category: "analysis",
    difficulty: "intermediate",
    relatedTerms: [
      "breakout",
      "support",
      "resistance",
      "volume",
    ],
  },
  {
    id: "support",
    term: "Support Level",
    shortDefinition:
      "A price level where buying interest is strong enough to prevent the stock from falling further.",
    fullDefinition:
      "Support is a price level where demand (buyers) is historically strong enough to stop the price from declining. Think of it as a floor. When a stock approaches support, it tends to bounce back up. If support breaks, the stock may fall to the next support level. Stop losses are often placed just below key support levels.",
    example:
      "Nifty has strong support at 22,000. If it falls to 22,000 and bounces, that support is confirmed.",
    category: "analysis",
    difficulty: "beginner",
    relatedTerms: [
      "resistance",
      "breakdown",
      "stop-loss",
      "breakout",
    ],
  },
  {
    id: "resistance",
    term: "Resistance Level",
    shortDefinition:
      "A price level where selling pressure is strong enough to prevent the stock from rising further.",
    fullDefinition:
      "Resistance is a price level where supply (sellers) is historically strong enough to cap the price. Think of it as a ceiling. When a stock approaches resistance, it tends to fall back. If resistance is broken (breakout), the stock may rally to the next resistance. Target prices are often set at resistance levels.",
    example:
      "If Infosys has resistance at ₹1,600 and the stock keeps failing to cross it, ₹1,600 is a resistance level.",
    category: "analysis",
    difficulty: "beginner",
    relatedTerms: [
      "support",
      "breakout",
      "target-price",
      "breakdown",
    ],
  },
  {
    id: "volume",
    term: "Volume",
    shortDefinition:
      "The number of shares traded during a given period — high volume confirms price moves.",
    fullDefinition:
      "Volume tells you how many shares of a stock changed hands. High volume during a price move means strong participation — many traders agree on the direction. Low volume moves are less trustworthy and may reverse. Always check volume alongside price: a breakout on high volume is far more reliable than one on low volume.",
    example:
      "If Reliance normally trades 5 lakh shares/day but today trades 15 lakh shares during a rally, the move is volume-confirmed.",
    category: "analysis",
    difficulty: "beginner",
    relatedTerms: ["breakout", "breakdown", "fii-dii"],
  },
  {
    id: "fii-dii",
    term: "FII/DII",
    shortDefinition:
      "Foreign Institutional Investors and Domestic Institutional Investors — the big money players.",
    fullDefinition:
      "FII (Foreign Institutional Investors) are overseas funds investing in Indian markets. DII (Domestic Institutional Investors) are Indian mutual funds, insurance companies, and pension funds. Their buying and selling patterns significantly influence market direction. When FIIs are buying, markets tend to rally. When they sell, markets often fall. Net FII/DII data is published daily by NSE.",
    example:
      "FIIs bought ₹2,500 crore worth of stocks today — this is bullish for the market in the short term.",
    category: "market",
    difficulty: "intermediate",
    relatedTerms: ["nifty-50", "volume", "india-vix", "sector"],
  },
  {
    id: "circuit-limit",
    term: "Circuit Limit",
    shortDefinition:
      "The maximum percentage a stock's price can move up or down in a single trading day.",
    fullDefinition:
      "Circuit limits are set by exchanges to prevent extreme price movements. A stock hitting its upper circuit (UC) cannot go higher that day; hitting lower circuit (LC) means it cannot fall further. Circuit limits vary: 2%, 5%, 10%, or 20% depending on the stock. Stocks hitting circuits repeatedly may have frozen liquidity — you cannot buy when it is at UC or sell when at LC.",
    example:
      "A small-cap stock with a 10% circuit limit at ₹200 can only trade between ₹180 (LC) and ₹220 (UC) in a day.",
    category: "market",
    difficulty: "intermediate",
    relatedTerms: ["small-cap", "volume", "delivery"],
  },
  {
    id: "demat",
    term: "Demat Account",
    shortDefinition:
      "A digital account that holds your shares electronically — like a bank account but for stocks.",
    fullDefinition:
      "A Demat (dematerialized) account holds your shares in electronic form. In India, CDSL and NSDL are the two depositories that maintain demat accounts through brokers like Zerodha, Groww, and Upstox. You need a demat account to buy stocks in delivery mode. Shares are credited to your demat account after T+1 settlement.",
    example:
      "When you buy 50 shares of ITC in delivery, they appear in your demat account the next trading day.",
    category: "platform",
    difficulty: "beginner",
    relatedTerms: ["delivery", "large-cap"],
  },
  {
    id: "btst",
    term: "BTST (Buy Today, Sell Tomorrow)",
    shortDefinition:
      "A trade where you buy a stock today and sell it the next trading day.",
    fullDefinition:
      "BTST stands for Buy Today, Sell Tomorrow. It is a very short-term strategy where you buy shares during market hours and sell them the next trading day before or after the market opens. On RateMyTip, BTST is classified under the Swing timeframe. This strategy is popular for capturing overnight gaps caused by global market cues or corporate events.",
    example:
      "Buy ICICI Bank at ₹1,050 before close on Monday, sell at ₹1,070 on Tuesday morning — ₹20 profit per share overnight.",
    category: "trading",
    difficulty: "beginner",
    relatedTerms: ["swing-trade", "intraday", "delivery"],
  },
  {
    id: "trailing-stop-loss",
    term: "Trailing Stop Loss",
    shortDefinition:
      "A stop loss that moves up as the stock price rises, locking in profits while still protecting against reversal.",
    fullDefinition:
      "A trailing stop loss automatically adjusts upward as the stock price increases, but stays fixed when the price drops. This lets you lock in gains while still protecting your position. For example, if you set a trailing SL of ₹20, and the stock goes from ₹500 to ₹550, your SL moves from ₹480 to ₹530. If the stock then drops to ₹530, you are stopped out with a ₹30 profit instead of a ₹20 loss.",
    example:
      "Stock bought at ₹500, trailing SL ₹20. Price hits ₹560 → SL at ₹540. Price falls to ₹540 → exit with ₹40 profit.",
    category: "risk",
    difficulty: "intermediate",
    relatedTerms: ["stop-loss", "target-price", "swing-trade"],
  },
  {
    id: "gap-up",
    term: "Gap Up",
    shortDefinition:
      "When a stock opens at a price significantly higher than its previous day close.",
    fullDefinition:
      "A gap up happens when a stock opens at a price higher than the previous day's close, creating a visible 'gap' on the price chart. Gaps are caused by overnight events — strong global cues, quarterly results, or major news. Gap-up openings are common in BTST trades. A large gap up may mean the best entry price has already been missed.",
    example:
      "TCS closed at ₹3,500 yesterday and opens at ₹3,560 today due to strong quarterly results — a ₹60 gap up.",
    category: "analysis",
    difficulty: "intermediate",
    relatedTerms: ["btst", "breakout", "volume"],
  },
  {
    id: "profit-booking",
    term: "Profit Booking",
    shortDefinition:
      "Selling a stock to realize gains after it has risen to or near the target price.",
    fullDefinition:
      "Profit booking is the act of selling your shares to lock in profits. When a stock reaches the tip's target price, you 'book profit' by selling. Partial profit booking means selling some shares at Target 1 and holding the rest for Target 2 or 3. Tip creators often advise trailing stop-loss after booking partial profits.",
    example:
      "Bought at ₹200, Target 1 ₹220 hit. Book 50% profit at ₹220 (₹20/share gain), trail SL for the rest.",
    category: "trading",
    difficulty: "beginner",
    relatedTerms: [
      "target-price",
      "trailing-stop-loss",
      "risk-reward-ratio",
    ],
  },
] as const;

// ──── Build GLOSSARY_MAP for O(1) lookups by ID ────

export const GLOSSARY_MAP: ReadonlyMap<string, GlossaryTerm> = new Map(
  GLOSSARY_TERMS.map((t) => [t.id, t]),
);

// ──── Keyword/Abbreviation → Term ID mapping ────
// Allows fuzzy matching from tip content to glossary terms.

export const KEYWORD_TO_TERM_ID: Readonly<Record<string, string>> = {
  // Entry price variants
  entry: "entry-price",
  "entry price": "entry-price",
  "entry level": "entry-price",
  "buy price": "entry-price",
  "buy at": "entry-price",
  "buy near": "entry-price",
  "buy above": "entry-price",

  // Stop loss variants
  sl: "stop-loss",
  "stop loss": "stop-loss",
  stoploss: "stop-loss",
  "stop-loss": "stop-loss",
  "sl price": "stop-loss",

  // Target price variants
  target: "target-price",
  tgt: "target-price",
  "target price": "target-price",
  "tp": "target-price",
  "target 1": "target-price",
  "target 2": "target-price",
  "target 3": "target-price",
  "t1": "target-price",
  "t2": "target-price",
  "t3": "target-price",

  // RMT Score
  "rmt score": "rmt-score",
  "rmt": "rmt-score",
  "ratemytip score": "rmt-score",
  score: "rmt-score",

  // Risk-Reward
  "risk reward": "risk-reward-ratio",
  "risk-reward": "risk-reward-ratio",
  "r:r": "risk-reward-ratio",
  "rr": "risk-reward-ratio",
  "risk reward ratio": "risk-reward-ratio",

  // Swing trade
  swing: "swing-trade",
  "swing trade": "swing-trade",
  "swing trading": "swing-trade",

  // Intraday
  intraday: "intraday",
  "intra day": "intraday",
  "intra-day": "intraday",
  "day trade": "intraday",
  "day trading": "intraday",

  // Positional
  positional: "positional",
  "positional trade": "positional",
  "positional trading": "positional",

  // Long term
  "long term": "long-term",
  "long-term": "long-term",
  "invest": "long-term",
  "investment": "long-term",
  "buy and hold": "long-term",

  // CMP
  cmp: "cmp",
  "current market price": "cmp",
  "current price": "cmp",
  ltp: "cmp",
  "last traded price": "cmp",

  // Nifty 50
  nifty: "nifty-50",
  "nifty 50": "nifty-50",
  nifty50: "nifty-50",

  // India VIX
  vix: "india-vix",
  "india vix": "india-vix",
  "volatility index": "india-vix",

  // Accuracy
  accuracy: "accuracy-rate",
  "accuracy rate": "accuracy-rate",
  "hit rate": "accuracy-rate",
  "win rate": "accuracy-rate",
  "success rate": "accuracy-rate",

  // Conviction
  conviction: "conviction",
  "high conviction": "conviction",
  "low conviction": "conviction",
  confidence: "conviction",

  // Market order
  "market order": "market-order",
  "at market": "market-order",

  // Limit order
  "limit order": "limit-order",
  "limit buy": "limit-order",
  "limit sell": "limit-order",

  // Delivery
  delivery: "delivery",
  "delivery trade": "delivery",
  "cash trade": "delivery",

  // Large cap
  "large cap": "large-cap",
  "large-cap": "large-cap",
  largecap: "large-cap",
  bluechip: "large-cap",
  "blue chip": "large-cap",

  // Mid cap
  "mid cap": "mid-cap",
  "mid-cap": "mid-cap",
  midcap: "mid-cap",

  // Small cap
  "small cap": "small-cap",
  "small-cap": "small-cap",
  smallcap: "small-cap",
  "penny stock": "small-cap",

  // Beta
  beta: "beta",
  "high beta": "beta",
  "low beta": "beta",

  // Sector
  sector: "sector",
  "sector rotation": "sector",
  sectoral: "sector",

  // Breakout
  breakout: "breakout",
  "break out": "breakout",
  "breaking out": "breakout",

  // Breakdown
  breakdown: "breakdown",
  "break down": "breakdown",
  "breaking down": "breakdown",

  // Support
  support: "support",
  "support level": "support",
  "support zone": "support",
  floor: "support",

  // Resistance
  resistance: "resistance",
  "resistance level": "resistance",
  "resistance zone": "resistance",
  ceiling: "resistance",

  // Volume
  volume: "volume",
  "high volume": "volume",
  "low volume": "volume",
  "delivery volume": "volume",

  // FII/DII
  fii: "fii-dii",
  dii: "fii-dii",
  "fii dii": "fii-dii",
  "fii/dii": "fii-dii",
  "foreign institutional": "fii-dii",
  "domestic institutional": "fii-dii",

  // Circuit limit
  circuit: "circuit-limit",
  "circuit limit": "circuit-limit",
  "upper circuit": "circuit-limit",
  "lower circuit": "circuit-limit",
  uc: "circuit-limit",
  lc: "circuit-limit",

  // Demat
  demat: "demat",
  "demat account": "demat",
  "d-mat": "demat",
  cdsl: "demat",
  nsdl: "demat",

  // BTST
  btst: "btst",
  "buy today sell tomorrow": "btst",
  stbt: "btst",

  // Trailing stop loss
  "trailing sl": "trailing-stop-loss",
  "trailing stop": "trailing-stop-loss",
  "trailing stop loss": "trailing-stop-loss",
  tsl: "trailing-stop-loss",

  // Gap up
  "gap up": "gap-up",
  "gap-up": "gap-up",
  gapup: "gap-up",
  "gap down": "gap-up",

  // Profit booking
  "profit booking": "profit-booking",
  "book profit": "profit-booking",
  "partial profit": "profit-booking",
  "profit book": "profit-booking",
} as const;

// ──── Helpers ────

export function getTermById(id: string): GlossaryTerm | undefined {
  return GLOSSARY_MAP.get(id);
}

export function getTermByKeyword(keyword: string): GlossaryTerm | undefined {
  const normalised = keyword.toLowerCase().trim();
  const termId = KEYWORD_TO_TERM_ID[normalised];
  if (!termId) return undefined;
  return GLOSSARY_MAP.get(termId);
}

export function getTermsByCategory(
  category: GlossaryCategory,
): readonly GlossaryTerm[] {
  return GLOSSARY_TERMS.filter((t) => t.category === category);
}

export function getTermsByDifficulty(
  difficulty: GlossaryDifficulty,
): readonly GlossaryTerm[] {
  return GLOSSARY_TERMS.filter((t) => t.difficulty === difficulty);
}

export { GLOSSARY_TERMS };
