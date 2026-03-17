import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getModerationLog() {
  try {
    const actions = await db.moderationAction.findMany({
      include: {
        creator: { select: { displayName: true, slug: true } },
        admin: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return actions;
  } catch {
    return [];
  }
}

const ACTION_COLORS: Record<string, string> = {
  ACTIVATED: "bg-emerald-50 text-emerald-700",
  DEACTIVATED: "bg-red-50 text-red-700",
  FLAGGED: "bg-amber-50 text-amber-700",
  UNFLAGGED: "bg-blue-50 text-blue-700",
  NOTE_ADDED: "bg-bg-alt text-muted",
};

export default async function AdminModerationPage(): Promise<React.ReactElement> {
  const actions = await getModerationLog();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">Moderation Log</h1>
        <p className="mt-1 text-sm text-muted">
          History of moderation actions taken on creators
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border/60 bg-surface shadow-sm">
        <table className="w-full min-w-[600px] text-left">
          <thead>
            <tr className="border-b border-border/60 bg-bg-alt/80">
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                Date
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                Action
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                Creator
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                Admin
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                Reason
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {actions.map((action) => (
              <tr key={action.id} className="transition-colors hover:bg-bg-alt/50">
                <td className="px-5 py-3.5 text-xs text-muted tabular-nums">
                  {new Date(action.createdAt).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`rounded-md px-2.5 py-0.5 text-xs font-medium ${
                    ACTION_COLORS[action.action] ?? "bg-bg-alt text-muted"
                  }`}>
                    {action.action}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-sm font-medium text-text">
                  {action.creator.displayName}
                </td>
                <td className="px-5 py-3.5 text-sm text-muted">
                  {action.admin.name}
                </td>
                <td className="max-w-[300px] truncate px-5 py-3.5 text-xs text-muted">
                  {action.reason}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {actions.length === 0 && (
          <div className="py-16 text-center text-sm text-muted">
            No moderation actions recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}
