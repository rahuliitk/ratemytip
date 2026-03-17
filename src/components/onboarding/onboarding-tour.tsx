"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════
// ONBOARDING TOUR — Step-by-step guided overlay for first-
// time visitors. Custom implementation with spotlight,
// tooltip, and step navigation. No external dependencies.
// ═══════════════════════════════════════════════════════════

// ──── Constants ────

const STORAGE_KEY = "ratemytip-onboarding-done";

// ──── Tour Step Definition ────

interface TourStep {
  readonly targetSelector: string;
  readonly title: string;
  readonly description: string;
  readonly fallbackPosition?: { top: number; left: number };
}

const TOUR_STEPS: readonly TourStep[] = [
  {
    targetSelector: "[data-tour='leaderboard']",
    title: "Welcome to RateMyTip!",
    description:
      "This leaderboard ranks tip creators by their verified accuracy. See who actually delivers results and who is all talk.",
    fallbackPosition: { top: 200, left: 100 },
  },
  {
    targetSelector: "[data-tour='score-badge']",
    title: "The RMT Score",
    description:
      "The RMT Score (0-100) combines accuracy, risk-adjusted returns, and consistency into a single trust metric.",
    fallbackPosition: { top: 200, left: 300 },
  },
  {
    targetSelector: "[data-tour='tip-card']",
    title: "Explore Individual Tips",
    description:
      "Click any tip to see full details -- entry price, targets, stop loss, and real performance tracked against market data.",
    fallbackPosition: { top: 350, left: 100 },
  },
  {
    targetSelector: "[data-tour='search-bar']",
    title: "Search Any Stock or Creator",
    description:
      "Search for any stock or creator to see their complete track record. Every tip is verified against real market data.",
    fallbackPosition: { top: 80, left: 400 },
  },
  {
    targetSelector: "#beginner-mode-toggle",
    title: "Beginner Mode",
    description:
      "New to trading? Switch to Beginner Mode for extra guidance, glossary tooltips, and simpler views throughout the platform.",
    fallbackPosition: { top: 80, left: 600 },
  },
] as const;

// ──── Tooltip Placement Logic ────

type Placement = "top" | "bottom" | "left" | "right";

interface TooltipPosition {
  top: number;
  left: number;
  placement: Placement;
}

function calculateTooltipPosition(
  targetRect: DOMRect,
  tooltipWidth: number,
  tooltipHeight: number
): TooltipPosition {
  const MARGIN = 16;
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;

  // Prefer bottom placement
  const bottomSpace = viewportH - targetRect.bottom;
  const topSpace = targetRect.top;
  const rightSpace = viewportW - targetRect.right;
  const leftSpace = targetRect.left;

  // Try bottom
  if (bottomSpace > tooltipHeight + MARGIN * 2) {
    return {
      top: targetRect.bottom + MARGIN,
      left: Math.max(
        MARGIN,
        Math.min(
          targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
          viewportW - tooltipWidth - MARGIN
        )
      ),
      placement: "bottom",
    };
  }

  // Try top
  if (topSpace > tooltipHeight + MARGIN * 2) {
    return {
      top: targetRect.top - tooltipHeight - MARGIN,
      left: Math.max(
        MARGIN,
        Math.min(
          targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
          viewportW - tooltipWidth - MARGIN
        )
      ),
      placement: "top",
    };
  }

  // Try right
  if (rightSpace > tooltipWidth + MARGIN * 2) {
    return {
      top: Math.max(
        MARGIN,
        Math.min(
          targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
          viewportH - tooltipHeight - MARGIN
        )
      ),
      left: targetRect.right + MARGIN,
      placement: "right",
    };
  }

  // Try left
  if (leftSpace > tooltipWidth + MARGIN * 2) {
    return {
      top: Math.max(
        MARGIN,
        Math.min(
          targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
          viewportH - tooltipHeight - MARGIN
        )
      ),
      left: targetRect.left - tooltipWidth - MARGIN,
      placement: "left",
    };
  }

  // Fallback: centered below target
  return {
    top: Math.min(targetRect.bottom + MARGIN, viewportH - tooltipHeight - MARGIN),
    left: Math.max(MARGIN, (viewportW - tooltipWidth) / 2),
    placement: "bottom",
  };
}

// ──── Spotlight Rect ────

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

// ──── Props ────

interface OnboardingTourProps {
  readonly onComplete?: () => void;
}

// ──── Component ────

