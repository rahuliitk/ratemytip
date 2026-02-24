"use client";

import { useSession } from "next-auth/react";
import useSWR from "swr";
import Link from "next/link";
import { ScoreBadge } from "@/components/shared/score-badge";
import { Users, Bookmark, Star, MessageSquare, Rss } from "lucide-react";
import { Button } from "@/components/ui/button";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DashboardPage(): React.ReactElement {
  const { data: session } = useSession();
  const { data: following } = useSWR("/api/v1/user/following?limit=5", fetcher);
  const { data: profile } = useSWR("/api/v1/user/profile", fetcher);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-primary">
        Welcome back, {session?.user?.name ?? "User"}
      </h1>
      <p className="mt-1 text-sm text-muted">
        @{session?.user?.username ?? "user"}
      </p>

      {/* Quick stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-surface p-4">
          <div className="flex items-center gap-2 text-muted">
            <Users className="h-4 w-4" />
            <span className="text-xs">Following</span>
          </div>
          <p className="mt-1 text-2xl font-bold tabular-nums text-text">
            {profile?.data?.followingCount ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-surface p-4">
          <div className="flex items-center gap-2 text-muted">
            <Bookmark className="h-4 w-4" />
            <span className="text-xs">Saved Tips</span>
          </div>
          <p className="mt-1 text-2xl font-bold tabular-nums text-text">
            {profile?.data?.savedCount ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-surface p-4">
          <div className="flex items-center gap-2 text-muted">
            <Star className="h-4 w-4" />
            <span className="text-xs">Ratings Given</span>
          </div>
          <p className="mt-1 text-2xl font-bold tabular-nums text-text">
            {profile?.data?.ratingsCount ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-surface p-4">
          <div className="flex items-center gap-2 text-muted">
            <MessageSquare className="h-4 w-4" />
            <span className="text-xs">Comments</span>
          </div>
          <p className="mt-1 text-2xl font-bold tabular-nums text-text">
            {profile?.data?.commentsCount ?? 0}
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6 flex gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/feed" className="flex items-center gap-1.5">
            <Rss className="h-4 w-4" />
            My Feed
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/saved" className="flex items-center gap-1.5">
            <Bookmark className="h-4 w-4" />
            Saved Tips
          </Link>
        </Button>
      </div>

      {/* Followed creators */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-primary">Followed Creators</h2>
          <Link
            href="/dashboard"
            className="text-sm text-accent hover:underline"
          >
            View all
          </Link>
        </div>
        {following?.data?.length > 0 ? (
          <div className="mt-4 space-y-3">
            {following.data.map(
              (item: {
                creator: {
                  id: string;
                  slug: string;
                  displayName: string;
                  tier: string;
                  currentScore?: { rmtScore: number };
                };
              }) => (
                <Link
                  key={item.creator.id}
                  href={`/creator/${item.creator.slug}`}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-surface p-3 transition-colors hover:bg-bg"
                >
                  <div>
                    <p className="text-sm font-medium text-text">
                      {item.creator.displayName}
                    </p>
                    <p className="text-xs text-muted">{item.creator.tier}</p>
                  </div>
                  {item.creator.currentScore && (
                    <ScoreBadge score={item.creator.currentScore.rmtScore} />
                  )}
                </Link>
              )
            )}
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-gray-300 p-6 text-center">
            <p className="text-sm text-muted">
              You&apos;re not following any creators yet.
            </p>
            <Link
              href="/leaderboard"
              className="mt-2 inline-block text-sm text-accent hover:underline"
            >
              Browse the leaderboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
