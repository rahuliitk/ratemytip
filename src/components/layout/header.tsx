"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, Search, BarChart3, Github, LogOut, Settings, Bookmark, LayoutDashboard, PenLine, Rss } from "lucide-react";
import { NotificationBell } from "@/components/shared/notification-bell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function Header(): React.ReactElement {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session, status } = useSession();

  const isUser = session?.user?.userType === "user";
  const isCreator = isUser && session?.user?.role === "CREATOR";

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
        <nav className="hidden items-center gap-6 md:flex">
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
          <a
            href="https://github.com/rahuliitk/ratemytip"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted transition-colors hover:text-primary"
            aria-label="GitHub repository"
          >
            <Github className="h-5 w-5" />
          </a>

          {/* Auth section */}
          {status === "loading" ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
          ) : isUser ? (
            <div className="flex items-center gap-2">
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent transition-colors hover:bg-accent/20"
                  aria-label="User menu"
                >
                  {session.user.name?.charAt(0).toUpperCase() ?? "U"}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="text-sm font-medium">{session.user.name}</p>
                  <p className="text-xs text-muted">@{session.user.username}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                {isCreator && (
                  <DropdownMenuItem asChild>
                    <Link href="/creator-dashboard" className="cursor-pointer">
                      <PenLine className="mr-2 h-4 w-4" />
                      Creator Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/feed" className="cursor-pointer">
                    <Rss className="mr-2 h-4 w-4" />
                    My Feed
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/saved" className="cursor-pointer">
                    <Bookmark className="mr-2 h-4 w-4" />
                    Saved Tips
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-danger"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Sign up</Link>
              </Button>
            </div>
          )}
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
            <a
              href="https://github.com/rahuliitk/ratemytip"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-bg hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
            {/* Mobile auth links */}
            {isUser ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-bg hover:text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                {isCreator && (
                  <Link
                    href="/creator-dashboard"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-bg hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <PenLine className="h-4 w-4" />
                    Creator Dashboard
                  </Link>
                )}
                <Link
                  href="/saved"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-bg hover:text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Bookmark className="h-4 w-4" />
                  Saved Tips
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-bg hover:text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <button
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-danger hover:bg-bg"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </>
            ) : status !== "loading" ? (
              <div className="flex gap-2 px-3 pt-2">
                <Link
                  href="/login"
                  className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-center text-sm font-medium text-muted hover:bg-bg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="flex-1 rounded-md bg-primary px-3 py-2 text-center text-sm font-medium text-white hover:bg-primary/90"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign up
                </Link>
              </div>
            ) : null}
          </nav>
        </div>
      )}
    </header>
  );
}
