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
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gradient-primary">
            Creator Management
          </h1>
          <p className="mt-1 text-sm text-muted">
            {creators.length} creators in the system
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-[0_1px_3px_0_rgba(26,54,93,0.06),0_1px_2px_-1px_rgba(26,54,93,0.06)]">
        <table className="w-full min-w-[800px] text-left">
          <thead>
            <tr className="border-b border-gray-200 bg-bg">
              <th className="px-4 py-3 text-xs font-semibold uppercase text-muted">
                Creator
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-muted">
                Status
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-muted">
                Tier
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-muted">
                RMT Score
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-muted">
                Tips
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-muted">
                Platforms
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-muted">
                Last Scraped
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {creators.map((creator) => {
              const lastScraped = creator.platforms
                .map((p) => p.lastScrapedAt)
                .filter(Boolean)
                .sort((a, b) => (b?.getTime() ?? 0) - (a?.getTime() ?? 0))[0];

              return (
                <tr key={creator.id} className="hover:bg-[#2B6CB0]/5">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/creators/${creator.id}`}
                      className="text-sm font-medium text-text hover:underline"
                    >
                      {creator.displayName}
                    </Link>
                    <p className="text-xs text-muted">/{creator.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        creator.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {creator.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-muted">
                      {creator.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {creator.currentScore ? (
                      <ScoreBadge
                        score={creator.currentScore.rmtScore}
                        size="sm"
                      />
                    ) : (
                      <span className="text-xs text-muted">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums text-muted">
                    {creator.totalTips}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {creator.platforms.map((p) => (
                        <span
                          key={p.platform}
                          className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-muted"
                        >
                          {p.platform}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
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
          <div className="py-12 text-center text-sm text-muted">
            No creators in the system yet.
          </div>
        )}
      </div>
    </div>
  );
}
