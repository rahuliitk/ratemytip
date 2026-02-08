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
        "flex flex-col items-center justify-center py-12 text-center",
        className
      )}
    >
      <div className="mb-4 text-[#718096]">
        {icon ?? <SearchX className="h-12 w-12" />}
      </div>
      <h3 className="mb-1 text-lg font-semibold text-[#1A202C]">{title}</h3>
      {description && (
        <p className="mb-4 max-w-md text-sm text-[#718096]">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
