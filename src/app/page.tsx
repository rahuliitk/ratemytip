import Link from "next/link";

import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ScoreBadge } from "@/components/shared/score-badge";
import { SearchBar } from "@/components/search/search-bar";
import { RecentTipsSection } from "@/components/home/recent-tips-section";
import {
  TrendingUp,
  Users,
  Target,
  ArrowRight,
  Zap,
  BarChart3,
  Clock,
  Calendar,
} from "lucide-react";

const CATEGORIES = [
  { label: "Intraday", href: "/leaderboard/intraday", icon: Zap },
  { label: "Swing", href: "/leaderboard/swing", icon: TrendingUp },
  { label: "Positional", href: "/leaderboard/positional", icon: Calendar },
  { label: "Long Term", href: "/leaderboard/long_term", icon: Clock },
  { label: "Options", href: "/leaderboard/options", icon: BarChart3 },
] as const;

async function getTopCreators() {
  try {
    const creators = await db.creator.findMany({
      where: { isActive: true, currentScore: { isNot: null } },
      include: {
        currentScore: true,
      },
      orderBy: {
        currentScore: { rmtScore: "desc" },
      },
      take: 10,
    });
    return creators;
  } catch {
    return [];
  }
}

async function getStats() {
  try {
    const [tipCount, creatorCount] = await Promise.all([
      db.tip.count({ where: { status: { not: "REJECTED" } } }),
      db.creator.count({ where: { isActive: true } }),
    ]);
    return { tipCount, creatorCount };
  } catch {
    return { tipCount: 0, creatorCount: 0 };
  }
}

export default async function HomePage(): Promise<React.ReactElement> {
  const [topCreators, stats] = await Promise.all([
    getTopCreators(),
    getStats(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0F2B4E] via-[#1A365D] to-[#2B6CB0] px-4 py-20 text-white sm:py-28">
        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>
            The Truth Behind Every Financial Tip
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-blue-100/80">
            RateMyTip tracks and scores stock market tips from influencers and
            analysts. See who actually delivers results with transparent,
            verified data.
          </p>
          <div className="mx-auto mt-8 max-w-xl">
            <SearchBar
              placeholder="Search creators or stocks..."
              size="lg"
              autoFocus={false}
              variant="hero"
            />
          </div>
        </div>
      </section>

      {/* Stats Bar — floating glass card */}
      <section className="relative -mt-8 z-10 px-4">
        <div className="mx-auto max-w-3xl rounded-2xl glass shadow-lg">
          <div className="flex flex-wrap items-center justify-center gap-8 px-6 py-5 sm:gap-12">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2B6CB0]/10 to-[#2B6CB0]/5">
                <Target className="h-5 w-5 text-accent" />
              </div>
              <div>
                <span className="text-2xl font-bold text-primary tabular-nums">
                  {stats.tipCount.toLocaleString("en-IN")}
                </span>
                <p className="text-xs text-muted">tips tracked</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2B6CB0]/10 to-[#2B6CB0]/5">
                <Users className="h-5 w-5 text-accent" />
              </div>
              <div>
                <span className="text-2xl font-bold text-primary tabular-nums">
                  {stats.creatorCount.toLocaleString("en-IN")}
                </span>
                <p className="text-xs text-muted">creators scored</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2B6CB0]/10 to-[#2B6CB0]/5">
                <BarChart3 className="h-5 w-5 text-accent" />
              </div>
              <div>
                <span className="text-2xl font-bold text-primary tabular-nums">
                  RMT Score
                </span>
                <p className="text-xs text-muted">powered rankings</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top 10 Leaderboard Preview */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gradient-primary">
            Top Creators
          </h2>
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#1A365D] to-[#2B6CB0] px-4 py-2 text-sm font-medium text-white shadow-md transition-all duration-200 hover:shadow-lg hover:brightness-110"
          >
            View Full Leaderboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_1px_2px_0_rgba(26,54,93,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-50/50">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                    Rank
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                    Creator
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">
                    RMT Score
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">
                    Accuracy
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">
                    Tips
                  </th>
                </tr>
              </thead>
              <tbody className="stagger-children">
                {topCreators.length > 0 ? (
                  topCreators.map((creator, index) => (
                    <tr key={creator.id} className="transition-all duration-200 hover:bg-[#2B6CB0]/[0.03] even:bg-gray-50/30">
                      <td className="px-4 py-3.5 text-sm font-medium text-muted tabular-nums">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/creator/${creator.slug}`}
                          className="flex items-center gap-2.5 hover:underline"
                        >
                          <span className="text-sm font-medium text-text">
                            {creator.displayName}
                          </span>
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-muted">
                            {creator.tier}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {creator.currentScore ? (
                          <ScoreBadge
                            score={creator.currentScore.rmtScore}
                            size="sm"
                          />
                        ) : (
                          <span className="text-xs text-muted">Unrated</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm tabular-nums text-text">
                        {creator.currentScore
                          ? `${(creator.currentScore.accuracyRate * 100).toFixed(1)}%`
                          : "-"}
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm tabular-nums text-muted">
                        {creator.totalTips}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-sm text-muted"
                    >
                      No creators tracked yet. Data will appear once scraping
                      begins.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Recent Tips */}
      <RecentTipsSection />

      {/* Category Quick Links */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-2xl font-bold text-gradient-primary">
            Browse by Category
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.href}
                  href={cat.href}
                  className="flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_1px_2px_0_rgba(26,54,93,0.04)] card-hover gradient-border-hover"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#2B6CB0]/10 to-[#2B6CB0]/5">
                    <Icon className="h-7 w-7 text-accent" />
                  </div>
                  <span className="text-sm font-bold text-primary">
                    {cat.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* SEO Content */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-xl font-bold text-gradient-primary">
          Why RateMyTip?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Financial influencers across the globe offer stock and crypto tips on
          social media. But how do you know which ones to trust? RateMyTip
          solves this by tracking every tip, measuring actual performance
          against real market data, and producing a transparent RMT Score for
          each creator. Our scoring algorithm considers accuracy, risk-adjusted
          returns, consistency, and volume to give you a complete picture of a
          creator&apos;s track record.
        </p>
      </section>
      </main>
      <Footer />
    </div>
  );
}
