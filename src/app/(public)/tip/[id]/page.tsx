import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { TipStatusBadge } from "@/components/tip/tip-status-badge";
import { TipPriceChart } from "@/components/tip/tip-price-chart";
import { ScoreBadge } from "@/components/shared/score-badge";
import { ShareButton } from "@/components/shared/share-button";
import { StarRating } from "@/components/tip/star-rating";
import { BookmarkButton } from "@/components/tip/bookmark-button";
import { CommentSection } from "@/components/tip/comment-section";
import { TipExplanation } from "@/components/tip/tip-explanation";
import { GlossaryTooltip } from "@/components/beginner/glossary-tooltip";
import { PositionCalculator } from "@/components/beginner/position-calculator";
import { RiskBadge } from "@/components/beginner/risk-badge";
import { ExecutionGuide } from "@/components/beginner/execution-guide";
import { BrokerageCostCard } from "@/components/beginner/brokerage-cost-card";
import { PostMortemCard } from "@/components/post-mortem/post-mortem-card";
import { EntryTimingCard } from "@/components/beginner/entry-timing-card";
import { SimilarTipsPanel } from "@/components/beginner/similar-tips-panel";
import { TipFeedback } from "@/components/feedback/tip-feedback";
import { assessTipRisk } from "@/lib/risk/risk-scorer";
import { buildContextualExplanations } from "@/lib/glossary/context-builder";
import { formatPrice, formatPercent } from "@/lib/utils/format";
import { subDays } from "date-fns";

export const revalidate = 600; // 10 minutes

interface TipPageProps {
  params: Promise<{ id: string }>;
}

