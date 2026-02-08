import { db } from "@/lib/db";

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

export default async function AdminModerationPage(): Promise<React.ReactElement> {
  const actions = await getModerationLog();

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">Moderation Log</h1>
      <p className="mt-1 text-sm text-muted">
        History of moderation actions taken on creators
      </p>

      <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 bg-surface">
        <table className="w-full min-w-[600px] text-left">
          <thead>
            <tr className="border-b border-gray-200 bg-bg">
              <th className="px-4 py-3 text-xs font-semibold uppercase text-muted">
                Date
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-muted">
                Action
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-muted">
                Creator
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-muted">
                Admin
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-muted">
                Reason
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {actions.map((action) => (
              <tr key={action.id} className="hover:bg-bg">
                <td className="px-4 py-3 text-xs text-muted">
                  {new Date(action.createdAt).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-text">
                    {action.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-text">
                  {action.creator.displayName}
                </td>
                <td className="px-4 py-3 text-sm text-muted">
                  {action.admin.name}
                </td>
                <td className="max-w-[300px] truncate px-4 py-3 text-xs text-muted">
                  {action.reason}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {actions.length === 0 && (
          <div className="py-12 text-center text-sm text-muted">
            No moderation actions recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}
