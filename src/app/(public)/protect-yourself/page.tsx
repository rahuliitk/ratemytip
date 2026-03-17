import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title:
    "Protect Yourself from Stock Market Scams | RateMyTip",
  description:
    "A comprehensive guide to protecting yourself from stock market scams, fake finfluencers, pump-and-dump schemes, and financial fraud in India. Learn how to file SEBI complaints.",
  openGraph: {
    title: "Protect Yourself from Stock Market Scams | RateMyTip",
    description:
      "Learn how to spot fake trading screenshots, front-running, pump-and-dump schemes, and more. A free guide from RateMyTip.",
  },
};

export default function ProtectYourselfPage(): React.ReactElement {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50">
          <ShieldAlert className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-text">
            Protect Yourself
          </h1>
          <p className="mt-1.5 text-sm text-muted leading-relaxed">
            A comprehensive guide to spotting scams, avoiding fraud, and
            safeguarding your money in the Indian stock market.
          </p>
        </div>
      </div>

      {/* Table of Contents */}
      <nav className="mt-8 rounded-xl border border-border/60 bg-surface p-5">
        <h2 className="text-sm font-semibold text-text uppercase tracking-wide">
          In This Guide
        </h2>
        <ol className="mt-3 space-y-1.5 text-sm">
          <li>
            <a href="#common-scams" className="text-accent hover:underline">
              1. 10 Most Common Stock Market Scams in India
            </a>
          </li>
          <li>
            <a href="#fake-screenshots" className="text-accent hover:underline">
              2. How to Spot a Fake Trading Screenshot
            </a>
          </li>
          <li>
            <a href="#telegram-groups" className="text-accent hover:underline">
              3. Why Free Telegram Groups Are Not Really Free
            </a>
          </li>
          <li>
            <a href="#front-running" className="text-accent hover:underline">
              4. What Is Front-Running and How It Hurts You
            </a>
          </li>
          <li>
            <a href="#red-flags" className="text-accent hover:underline">
              5. Red Flags: When a Finfluencer is Probably Lying
            </a>
          </li>
          <li>
            <a href="#sebi-complaint" className="text-accent hover:underline">
              6. How to File a SEBI Complaint
            </a>
          </li>
          <li>
            <a href="#cyber-crime" className="text-accent hover:underline">
              7. Cyber Crime Reporting Guide for Financial Fraud
            </a>
          </li>
        </ol>
      </nav>

      {/* Section 1 */}
      <section id="common-scams" className="mt-12">
        <h2 className="text-2xl font-bold text-text">
          1. 10 Most Common Stock Market Scams in India
        </h2>
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-text/80">
          <p>
            The Indian stock market has seen explosive retail participation
            since 2020, and with it, a corresponding surge in fraud. Here are
            the ten most common scams you should know about:
          </p>

          <div className="space-y-6">
            <div className="rounded-lg border border-border/60 p-4">
              <h3 className="font-semibold text-text">
                1. Pump and Dump
              </h3>
              <p className="mt-1">
                Scammers accumulate shares of a low-volume penny stock, then
                aggressively promote it on social media and Telegram groups.
                When followers buy and drive the price up, the scammers sell
                their holdings. The stock then crashes, leaving followers with
                heavy losses.
              </p>
            </div>

            <div className="rounded-lg border border-border/60 p-4">
              <h3 className="font-semibold text-text">
                2. Fake P&L Screenshots
              </h3>
              <p className="mt-1">
                Influencers share fabricated or doctored profit-and-loss
                screenshots to project an image of consistent profitability.
                These may come from demo accounts, paper trading, or simple
                photo editing.
              </p>
            </div>

            <div className="rounded-lg border border-border/60 p-4">
              <h3 className="font-semibold text-text">
                3. Guaranteed Returns Schemes
              </h3>
              <p className="mt-1">
                Any promise of &quot;guaranteed returns&quot; in the stock market is a
                scam by definition. SEBI explicitly prohibits guaranteed
                return claims. The stock market inherently involves risk, and
                no legitimate advisor can eliminate it.
              </p>
            </div>

            <div className="rounded-lg border border-border/60 p-4">
              <h3 className="font-semibold text-text">
                4. Free-to-Paid Group Pipeline
              </h3>
              <p className="mt-1">
                Free Telegram or WhatsApp groups lure members with a few
                impressive-looking tips, then funnel them into expensive paid
                groups that deliver mediocre or even random results.
              </p>
            </div>

            <div className="rounded-lg border border-border/60 p-4">
              <h3 className="font-semibold text-text">
                5. Front-Running
              </h3>
              <p className="mt-1">
                An influencer buys a stock before recommending it to their
                large audience, profits from the resulting price spike when
                followers buy, and then exits. This is illegal under SEBI
                regulations.
              </p>
            </div>

            <div className="rounded-lg border border-border/60 p-4">
              <h3 className="font-semibold text-text">
                6. Fake SEBI Registration
              </h3>
              <p className="mt-1">
                Some tip providers claim to be SEBI-registered Research
                Analysts but are not. Always verify registration numbers on
                the official SEBI website at{" "}
                <a
                  href="https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doRecognisedFpi=yes&intmId=13"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline inline-flex items-center gap-0.5"
                >
                  sebi.gov.in
                  <ExternalLink className="h-3 w-3" />
                </a>
                .
              </p>
            </div>

            <div className="rounded-lg border border-border/60 p-4">
              <h3 className="font-semibold text-text">
                7. Insider Trading Tips
              </h3>
              <p className="mt-1">
                Messages like &quot;I have insider information about XYZ company
                results&quot; are almost always false. Even if true, acting on
                insider information is a criminal offence under SEBI rules
                with imprisonment up to 10 years.
              </p>
            </div>

            <div className="rounded-lg border border-border/60 p-4">
              <h3 className="font-semibold text-text">
                8. SMS/WhatsApp Stock Tips
              </h3>
              <p className="mt-1">
                Unsolicited stock tip messages sent via SMS or WhatsApp are
                almost always pump-and-dump operations. Legitimate research
                analysts do not cold-message random phone numbers.
              </p>
            </div>

            <div className="rounded-lg border border-border/60 p-4">
              <h3 className="font-semibold text-text">
                9. Fake Trading Courses
              </h3>
              <p className="mt-1">
                Overpriced &quot;trading courses&quot; (Rs.50,000 to Rs.5,00,000) that
                promise to make you a &quot;professional trader&quot; but contain
                generic information freely available on YouTube and
                Investopedia. The real product being sold is the dream, not
                the education.
              </p>
            </div>

            <div className="rounded-lg border border-border/60 p-4">
              <h3 className="font-semibold text-text">
                10. Copy Trading Scams
              </h3>
              <p className="mt-1">
                Services that promise to &quot;copy&quot; a successful trader&apos;s
                positions automatically, but use manipulated performance data
                to attract subscribers. The &quot;master trader&quot; may be trading a
                demo account or selectively showing results.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 */}
      <section id="fake-screenshots" className="mt-12">
        <h2 className="text-2xl font-bold text-text">
          2. How to Spot a Fake Trading Screenshot
        </h2>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-text/80">
          <p>
            Fake P&L screenshots are one of the most common tools used by
            dishonest finfluencers to build credibility. Here is how to spot
            them:
          </p>

          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Check for consistency:</strong> The font, spacing, and
              colors should match the broker&apos;s actual app interface. Compare
              with real screenshots from the same platform.
            </li>
            <li>
              <strong>Look for round numbers:</strong> Profits that are
              suspiciously round (exactly Rs.50,000, Rs.1,00,000) are a red
              flag. Real trading results are almost never round numbers.
            </li>
            <li>
              <strong>Inspect the edges:</strong> Zooming into the image may
              reveal editing artifacts, misaligned text, or inconsistent
              pixel quality around the profit numbers.
            </li>
            <li>
              <strong>Check timestamps:</strong> Do the trade timestamps
              correspond to actual market hours? Are the dates on trading
              days (not weekends or holidays)?
            </li>
            <li>
              <strong>Cross-reference with market data:</strong> Did the
              stock actually move enough on that day to produce the claimed
              profit? You can check historical prices easily.
            </li>
            <li>
              <strong>Ask for the full statement:</strong> A genuine trader
              should be willing to show a full weekly or monthly statement,
              not just cherry-picked individual trades.
            </li>
            <li>
              <strong>Paper trading vs. real money:</strong> Many platforms
              have paper/virtual trading modes. These look identical to real
              trading but involve no actual money. Look for indicators like
              &quot;Virtual&quot; or &quot;Paper&quot; labels.
            </li>
          </ul>

          <p className="mt-4 rounded-lg bg-accent/5 px-4 py-3 text-accent font-medium">
            RateMyTip eliminates this problem entirely. We track tips at the
            moment they are posted and verify outcomes against real market
            data. No screenshots needed.
          </p>
        </div>
      </section>

      {/* Section 3 */}
      <section id="telegram-groups" className="mt-12">
        <h2 className="text-2xl font-bold text-text">
          3. Why Free Telegram Groups Are Not Really Free
        </h2>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-text/80">
          <p>
            &quot;Join our free stock tips group!&quot; sounds harmless, but here is
            what is actually happening behind the scenes:
          </p>

          <h3 className="mt-4 font-semibold text-text">The Business Model</h3>
          <p>
            Free groups exist for one purpose: to convert you into a paying
            customer. The typical pipeline works like this:
          </p>
          <ol className="list-decimal space-y-2 pl-6 mt-2">
            <li>
              A free group is created and promoted heavily (ads, YouTube
              videos, Instagram reels).
            </li>
            <li>
              The group shares a curated selection of tips. The good ones
              are highlighted; the bad ones are quietly deleted or ignored.
            </li>
            <li>
              After a few impressive-looking wins, the moderator announces
              the &quot;premium&quot; group with much better accuracy.
            </li>
            <li>
              Members who pay Rs.3,000 to Rs.30,000 per month join the
              premium group.
            </li>
            <li>
              The premium group delivers the same average results. If you
              complain, you are removed.
            </li>
          </ol>

          <h3 className="mt-4 font-semibold text-text">
            The Hidden Costs of &quot;Free&quot; Groups
          </h3>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Your money:</strong> Tips that are quietly deleted
              after failing can cause real losses if you followed them.
            </li>
            <li>
              <strong>Your data:</strong> Your phone number and investment
              behavior are valuable. Some groups sell member data.
            </li>
            <li>
              <strong>Your attention:</strong> Constant notifications create
              FOMO (fear of missing out) and push you to trade more than you
              should.
            </li>
            <li>
              <strong>Your objectivity:</strong> Herd mentality in groups
              overrides rational decision-making.
            </li>
          </ul>

          <h3 className="mt-4 font-semibold text-text">What to Do Instead</h3>
          <p>
            Instead of relying on anonymous group tips, use verified track
            records. On RateMyTip, every tip is recorded at the time it is
            posted and tracked against real market data. No one can delete a
            bad tip after the fact.
          </p>
        </div>
      </section>

      {/* Section 4 */}
      <section id="front-running" className="mt-12">
        <h2 className="text-2xl font-bold text-text">
          4. What Is Front-Running and How It Hurts You
        </h2>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-text/80">
          <p>
            Front-running is one of the most insidious forms of market
            manipulation, and it is rampant in the finfluencer space.
          </p>

          <h3 className="mt-4 font-semibold text-text">How It Works</h3>
          <ol className="list-decimal space-y-2 pl-6 mt-2">
            <li>
              An influencer with 50,000+ followers identifies a stock they
              want to trade.
            </li>
            <li>
              They quietly buy shares at, say, Rs.100.
            </li>
            <li>
              They post a tip: &quot;BUY Stock X at Rs.100-105, Target Rs.120.&quot;
            </li>
            <li>
              Thousands of followers rush to buy. The buying pressure pushes
              the stock to Rs.108-110.
            </li>
            <li>
              The influencer sells at Rs.108-110, pocketing an 8-10% gain.
            </li>
            <li>
              Without the buying pressure, the stock drifts back to
              Rs.101-103 or even lower.
            </li>
            <li>
              Followers are left with minimal gains or losses.
            </li>
          </ol>

          <h3 className="mt-4 font-semibold text-text">Why It Is Illegal</h3>
          <p>
            Front-running violates SEBI&apos;s Prohibition of Fraudulent and
            Unfair Trade Practices (PFUTP) regulations. It is a form of
            market manipulation where the influencer profits at the expense
            of their followers. Penalties include fines up to Rs.25 crore
            and imprisonment.
          </p>

          <h3 className="mt-4 font-semibold text-text">How to Spot It</h3>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              The stock has already moved significantly by the time the tip
              reaches you.
            </li>
            <li>
              There is a sudden volume spike just before the tip is posted.
            </li>
            <li>
              The influencer&apos;s tips consistently show an immediate price
              jump followed by a reversal.
            </li>
            <li>
              The suggested entry price is always conveniently lower than
              the current market price at the time of posting.
            </li>
          </ul>

          <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-amber-800 font-medium">
            RateMyTip records the exact timestamp of every tip along with
            the stock price at that moment. This makes front-running
            patterns detectable over time.
          </p>
        </div>
      </section>

      {/* Section 5 */}
      <section id="red-flags" className="mt-12">
        <h2 className="text-2xl font-bold text-text">
          5. Red Flags: When a Finfluencer is Probably Lying
        </h2>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-text/80">
          <p>
            Watch out for these warning signs when evaluating a tip creator:
          </p>

          <ul className="space-y-3 mt-4">
            <li className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-200 text-[10px] font-bold text-red-700">
                !
              </span>
              <div>
                <p className="font-medium text-red-800">
                  &quot;I have never had a losing trade&quot;
                </p>
                <p className="mt-0.5 text-red-700/80">
                  Every trader has losing trades. Anyone who claims
                  otherwise is lying.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-200 text-[10px] font-bold text-red-700">
                !
              </span>
              <div>
                <p className="font-medium text-red-800">
                  &quot;90%+ accuracy guaranteed&quot;
                </p>
                <p className="mt-0.5 text-red-700/80">
                  Even the best professional fund managers rarely sustain
                  70%+ accuracy. Claims of 90%+ should be treated as false
                  until proven otherwise.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-200 text-[10px] font-bold text-red-700">
                !
              </span>
              <div>
                <p className="font-medium text-red-800">
                  Deletes tips that did not work out
                </p>
                <p className="mt-0.5 text-red-700/80">
                  If an influencer regularly deletes tweets or messages
                  about tips that failed, they are hiding their track
                  record.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-200 text-[10px] font-bold text-red-700">
                !
              </span>
              <div>
                <p className="font-medium text-red-800">
                  Only shows winning trades
                </p>
                <p className="mt-0.5 text-red-700/80">
                  Survivorship bias in action. A legitimate creator
                  acknowledges their losing trades too.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-200 text-[10px] font-bold text-red-700">
                !
              </span>
              <div>
                <p className="font-medium text-red-800">
                  Uses high-pressure language
                </p>
                <p className="mt-0.5 text-red-700/80">
                  &quot;Buy NOW or miss out forever!&quot;, &quot;Only 5 seats left in
                  premium!&quot;, &quot;This stock will 10x in 1 month!&quot; — all
                  classic manipulation tactics.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-200 text-[10px] font-bold text-red-700">
                !
              </span>
              <div>
                <p className="font-medium text-red-800">
                  No SEBI registration despite charging money
                </p>
                <p className="mt-0.5 text-red-700/80">
                  Anyone who charges for stock tips in India is legally
                  required to be a SEBI-Registered Research Analyst. No
                  exceptions.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-200 text-[10px] font-bold text-red-700">
                !
              </span>
              <div>
                <p className="font-medium text-red-800">
                  Tips only penny stocks and unknown micro-caps
                </p>
                <p className="mt-0.5 text-red-700/80">
                  Low-volume stocks are easy to manipulate. If all their
                  tips are in obscure companies you have never heard of, be
                  very suspicious.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* Section 6 */}
      <section id="sebi-complaint" className="mt-12">
        <h2 className="text-2xl font-bold text-text">
          6. How to File a SEBI Complaint
        </h2>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-text/80">
          <p>
            If you have been a victim of a stock market scam or have
            evidence of fraudulent activity by a finfluencer, you can file a
            complaint with SEBI (Securities and Exchange Board of India).
          </p>

          <h3 className="mt-4 font-semibold text-text">
            Step-by-Step Process
          </h3>
          <ol className="list-decimal space-y-3 pl-6 mt-2">
            <li>
              <strong>Visit SCORES:</strong> Go to the SEBI Complaints
              Redress System (SCORES) at{" "}
              <a
                href="https://scores.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline inline-flex items-center gap-0.5"
              >
                scores.gov.in
                <ExternalLink className="h-3 w-3" />
              </a>
              .
            </li>
            <li>
              <strong>Register an account:</strong> Create a new account
              using your PAN card, Aadhaar, and email address.
            </li>
            <li>
              <strong>Select complaint type:</strong> Choose the appropriate
              category. For finfluencer fraud, select &quot;Intermediaries&quot; and
              then &quot;Investment Advisers / Research Analysts.&quot;
            </li>
            <li>
              <strong>Provide details:</strong> Include the name of the
              entity/person, their social media handles, the nature of the
              fraud, and the financial loss incurred.
            </li>
            <li>
              <strong>Attach evidence:</strong> Upload screenshots of tips,
              payment receipts, chat conversations, and any other relevant
              evidence.
            </li>
            <li>
              <strong>Submit and track:</strong> After submission, you will
              receive a complaint number. SEBI is required to respond within
              30 days.
            </li>
          </ol>

          <h3 className="mt-4 font-semibold text-text">
            What SEBI Can Do
          </h3>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              Issue warnings or penalties to the offending party
            </li>
            <li>
              Bar them from operating in the securities market
            </li>
            <li>
              Impose monetary penalties up to Rs.25 crore
            </li>
            <li>
              Refer cases for criminal prosecution where applicable
            </li>
          </ul>

          <p className="mt-4 rounded-lg bg-blue-50 px-4 py-3 text-blue-800">
            <strong>Tip:</strong> Keep detailed records from the beginning.
            Screenshots with timestamps, payment receipts, and
            correspondence are crucial for a successful complaint.
          </p>
        </div>
      </section>

      {/* Section 7 */}
      <section id="cyber-crime" className="mt-12">
        <h2 className="text-2xl font-bold text-text">
          7. Cyber Crime Reporting Guide for Financial Fraud
        </h2>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-text/80">
          <p>
            For cases involving online financial fraud (phishing, identity
            theft, unauthorized transactions), you should report to the
            National Cyber Crime Reporting Portal in addition to SEBI.
          </p>

          <h3 className="mt-4 font-semibold text-text">
            Online Reporting
          </h3>
          <ol className="list-decimal space-y-3 pl-6 mt-2">
            <li>
              <strong>Visit the portal:</strong> Go to{" "}
              <a
                href="https://cybercrime.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline inline-flex items-center gap-0.5"
              >
                cybercrime.gov.in
                <ExternalLink className="h-3 w-3" />
              </a>
              .
            </li>
            <li>
              <strong>Select &quot;Report Financial Fraud&quot;</strong> for
              investment-related scams, or &quot;Report Other Cyber Crime&quot; for
              broader fraud.
            </li>
            <li>
              <strong>Provide your details:</strong> Name, phone number,
              email, and incident details.
            </li>
            <li>
              <strong>Upload evidence:</strong> Screenshots, transaction
              details, and any communication with the fraudster.
            </li>
            <li>
              <strong>Note your complaint number</strong> for future
              reference and tracking.
            </li>
          </ol>

          <h3 className="mt-4 font-semibold text-text">
            Helpline Numbers
          </h3>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>National Cyber Crime Helpline:</strong> 1930 (toll-free, 24x7)
            </li>
            <li>
              <strong>SEBI Helpline:</strong> 1800 266 7575 (toll-free)
            </li>
            <li>
              <strong>Police:</strong> File an FIR at your local police
              station if the fraud amount is significant.
            </li>
          </ul>

          <h3 className="mt-4 font-semibold text-text">
            Important Tips
          </h3>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              Report financial fraud within 24 hours of discovery for the
              best chance of recovery.
            </li>
            <li>
              Never delete any communication with the fraudster — it is
              evidence.
            </li>
            <li>
              Immediately inform your bank to freeze or monitor the
              affected accounts.
            </li>
            <li>
              File complaints with both SEBI (SCORES) and the Cyber Crime
              portal for comprehensive coverage.
            </li>
          </ul>
        </div>
      </section>

      {/* Bottom CTA */}
      <div className="mt-16 rounded-xl border border-border/60 bg-surface p-6 text-center">
        <h2 className="text-lg font-bold text-text">
          Verify Before You Trust
        </h2>
        <p className="mt-2 text-sm text-muted">
          Use RateMyTip to check any tip creator&apos;s verified track record
          before following their advice.
        </p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <Link
            href="/leaderboard"
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:shadow-md hover:bg-accent/90"
          >
            View Leaderboard
          </Link>
          <Link
            href="/learn"
            className="rounded-lg border border-border/60 px-5 py-2.5 text-sm font-medium text-muted transition-all duration-150 hover:bg-bg-alt hover:text-text"
          >
            Continue Learning
          </Link>
        </div>
      </div>
    </div>
  );
}