async function getTip(id: string) {
  try {
    const tip = await db.tip.findUnique({
      where: { id },
      include: {
        creator: { include: { currentScore: true } },
        stock: true,
        amendments: { orderBy: { amendedAt: "desc" } },
        explanation: true,
      },
    });

    if (!tip || tip.status === "REJECTED") return null;

    // Fetch price history for the stock (last 90 days)
    const ninetyDaysAgo = subDays(new Date(), 90);
    const priceHistory = await db.stockPrice.findMany({
      where: {
        stockId: tip.stockId,
        date: { gte: ninetyDaysAgo },
      },
      orderBy: { date: "desc" },
    });

    const priceData = priceHistory.map((p) => ({
      id: p.id,
      stockId: p.stockId,
      date: p.date.toISOString(),
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
      volume: p.volume !== null ? Number(p.volume) : null,
      source: p.source,
    }));

    return { ...tip, priceData };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: TipPageProps): Promise<Metadata> {
  const { id } = await params;
  const tip = await getTip(id);

  if (!tip) {
    return { title: "Tip Not Found" };
  }

  return {
    title: `${tip.direction} ${tip.stock.symbol} — ${tip.creator.displayName}`,
    description: `${tip.direction} tip for ${tip.stock.name} by ${tip.creator.displayName}. Entry: ${formatPrice(tip.entryPrice)}, Target: ${formatPrice(tip.target1)}, SL: ${formatPrice(tip.stopLoss)}. Status: ${tip.status}.`,
    openGraph: {
      title: `${tip.direction} ${tip.stock.symbol} | ${tip.creator.displayName} | RateMyTip`,
      description: `Entry: ${formatPrice(tip.entryPrice)} | Target: ${formatPrice(tip.target1)} | SL: ${formatPrice(tip.stopLoss)}`,
    },
  };
}

export default async function TipPage({
  params,
}: TipPageProps): Promise<React.ReactElement> {
  const { id } = await params;
  const tip = await getTip(id);

  if (!tip) notFound();

  const isBuy = tip.direction === "BUY";

  // Calculate risk assessment for this tip
  const riskAssessment = assessTipRisk({
    entryPrice: tip.entryPrice,
    stopLoss: tip.stopLoss,
    direction: tip.direction,
    timeframe: tip.timeframe,
    marketCap: tip.stock.marketCap ?? undefined,
  });

  // Build contextual explanations for beginners
  const contextExplanations = buildContextualExplanations({
    entryPrice: tip.entryPrice,
    target1: tip.target1,
    target2: tip.target2,
    target3: tip.target3,
    stopLoss: tip.stopLoss,
    direction: tip.direction,
  });

  // Check if current user saved this tip
  const session = await auth();
  let isSaved = false;
  if (session?.user?.userId) {
    const saved = await db.savedTip.findUnique({
      where: { tipId_userId: { tipId: tip.id, userId: session.user.userId } },
    });
    isSaved = !!saved;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top bar: rating + actions */}
      <div className="mb-4 flex items-center justify-between">
        <StarRating tipId={tip.id} avgRating={tip.avgRating} ratingCount={tip.ratingCount} />
        <div className="flex items-center gap-1">
          <BookmarkButton tipId={tip.id} initialSaved={isSaved} />
          <ShareButton title={`${tip.direction} ${tip.stock.symbol} by ${tip.creator.displayName} | RateMyTip`} />
        </div>
      </div>

      {/* Main tip detail card */}
      <div className="rounded-xl border border-border/60 bg-surface p-6 shadow-sm">
        {/* Tip header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href={`/stock/${tip.stock.symbol}`}
                className="text-2xl font-bold text-text hover:text-accent"
              >
                {tip.stock.symbol}
              </Link>
              <span
                className={`rounded-md px-2.5 py-1 text-[10px] font-bold text-white ${
                  isBuy ? "bg-emerald-500" : "bg-red-500"
                }`}
              >
                {tip.direction}
              </span>
              <TipStatusBadge status={tip.status} />
              <RiskBadge riskLevel={riskAssessment.riskLevel} riskScore={riskAssessment.riskScore} size="lg" />
            </div>
            <p className="mt-1 text-sm text-muted">{tip.stock.name}</p>
          </div>

          {tip.returnPct !== null && (
            <div className={`rounded-lg px-4 py-2 text-right ${
              tip.returnPct >= 0 ? "bg-success/10" : "bg-danger/10"
            }`}>
              <p className="text-xs text-muted">Return</p>
              <p
                className={`text-2xl font-bold tabular-nums ${
                  tip.returnPct >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {formatPercent(tip.returnPct)}
              </p>
            </div>
          )}
        </div>

        {/* Price details grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-bg-alt/50 p-3">
            <p className="text-xs text-muted"><GlossaryTooltip termId="entry-price">Entry Price</GlossaryTooltip></p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-text">
              {formatPrice(tip.entryPrice)}
            </p>
          </div>
          <div className="rounded-lg bg-bg-alt/50 p-3">
            <p className="text-xs text-muted"><GlossaryTooltip termId="target-price">Target 1</GlossaryTooltip></p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-emerald-600">
              {formatPrice(tip.target1)}
            </p>
          </div>
          {tip.target2 !== null && (
            <div className="rounded-lg bg-bg-alt/50 p-3">
              <p className="text-xs text-muted"><GlossaryTooltip termId="target-price">Target 2</GlossaryTooltip></p>
              <p className="mt-1 text-sm font-semibold tabular-nums text-emerald-600">
                {formatPrice(tip.target2)}
              </p>
            </div>
          )}
          {tip.target3 !== null && (
            <div className="rounded-lg bg-bg-alt/50 p-3">
              <p className="text-xs text-muted"><GlossaryTooltip termId="target-price">Target 3</GlossaryTooltip></p>
              <p className="mt-1 text-sm font-semibold tabular-nums text-emerald-600">
                {formatPrice(tip.target3)}
              </p>
            </div>
          )}
          <div className="rounded-lg bg-bg-alt/50 p-3">
            <p className="text-xs text-muted"><GlossaryTooltip termId="stop-loss">Stop Loss</GlossaryTooltip></p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-red-600">
              {formatPrice(tip.stopLoss)}
            </p>
          </div>
        </div>

        {/* Price chart with entry/target/SL lines */}
        {tip.priceData.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-medium text-muted">Price Chart</p>
            <div className="mt-2">
              <TipPriceChart
                priceHistory={tip.priceData}
                entryPrice={tip.entryPrice}
                target1={tip.target1}
                target2={tip.target2}
                target3={tip.target3}
                stopLoss={tip.stopLoss}
                symbol={tip.stock.symbol}
              />
            </div>
          </div>
        )}

        {/* Details grid */}
        <div className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted"><GlossaryTooltip termId={tip.timeframe.toLowerCase() === "intraday" ? "intraday" : tip.timeframe.toLowerCase() === "swing" ? "swing-trade" : "positional"}>Timeframe</GlossaryTooltip></p>
            <p className="mt-0.5 font-medium text-text">{tip.timeframe}</p>
          </div>
          <div>
            <p className="text-xs text-muted"><GlossaryTooltip termId="conviction">Conviction</GlossaryTooltip></p>
            <p className="mt-0.5 font-medium text-text">{tip.conviction}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Asset Class</p>
            <p className="mt-0.5 font-medium text-text">{tip.assetClass}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Tip Date</p>
            <p className="mt-0.5 font-medium text-text">
              {new Date(tip.tipTimestamp).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Expires</p>
            <p className="mt-0.5 font-medium text-text">
              {new Date(tip.expiresAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          {tip.priceAtTip !== null && (
            <div>
              <p className="text-xs text-muted">CMP at Tip</p>
              <p className="mt-0.5 font-medium tabular-nums text-text">
                {formatPrice(tip.priceAtTip)}
              </p>
            </div>
          )}
          {tip.closedPrice !== null && (
            <div>
              <p className="text-xs text-muted">Closed Price</p>
              <p className="mt-0.5 font-medium tabular-nums text-text">
                {formatPrice(tip.closedPrice)}
              </p>
            </div>
          )}
          {tip.riskRewardRatio !== null && (
            <div>
              <p className="text-xs text-muted">Risk/Reward</p>
              <p className="mt-0.5 font-medium tabular-nums text-text">
                {tip.riskRewardRatio.toFixed(2)}
              </p>
            </div>
          )}
        </div>

        {/* Rationale */}
        {tip.rationale && (
          <div className="mt-6">
            <p className="text-xs font-medium text-muted">Rationale</p>
            <p className="mt-1 text-sm leading-relaxed text-text">{tip.rationale}</p>
          </div>
        )}

        {/* Source removed — MoneyControl CDN blocks direct links */}

        {/* Beginner Tools Section */}
        <div className="mt-6 space-y-4 border-t border-border/40 pt-6">
          {/* Contextual Explanations for Beginners */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4">
            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3">
              What does this mean?
            </h3>
            <div className="space-y-2">
              {contextExplanations.map((exp) => (
                <div key={exp.term} className="text-xs text-blue-700 dark:text-blue-400">
                  <span className="font-medium">{exp.term}:</span> {exp.explanation}
                </div>
              ))}
            </div>
          </div>

          {/* Position Size Calculator */}
          <PositionCalculator
            entryPrice={tip.entryPrice}
            target1={tip.target1}
            target2={tip.target2 ?? undefined}
            stopLoss={tip.stopLoss}
            direction={tip.direction}
            stockSymbol={tip.stock.symbol}
          />

          {/* Brokerage Cost Calculator */}
          <BrokerageCostCard
            entryPrice={tip.entryPrice}
            target1={tip.target1}
            stockSymbol={tip.stock.symbol}
          />

          {/* Execution Guide */}
          {tip.status === "ACTIVE" && (
            <ExecutionGuide
              entryPrice={tip.entryPrice}
              target1={tip.target1}
              stopLoss={tip.stopLoss}
              stockSymbol={tip.stock.symbol}
              direction={tip.direction}
            />
          )}

          {/* Risk Assessment Details */}
          {riskAssessment.factors.length > 0 && (
            <div className="rounded-lg border border-border/40 p-4">
              <h3 className="text-sm font-semibold text-text mb-3">
                Risk Assessment Breakdown
              </h3>
              <div className="space-y-2">
                {riskAssessment.factors.map((factor) => (
                  <div key={factor.name} className="flex items-center justify-between text-xs">
                    <span className="text-muted">{factor.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 rounded-full bg-bg-alt overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            factor.score <= 25 ? "bg-emerald-500" :
                            factor.score <= 50 ? "bg-yellow-500" :
                            factor.score <= 75 ? "bg-orange-500" : "bg-red-500"
                          }`}
                          style={{ width: `${factor.score}%` }}
                        />
                      </div>
                      <span className="text-muted tabular-nums w-8 text-right">{factor.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content hash */}
        <div className="mt-6 border-t border-border/40 pt-4">
          <p className="text-xs text-muted-light">
            Integrity hash: <code className="text-xs text-muted-light">{tip.contentHash}</code>
          </p>
        </div>
      </div>

      {/* Post-Mortem Analysis (only for resolved tips) */}
      <div className="mt-6">
        <PostMortemCard
          tip={{
            status: tip.status,
            entryPrice: tip.entryPrice,
            target1: tip.target1,
            stopLoss: tip.stopLoss,
            closedPrice: tip.closedPrice,
            closedAt: tip.closedAt?.toISOString() ?? null,
            tipTimestamp: tip.tipTimestamp.toISOString(),
            direction: tip.direction,
            timeframe: tip.timeframe,
            conviction: tip.conviction,
            stockSymbol: tip.stock.symbol,
          }}
        />
      </div>

      {/* Creator's Explanation */}
      {tip.explanation && (
        <div className="mt-6">
          <TipExplanation
            content={tip.explanation.content}
            imageUrls={tip.explanation.imageUrls}
            version={tip.explanation.version}
            updatedAt={tip.explanation.updatedAt.toISOString()}
          />
        </div>
      )}

      {/* Creator Mini Profile */}
      <div className="mt-6 rounded-xl border border-border/60 bg-surface p-4 shadow-sm">
        <Link
          href={`/creator/${tip.creator.slug}`}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            {tip.creator.profileImageUrl ? (
              <Image
                src={tip.creator.profileImageUrl}
                alt={tip.creator.displayName}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                {tip.creator.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-text">
                {tip.creator.displayName}
              </p>
              <p className="text-xs text-muted">
                {tip.creator.tier} &middot; {tip.creator.totalTips} tips
              </p>
            </div>
          </div>
          {tip.creator.currentScore && (
            <ScoreBadge score={tip.creator.currentScore.rmtScore} />
          )}
        </Link>
      </div>

      {/* Entry Timing Insights (only for active tips) */}
      <EntryTimingCard
        tip={{
          entryPrice: tip.entryPrice,
          target1: tip.target1,
          stopLoss: tip.stopLoss,
          tipTimestamp: tip.tipTimestamp.toISOString(),
          direction: tip.direction,
          status: tip.status,
          priceAtTip: tip.priceAtTip,
        }}
      />

      {/* Similar Past Tips */}
      <div className="mt-6">
        <SimilarTipsPanel
          tipId={tip.id}
          creatorName={tip.creator.displayName}
        />
      </div>

      {/* Tip Feedback */}
      <div className="mt-6">
        <TipFeedback tipId={tip.id} />
      </div>

      {/* Comments */}
      <div className="mt-6">
        <CommentSection tipId={tip.id} />
      </div>

      {/* Amendment history */}
      {tip.amendments.length > 0 && (
        <div className="mt-6 rounded-xl border border-border/60 bg-surface p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-text">
            Amendment History
          </h3>
          <div className="mt-3 space-y-2">
            {tip.amendments.map((amendment) => (
              <div
                key={amendment.id}
                className="rounded-lg bg-bg-alt/50 p-2.5 text-xs text-muted"
              >
                <span className="font-medium text-text">{amendment.field}</span> changed
                from <code className="rounded bg-bg-alt px-1 py-0.5">{amendment.oldValue}</code> to{" "}
                <code className="rounded bg-bg-alt px-1 py-0.5">{amendment.newValue}</code>
                {amendment.reason && ` — ${amendment.reason}`}
                <span className="ml-2 text-muted-light">
                  {new Date(amendment.amendedAt).toLocaleDateString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
