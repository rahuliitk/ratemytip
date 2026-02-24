import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardStats } from "@/components/creator-dashboard/dashboard-stats";
import { PerformanceChart } from "@/components/creator-dashboard/performance-chart";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default async function CreatorDashboardPage(): Promise<React.ReactElement> {
  const session = await auth();
  if (!session?.user?.userId || session.user.role !== "CREATOR") {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.userId },
    select: { claimedCreatorId: true },
  });

  if (!user?.claimedCreatorId) redirect("/");

  const [creator, pendingCount, recentTips, scoreHistory] = await Promise.all([
    db.creator.findUnique({
      where: { id: user.claimedCreatorId },
      include: { currentScore: true },
    }),
    db.tip.count({
      where: { creatorId: user.claimedCreatorId, status: "PENDING_REVIEW" },
    }),
    db.tip.findMany({
      where: { creatorId: user.claimedCreatorId, status: { not: "REJECTED" } },
      include: { stock: { select: { symbol: true } } },
      orderBy: { tipTimestamp: "desc" },
      take: 5,
    }),
    db.scoreSnapshot.findMany({
      where: { creatorId: user.claimedCreatorId },
      orderBy: { date: "desc" },
      take: 90,
    }),
  ]);

  if (!creator) redirect("/");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gradient-primary">Welcome back, {creator.displayName}</h1>
          <p className="text-sm text-muted">{creator.tier} Tier</p>
        </div>
        <Link href="/creator-dashboard/new-tip">
          <Button size="sm" className="gap-1.5">
            <PlusCircle className="h-4 w-4" />
            New Tip
          </Button>
        </Link>
      </div>

      <DashboardStats
        totalTips={creator.totalTips}
        activeTips={creator.activeTips}
        pendingTips={pendingCount}
        accuracyRate={creator.currentScore?.accuracyRate ?? null}
        rmtScore={creator.currentScore?.rmtScore ?? null}
      />

      {/* Score History Chart */}
      {scoreHistory.length > 0 && (
        <div className="rounded-2xl bg-white shadow-[0_1px_3px_0_rgba(26,54,93,0.06),0_1px_2px_-1px_rgba(26,54,93,0.06)] p-6">
          <h2 className="text-lg font-bold text-gradient-primary">Performance Trend</h2>
          <p className="mt-1 text-xs text-muted">
            Score and accuracy over the last {scoreHistory.length} days
          </p>
          <div className="mt-4">
            <PerformanceChart
              data={scoreHistory.map((s) => ({
                date: s.date.toISOString(),
                rmtScore: s.rmtScore,
                accuracyRate: s.accuracyRate,
              }))}
            />
          </div>
        </div>
      )}

      {/* Recent Tips */}
      <div className="rounded-2xl bg-white shadow-[0_1px_3px_0_rgba(26,54,93,0.06),0_1px_2px_-1px_rgba(26,54,93,0.06)] p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gradient-primary">Recent Tips</h2>
          <Link href="/creator-dashboard/my-tips" className="text-xs text-accent hover:underline">
            View all
          </Link>
        </div>
        {recentTips.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No tips posted yet. Create your first tip!</p>
        ) : (
          <div className="mt-4 space-y-2">
            {recentTips.map((tip) => (
              <Link
                key={tip.id}
                href={`/tip/${tip.id}`}
                className="flex items-center justify-between rounded-md bg-bg p-3 text-sm transition-colors hover:bg-gray-100"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-bold ${
                      tip.direction === "BUY"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {tip.direction}
                  </span>
                  <span className="font-medium text-text">{tip.stock.symbol}</span>
                </div>
                <span className="text-xs text-muted">{tip.status.replace(/_/g, " ")}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
