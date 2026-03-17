"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════
// GETTING STARTED CHECKLIST — A floating widget that tracks
// onboarding progress via localStorage. Sits in the bottom-
// right corner, can be minimized. Automatically checks off
// items as the user visits relevant pages or performs actions.
// ═══════════════════════════════════════════════════════════

// ──── Constants ────

const STORAGE_KEY = "ratemytip-getting-started";
const DISMISSED_KEY = "ratemytip-getting-started-dismissed";

// ──── Checklist Items ────

interface ChecklistItem {
  readonly id: string;
  readonly label: string;
  readonly description: string;
}

const CHECKLIST_ITEMS: readonly ChecklistItem[] = [
  {
    id: "visit-leaderboard",
    label: "Visit the leaderboard",
    description: "See how tip creators are ranked by accuracy",
  },
  {
    id: "view-creator-profile",
    label: "View a creator profile",
    description: "Check out a creator's track record and score",
  },
  {
    id: "read-tip-detail",
    label: "Read a tip detail page",
    description: "Understand entry, target, and stop loss levels",
  },
  {
    id: "try-position-calculator",
    label: "Try the position size calculator",
    description: "Learn how many shares to buy based on risk",
  },
  {
    id: "set-experience-level",
    label: "Set your experience level",
    description: "Customize the platform for your trading knowledge",
  },
] as const;

// ──── Path-based auto-detection patterns ────

const PATH_TRIGGERS: Record<string, string> = {
  "/leaderboard": "visit-leaderboard",
};

// Prefix-based triggers
const PREFIX_TRIGGERS: readonly { prefix: string; id: string }[] = [
  { prefix: "/creator/", id: "view-creator-profile" },
  { prefix: "/tip/", id: "read-tip-detail" },
];

// ──── Helpers ────

function loadCompletedItems(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return new Set(parsed.filter((item): item is string => typeof item === "string"));
      }
    }
  } catch {
    // Ignore parse errors
  }
  return new Set();
}

function saveCompletedItems(items: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...items]));
  } catch {
    // Ignore storage errors
  }
}

function isDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "true";
  } catch {
    return false;
  }
}

// ──── Component ────

