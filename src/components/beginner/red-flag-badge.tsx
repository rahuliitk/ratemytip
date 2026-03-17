"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { RedFlag } from "@/lib/red-flags/detector";

// ──── Props ────

interface RedFlagBadgeProps {
  readonly flagsCount: number;
  readonly overallRisk: "LOW" | "MODERATE" | "HIGH";
  readonly flags: readonly RedFlag[];
}

// ──── Badge Styles ────

const RISK_BADGE_STYLES = {
  LOW: {
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: "text-emerald-600",
    label: "Low Risk",
  },
  MODERATE: {
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    icon: "text-amber-600",
    label: "Moderate Risk",
  },
  HIGH: {
    badge: "bg-red-100 text-red-700 border-red-200",
    icon: "text-red-600",
    label: "High Risk",
  },
} as const;

// ──── Severity Indicator Styles ────

const SEVERITY_STYLES = {
  WARNING: {
    bg: "bg-amber-50 border-amber-200",
    icon: "text-amber-500",
    label: "Warning",
  },
  DANGER: {
    bg: "bg-red-50 border-red-200",
    icon: "text-red-500",
    label: "Danger",
  },
} as const;

// ──── Shield Icon (LOW risk) ────

function ShieldIcon({ className }: { readonly className?: string }): React.ReactElement {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

// ──── Warning Triangle Icon (MODERATE risk) ────

function WarningIcon({ className }: { readonly className?: string }): React.ReactElement {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

// ──── Alert Circle Icon (HIGH risk) ────

function AlertIcon({ className }: { readonly className?: string }): React.ReactElement {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

// ──── Risk Icon Selector ────

function RiskIcon({
  risk,
  className,
}: {
  readonly risk: "LOW" | "MODERATE" | "HIGH";
  readonly className?: string;
}): React.ReactElement {
  switch (risk) {
    case "LOW":
      return <ShieldIcon className={className} />;
    case "MODERATE":
      return <WarningIcon className={className} />;
    case "HIGH":
      return <AlertIcon className={className} />;
  }
}

// ──── Severity Icon Selector ────

function SeverityIcon({
  severity,
  className,
}: {
  readonly severity: "WARNING" | "DANGER";
  readonly className?: string;
}): React.ReactElement {
  switch (severity) {
    case "WARNING":
      return <WarningIcon className={className} />;
    case "DANGER":
      return <AlertIcon className={className} />;
  }
}

// ──── Red Flag Badge Component ────

export function RedFlagBadge({
  flagsCount,
  overallRisk,
  flags,
}: RedFlagBadgeProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLButtonElement>(null);

  const riskStyle = RISK_BADGE_STYLES[overallRisk];

  // Close panel on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        badgeRef.current &&
        !badgeRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close panel on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block">
      {/* Badge Button */}
      <button
        ref={badgeRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        onMouseEnter={() => setIsOpen(true)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold transition-colors hover:opacity-80",
          riskStyle.badge,
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <RiskIcon risk={overallRisk} className={cn("h-4 w-4", riskStyle.icon)} />
        <span>{riskStyle.label}</span>
        {flagsCount > 0 && (
          <span
            className={cn(
              "ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full text-[10px] font-bold",
              overallRisk === "LOW"
                ? "bg-emerald-200 text-emerald-800"
                : overallRisk === "MODERATE"
                  ? "bg-amber-200 text-amber-800"
                  : "bg-red-200 text-red-800",
            )}
          >
            {flagsCount}
          </span>
        )}
      </button>

      {/* Expandable Flags Panel */}
      {isOpen && flags.length > 0 && (
        <div
          ref={panelRef}
          onMouseLeave={() => setIsOpen(false)}
          className="absolute left-0 top-full z-50 mt-2 w-80 rounded-xl border border-border/60 bg-surface shadow-lg"
          role="tooltip"
        >
          {/* Panel Header */}
          <div className="border-b border-border/40 px-4 py-3">
            <h4 className="text-sm font-bold text-text">
              Red Flags ({flagsCount})
            </h4>
            <p className="mt-0.5 text-xs text-muted">
              Issues detected with this creator&apos;s tip history
            </p>
          </div>

          {/* Flags List */}
          <div className="max-h-72 overflow-y-auto p-2">
            {flags.map((flag) => {
              const severityStyle = SEVERITY_STYLES[flag.severity];

              return (
                <div
                  key={flag.id}
                  className={cn(
                    "mb-2 rounded-lg border p-3 last:mb-0",
                    severityStyle.bg,
                  )}
                >
                  <div className="flex items-start gap-2">
                    <SeverityIcon
                      severity={flag.severity}
                      className={cn("mt-0.5 h-4 w-4 shrink-0", severityStyle.icon)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-text">
                          {flag.title}
                        </span>
                        <span
                          className={cn(
                            "rounded px-1 py-0.5 text-[10px] font-semibold uppercase",
                            flag.severity === "WARNING"
                              ? "bg-amber-200 text-amber-800"
                              : "bg-red-200 text-red-800",
                          )}
                        >
                          {severityStyle.label}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted">
                        {flag.description}
                      </p>
                      {flag.evidence && (
                        <p className="mt-1.5 rounded bg-white/50 px-2 py-1 text-[11px] font-medium tabular-nums text-text/70">
                          {flag.evidence}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state when no flags */}
      {isOpen && flags.length === 0 && (
        <div
          ref={panelRef}
          onMouseLeave={() => setIsOpen(false)}
          className="absolute left-0 top-full z-50 mt-2 w-64 rounded-xl border border-border/60 bg-surface p-4 shadow-lg"
          role="tooltip"
        >
          <div className="flex items-center gap-2">
            <ShieldIcon className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-sm font-medium text-text">No Red Flags</p>
              <p className="mt-0.5 text-xs text-muted">
                This creator has a clean track record.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
