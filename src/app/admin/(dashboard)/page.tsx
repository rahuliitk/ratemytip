import { db } from "@/lib/db";
import {
  ClipboardCheck,
  Users,
  Target,
  TrendingUp,
  Bot,
  CheckCircle2,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
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


function jobStatusBg(status: string): string {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700";
    case "RUNNING":
      return "bg-blue-50 text-blue-700";
    case "FAILED":
      return "bg-red-50 text-red-700";
    case "QUEUED":
      return "bg-amber-50 text-amber-700";
    default:
      return "bg-bg-alt text-muted";
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
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Pending Review",
      value: stats.pendingReview.toLocaleString("en-IN"),
      icon: ClipboardCheck,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      label: "Active Creators",
      value: stats.activeCreators.toLocaleString("en-IN"),
      icon: Users,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      label: "Tips Today",
      value: stats.tipsToday.toLocaleString("en-IN"),
      icon: TrendingUp,
      color: "text-violet-600",
      bgColor: "bg-violet-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">
          Overview of platform activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-xl border border-border/60 bg-surface p-5 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.bgColor}`}>
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
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Scrape Jobs */}
        <div className="rounded-xl border border-border/60 bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-2 border-b border-border/40 pb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50">
              <Bot className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <h2 className="text-sm font-semibold text-text">
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
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text">
                      {job.platform}
                    </span>
                    <span className="text-muted">
                      {job.jobType.replace(/_/g, " ").toLowerCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${jobStatusBg(job.status)}`}>
                      {job.status}
                    </span>
                    <span className="text-muted tabular-nums">
                      {formatTimeAgo(job.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-4 text-center text-xs text-muted">No scrape jobs yet.</p>
            )}
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="rounded-xl border border-border/60 bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-2 border-b border-border/40 pb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <h2 className="text-sm font-semibold text-text">
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
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1">
                      {review.action === "APPROVED" ? (
                        <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                      ) : review.action === "REJECTED" ? (
                        <ArrowDownRight className="h-3 w-3 text-red-500" />
                      ) : null}
                      <span
                        className={`font-medium ${review.action === "APPROVED" ? "text-emerald-600" : review.action === "REJECTED" ? "text-red-600" : "text-text"}`}
                      >
                        {review.action}
                      </span>
                    </span>
                    <span className="text-muted">
                      {review.tip.direction} {review.tip.stock.symbol}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted">by {review.admin.name}</span>
                    <span className="text-muted tabular-nums">
                      {formatTimeAgo(review.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-4 text-center text-xs text-muted">No reviews yet.</p>
            )}
          </div>
        </div>

        {/* Recent Score Updates */}
        <div className="rounded-xl border border-border/60 bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-2 border-b border-border/40 pb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-50">
              <BarChart3 className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <h2 className="text-sm font-semibold text-text">
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
                  <span className="font-medium text-text">
                    {snap.creator.displayName}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 font-semibold tabular-nums text-blue-700">
                      {snap.rmtScore.toFixed(1)}
                    </span>
                    <span className="text-muted tabular-nums">
                      {new Date(snap.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-4 text-center text-xs text-muted">No score updates yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
