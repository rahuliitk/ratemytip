import { cn } from "@/lib/utils";

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

function Skeleton({ className, ...props }: SkeletonProps): React.ReactElement {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-bg-alt", className)}
      {...props}
    />
  );
}

export { Skeleton };
