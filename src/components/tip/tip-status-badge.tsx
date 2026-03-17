import { cn } from "@/lib/utils";
import type { TipStatus } from "@/types";

interface TipStatusBadgeProps {
  readonly status: TipStatus;
}

const STATUS_CONFIG: Record<TipStatus, { label: string; className: string; dotColor: string }> = {
  ACTIVE: {
    label: "Active",
    className: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20",
    dotColor: "bg-blue-500",
  },
  TARGET_1_HIT: {
    label: "T1 Hit",
    className: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
    dotColor: "bg-emerald-500",
  },
  TARGET_2_HIT: {
    label: "T2 Hit",
    className: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
    dotColor: "bg-emerald-600",
  },
  TARGET_3_HIT: {
    label: "T3 Hit",
    className: "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-600/20",
    dotColor: "bg-emerald-600",
  },
  ALL_TARGETS_HIT: {
    label: "All Targets Hit",
    className: "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-600/30",
    dotColor: "bg-emerald-700",
  },
  STOPLOSS_HIT: {
    label: "SL Hit",
    className: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
    dotColor: "bg-red-500",
  },
  EXPIRED: {
    label: "Expired",
    className: "bg-bg-alt text-muted ring-1 ring-inset ring-border",
    dotColor: "bg-muted",
  },
  PENDING_REVIEW: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
    dotColor: "bg-amber-500",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-50 text-red-600 ring-1 ring-inset ring-red-600/10",
    dotColor: "bg-red-400",
  },
};

export function TipStatusBadge({ status }: TipStatusBadgeProps): React.ReactElement {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium",
        config.className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dotColor)} />
      {config.label}
    </span>
  );
}
