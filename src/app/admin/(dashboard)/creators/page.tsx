import Link from "next/link";
import { db } from "@/lib/db";
import { ScoreBadge } from "@/components/shared/score-badge";

export const dynamic = "force-dynamic";

async function getCreators() {
  try {
    const creators = await db.creator.findMany({
      include: {
        currentScore: true,
        platforms: { select: { platform: true, lastScrapedAt: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });
    return creators;
  } catch {
    return [];
  }
}

export default async function AdminCreatorsPage(): Promise<React.ReactElement> {
  const creators = await getCreators();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">
            Creator Management
          </h1>
          <p className="mt-1 text-sm text-muted">
            {creators.length} creators in the system
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border/60 bg-surface shadow-sm">
        <table className="w-full min-w-[800px] text-left">
          <thead>
            <tr className="border-b border-border/60 bg-bg-alt/80">
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                Creator
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                Status
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                Tier
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">
                RMT Score
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">
                Tips
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                Platforms
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                Last Scraped
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {creators.map((creator) => {
              const lastScraped = creator.platforms
                .map((p) => p.lastScrapedAt)
                .filter(Boolean)
                .sort((a, b) => (b?.getTime() ?? 0) - (a?.getTime() ?? 0))[0];

              return (
                <tr key={creator.id} className="transition-colors hover:bg-bg-alt/50">
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/admin/creators/${creator.id}`}
                      className="text-sm font-medium text-text hover:text-accent hover:underline"
                    >
                      {creator.displayName}
                    </Link>
                    <p className="text-xs text-muted">/{creator.slug}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        creator.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                        creator.isActive ? "bg-emerald-500" : "bg-red-500"
                      }`} />
                      {creator.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="rounded-md bg-bg-alt px-2 py-0.5 text-xs font-medium text-muted">
                      {creator.tier}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {creator.currentScore ? (
                      <ScoreBadge
                        score={creator.currentScore.rmtScore}
                        size="sm"
                      />
                    ) : (
                      <span className="text-xs text-muted">-</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right text-sm font-medium tabular-nums text-text">
                    {creator.totalTips}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-1.5">
                      {creator.platforms.map((p) => (
                        <span
                          key={p.platform}
                          className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                        >
                          {p.platform}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-muted">
                    {lastScraped
                      ? new Date(lastScraped).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Never"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {creators.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm text-muted">
              No creators in the system yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
