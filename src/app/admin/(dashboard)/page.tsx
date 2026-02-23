import { db } from "@/lib/db";
import {
  ClipboardCheck,
  Users,
  Target,
  TrendingUp,
  Bot,
  CheckCircle2,
  BarChart3,
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

async function getRecentActivity() {
  try {
    const [recentJobs, recentReviews, recentSnapshots] = await Promise.all([
      db.scrapeJob.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          platform: true,
          jobType: true,
          status: true,
          postsFound: true,
          tipsExtracted: true,
          createdAt: true,
        },
      }),
      db.reviewAction.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          admin: { select: { name: true } },
          tip: {
            select: {
              stock: { select: { symbol: true } },
              direction: true,
            },
          },
        },
      }),
      db.scoreSnapshot.findMany({
        orderBy: { date: "desc" },
        take: 5,
        distinct: ["creatorId"],
        include: {
          creator: { select: { displayName: true, slug: true } },
        },
      }),
    ]);

    return { recentJobs, recentReviews, recentSnapshots };
  } catch {
    return { recentJobs: [], recentReviews: [], recentSnapshots: [] };
  }
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function jobStatusColor(status: string): string {
  switch (status) {
    case "COMPLETED":
      return "text-success";
    case "RUNNING":
      return "text-accent";
    case "FAILED":
      return "text-danger";
    case "QUEUED":
      return "text-warning";
    default:
      return "text-muted";
  }
}

export default async function AdminDashboardPage(): Promise<React.ReactElement> {
  const [stats, activity] = await Promise.all([
    getDashboardStats(),
    getRecentActivity(),
  ]);

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

      {/* Activity Feed */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Recent Scrape Jobs */}
        <div className="rounded-lg border border-gray-200 bg-surface p-5">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-primary">
              Recent Scrape Jobs
            </h2>
          </div>
          <div className="mt-4 space-y-3">
            {activity.recentJobs.length > 0 ? (
              activity.recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-medium text-text">
                      {job.platform}
                    </span>
                    <span className="ml-1 text-muted">
                      {job.jobType.replace(/_/g, " ").toLowerCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${jobStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                    <span className="text-muted">
                      {formatTimeAgo(job.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted">No scrape jobs yet.</p>
            )}
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="rounded-lg border border-gray-200 bg-surface p-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <h2 className="text-sm font-semibold text-primary">
              Recent Reviews
            </h2>
          </div>
          <div className="mt-4 space-y-3">
            {activity.recentReviews.length > 0 ? (
              activity.recentReviews.map((review) => (
                <div
                  key={review.id}
                  className="flex items-center justify-between text-xs"
                >
                  <div>
                    <span
                      className={`font-medium ${review.action === "APPROVED" ? "text-success" : review.action === "REJECTED" ? "text-danger" : "text-text"}`}
                    >
                      {review.action}
                    </span>
                    <span className="ml-1 text-muted">
                      {review.tip.direction} {review.tip.stock.symbol}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted">by {review.admin.name}</span>
                    <span className="text-muted">
                      {formatTimeAgo(review.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted">No reviews yet.</p>
            )}
          </div>
        </div>

        {/* Recent Score Updates */}
        <div className="rounded-lg border border-gray-200 bg-surface p-5">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-warning" />
            <h2 className="text-sm font-semibold text-primary">
              Recent Score Updates
            </h2>
          </div>
          <div className="mt-4 space-y-3">
            {activity.recentSnapshots.length > 0 ? (
              activity.recentSnapshots.map((snap) => (
                <div
                  key={snap.id}
                  className="flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-medium text-text">
                      {snap.creator.displayName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium tabular-nums text-accent">
                      {snap.rmtScore.toFixed(1)}
                    </span>
                    <span className="text-muted">
                      {new Date(snap.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted">No score updates yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
