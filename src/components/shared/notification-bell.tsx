"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NOTIFICATION } from "@/lib/constants";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell(): React.ReactElement {
  const [open, setOpen] = useState(false);

  const { data, mutate } = useSWR(
    "/api/v1/user/notifications?unreadOnly=false&pageSize=5",
    fetcher,
    { refreshInterval: NOTIFICATION.POLLING_INTERVAL_MS }
  );

  const notifications: NotificationItem[] = data?.data ?? [];
  const unreadCount: number = data?.meta?.unreadCount ?? 0;

  async function markAllRead(): Promise<void> {
    await fetch("/api/v1/user/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    mutate();
  }

  function formatTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-bg hover:text-primary"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs font-normal text-accent hover:underline"
            >
              Mark all read
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted">
            No notifications yet
          </div>
        ) : (
          <>
            {notifications.map((n) => (
              <DropdownMenuItem key={n.id} asChild>
                <Link
                  href={n.actionUrl ?? "/notifications"}
                  className={`cursor-pointer flex-col items-start gap-0.5 px-3 py-2 ${
                    !n.isRead ? "bg-blue-50/50" : ""
                  }`}
                  onClick={() => setOpen(false)}
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <p className="text-sm font-medium text-text">{n.title}</p>
                    {!n.isRead && (
                      <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-accent" />
                    )}
                  </div>
                  <p className="text-xs text-muted line-clamp-2">{n.body}</p>
                  <p className="text-[10px] text-muted">{formatTimeAgo(n.createdAt)}</p>
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href="/notifications"
                className="cursor-pointer justify-center text-center text-sm text-accent"
                onClick={() => setOpen(false)}
              >
                View all notifications
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
