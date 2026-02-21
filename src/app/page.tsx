import Link from "next/link";

import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ScoreBadge } from "@/components/shared/score-badge";
import { SearchBar } from "@/components/search/search-bar";
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
      <section className="bg-primary px-4 py-16 text-white sm:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
            The Truth Behind Every Financial Tip
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-blue-200">
            RateMyTip tracks and scores stock market tips from influencers and
            analysts. See who actually delivers results with transparent,
            verified data.
          </p>
          <div className="mx-auto mt-8 max-w-xl">
            <SearchBar
              placeholder="Search creators or stocks..."
              size="lg"
              autoFocus={false}
            />
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b border-gray-200 bg-surface">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-8 px-4 py-6 sm:gap-16">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-accent" />
            <span className="text-lg font-bold text-primary tabular-nums">
              {stats.tipCount.toLocaleString("en-IN")}
            </span>
            <span className="text-sm text-muted">tips tracked</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" />
            <span className="text-lg font-bold text-primary tabular-nums">
              {stats.creatorCount.toLocaleString("en-IN")}
            </span>
            <span className="text-sm text-muted">creators scored</span>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-accent" />
            <span className="text-lg font-bold text-primary tabular-nums">
              RMT Score
            </span>
            <span className="text-sm text-muted">powered rankings</span>
          </div>
        </div>
      </section>

      {/* Top 10 Leaderboard Preview */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-primary">
            Top Creators
          </h2>
          <Link
            href="/leaderboard"
            className="flex items-center gap-1 text-sm font-medium text-accent hover:underline"
          >
            View Full Leaderboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[600px] text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-3 py-3 text-xs font-semibold uppercase text-muted">
                  Rank
                </th>
                <th className="px-3 py-3 text-xs font-semibold uppercase text-muted">
                  Creator
                </th>
                <th className="px-3 py-3 text-right text-xs font-semibold uppercase text-muted">
                  RMT Score
                </th>
                <th className="px-3 py-3 text-right text-xs font-semibold uppercase text-muted">
                  Accuracy
                </th>
                <th className="px-3 py-3 text-right text-xs font-semibold uppercase text-muted">
                  Tips
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topCreators.length > 0 ? (
                topCreators.map((creator, index) => (
                  <tr key={creator.id} className="hover:bg-bg">
                    <td className="px-3 py-3 text-sm font-medium text-muted tabular-nums">
                      {index + 1}
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        href={`/creator/${creator.slug}`}
                        className="flex items-center gap-2 hover:underline"
                      >
                        <span className="text-sm font-medium text-text">
                          {creator.displayName}
                        </span>
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-muted">
                          {creator.tier}
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-right">
                      {creator.currentScore ? (
                        <ScoreBadge
                          score={creator.currentScore.rmtScore}
                          size="sm"
                        />
                      ) : (
                        <span className="text-xs text-muted">Unrated</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right text-sm tabular-nums text-text">
                      {creator.currentScore
                        ? `${(creator.currentScore.accuracyRate * 100).toFixed(1)}%`
                        : "-"}
                    </td>
                    <td className="px-3 py-3 text-right text-sm tabular-nums text-muted">
                      {creator.totalTips}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-12 text-center text-sm text-muted"
                  >
                    No creators tracked yet. Data will appear once scraping
                    begins.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Category Quick Links */}
      <section className="bg-surface px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-2xl font-bold text-primary">
            Browse by Category
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.href}
                  href={cat.href}
                  className="flex flex-col items-center gap-3 rounded-lg border border-gray-200 bg-bg p-6 transition-shadow hover:shadow-md"
                >
                  <Icon className="h-8 w-8 text-accent" />
                  <span className="text-sm font-semibold text-primary">
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
        <h2 className="text-xl font-bold text-primary">
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
