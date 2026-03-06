import { cn } from "@/lib/utils";
import {
  formatNumber,
  formatPercent,
  formatPrice,
} from "@/lib/utils/format";

interface FormattedNumberProps {
  readonly value: number;
  readonly className?: string;
}

export function FormattedNumber({
  value,
  className,
}: FormattedNumberProps): React.ReactElement {
  return (
    <span className={cn("tabular-nums", className)}>
      {formatNumber(value)}
    </span>
  );
}

interface FormattedPercentProps {
  readonly value: number;
  readonly decimals?: number;
  readonly colorCoded?: boolean;
  readonly className?: string;
}

export function FormattedPercent({
  value,
  decimals = 1,
  colorCoded = false,
  className,
}: FormattedPercentProps): React.ReactElement {
  return (
    <span
      className={cn(
        "tabular-nums",
        colorCoded && value > 0 && "text-emerald-600",
        colorCoded && value < 0 && "text-red-600",
        colorCoded && value === 0 && "text-muted",
        className
      )}
    >
      {formatPercent(value, decimals)}
    </span>
  );
}

interface FormattedPriceProps {
  readonly value: number;
  readonly className?: string;
}

export function FormattedPrice({
  value,
  className,
}: FormattedPriceProps): React.ReactElement {
  return (
    <span className={cn("tabular-nums", className)}>
      {formatPrice(value)}
    </span>
  );
}
