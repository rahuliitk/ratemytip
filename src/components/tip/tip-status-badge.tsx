import { cn } from "@/lib/utils";
import type { TipStatus } from "@/types";

interface TipStatusBadgeProps {
  readonly status: TipStatus;
}

const STATUS_CONFIG: Record<TipStatus, { label: string; className: string; dotColor: string }> = {
  ACTIVE: {
    label: "Active",
    className: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
    dotColor: "bg-blue-500",
  },
  TARGET_1_HIT: {
    label: "T1 Hit",
    className: "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200",
    dotColor: "bg-green-500",
  },
  TARGET_2_HIT: {
    label: "T2 Hit",
    className: "bg-green-50 text-green-800 ring-1 ring-inset ring-green-200",
    dotColor: "bg-green-600",
  },
  TARGET_3_HIT: {
    label: "T3 Hit",
    className: "bg-green-50 text-green-800 ring-1 ring-inset ring-green-300",
    dotColor: "bg-green-600",
  },
  ALL_TARGETS_HIT: {
    label: "All Targets Hit",
    className: "bg-green-50 text-green-900 ring-1 ring-inset ring-green-300 animate-pulse-glow",
    dotColor: "bg-green-700",
  },
  STOPLOSS_HIT: {
    label: "SL Hit",
    className: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
    dotColor: "bg-red-500",
  },
  EXPIRED: {
    label: "Expired",
    className: "bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-200",
    dotColor: "bg-gray-400",
  },
  PENDING_REVIEW: {
    label: "Pending",
    className: "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200",
    dotColor: "bg-orange-500",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-50 text-red-600 ring-1 ring-inset ring-red-100",
    dotColor: "bg-red-400",
  },
};

export function TipStatusBadge({ status }: TipStatusBadgeProps): React.ReactElement {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dotColor)} />
      {config.label}
    </span>
  );
}
