"use client";

import {
  type ReactNode,
  useCallback,
  useId,
  useRef,
  useState,
} from "react";
import { GLOSSARY_MAP } from "@/lib/glossary/terms";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════
// GLOSSARY TOOLTIP — Inline hover/tap tooltip that explains
// financial terms for beginners using the project glossary.
// ═══════════════════════════════════════════════════════════

interface GlossaryTooltipProps {
  /** The glossary term ID (kebab-case, e.g. "stop-loss") */
  readonly termId: string;
  /** Trigger content — typically the highlighted word(s) */
  readonly children: ReactNode;
}

export function GlossaryTooltip({
  termId,
  children,
}: GlossaryTooltipProps): React.ReactElement {
  const term = GLOSSARY_MAP.get(termId);
  const tooltipId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ──── Hover handlers with small delay to avoid flicker ────

  const openTooltip = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsOpen(true);
  }, []);

  const closeTooltip = useCallback(() => {
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  }, []);

  // Toggle for mobile tap
  const handleClick = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // If the term is not found in the glossary, render children as-is
  if (!term) {
    return <>{children}</>;
  }

  return (
    <span
      className="relative inline-block"
      onMouseEnter={openTooltip}
      onMouseLeave={closeTooltip}
    >
      {/* ── Trigger text with dashed underline ── */}
      <span
        role="button"
        tabIndex={0}
        aria-describedby={isOpen ? tooltipId : undefined}
        className={cn(
          "cursor-help border-b border-dashed border-accent/50",
          "text-accent hover:text-accent-hover",
          "transition-colors duration-150",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          "rounded-sm"
        )}
        onClick={handleClick}
        onFocus={openTooltip}
        onBlur={closeTooltip}
      >
        {children}
      </span>

      {/* ── Tooltip popover ── */}
      {isOpen && (
        <span
          id={tooltipId}
          role="tooltip"
          className={cn(
            // Positioning: above the trigger, centered
            "absolute bottom-full left-1/2 -translate-x-1/2 mb-2",
            // Sizing
            "w-72 sm:w-80",
            // Visual styling using project design tokens
            "rounded-lg border border-border bg-surface p-3",
            "shadow-lg",
            // Text
            "text-sm text-text",
            // Animation
            "animate-scale-in z-50"
          )}
          // Keep tooltip open when hovering over it (prevents flicker)
          onMouseEnter={openTooltip}
          onMouseLeave={closeTooltip}
        >
          {/* ── Term name ── */}
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-accent">
            {term.term}
          </span>

          {/* ── Short definition ── */}
          <span className="block leading-relaxed text-text-secondary">
            {term.shortDefinition}
          </span>

          {/* ── Example (if available) ── */}
          {term.example && (
            <span
              className={cn(
                "mt-2 block rounded-md px-2.5 py-2",
                "bg-accent-subtle text-xs leading-relaxed text-text-secondary"
              )}
            >
              <span className="font-semibold text-accent">Example: </span>
              {term.example}
            </span>
          )}

          {/* ── Arrow/caret pointing down ── */}
          <span
            className={cn(
              "absolute left-1/2 top-full -translate-x-1/2",
              "h-0 w-0",
              "border-x-[6px] border-t-[6px] border-x-transparent border-t-border"
            )}
            aria-hidden="true"
          />
          {/* Inner arrow (fills the border arrow to match bg) */}
          <span
            className={cn(
              "absolute left-1/2 top-full -translate-x-1/2 -mt-px",
              "h-0 w-0",
              "border-x-[5px] border-t-[5px] border-x-transparent border-t-surface"
            )}
            aria-hidden="true"
          />
        </span>
      )}
    </span>
  );
}
