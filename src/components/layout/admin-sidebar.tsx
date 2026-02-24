"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardCheck,
  Users,
  Bot,
  Shield,
  BarChart3,
  UserCheck,
  MessageSquareWarning,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  readonly label: string;
  readonly href: string;
  readonly icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: readonly NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Review Queue", href: "/admin/review", icon: ClipboardCheck },
  { label: "Creators", href: "/admin/creators", icon: Users },
  { label: "Scrapers", href: "/admin/scrapers", icon: Bot },
  { label: "Claims", href: "/admin/claims", icon: UserCheck },
  { label: "Comments", href: "/admin/comments", icon: MessageSquareWarning },
  { label: "Moderation", href: "/admin/moderation", icon: Shield },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
] as const;

export function AdminSidebar(): React.ReactElement {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  }

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-surface">
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <Link href="/admin" className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-accent" />
          <span className="text-lg font-bold text-primary">RMT Admin</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:bg-bg hover:text-primary"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 px-3 py-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-bg hover:text-primary"
        >
          View Public Site
        </Link>
      </div>
    </aside>
  );
}
