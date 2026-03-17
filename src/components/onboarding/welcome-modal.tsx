"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════
// WELCOME MODAL — First-visit modal introducing the platform.
// Shows before the onboarding tour. Offers "Take a Quick Tour"
// or "Skip" options. Only displays once (localStorage gate).
// ═══════════════════════════════════════════════════════════

// ──── Constants ────

const STORAGE_KEY = "ratemytip-welcome-shown";
const TOUR_DONE_KEY = "ratemytip-onboarding-done";

// ──── Feature Bullets ────

const FEATURES = [
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5 text-blue-600"
        aria-hidden="true"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    text: "We track tips from 500+ analysts and influencers",
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5 text-green-600"
        aria-hidden="true"
      >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    text: "Every tip is verified against real market data",
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5 text-amber-600"
        aria-hidden="true"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    text: "Our RMT Score tells you who actually delivers results",
  },
] as const;

// ──── Component ────

export function WelcomeModal(): React.ReactElement | null {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Only show if not previously shown
  useEffect(() => {
    try {
      const alreadyShown = localStorage.getItem(STORAGE_KEY);
      const tourDone = localStorage.getItem(TOUR_DONE_KEY);
      if (alreadyShown !== "true" && tourDone !== "true") {
        // Small delay so the page renders first
        const timer = setTimeout(() => setIsVisible(true), 500);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore localStorage errors
    }
    return undefined;
  }, []);

  const markShown = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Ignore
    }
  }, []);

  const closeModal = useCallback(
    (startTour: boolean) => {
      setIsClosing(true);
      markShown();

      // Wait for exit animation
      setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);

        if (startTour) {
          // Dispatch custom event that OnboardingTour listens for
          window.dispatchEvent(new CustomEvent("ratemytip:start-tour"));
        }
      }, 200);
    },
    [markShown]
  );

  const handleTakeTour = useCallback(() => {
    closeModal(true);
  }, [closeModal]);

  const handleSkip = useCallback(() => {
    closeModal(false);
    // Also mark tour as done since user chose to skip everything
    try {
      localStorage.setItem(TOUR_DONE_KEY, "true");
    } catch {
      // Ignore
    }
  }, [closeModal]);

  // Close on Escape
  useEffect(() => {
    if (!isVisible) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleSkip();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isVisible, handleSkip]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[10000] flex items-center justify-center px-4",
        "transition-opacity duration-200",
        isClosing ? "opacity-0" : "opacity-100"
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-modal-title"
      aria-describedby="welcome-modal-desc"
    >
      {/* ── Backdrop ── */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleSkip}
        aria-hidden="true"
      />

      {/* ── Modal Card ── */}
      <div
        className={cn(
          "relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl",
          "animate-in fade-in-0 zoom-in-95 duration-300",
          isClosing && "animate-out fade-out-0 zoom-out-95 duration-200"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Logo / Brand Icon */}
        <div className="mb-5 flex justify-center">
          <div
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-2xl",
              "bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-500/25"
            )}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7"
              aria-hidden="true"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2
          id="welcome-modal-title"
          className="mb-1 text-center text-xl font-bold text-gray-900"
        >
          Welcome to RateMyTip!
        </h2>

        {/* Subtitle */}
        <p
          id="welcome-modal-desc"
          className="mb-6 text-center text-sm text-gray-500"
        >
          The truth behind every financial tip
        </p>

        {/* Feature Bullets */}
        <div className="mb-8 space-y-3">
          {FEATURES.map((feature, index) => (
            <div
              key={index}
              className={cn(
                "flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50/50 px-4 py-3",
                "transition-colors duration-150"
              )}
            >
              <div className="mt-0.5 flex-shrink-0">{feature.icon}</div>
              <p className="text-sm leading-relaxed text-gray-700">
                {feature.text}
              </p>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleTakeTour}
            className={cn(
              "w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white",
              "transition-all duration-150",
              "hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/25",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
              "active:scale-[0.98]"
            )}
          >
            Take a Quick Tour
          </button>

          <button
            type="button"
            onClick={handleSkip}
            className={cn(
              "w-full rounded-xl px-5 py-3 text-sm font-medium text-gray-500",
              "transition-colors duration-150",
              "hover:bg-gray-50 hover:text-gray-700",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
            )}
          >
            Skip, I&apos;ll explore on my own
          </button>
        </div>
      </div>
    </div>
  );
}
