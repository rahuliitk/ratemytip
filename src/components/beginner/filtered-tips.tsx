"use client";

import { useMemo, type ReactNode } from "react";
import { useExperienceLevel } from "@/components/beginner/beginner-mode-toggle";
import type { TipWithCreator } from "@/types";
import { TipCardWithCreator } from "@/components/tip/tip-card-with-creator";
import { LiteTipCard } from "@/components/beginner/lite-tip-card";

// ═══════════════════════════════════════════════════════════
// FILTERED TIPS — Client-side wrapper that hides complex
// tip types (intraday, options, futures) when the user is in
// Beginner Mode. Wraps around the tips feed on the browse page.
// ═══════════════════════════════════════════════════════════

// Timeframes considered too advanced/risky for beginners
const BEGINNER_HIDDEN_TIMEFRAMES = new Set(["INTRADAY"]);

// Asset classes considered too complex for beginners
const BEGINNER_HIDDEN_ASSET_CLASSES = new Set(["FUTURES", "OPTIONS"]);

interface FilteredTipsProps {
  /** The full list of tips fetched from the server */
  readonly tips: readonly TipWithCreator[];
  /** Optional empty state node to render when all tips are filtered out */
  readonly emptyState?: ReactNode;
}

/**
 * Checks if a tip should be visible in Beginner Mode.
 * We filter based on timeframe (available on TipWithCreator)
 * since asset class is not included in the compact type.
 *
 * Intraday tips are hidden because they require fast execution,
 * high attention, and leverage knowledge that beginners lack.
 */
function isBeginnerFriendly(tip: TipWithCreator): boolean {
  if (BEGINNER_HIDDEN_TIMEFRAMES.has(tip.timeframe)) {
    return false;
  }
  return true;
}

export function FilteredTips({
  tips,
  emptyState,
}: FilteredTipsProps): React.ReactElement {
  const { isBeginnerMode } = useExperienceLevel();

  const visibleTips = useMemo(() => {
    if (!isBeginnerMode) return tips;
    return tips.filter(isBeginnerFriendly);
  }, [tips, isBeginnerMode]);

  const hiddenCount = tips.length - visibleTips.length;

  return (
    <>
      {/* Beginner mode info banner */}
      {isBeginnerMode && hiddenCount > 0 && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-950/30">
          <div className="flex items-start gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-300">
                Beginner Mode Active
              </p>
              <p className="mt-0.5 text-xs text-green-700 dark:text-green-400">
                {hiddenCount} intraday and derivatives tips are hidden. These
                require advanced knowledge and carry higher risk. Switch to
                Standard or Advanced mode to see all tips.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tip cards — use simplified LiteTipCard in beginner mode */}
      <div className={isBeginnerMode ? "stagger-children grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "stagger-children space-y-3"}>
        {visibleTips.map((tip) =>
          isBeginnerMode ? (
            <LiteTipCard key={tip.id} tip={tip} />
          ) : (
            <TipCardWithCreator key={tip.id} tip={tip} />
          )
        )}
      </div>

      {/* Empty state */}
      {visibleTips.length === 0 && (
        <>
          {emptyState ?? (
            <div className="py-16 text-center text-sm text-muted">
              {isBeginnerMode
                ? "No beginner-friendly tips match your filters. Try adjusting the criteria above or switching to Standard mode."
                : "No tips match your filters. Try adjusting the criteria above."}
            </div>
          )}
        </>
      )}
    </>
  );
}
