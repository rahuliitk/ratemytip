"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { label: "All", href: "/leaderboard" },
  { label: "Intraday", href: "/leaderboard/intraday" },
  { label: "Swing", href: "/leaderboard/swing" },
  { label: "Positional", href: "/leaderboard/positional" },
  { label: "Long Term", href: "/leaderboard/long_term" },
  { label: "Options", href: "/leaderboard/options" },
] as const;

export function CategoryTabs(): React.ReactElement {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/leaderboard") {
      return pathname === "/leaderboard";
    }
    return pathname === href;
  }

  return (
    <div className="flex gap-1 overflow-x-auto border-b border-gray-200">
      {CATEGORIES.map((cat) => (
        <Link
          key={cat.href}
          href={cat.href}
          className={cn(
            "whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
            isActive(cat.href)
              ? "border-accent text-accent"
              : "border-transparent text-muted hover:border-gray-300 hover:text-text"
          )}
        >
          {cat.label}
        </Link>
      ))}
    </div>
  );
}
