import { db } from "@/lib/db";
import { Target, Users, TrendingUp, BarChart3 } from "lucide-react";
import { AnalyticsCharts } from "@/components/admin/analytics-charts";

export const dynamic = "force-dynamic";

async function getAnalytics() {
  try {
    const [
      totalCreators,
      totalTips,
      activeTips,
      completedTips,
      avgScore,
    ] = await Promise.all([
      db.creator.count({ where: { isActive: true } }),
      db.tip.count({ where: { status: { not: "REJECTED" } } }),
      db.tip.count({ where: { status: "ACTIVE" } }),
      db.tip.count({
        where: {
          status: {
            in: [
              "TARGET_1_HIT",
              "TARGET_2_HIT",
              "TARGET_3_HIT",
              "ALL_TARGETS_HIT",
              "STOPLOSS_HIT",
              "EXPIRED",
            ],
          },
        },
      }),
      db.creatorScore.aggregate({ _avg: { rmtScore: true } }),
    ]);

    return {
      totalCreators,
      totalTips,
      activeTips,
      completedTips,
      avgRmtScore: avgScore._avg.rmtScore ?? 0,
    };
  } catch {
    return {
      totalCreators: 0,
      totalTips: 0,
      activeTips: 0,
      completedTips: 0,
      avgRmtScore: 0,
    };
  }
}

async function getChartData() {
  try {
    // Daily tips for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const tips = await db.tip.findMany({
      where: { createdAt: { gte: thirtyDaysAgo }, status: { not: "REJECTED" } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const dailyMap = new Map<string, number>();
    for (const tip of tips) {
      const day = tip.createdAt.toISOString().slice(0, 10);
      dailyMap.set(day, (dailyMap.get(day) ?? 0) + 1);
    }
    const dailyTips = Array.from(dailyMap.entries()).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      count,
    }));

    // Score distribution
    const scores = await db.creatorScore.findMany({ select: { rmtScore: true } });
    const ranges = ["0-20", "20-40", "40-60", "60-80", "80-100"];
    const distribution = ranges.map((range) => {
      const [min, max] = range.split("-").map(Number);
      return {
        range,
        count: scores.filter((s) => s.rmtScore >= min! && s.rmtScore < max!).length,
      };
    });

    return { dailyTips, scoreDistribution: distribution };
  } catch {
    return { dailyTips: [], scoreDistribution: [] };
  }
}

export default async function AdminAnalyticsPage(): Promise<React.ReactElement> {
  const [analytics, chartData] = await Promise.all([
    getAnalytics(),
    getChartData(),
  ]);

  const cards = [
    {
      label: "Total Creators",
      value: analytics.totalCreators.toLocaleString("en-IN"),
      icon: Users,
      color: "text-accent",
    },
    {
      label: "Total Tips",
      value: analytics.totalTips.toLocaleString("en-IN"),
      icon: Target,
      color: "text-success",
    },
    {
      label: "Active Tips",
      value: analytics.activeTips.toLocaleString("en-IN"),
      icon: TrendingUp,
      color: "text-warning",
    },
    {
      label: "Completed Tips",
      value: analytics.completedTips.toLocaleString("en-IN"),
      icon: BarChart3,
      color: "text-primary",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">Analytics</h1>
      <p className="mt-1 text-sm text-muted">
        Platform-wide performance metrics
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-lg border border-gray-200 bg-surface p-5"
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-5 w-5 ${card.color}`} />
                <div>
                  <p className="text-xs font-medium text-muted">
                    {card.label}
                  </p>
                  <p className="text-2xl font-bold tabular-nums text-text">
                    {card.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg border border-gray-200 bg-surface p-5">
        <h2 className="text-sm font-semibold text-primary">
          Average RMT Score
        </h2>
        <p className="mt-2 text-3xl font-bold tabular-nums text-accent">
          {analytics.avgRmtScore.toFixed(1)}
        </p>
        <p className="text-xs text-muted">across all rated creators</p>
      </div>

      <div className="mt-8">
        <AnalyticsCharts
          dailyTips={chartData.dailyTips}
          scoreDistribution={chartData.scoreDistribution}
        />
      </div>
    </div>
  );
}
