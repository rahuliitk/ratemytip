"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  useEffect(() => {
    console.error("Public page error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center justify-center px-4 py-24 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-light">
        <AlertTriangle className="h-6 w-6 text-danger" />
      </div>
      <h2 className="mb-1 text-lg font-semibold text-text">
        Something went wrong
      </h2>
      <p className="mb-6 text-sm text-muted">
        An unexpected error occurred. Please try again.
      </p>
      <Button variant="outline" onClick={reset}>
        Try Again
      </Button>
    </div>
  );
}
