import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PerformanceChart } from "@/components/creator-dashboard/performance-chart";

export default async function AnalyticsPage(): Promise<React.ReactElement> {
  const session = await auth();
  if (!session?.user?.userId || session.user.role !== "CREATOR") {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.userId },
    select: { claimedCreatorId: true },
  });

  if (!user?.claimedCreatorId) redirect("/");

  const [creator, scoreHistory, tipsByTimeframe, tipsByStatus] = await Promise.all([
    db.creator.findUnique({
      where: { id: user.claimedCreatorId },
      include: { currentScore: true },
    }),
    db.scoreSnapshot.findMany({
      where: { creatorId: user.claimedCreatorId },
      orderBy: { date: "desc" },
      take: 90,
    }),
    db.tip.groupBy({
      by: ["timeframe"],
      where: { creatorId: user.claimedCreatorId, status: { not: "REJECTED" } },
      _count: true,
    }),
    db.tip.groupBy({
      by: ["status"],
      where: { creatorId: user.claimedCreatorId },
      _count: true,
    }),
  ]);

  if (!creator) redirect("/");

  const score = creator.currentScore;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Analytics</h1>
        <p className="text-sm text-muted">Your performance breakdown and trends</p>
      </div>

      {/* Score Components */}
      {score && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Accuracy Score", value: score.accuracyScore.toFixed(1), color: "text-accent" },
            { label: "Risk-Adjusted", value: score.riskAdjustedScore.toFixed(1), color: "text-success" },
            { label: "Consistency", value: score.consistencyScore.toFixed(1), color: "text-primary" },
            { label: "Volume Factor", value: score.volumeFactorScore.toFixed(1), color: "text-muted" },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-gray-200 bg-surface p-4">
              <p className="text-xs text-muted">{item.label}</p>
              <p className={`mt-1 text-2xl font-bold tabular-nums ${item.color}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Score History Chart */}
      <div className="rounded-lg border border-gray-200 bg-surface p-6">
        <h2 className="text-lg font-bold text-primary">Score Trend</h2>
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

      {/* Accuracy by Timeframe */}
      {score && (
        <div className="rounded-lg border border-gray-200 bg-surface p-6">
          <h2 className="text-lg font-bold text-primary">Accuracy by Timeframe</h2>
          <div className="mt-4 space-y-3">
            {[
              { label: "Intraday", value: score.intradayAccuracy },
              { label: "Swing", value: score.swingAccuracy },
              { label: "Positional", value: score.positionalAccuracy },
              { label: "Long Term", value: score.longTermAccuracy },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="w-24 text-sm text-muted">{label}</span>
                <div className="flex-1">
                  <div className="h-4 overflow-hidden rounded-full bg-bg">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${value !== null ? (value * 100) : 0}%` }}
                    />
                  </div>
                </div>
                <span className="w-14 text-right text-sm font-semibold tabular-nums text-text">
                  {value !== null ? `${(value * 100).toFixed(1)}%` : "N/A"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips Distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-surface p-6">
          <h2 className="text-lg font-bold text-primary">Tips by Timeframe</h2>
          <div className="mt-4 space-y-2">
            {tipsByTimeframe.map((t) => (
              <div key={t.timeframe} className="flex items-center justify-between rounded-md bg-bg px-3 py-2 text-sm">
                <span className="text-text">{t.timeframe}</span>
                <span className="font-semibold tabular-nums text-text">{t._count}</span>
              </div>
            ))}
            {tipsByTimeframe.length === 0 && (
              <p className="text-sm text-muted">No tips yet</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-surface p-6">
          <h2 className="text-lg font-bold text-primary">Tips by Status</h2>
          <div className="mt-4 space-y-2">
            {tipsByStatus.map((t) => (
              <div key={t.status} className="flex items-center justify-between rounded-md bg-bg px-3 py-2 text-sm">
                <span className="text-text">{t.status.replace(/_/g, " ")}</span>
                <span className="font-semibold tabular-nums text-text">{t._count}</span>
              </div>
            ))}
            {tipsByStatus.length === 0 && (
              <p className="text-sm text-muted">No tips yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
