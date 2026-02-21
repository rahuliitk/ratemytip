import { db } from "@/lib/db";
import { Target, Users, TrendingUp, BarChart3 } from "lucide-react";

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

export default async function AdminAnalyticsPage(): Promise<React.ReactElement> {
  const analytics = await getAnalytics();

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

      {/* Chart placeholders */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-surface p-6">
          <h2 className="text-sm font-semibold text-primary">
            Tips Over Time
          </h2>
          <div className="mt-4 flex h-48 items-center justify-center rounded bg-bg text-sm text-muted">
            Chart: Daily tips count (Recharts)
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-surface p-6">
          <h2 className="text-sm font-semibold text-primary">
            Score Distribution
          </h2>
          <div className="mt-4 flex h-48 items-center justify-center rounded bg-bg text-sm text-muted">
            Chart: RMT Score histogram (Recharts)
          </div>
        </div>
      </div>
    </div>
  );
}
