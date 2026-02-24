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
    <div className="inline-flex rounded-xl bg-gray-100 p-1 gap-1">
      {CATEGORIES.map((cat) => (
        <Link
          key={cat.href}
          href={cat.href}
          className={cn(
            "whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
            isActive(cat.href)
              ? "bg-white text-primary shadow-sm"
              : "text-muted hover:text-text"
          )}
        >
          {cat.label}
        </Link>
      ))}
    </div>
  );
}
