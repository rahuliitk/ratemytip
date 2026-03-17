"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════
// EXPERIENCE LEVEL FILTER / BEGINNER MODE
//
// Provides a React context for experience level selection and
// a toggle component that renders as a chip in the top-right
// area. Persists the user's choice in localStorage.
// ═══════════════════════════════════════════════════════════

// ──── Types ────

type ExperienceLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

interface ExperienceLevelContextValue {
  readonly level: ExperienceLevel;
  readonly setLevel: (level: ExperienceLevel) => void;
  readonly isBeginnerMode: boolean;
}

// ──── Constants ────

const STORAGE_KEY = "ratemytip-experience-level";
const DEFAULT_LEVEL: ExperienceLevel = "INTERMEDIATE";

const LEVEL_CONFIG: Record<
  ExperienceLevel,
  { label: string; bg: string; text: string; border: string; ring: string }
> = {
  BEGINNER: {
    label: "Beginner Mode",
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-300",
    ring: "ring-green-500/20",
  },
  INTERMEDIATE: {
    label: "Standard",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-300",
    ring: "ring-blue-500/20",
  },
  ADVANCED: {
    label: "Advanced",
    bg: "bg-gray-50",
    text: "text-gray-700",
    border: "border-gray-300",
    ring: "ring-gray-500/20",
  },
};

const LEVEL_ORDER: readonly ExperienceLevel[] = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
] as const;

// ──── Context ────

const ExperienceLevelContext = createContext<ExperienceLevelContextValue | null>(
  null
);

// ──── Provider ────

interface ExperienceLevelProviderProps {
  readonly children: ReactNode;
}

export function ExperienceLevelProvider({
  children,
}: ExperienceLevelProviderProps): React.ReactElement {
  const [level, setLevelState] = useState<ExperienceLevel>(DEFAULT_LEVEL);
  const [mounted, setMounted] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && LEVEL_ORDER.includes(stored as ExperienceLevel)) {
        setLevelState(stored as ExperienceLevel);
      }
    } catch {
      // localStorage may be unavailable (e.g. private browsing on some browsers)
    }
    setMounted(true);
  }, []);

  const setLevel = useCallback((newLevel: ExperienceLevel) => {
    setLevelState(newLevel);
    try {
      localStorage.setItem(STORAGE_KEY, newLevel);
    } catch {
      // Silently ignore storage errors
    }
    // Notify other components (e.g., Getting Started checklist) that level was set
    try {
      window.dispatchEvent(new CustomEvent("ratemytip:experience-level-set"));
    } catch {
      // Ignore dispatch errors
    }
  }, []);

  const value = useMemo<ExperienceLevelContextValue>(
    () => ({
      level: mounted ? level : DEFAULT_LEVEL,
      setLevel,
      isBeginnerMode: mounted ? level === "BEGINNER" : false,
    }),
    [level, setLevel, mounted]
  );

  return (
    <ExperienceLevelContext.Provider value={value}>
      {children}
    </ExperienceLevelContext.Provider>
  );
}

// ──── Hook ────

export function useExperienceLevel(): ExperienceLevelContextValue {
  const context = useContext(ExperienceLevelContext);
  if (!context) {
    throw new Error(
      "useExperienceLevel must be used within an ExperienceLevelProvider"
    );
  }
  return context;
}

// ──── Toggle Component ────

interface BeginnerModeToggleProps {
  readonly className?: string;
}

export function BeginnerModeToggle({
  className,
}: BeginnerModeToggleProps): React.ReactElement {
  const { level, setLevel } = useExperienceLevel();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const config = LEVEL_CONFIG[level];

  const handleSelect = useCallback(
    (selected: ExperienceLevel) => {
      setLevel(selected);
      setIsDropdownOpen(false);
    },
    [setLevel]
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-beginner-toggle]")) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isDropdownOpen]);

  return (
    <div
      className={cn("relative inline-block", className)}
      data-beginner-toggle
      id="beginner-mode-toggle"
    >
      {/* ── Active Level Chip ── */}
      <button
        type="button"
        onClick={() => setIsDropdownOpen((prev) => !prev)}
        aria-expanded={isDropdownOpen}
        aria-haspopup="listbox"
        aria-label={`Experience level: ${config.label}. Click to change.`}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1",
          "text-xs font-medium transition-all duration-150",
          "cursor-pointer select-none",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
          config.bg,
          config.text,
          config.border,
          isDropdownOpen && "ring-2",
          isDropdownOpen && config.ring
        )}
      >
        {/* Colored dot */}
        <span
          className={cn(
            "inline-block h-2 w-2 rounded-full",
            level === "BEGINNER" && "bg-green-500",
            level === "INTERMEDIATE" && "bg-blue-500",
            level === "ADVANCED" && "bg-gray-500"
          )}
          aria-hidden="true"
        />
        {config.label}
        {/* Chevron */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          className={cn(
            "h-3 w-3 transition-transform duration-150",
            isDropdownOpen && "rotate-180"
          )}
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* ── Dropdown ── */}
      {isDropdownOpen && (
        <div
          role="listbox"
          aria-label="Select experience level"
          className={cn(
            "absolute right-0 top-full z-50 mt-1.5",
            "w-48 rounded-lg border border-gray-200 bg-white py-1",
            "shadow-lg",
            "animate-in fade-in-0 zoom-in-95"
          )}
        >
          {LEVEL_ORDER.map((option) => {
            const optConfig = LEVEL_CONFIG[option];
            const isSelected = option === level;

            return (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option)}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm",
                  "transition-colors duration-100",
                  "hover:bg-gray-50",
                  isSelected && "bg-gray-50 font-medium"
                )}
              >
                {/* Colored dot */}
                <span
                  className={cn(
                    "inline-block h-2.5 w-2.5 rounded-full",
                    option === "BEGINNER" && "bg-green-500",
                    option === "INTERMEDIATE" && "bg-blue-500",
                    option === "ADVANCED" && "bg-gray-400"
                  )}
                  aria-hidden="true"
                />
                <span className="flex flex-col">
                  <span className={cn("text-sm", optConfig.text)}>
                    {optConfig.label}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {option === "BEGINNER" && "Extra guidance & simpler views"}
                    {option === "INTERMEDIATE" && "Default experience"}
                    {option === "ADVANCED" && "All data, minimal hand-holding"}
                  </span>
                </span>
                {/* Checkmark for selected */}
                {isSelected && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="ml-auto h-4 w-4 text-blue-600"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
