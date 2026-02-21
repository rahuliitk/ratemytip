import { db } from "@/lib/db";
import {
  ClipboardCheck,
  Users,
  Target,
  TrendingUp,
} from "lucide-react";

export const dynamic = "force-dynamic";

async function getDashboardStats() {
  try {
    const [totalTips, pendingReview, activeCreators, tipsToday] =
      await Promise.all([
        db.tip.count({ where: { status: { not: "REJECTED" } } }),
        db.tip.count({ where: { reviewStatus: "PENDING" } }),
        db.creator.count({ where: { isActive: true } }),
        db.tip.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
      ]);

    return { totalTips, pendingReview, activeCreators, tipsToday };
  } catch {
    return { totalTips: 0, pendingReview: 0, activeCreators: 0, tipsToday: 0 };
  }
}

export default async function AdminDashboardPage(): Promise<React.ReactElement> {
  const stats = await getDashboardStats();

  const cards = [
    {
      label: "Total Tips",
      value: stats.totalTips.toLocaleString("en-IN"),
      icon: Target,
      color: "text-accent",
      bgColor: "bg-blue-50",
    },
    {
      label: "Pending Review",
      value: stats.pendingReview.toLocaleString("en-IN"),
      icon: ClipboardCheck,
      color: "text-warning",
      bgColor: "bg-orange-50",
    },
    {
      label: "Active Creators",
      value: stats.activeCreators.toLocaleString("en-IN"),
      icon: Users,
      color: "text-success",
      bgColor: "bg-green-50",
    },
    {
      label: "Tips Today",
      value: stats.tipsToday.toLocaleString("en-IN"),
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-blue-50",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
      <p className="mt-1 text-sm text-muted">
        Overview of platform activity
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
                <div className={`rounded-lg p-2 ${card.bgColor}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
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

      {/* Placeholder for recent activity */}
      <div className="mt-8 rounded-lg border border-gray-200 bg-surface p-6">
        <h2 className="text-lg font-semibold text-primary">
          Recent Activity
        </h2>
        <p className="mt-2 text-sm text-muted">
          Recent scraping jobs, reviews, and score calculations will appear
          here.
        </p>
        <div className="mt-4 flex h-48 items-center justify-center rounded bg-bg text-sm text-muted">
          Activity feed coming soon
        </div>
      </div>
    </div>
  );
}
