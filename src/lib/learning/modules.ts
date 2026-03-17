// src/lib/learning/modules.ts
// Static learning module definitions for the RateMyTip learning hub.

export interface QuizQuestion {
  readonly question: string;
  readonly options: readonly string[];
  readonly correctIndex: number;
  readonly explanation: string;
}

export interface ModuleSection {
  readonly title: string;
  readonly body: string;
}

export interface LearningModule {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly description: string;
  readonly estimatedMinutes: number;
  readonly difficulty: "Beginner" | "Intermediate" | "Advanced";
  readonly content: readonly ModuleSection[];
  readonly quiz: readonly QuizQuestion[];
}

export const LEARNING_MODULES: readonly LearningModule[] = [
  {
    id: "mod-1",
    title: "Understanding Stock Tips in 10 Minutes",
    slug: "understanding-stock-tips",
    description:
      "Learn the basics of what a stock tip is, who gives them, and how to evaluate whether you should act on one.",
    estimatedMinutes: 10,
    difficulty: "Beginner",
    content: [
      {
        title: "What Is a Stock Tip?",
        body: `A **stock tip** is a recommendation to buy or sell a particular stock at a specific price, usually with a target price (where to book profit) and a stop-loss price (where to cut your loss).

Tips are shared by analysts, traders, brokerage houses, and increasingly by social media influencers (often called "finfluencers"). They typically include:

- **Stock Name / Symbol** — e.g., RELIANCE, TCS
- **Direction** — BUY or SELL
- **Entry Price** — The price at which you should enter the trade
- **Target Price** — The price at which you should book profit
- **Stop Loss** — The price at which you should exit to limit losses
- **Timeframe** — How long you should hold (intraday, swing, positional, long-term)`,
      },
      {
        title: "Who Gives Stock Tips?",
        body: `Stock tips come from many sources, each with different levels of reliability:

1. **SEBI-Registered Research Analysts (RAs)** — These are legally required to be registered with SEBI. They must pass exams and follow disclosure rules. This is the most regulated category.

2. **Brokerage Research Desks** — Firms like ICICI Direct, Motilal Oswal, and Zerodha publish research reports with stock recommendations.

3. **Independent Traders & Analysts** — Individuals who share tips on Twitter, YouTube, or Telegram based on their own analysis. Quality varies enormously.

4. **Finfluencers** — Social media personalities who have large followings and share stock tips. Many are not SEBI-registered, which is a red flag.

5. **Paid Tip Services** — Subscription services that send daily or weekly tips via SMS, WhatsApp, or Telegram. Some are legitimate; many are scams.`,
      },
      {
        title: "How to Evaluate a Stock Tip",
        body: `Before acting on any stock tip, ask yourself these questions:

1. **Is the source credible?** Check their track record. RateMyTip tracks this for you automatically.
2. **Does it have a clear stop-loss?** A tip without a stop-loss is irresponsible. Always know your maximum loss.
3. **Is the risk-reward ratio favorable?** Ideally, the potential profit should be at least 2x the potential loss.
4. **Does it fit your trading style?** An intraday tip is useless if you have a full-time job and cannot watch the market.
5. **Is the tip based on analysis or hype?** Look for reasoning — chart patterns, fundamentals, news catalysts.

**Golden Rule:** Never invest money you cannot afford to lose based on someone else's tip. Always do your own research (DYOR).`,
      },
      {
        title: "Understanding Risk-Reward",
        body: `The **risk-reward ratio** is one of the most important concepts in trading. It compares how much you stand to lose versus how much you stand to gain.

**Example:**
- Entry Price: Rs.100
- Target: Rs.115 (potential gain: Rs.15)
- Stop Loss: Rs.95 (potential loss: Rs.5)
- Risk-Reward Ratio: 1:3 (risking Rs.5 to potentially gain Rs.15)

A good rule of thumb: only take trades where the risk-reward ratio is at least 1:2.

This means even if only 50% of your trades hit the target, you will still be profitable overall.`,
      },
    ],
    quiz: [
      {
        question: "What is a stock tip?",
        options: [
          "A guaranteed way to make money in the stock market",
          "A recommendation to buy or sell a stock with entry, target, and stop-loss prices",
          "A secret insider trading signal",
          "A government-issued investment advisory",
        ],
        correctIndex: 1,
        explanation:
          "A stock tip is simply a recommendation with specific price levels. It is never a guarantee of profit.",
      },
      {
        question: "What does a stop-loss price represent?",
        options: [
          "The price at which you will definitely make a profit",
          "The highest price the stock will reach",
          "The price at which you should exit to limit your losses",
          "The price recommended by SEBI",
        ],
        correctIndex: 2,
        explanation:
          "A stop-loss is your safety net. It is the price at which you exit the trade to prevent further losses if the market moves against you.",
      },
      {
        question:
          "If a tip has an entry of Rs.200, target of Rs.230, and stop-loss of Rs.190, what is the risk-reward ratio?",
        options: ["1:1", "1:2", "1:3", "2:1"],
        correctIndex: 2,
        explanation:
          "Risk = 200 - 190 = Rs.10. Reward = 230 - 200 = Rs.30. So the ratio is 10:30 or 1:3.",
      },
    ],
  },
  {
    id: "mod-2",
    title: "What Makes a Good Tip Creator? Reading the RMT Score",
    slug: "reading-the-rmt-score",
    description:
      "Understand how RateMyTip evaluates tip creators and what the RMT Score tells you about their reliability.",
    estimatedMinutes: 12,
    difficulty: "Beginner",
    content: [
      {
        title: "Why Track Record Matters",
        body: `Anyone can post a stock tip on social media. The real question is: **how often are they right?**

Many finfluencers only show their winning trades and conveniently delete or ignore the losing ones. This creates a false impression of success.

RateMyTip solves this problem by **independently tracking every tip** a creator makes and verifying the outcome against real market data. No one can cherry-pick their results on our platform.`,
      },
      {
        title: "How the RMT Score Works",
        body: `The **RMT Score** is a composite score from 0 to 100 that represents a tip creator's overall performance. It is calculated from four components:

1. **Accuracy (40% weight)** — What percentage of their tips hit the target? This is recency-weighted, meaning recent tips count more than old ones.

2. **Risk-Adjusted Returns (30% weight)** — It is not just about hitting targets. A tip with a 2% target and 10% stop-loss is far riskier than one with a 10% target and 3% stop-loss. This component measures return relative to risk taken.

3. **Consistency (20% weight)** — Is the creator consistently good, or do they have wild swings between great months and terrible months? Steady performance scores higher.

4. **Volume Factor (10% weight)** — More tips = more data = more statistically reliable score. A creator with 200 tracked tips has a more meaningful score than one with just 25.`,
      },
      {
        title: "Understanding Creator Tiers",
        body: `Creators are placed into tiers based on the number of completed (scored) tips:

- **Unrated** — Fewer than 20 tips. Not enough data to score reliably.
- **Bronze** — 20 to 49 tips. Score is available but has a wide confidence interval.
- **Silver** — 50 to 199 tips. Reasonably reliable score.
- **Gold** — 200 to 499 tips. Strong statistical basis.
- **Platinum** — 500 to 999 tips. Highly reliable score.
- **Diamond** — 1000+ tips. The most data-backed score possible.

**Higher tier does not mean higher score.** A Gold-tier creator with an RMT Score of 45 is less accurate than a Silver-tier creator with a score of 78. Tier indicates data quantity; score indicates quality.`,
      },
      {
        title: "The Confidence Interval",
        body: `You may see scores displayed like "RMT Score: 73 +/- 5." The +/- number is the **confidence interval** (at 95% confidence).

This means the creator's true score is very likely between 68 and 78. A narrower interval means we are more certain about the score.

Confidence intervals are wider when:
- The creator has fewer tips (less data)
- Their accuracy is close to 50% (maximum uncertainty)

And narrower when:
- They have many tips (more data)
- Their accuracy is very high or very low (more certainty)`,
      },
    ],
    quiz: [
      {
        question: "What is the most heavily weighted component of the RMT Score?",
        options: [
          "Volume Factor",
          "Consistency",
          "Accuracy",
          "Risk-Adjusted Returns",
        ],
        correctIndex: 2,
        explanation:
          "Accuracy carries 40% of the total weight, making it the single most important factor in the RMT Score.",
      },
      {
        question:
          'A creator has a "Gold" tier badge. What does this tell you?',
        options: [
          "They have the highest RMT Score",
          "They are SEBI-registered",
          "They have between 200 and 499 completed tips tracked",
          "Their tips are guaranteed to be profitable",
        ],
        correctIndex: 2,
        explanation:
          "The tier badge indicates the volume of tracked tips, not the quality. Always check the RMT Score for quality.",
      },
      {
        question: 'What does a score of "73 +/- 5" mean?',
        options: [
          "The score will change by 5 points tomorrow",
          "The true score is very likely between 68 and 78",
          "The creator loses 5% on average",
          "They have 5 losing tips",
        ],
        correctIndex: 1,
        explanation:
          "The +/- 5 is a 95% confidence interval. It tells you the range within which the true score almost certainly falls.",
      },
    ],
  },
  {
    id: "mod-3",
    title: "Risk Management 101: Why Stop Loss is Your Best Friend",
    slug: "risk-management-101",
    description:
      "Learn why setting a stop-loss is the most important habit for any trader and how to use it effectively.",
    estimatedMinutes: 15,
    difficulty: "Beginner",
    content: [
      {
        title: "What Is a Stop Loss?",
        body: `A **stop loss** (SL) is a predetermined price at which you will exit a trade to limit your loss. It is your safety net against catastrophic losses.

**Example:**
You buy Infosys at Rs.1500 with a stop-loss at Rs.1460.
- If Infosys drops to Rs.1460, you sell and take a Rs.40 loss per share.
- Without a stop-loss, if Infosys drops to Rs.1300, you would be sitting on a Rs.200 loss per share — 5x worse!

**The purpose of a stop-loss is not to avoid losses entirely.** Losses are a natural part of trading. The purpose is to keep each individual loss small so that your winning trades more than compensate.`,
      },
      {
        title: "Why Beginners Avoid Stop Losses (And Why That Is Dangerous)",
        body: `Common excuses for not using a stop-loss:

1. **"It will come back"** — Sometimes it does. But sometimes it does not. A stock can drop 50% or more and take years to recover, if ever.

2. **"I do not want to book a loss"** — An unrealized loss is still a loss. Your capital is stuck in a losing position instead of being used for better opportunities.

3. **"The market makers hunt stop losses"** — While short-term volatility can trigger stop losses, the solution is to place them at logical levels (below support), not to avoid them entirely.

4. **"I will watch and exit manually"** — Emotions make this nearly impossible. When a stock is dropping, fear and hope battle each other, and most people freeze.

**The data is clear:** Traders who consistently use stop losses survive long enough to become profitable. Those who don't eventually face a catastrophic loss that wipes out months of gains.`,
      },
      {
        title: "How to Set a Good Stop Loss",
        body: `There is no one-size-fits-all rule, but here are proven methods:

**1. Percentage-Based:**
Set the SL at a fixed percentage below your entry. Common ranges:
- Intraday: 0.5% to 1.5%
- Swing: 2% to 5%
- Positional: 5% to 10%

**2. Support-Based (Technical):**
Place the SL just below a key support level (a price where the stock has historically bounced). This is more logical than an arbitrary percentage.

**3. ATR-Based (Average True Range):**
Use the stock's ATR (a measure of daily volatility) to set the SL. For example, SL = Entry - (2 x ATR). This adapts to how volatile the stock is.

**Key principles:**
- Never widen your stop-loss after entering a trade.
- Place the SL before you enter the trade, not after.
- The SL level should determine your position size, not the other way around.`,
      },
      {
        title: "Position Sizing: How Much to Risk Per Trade",
        body: `Position sizing ties directly to stop-loss management. The rule of thumb:

**Never risk more than 1-2% of your total capital on a single trade.**

**Example:**
- Total capital: Rs.1,00,000
- Maximum risk per trade (2%): Rs.2,000
- Entry: Rs.500, Stop-loss: Rs.480
- Risk per share: Rs.20
- Maximum position size: Rs.2,000 / Rs.20 = 100 shares
- Investment: 100 x Rs.500 = Rs.50,000

This means even if the trade hits your stop-loss, you only lose 2% of your capital. You would need 50 consecutive losses to go broke — which is virtually impossible if your strategy has any edge at all.`,
      },
    ],
    quiz: [
      {
        question: "What is the primary purpose of a stop-loss?",
        options: [
          "To guarantee profits on every trade",
          "To keep each individual loss small and manageable",
          "To prevent the stock price from falling",
          "To automatically buy more shares at a lower price",
        ],
        correctIndex: 1,
        explanation:
          "A stop-loss limits the maximum loss on a single trade, keeping it small so that winning trades can more than make up for it.",
      },
      {
        question:
          "You have Rs.2,00,000 capital and follow the 2% risk rule. What is the maximum you should risk on one trade?",
        options: ["Rs.2,000", "Rs.4,000", "Rs.10,000", "Rs.20,000"],
        correctIndex: 1,
        explanation:
          "2% of Rs.2,00,000 = Rs.4,000. This is the maximum amount you should be prepared to lose on any single trade.",
      },
      {
        question: "When should you widen (move further away) your stop-loss?",
        options: [
          "When the stock is falling and you hope it will recover",
          "When the trade is going in your favor and you want to lock profits (trailing stop)",
          "When a friend tells you the stock is going to bounce",
          "Never — always stick to your original stop-loss level",
        ],
        correctIndex: 3,
        explanation:
          "You should never widen a stop-loss to avoid taking a loss. You can trail it in your favor (tighten it), but never move it against your position.",
      },
    ],
  },
  {
    id: "mod-4",
    title: "Intraday vs Swing vs Positional: Which Style Fits Your Life?",
    slug: "trading-styles",
    description:
      "Understand the three main trading timeframes and find out which one matches your schedule, capital, and temperament.",
    estimatedMinutes: 12,
    difficulty: "Beginner",
    content: [
      {
        title: "The Three Main Trading Styles",
        body: `Not all trading is the same. The timeframe you choose dramatically affects your experience:

| Style | Holding Period | Monitoring | Stress Level |
|-------|---------------|------------|--------------|
| **Intraday** | Minutes to hours (same day) | Constant screen time | High |
| **Swing** | 2 to 14 days | Check 2-3 times/day | Medium |
| **Positional** | 15 to 90+ days | Check once a day or less | Low |

Each style has distinct advantages and disadvantages. There is no "best" style — only the one that fits your circumstances.`,
      },
      {
        title: "Intraday Trading",
        body: `**What it is:** You buy and sell within the same trading day. No positions are carried overnight.

**Pros:**
- No overnight risk (news or gaps cannot hurt you while you sleep)
- Leverage available (brokers allow higher margins for intraday)
- Quick results — you know the outcome the same day

**Cons:**
- Requires full-time attention during market hours (9:15 AM - 3:30 PM)
- Very stressful — rapid decisions with real money
- Transaction costs add up quickly (brokerage + taxes on every trade)
- Most beginners lose money in intraday trading

**Best for:** People who can dedicate full market hours, have fast internet, and can handle high stress. NOT recommended for beginners.`,
      },
      {
        title: "Swing Trading",
        body: `**What it is:** You hold positions for a few days to a couple of weeks, capturing medium-term price movements ("swings").

**Pros:**
- No need to watch the screen all day
- Lower transaction costs than intraday
- Can be done alongside a full-time job
- Enough time for technical patterns to play out

**Cons:**
- Overnight risk (gaps up or down when the market opens next day)
- Requires patience — results take days, not hours
- Need to manage multiple open positions

**Best for:** Working professionals who can check the market a few times per day. This is often the best starting point for beginners.`,
      },
      {
        title: "Positional Trading",
        body: `**What it is:** You hold positions for weeks to months, riding larger trends.

**Pros:**
- Very low time commitment (check once a day or even less)
- Catches the "big moves" that intraday and swing traders often miss
- Lower stress — daily fluctuations matter less
- Lowest transaction costs (fewest trades)

**Cons:**
- Capital is locked up for longer periods
- Requires higher conviction in your analysis
- Larger stop losses needed (bigger absolute risk per trade)
- Need patience — it can be boring!

**Best for:** People with larger capital who prefer a hands-off approach. Also good for beginners learning fundamental analysis.`,
      },
      {
        title: "How to Choose Your Style",
        body: `Ask yourself these questions:

1. **How much time can I dedicate?**
   - 6+ hours/day → Intraday is an option
   - 30 min to 1 hour/day → Swing is ideal
   - 10 min/day → Positional is best

2. **What is my capital?**
   - Less than Rs.1 lakh → Swing or Positional (intraday costs eat into small capital)
   - Rs.1-5 lakh → Any style works
   - Rs.5 lakh+ → Positional can be very effective

3. **What is my temperament?**
   - I like fast action and quick results → Intraday
   - I am patient but like regular activity → Swing
   - I prefer set-it-and-forget-it → Positional

4. **Am I a beginner?**
   - If yes, start with **Swing Trading**. It gives you enough time to learn without the pressure of intraday and without the long waits of positional.`,
      },
    ],
    quiz: [
      {
        question: "Which trading style requires the most active screen time?",
        options: [
          "Positional trading",
          "Swing trading",
          "Intraday trading",
          "All require the same time",
        ],
        correctIndex: 2,
        explanation:
          "Intraday trading requires constant monitoring during market hours since all positions must be closed the same day.",
      },
      {
        question: "A working professional with a 9-to-5 job should probably start with which style?",
        options: [
          "Intraday — the quick profits are tempting",
          "Swing — it can be managed with a few minutes per day",
          "Options scalping — fastest way to make money",
          "All styles work equally well for busy people",
        ],
        correctIndex: 1,
        explanation:
          "Swing trading requires only brief check-ins a few times per day, making it compatible with a regular job.",
      },
      {
        question: "What is a key advantage of positional trading?",
        options: [
          "No risk involved at all",
          "Capital is never locked up",
          "Very low daily time commitment",
          "Guaranteed returns within a week",
        ],
        correctIndex: 2,
        explanation:
          "Positional trading requires the least daily attention — you can check your positions once a day or even less frequently.",
      },
    ],
  },
  {
    id: "mod-5",
    title: "How to Read a Stock Chart (Basics)",
    slug: "reading-stock-charts",
    description:
      "A beginner-friendly introduction to candlestick charts, support/resistance, and the most common chart patterns.",
    estimatedMinutes: 20,
    difficulty: "Intermediate",
    content: [
      {
        title: "Why Charts Matter",
        body: `A stock chart is a visual representation of a stock's price movement over time. Even if you rely on tips from others, understanding basic charts helps you:

- **Verify tip entry points:** Is the suggested entry price at a logical level?
- **Understand stop-loss placement:** Is the stop-loss below a key support level?
- **Time your entries better:** Even a good tip can be entered at a bad time.
- **Evaluate creator quality:** Does the creator's analysis make sense on the chart?

You do not need to become a chartist to benefit from basic chart literacy.`,
      },
      {
        title: "Reading a Candlestick",
        body: `The most common chart type is the **candlestick chart**. Each candle shows four prices for a time period:

- **Open** — The price at the start of the period
- **Close** — The price at the end of the period
- **High** — The highest price during the period
- **Low** — The lowest price during the period

**Green candle (bullish):** Close is higher than Open. The price went up.
**Red candle (bearish):** Close is lower than Open. The price went down.

The thick part is called the **body** (between open and close).
The thin lines above and below are called **wicks** or **shadows** (showing the high and low).

A candle with a very long wick suggests rejection at that price level — the market tried to go there but was pushed back.`,
      },
      {
        title: "Support and Resistance",
        body: `**Support** is a price level where the stock tends to stop falling and bounce back up. Think of it as a "floor."

**Resistance** is a price level where the stock tends to stop rising and pull back. Think of it as a "ceiling."

**Why they work:** At support levels, buyers have historically stepped in. At resistance levels, sellers have historically taken profits. These create self-reinforcing patterns because traders remember these levels.

**Key insight for evaluating tips:**
- A BUY tip with entry near support is stronger than one at random levels
- A stop-loss placed just below support is logical
- A target near resistance is realistic

When support breaks, it often becomes new resistance (and vice versa). This is called a "role reversal."`,
      },
      {
        title: "Common Chart Patterns",
        body: `Here are three patterns every beginner should know:

**1. Double Bottom (Bullish)**
The stock drops to a level, bounces, drops to the same level again, and bounces again. The "W" shape suggests strong support and a potential move up.

**2. Double Top (Bearish)**
The opposite — stock rises to a level twice and fails both times. The "M" shape suggests strong resistance and a potential move down.

**3. Breakout**
When a stock moves above a resistance level (or below support) with strong volume, it is called a breakout. Many tips are based on breakout entries.

**Important:** No pattern works 100% of the time. Patterns increase the probability of a certain outcome, but they never guarantee it. This is why stop losses are always necessary.`,
      },
      {
        title: "Volume: The Confirmation Tool",
        body: `**Volume** is the number of shares traded during a period. It is the most important confirmation tool:

- **Price up + high volume** = Strong move, likely to continue
- **Price up + low volume** = Weak move, may reverse
- **Breakout + high volume** = Legitimate breakout
- **Breakout + low volume** = Possible false breakout (trap)

When evaluating a tip that claims a stock is "breaking out," always check if the breakout happened on above-average volume. If not, be cautious.`,
      },
    ],
    quiz: [
      {
        question: "A green candlestick indicates that:",
        options: [
          "The stock lost value during that period",
          "The closing price was higher than the opening price",
          "The stock hit a new all-time high",
          "Volume was above average",
        ],
        correctIndex: 1,
        explanation:
          "A green (bullish) candle means the close was higher than the open, indicating the price went up during that period.",
      },
      {
        question:
          'What does it mean when a stock "breaks out" on low volume?',
        options: [
          "It is a very strong bullish signal",
          "It could be a false breakout and should be treated with caution",
          "Volume does not matter for breakouts",
          "You should immediately buy at market price",
        ],
        correctIndex: 1,
        explanation:
          "A breakout on low volume lacks conviction. It may be a false breakout (trap) that reverses quickly. High volume confirms a genuine breakout.",
      },
      {
        question:
          "Where should a logical stop-loss be placed for a BUY trade?",
        options: [
          "At a random percentage below entry",
          "Just below a key support level",
          "At the all-time low of the stock",
          "Exactly at the entry price",
        ],
        correctIndex: 1,
        explanation:
          "Placing the stop-loss just below support is logical because if support breaks, the original trade thesis is invalidated.",
      },
    ],
  },
  {
    id: "mod-6",
    title: "Common Scams in the Finfluencer Space",
    slug: "finfluencer-scams",
    description:
      "Protect yourself by learning the most common scams and manipulation tactics used by dishonest finfluencers.",
    estimatedMinutes: 15,
    difficulty: "Beginner",
    content: [
      {
        title: "Why Scams Are So Common",
        body: `The Indian stock market has seen an explosion of finfluencers in recent years. While many are genuine, the space is rife with scams because:

1. **Low barrier to entry** — Anyone can create a Twitter or Telegram account and call themselves an "expert."
2. **Regulatory gaps** — SEBI regulations exist but enforcement is challenging given the sheer number of accounts.
3. **Financial desperation** — People looking for quick money are easy targets.
4. **Survivorship bias** — You only hear about the wins, never the losses.
5. **Herd mentality** — "Everyone in this group is making money, so it must be real."

Understanding these scams is your best defense against them.`,
      },
      {
        title: "The Pump and Dump",
        body: `**How it works:**
1. The scammer quietly buys a large quantity of a low-volume, small-cap stock.
2. They then aggressively promote it to their followers: "This stock is going to 5x! Buy now before it is too late!"
3. As followers rush to buy, the price skyrockets (the "pump").
4. The scammer sells their holdings at the inflated price (the "dump").
5. The stock crashes back down, and followers are left holding worthless shares.

**Red flags:**
- Unknown micro-cap stock being promoted with extreme urgency
- "Buy NOW before it is too late!" language
- No fundamental or technical reasoning provided
- The stock has very low trading volume (easy to manipulate)

**Protection:** Never buy a stock you have never heard of based solely on a social media recommendation. If the volume is unusually low, be extra suspicious.`,
      },
      {
        title: "Fake Screenshots and Doctored P&L",
        body: `**How it works:**
Scammers share screenshots of huge profits (e.g., "Made Rs.5 lakhs today!") to build credibility. These screenshots are:
- Completely fabricated using photo editing tools
- From paper trading accounts (not real money)
- Showing only the winning trades while hiding losses
- From demo accounts with no real money at stake

**Red flags:**
- Screenshots are always of wins, never losses
- Round, "too perfect" numbers
- No verification mechanism (no way to independently check)
- Blurry or cropped screenshots that hide key details

**Protection:** This is exactly why RateMyTip exists. We track tips at the time they are posted and verify them against real market data. Screenshots can be faked; our tracked data cannot.`,
      },
      {
        title: "The Free Telegram Group to Paid Group Pipeline",
        body: `**How it works:**
1. A "free" Telegram group is created with thousands of members.
2. Moderators share a few genuine-looking tips (or post tips after the move has already happened).
3. Members are impressed by the "accuracy."
4. The sales pitch: "Our free group has 70% accuracy. Our premium paid group has 95% accuracy! Join for only Rs.5,000/month."
5. The paid group delivers the same mediocre results.
6. Members who complain are removed and blocked.

**Red flags:**
- Extraordinary accuracy claims (nobody has 90%+ accuracy consistently)
- High-pressure sales tactics ("only 10 seats left!")
- No verifiable track record
- No SEBI RA registration number

**Protection:** Ask for a SEBI registration number. Check the track record on RateMyTip. If the accuracy claim seems too good to be true, it almost certainly is.`,
      },
      {
        title: "Front-Running",
        body: `**How it works:**
Front-running is when someone buys a stock and then recommends it to a large audience, profiting from the price increase caused by their followers' buying.

**Example:**
1. The influencer buys Stock X at Rs.100.
2. They recommend it to their 50,000 followers.
3. Followers buy, pushing the price to Rs.108.
4. The influencer sells at Rs.108, making 8%.
5. Without the buying pressure, the stock drifts back to Rs.101.
6. Followers are left with minimal gains or losses.

**This is illegal** under SEBI regulations but extremely difficult to prove.

**Red flags:**
- Tips always seem to move significantly right after being posted
- The entry price in the tip is always below the current market price (they bought earlier)
- Suspiciously perfect timing on every tip

**Protection:** Always check if the stock has already moved significantly from the recommended entry price. If CMP is much higher than the tip's entry, the move may have already happened.`,
      },
      {
        title: "How to Protect Yourself",
        body: `Follow these rules to stay safe:

1. **Check SEBI Registration** — If someone charges for tips, they MUST be a SEBI-Registered Research Analyst. Ask for their RA registration number and verify it on SEBI's website.

2. **Verify Track Records** — Use RateMyTip to check any tip creator's actual performance. Do not rely on their self-reported results.

3. **Never Act on Urgency** — Legitimate tips do not expire in 5 minutes. If you are being pressured to buy immediately, something is wrong.

4. **Diversify Your Sources** — Do not rely on a single tip creator. Spread your information sources and cross-reference recommendations.

5. **Start Small** — Even with the best tip creator, start with small amounts until you have personal experience with their quality.

6. **If It Sounds Too Good to Be True, It Is** — Nobody has a "secret formula" for guaranteed profits. The stock market involves risk, always.

7. **Report Suspicious Activity** — File a complaint with SEBI (scores.gov.in) or the Cyber Crime portal (cybercrime.gov.in) if you encounter fraud.`,
      },
    ],
    quiz: [
      {
        question: "What is a pump-and-dump scheme?",
        options: [
          "A legitimate stock recommendation strategy",
          "Buying a stock, promoting it to inflate the price, then selling at the top",
          "A SEBI-approved trading method",
          "A type of mutual fund investment",
        ],
        correctIndex: 1,
        explanation:
          "Pump-and-dump is a fraud where scammers buy a stock, artificially inflate its price through promotion, and sell at the top, leaving followers with losses.",
      },
      {
        question:
          "Someone in a Telegram group claims 95% accuracy. What should you do?",
        options: [
          "Immediately join their paid group",
          "Ask for their SEBI RA number and verify their track record independently",
          "Send them money — 95% accuracy is incredible",
          "Share the group with friends so they can also benefit",
        ],
        correctIndex: 1,
        explanation:
          "Extraordinary claims require extraordinary evidence. Always verify with SEBI registration and independent track record verification (like RateMyTip).",
      },
      {
        question: "What is front-running?",
        options: [
          "Being the first person to buy a new IPO",
          "Running a marathon before market opens",
          "Buying a stock before recommending it to followers, then selling into the buying pressure",
          "A legitimate strategy taught in MBA courses",
        ],
        correctIndex: 2,
        explanation:
          "Front-running is an illegal practice where someone trades ahead of their own recommendation, profiting from the price impact of followers' orders.",
      },
    ],
  },
] as const;

export function getModuleBySlug(slug: string): LearningModule | undefined {
  return LEARNING_MODULES.find((m) => m.slug === slug);
}
