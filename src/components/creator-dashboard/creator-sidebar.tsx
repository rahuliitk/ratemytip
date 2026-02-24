"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ListChecks, BarChart3, UserCog, PlusCircle } from "lucide-react";

const NAV_ITEMS = [
  { href: "/creator-dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/creator-dashboard/my-tips", label: "My Tips", icon: ListChecks },
  { href: "/creator-dashboard/new-tip", label: "New Tip", icon: PlusCircle },
  { href: "/creator-dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/creator-dashboard/profile", label: "Profile", icon: UserCog },
] as const;

export function CreatorSidebar(): React.ReactElement {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-accent/10 text-accent"
                : "text-muted hover:bg-bg hover:text-primary"
            }`}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
