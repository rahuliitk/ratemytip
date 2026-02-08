"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Search, BarChart3 } from "lucide-react";

export function Header(): React.ReactElement {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-surface">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <BarChart3 className="h-7 w-7 text-accent" />
          <span className="text-xl font-bold text-primary">
            RateMyTip
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/leaderboard"
            className="text-sm font-medium text-muted transition-colors hover:text-primary"
          >
            Leaderboard
          </Link>
          <Link
            href="/search"
            className="flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-primary"
          >
            <Search className="h-4 w-4" />
            Search
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-muted hover:text-primary md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="border-t border-gray-200 bg-surface md:hidden">
          <nav className="flex flex-col gap-1 px-4 py-3">
            <Link
              href="/leaderboard"
              className="rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-bg hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              Leaderboard
            </Link>
            <Link
              href="/search"
              className="rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-bg hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              Search
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
