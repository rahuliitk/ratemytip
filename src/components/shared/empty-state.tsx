import { cn } from "@/lib/utils";
import { SearchX } from "lucide-react";

interface EmptyStateProps {
  readonly icon?: React.ReactNode;
  readonly title: string;
  readonly description?: string;
  readonly action?: React.ReactNode;
  readonly className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps): React.ReactElement {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-border/60 bg-surface py-16 text-center shadow-sm",
        className
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-bg-alt">
        <div className="text-muted">
          {icon ?? <SearchX className="h-7 w-7" />}
        </div>
      </div>
      <h3 className="mb-1 text-base font-semibold text-text">{title}</h3>
      {description && (
        <p className="mb-4 max-w-sm text-sm text-muted">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
