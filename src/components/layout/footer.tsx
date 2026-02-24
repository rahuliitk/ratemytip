import Link from "next/link";
import { Github, BarChart3 } from "lucide-react";

export function Footer(): React.ReactElement {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-white to-[#F7FAFC]">
      {/* Gradient separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#2B6CB0]/20 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#1A365D] to-[#2B6CB0]">
              <BarChart3 className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-gradient-primary">
              Every Call. Rated.
            </span>
          </div>
          <nav className="flex items-center gap-6">
            <Link
              href="/about"
              className="text-sm text-muted transition-all duration-200 hover:text-primary"
            >
              About
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-muted transition-all duration-200 hover:text-primary"
            >
              Privacy
            </Link>
            <a
              href="https://github.com/rahuliitk/ratemytip"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted transition-all duration-200 hover:text-primary"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
          </nav>
        </div>
        <p className="mt-6 text-center text-xs text-muted/70">
          &copy; {currentYear} RateMyTip. All rights reserved. Track, verify, and score stock market tips from influencers and analysts.
        </p>
      </div>
    </footer>
  );
}
