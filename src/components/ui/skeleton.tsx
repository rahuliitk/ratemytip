import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

function Skeleton({ className, ...props }: SkeletonProps): React.ReactElement {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-gray-100", className)}
      {...props}
    />
  );
}

export { Skeleton };
