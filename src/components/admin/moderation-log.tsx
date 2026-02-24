interface ModerationEntry {
  readonly id: string;
  readonly action: string;
  readonly reason: string;
  readonly createdAt: string;
  readonly creator: { readonly displayName: string; readonly slug: string };
  readonly admin: { readonly name: string; readonly email: string };
}

interface ModerationLogProps {
  readonly actions: readonly ModerationEntry[];
}

const ACTION_COLORS: Record<string, string> = {
  ACTIVATED: "bg-green-100 text-green-800",
  DEACTIVATED: "bg-red-100 text-red-800",
  FLAGGED: "bg-yellow-100 text-yellow-800",
  UNFLAGGED: "bg-blue-100 text-blue-800",
  NOTE_ADDED: "bg-gray-100 text-gray-700",
};

export function ModerationLog({
  actions,
}: ModerationLogProps): React.ReactElement {
  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-[0_1px_3px_0_rgba(26,54,93,0.06),0_1px_2px_-1px_rgba(26,54,93,0.06)]">
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
          {actions.map((entry) => (
            <tr key={entry.id} className="hover:bg-[#2B6CB0]/5">
              <td className="px-4 py-3 text-xs text-muted">
                {new Date(entry.createdAt).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                    ACTION_COLORS[entry.action] ?? "bg-gray-100 text-gray-700"
                  }`}
                >
                  {entry.action}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-text">
                {entry.creator.displayName}
              </td>
              <td className="px-4 py-3 text-sm text-muted">
                {entry.admin.name}
              </td>
              <td className="max-w-[300px] truncate px-4 py-3 text-xs text-muted">
                {entry.reason}
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
  );
}
