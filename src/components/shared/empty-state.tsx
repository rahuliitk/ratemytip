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
        "flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white py-16 text-center shadow-[0_1px_2px_0_rgba(26,54,93,0.04)]",
        className
      )}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#2B6CB0]/10 to-[#2B6CB0]/5">
        <div className="text-[#718096]">
          {icon ?? <SearchX className="h-8 w-8" />}
        </div>
      </div>
      <h3 className="mb-1 text-lg font-semibold text-[#1A202C]">{title}</h3>
      {description && (
        <p className="mb-4 max-w-md text-sm text-[#718096]">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
