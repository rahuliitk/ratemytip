"use client";

import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface TimeAgoProps {
  readonly date: Date | string;
  readonly className?: string;
  readonly addSuffix?: boolean;
}

export function TimeAgo({
  date,
  className,
  addSuffix = true,
}: TimeAgoProps): React.ReactElement {
  const [timeAgo, setTimeAgo] = React.useState<string>("");
  const dateObj = React.useMemo(
    () => (typeof date === "string" ? new Date(date) : date),
    [date]
  );

  React.useEffect(() => {
    const updateTime = (): void => {
      setTimeAgo(formatDistanceToNow(dateObj, { addSuffix }));
    };

    updateTime();

    // Update every minute for recent dates, every hour for older dates
    const diffMs = Date.now() - dateObj.getTime();
    const intervalMs = diffMs < 3_600_000 ? 60_000 : 3_600_000;
    const interval = setInterval(updateTime, intervalMs);

    return () => clearInterval(interval);
  }, [dateObj, addSuffix]);

  return (
    <time
      dateTime={dateObj.toISOString()}
      title={dateObj.toLocaleString()}
      className={cn("text-sm text-[#718096]", className)}
    >
      {timeAgo}
    </time>
  );
}
