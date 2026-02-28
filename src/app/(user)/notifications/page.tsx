"use client";

import useSWR from "swr";
import Link from "next/link";
import { useState, useCallback } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

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

export default function NotificationsPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const { data, mutate } = useSWR(
    `/api/v1/user/notifications?page=${page}&pageSize=20`,
    fetcher
  );

  const notifications: NotificationItem[] = data?.data ?? [];
  const hasMore = data?.meta?.hasMore ?? false;
  const unreadCount = data?.meta?.unreadCount ?? 0;

  async function markAllRead(): Promise<void> {
    await fetch("/api/v1/user/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    mutate();
  }

  async function markRead(ids: string[]): Promise<void> {
    await fetch("/api/v1/user/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    mutate();
  }

  const formatTimeAgo = useCallback((dateStr: string): string => {
    const diff = globalThis.Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gradient-primary">Notifications</h1>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      {!data ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl shimmer" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="mt-12 flex flex-col items-center text-center">
          <Bell className="h-12 w-12 text-muted/40" />
          <p className="mt-4 text-sm text-muted">No notifications yet</p>
          <p className="mt-1 text-xs text-muted">
            Follow creators and save tips to get notified about updates
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 space-y-2">
            {notifications.map((n) => (
              <Link
                key={n.id}
                href={n.actionUrl ?? "#"}
                onClick={() => {
                  if (!n.isRead) markRead([n.id]);
                }}
                className={`block rounded-2xl p-4 transition-all duration-200 ${
                  n.isRead
                    ? "bg-white shadow-[0_1px_2px_0_rgba(26,54,93,0.04)]"
                    : "bg-[#2B6CB0]/5 shadow-[0_1px_3px_0_rgba(43,108,176,0.1)]"
                } hover:shadow-[0_4px_6px_-1px_rgba(26,54,93,0.08)]`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-text">{n.title}</p>
                      {!n.isRead && (
                        <span className="h-2 w-2 flex-shrink-0 rounded-full bg-accent" />
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-muted">{n.body}</p>
                  </div>
                  <span className="flex-shrink-0 text-xs text-muted">
                    {formatTimeAgo(n.createdAt)}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-6 flex justify-between">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-xs text-muted">Page {page}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasMore}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