export function GettingStartedChecklist(): React.ReactElement | null {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDismissedState, setIsDismissedState] = useState(true); // Start hidden, show after mount
  const [mounted, setMounted] = useState(false);

  const pathname = usePathname();

  // Hydrate state from localStorage on mount
  useEffect(() => {
    const items = loadCompletedItems();
    setCompleted(items);
    setIsDismissedState(isDismissed());
    setMounted(true);
  }, []);

  // Mark an item as complete
  const markComplete = useCallback((itemId: string) => {
    setCompleted((prev) => {
      if (prev.has(itemId)) return prev;
      const next = new Set(prev);
      next.add(itemId);
      saveCompletedItems(next);
      return next;
    });
  }, []);

  // Auto-detect page visits and mark items complete
  useEffect(() => {
    if (!mounted) return;

    // Exact path match
    const exactMatch = PATH_TRIGGERS[pathname];
    if (exactMatch) {
      markComplete(exactMatch);
      return;
    }

    // Prefix match
    for (const { prefix, id } of PREFIX_TRIGGERS) {
      if (pathname.startsWith(prefix)) {
        markComplete(id);
        return;
      }
    }
  }, [pathname, mounted, markComplete]);

  // Listen for custom events from other components
  useEffect(() => {
    if (!mounted) return;

    const handlePositionCalc = () => markComplete("try-position-calculator");
    const handleExperienceLevel = () => markComplete("set-experience-level");

    window.addEventListener("ratemytip:position-calculator-used", handlePositionCalc);
    window.addEventListener("ratemytip:experience-level-set", handleExperienceLevel);

    // Also detect experience level changes via storage event
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "ratemytip-experience-level" && e.newValue) {
        markComplete("set-experience-level");
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("ratemytip:position-calculator-used", handlePositionCalc);
      window.removeEventListener("ratemytip:experience-level-set", handleExperienceLevel);
      window.removeEventListener("storage", handleStorage);
    };
  }, [mounted, markComplete]);

  const completedCount = completed.size;
  const totalCount = CHECKLIST_ITEMS.length;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const allDone = completedCount === totalCount;

  const handleDismiss = useCallback(() => {
    setIsDismissedState(true);
    try {
      localStorage.setItem(DISMISSED_KEY, "true");
    } catch {
      // Ignore
    }
  }, []);

  // Don't render until mounted (avoid hydration mismatch)
  if (!mounted) return null;

  // Don't show if dismissed or all items completed (auto-dismiss after completion)
  if (isDismissedState) return null;

  // Auto-dismiss 3 seconds after all items are completed
  // (handled via effect below, but for now just show the congratulations briefly)

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-[9000]",
        "transition-all duration-300 ease-in-out",
        isMinimized ? "w-auto" : "w-80"
      )}
    >
      {isMinimized ? (
        /* ── Minimized: compact pill ── */
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className={cn(
            "flex items-center gap-2 rounded-full px-4 py-2.5",
            "border border-border/60 bg-surface shadow-lg",
            "text-sm font-medium text-text",
            "transition-all duration-150 hover:shadow-xl",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          )}
          aria-label={`Getting Started: ${completedCount} of ${totalCount} complete. Click to expand.`}
        >
          {/* Circular progress indicator */}
          <svg width="24" height="24" viewBox="0 0 24 24" className="flex-shrink-0" aria-hidden="true">
            <circle
              cx="12"
              cy="12"
              r="10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="12"
              cy="12"
              r="10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={`${progressPct * 0.628} 62.8`}
              strokeLinecap="round"
              className="text-blue-600"
              transform="rotate(-90 12 12)"
            />
            <text
              x="12"
              y="12"
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-current text-[8px] font-bold text-text"
            >
              {completedCount}
            </text>
          </svg>
          <span>Getting Started</span>
        </button>
      ) : (
        /* ── Expanded: full checklist card ── */
        <div
          className={cn(
            "rounded-xl border border-border/60 bg-surface shadow-xl",
            "overflow-hidden"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4 text-blue-600"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.403 12.652a3 3 0 0 0 0-5.304 3 3 0 0 0-3.75-3.751 3 3 0 0 0-5.305 0 3 3 0 0 0-3.751 3.75 3 3 0 0 0 0 5.305 3 3 0 0 0 3.75 3.751 3 3 0 0 0 5.305 0 3 3 0 0 0 3.751-3.75Zm-2.546-4.46a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                  clipRule="evenodd"
                />
              </svg>
              <h3 className="text-sm font-semibold text-text">Getting Started</h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="rounded p-1 text-muted transition-colors hover:bg-bg-alt hover:text-text"
                aria-label="Minimize checklist"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                  <path d="M3.75 7.25a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5h-8.5Z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="rounded p-1 text-muted transition-colors hover:bg-bg-alt hover:text-text"
                aria-label="Dismiss checklist"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                  <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="px-4 pt-3">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>{completedCount} of {totalCount} complete</span>
              <span className="tabular-nums">{Math.round(progressPct)}%</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500 ease-out",
                  allDone ? "bg-emerald-500" : "bg-blue-600"
                )}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Checklist items */}
          <div className="max-h-64 overflow-y-auto px-4 py-3">
            <ul className="space-y-2" role="list">
              {CHECKLIST_ITEMS.map((item) => {
                const isComplete = completed.has(item.id);

                return (
                  <li
                    key={item.id}
                    className={cn(
                      "flex items-start gap-2.5 rounded-lg px-2.5 py-2 transition-colors duration-150",
                      isComplete
                        ? "bg-emerald-50 dark:bg-emerald-950/20"
                        : "hover:bg-bg-alt/50"
                    )}
                  >
                    {/* Checkbox circle */}
                    <span
                      className={cn(
                        "mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200",
                        isComplete
                          ? "border-emerald-500 bg-emerald-500"
                          : "border-gray-300 dark:border-gray-600"
                      )}
                      aria-hidden="true"
                    >
                      {isComplete && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 16 16"
                          fill="white"
                          className="h-2.5 w-2.5"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </span>

                    {/* Text */}
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-xs font-medium",
                          isComplete
                            ? "text-emerald-700 line-through dark:text-emerald-400"
                            : "text-text"
                        )}
                      >
                        {item.label}
                      </p>
                      {!isComplete && (
                        <p className="mt-0.5 text-[11px] text-muted">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Congratulations message when all done */}
          {allDone && (
            <div className="border-t border-border/40 px-4 py-3 text-center">
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                You have completed the getting started guide!
              </p>
              <button
                type="button"
                onClick={handleDismiss}
                className="mt-1.5 text-xs text-muted hover:text-text transition-colors"
              >
                Dismiss this checklist
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