export function OnboardingTour({
  onComplete,
}: OnboardingTourProps): React.ReactElement | null {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<TooltipPosition | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = TOUR_STEPS[currentStep];
  const totalSteps = TOUR_STEPS.length;

  // Check localStorage and start tour if not completed
  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  // Expose startTour so the welcome modal can trigger it
  useEffect(() => {
    const handler = () => startTour();
    window.addEventListener("ratemytip:start-tour", handler);
    return () => window.removeEventListener("ratemytip:start-tour", handler);
  }, [startTour]);

  // Recheck on mount: if not done, auto-start is controlled by welcome modal
  // This component only activates via the custom event or the exported start function
  useEffect(() => {
    try {
      const done = localStorage.getItem(STORAGE_KEY);
      if (done === "true") {
        setIsActive(false);
      }
    } catch {
      // Ignore
    }
  }, []);

  // Update spotlight + tooltip position when step changes
  useEffect(() => {
    if (!isActive || !step) return;

    const updatePosition = () => {
      const target = document.querySelector(step.targetSelector);

      if (target) {
        const rect = target.getBoundingClientRect();
        const PADDING = 8;

        setSpotlight({
          top: rect.top - PADDING + window.scrollY,
          left: rect.left - PADDING,
          width: rect.width + PADDING * 2,
          height: rect.height + PADDING * 2,
        });

        // Scroll target into view
        target.scrollIntoView({ behavior: "smooth", block: "center" });

        // Calculate tooltip position after a tick (to let scrolling settle)
        requestAnimationFrame(() => {
          const updatedRect = target.getBoundingClientRect();
          const TOOLTIP_WIDTH = 340;
          const TOOLTIP_HEIGHT = 220;
          const pos = calculateTooltipPosition(
            updatedRect,
            TOOLTIP_WIDTH,
            TOOLTIP_HEIGHT
          );
          setTooltipPos(pos);
        });
      } else if (step.fallbackPosition) {
        // Target not in DOM -- use fallback position
        setSpotlight(null);
        setTooltipPos({
          top: step.fallbackPosition.top,
          left: step.fallbackPosition.left,
          placement: "bottom",
        });
      }
    };

    // Small delay to let DOM settle
    const timer = setTimeout(updatePosition, 100);
    window.addEventListener("resize", updatePosition);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isActive, currentStep, step]);

  const completeTour = useCallback(
    (skipPermanent: boolean) => {
      setIsActive(false);
      if (skipPermanent) {
        try {
          localStorage.setItem(STORAGE_KEY, "true");
        } catch {
          // Ignore
        }
      }
      onComplete?.();
    },
    [onComplete]
  );

  const handleNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      completeTour(true);
    }
  }, [currentStep, totalSteps, completeTour]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    completeTour(true);
  }, [completeTour]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "Escape") {
        handleSkip();
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isActive, handleNext, handlePrev, handleSkip]);

  // Step indicator dots
  const stepDots = useMemo(
    () =>
      Array.from({ length: totalSteps }, (_, i) => (
        <span
          key={i}
          className={cn(
            "inline-block h-1.5 w-1.5 rounded-full transition-all duration-200",
            i === currentStep
              ? "w-4 bg-blue-600"
              : i < currentStep
                ? "bg-blue-300"
                : "bg-gray-300"
          )}
          aria-hidden="true"
        />
      )),
    [currentStep, totalSteps]
  );

  if (!isActive || !step) return null;

  return (
    <div
      className="fixed inset-0 z-[9999]"
      role="dialog"
      aria-modal="true"
      aria-label={`Onboarding tour: step ${currentStep + 1} of ${totalSteps}`}
    >
      {/* ── Dark Overlay with Spotlight Cutout ── */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ zIndex: 1 }}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            {/* White = visible (overlay shows), Black = hidden (cutout) */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {spotlight && (
              <rect
                x={spotlight.left}
                y={spotlight.top}
                width={spotlight.width}
                height={spotlight.height}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.6)"
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      {/* ── Spotlight Border Ring ── */}
      {spotlight && (
        <div
          className="pointer-events-none absolute rounded-lg ring-2 ring-blue-400 ring-offset-2"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
            zIndex: 2,
          }}
          aria-hidden="true"
        />
      )}

      {/* ── Clickable overlay to skip ── */}
      <div
        className="absolute inset-0"
        style={{ zIndex: 3 }}
        onClick={handleSkip}
        aria-hidden="true"
      />

      {/* ── Tooltip Card ── */}
      {tooltipPos && (
        <div
          ref={tooltipRef}
          className={cn(
            "absolute w-[340px] rounded-xl border border-gray-200 bg-white p-5 shadow-2xl",
            "animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
          )}
          style={{
            top: tooltipPos.top,
            left: tooltipPos.left,
            zIndex: 10,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Step counter */}
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">
              Step {currentStep + 1} of {totalSteps}
            </span>
            <button
              type="button"
              onClick={handleSkip}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Skip tour"
            >
              Skip tour
            </button>
          </div>

          {/* Title */}
          <h3 className="mb-1.5 text-base font-semibold text-gray-900">
            {step.title}
          </h3>

          {/* Description */}
          <p className="mb-5 text-sm leading-relaxed text-gray-600">
            {step.description}
          </p>

          {/* Step indicator dots */}
          <div className="mb-4 flex items-center gap-1.5">{stepDots}</div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                currentStep === 0
                  ? "cursor-not-allowed text-gray-300"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              Previous
            </button>

            <button
              type="button"
              onClick={handleNext}
              className={cn(
                "rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white",
                "transition-colors hover:bg-blue-700",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              )}
            >
              {currentStep === totalSteps - 1 ? "Finish" : "Next"}
            </button>
          </div>

          {/* "Don't show again" option on last step */}
          {currentStep === totalSteps - 1 && (
            <p className="mt-3 text-center text-[11px] text-gray-400">
              This tour will not appear again.
            </p>
          )}

          {/* "Don't show again" link on any step (via skip) */}
          {currentStep < totalSteps - 1 && (
            <button
              type="button"
              onClick={() => completeTour(true)}
              className="mt-3 block w-full text-center text-[11px] text-gray-400 hover:text-gray-500 transition-colors"
            >
              Don&apos;t show again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
