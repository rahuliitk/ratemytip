"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  readonly children: React.ReactNode;
  readonly fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log to error reporting service (Sentry in production)
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  readonly error: Error | null;
  readonly onReset?: () => void;
}

export function ErrorFallback({
  error,
  onReset,
}: ErrorFallbackProps): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-surface py-12 text-center shadow-sm">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-light">
        <AlertTriangle className="h-6 w-6 text-danger" />
      </div>
      <h3 className="mb-1 text-lg font-semibold text-text">
        Something went wrong
      </h3>
      <p className="mb-5 max-w-md text-sm text-muted">
        {error?.message ?? "An unexpected error occurred. Please try again."}
      </p>
      {onReset && (
        <Button variant="outline" onClick={onReset}>
          Try Again
        </Button>
      )}
    </div>
  );
}
