import { cn } from "@/lib/utils";
import type { TipStatus } from "@/types";

interface TipStatusBadgeProps {
  readonly status: TipStatus;
}

const STATUS_CONFIG: Record<TipStatus, { label: string; className: string }> = {
  ACTIVE: {
    label: "Active",
    className: "bg-blue-100 text-blue-800",
  },
  TARGET_1_HIT: {
    label: "T1 Hit",
    className: "bg-green-100 text-green-800",
  },
  TARGET_2_HIT: {
    label: "T2 Hit",
    className: "bg-green-100 text-green-900",
  },
  TARGET_3_HIT: {
    label: "T3 Hit",
    className: "bg-green-200 text-green-900",
  },
  ALL_TARGETS_HIT: {
    label: "All Targets Hit",
    className: "bg-green-200 text-green-900",
  },
  STOPLOSS_HIT: {
    label: "SL Hit",
    className: "bg-red-100 text-red-800",
  },
  EXPIRED: {
    label: "Expired",
    className: "bg-gray-100 text-gray-600",
  },
  PENDING_REVIEW: {
    label: "Pending",
    className: "bg-orange-100 text-orange-800",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-50 text-red-600",
  },
};

export function TipStatusBadge({ status }: TipStatusBadgeProps): React.ReactElement {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
