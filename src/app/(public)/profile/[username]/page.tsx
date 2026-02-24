import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ScoreBadge } from "@/components/shared/score-badge";
import { User, Calendar, Users } from "lucide-react";

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username } = await params;
  const user = await db.user.findUnique({
    where: { username, isActive: true },
    select: { displayName: true, username: true },
  });

  if (!user) return { title: "User Not Found | RateMyTip" };

  return {
    title: `${user.displayName} (@${user.username}) | RateMyTip`,
    description: `View ${user.displayName}'s profile on RateMyTip — see who they follow and their community activity.`,
  };
}

export default async function PublicProfilePage({
  params,
}: PageProps): Promise<React.ReactElement> {
  const { username } = await params;

  const user = await db.user.findUnique({
    where: { username, isActive: true },
    select: {
      id: true,
      displayName: true,
      username: true,
      avatarUrl: true,
      createdAt: true,
      _count: { select: { follows: true, comments: true } },
      follows: {
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          creator: {
            select: {
              slug: true,
              displayName: true,
              tier: true,
              currentScore: { select: { rmtScore: true } },
            },
          },
        },
      },
      comments: {
        take: 5,
        where: { isDeleted: false, isHidden: false },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          content: true,
          createdAt: true,
          tip: {
            select: {
              id: true,
              stock: { select: { symbol: true } },
            },
          },
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Profile header */}
      <div className="flex items-center gap-4">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.displayName}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-xl font-bold text-accent">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-primary">{user.displayName}</h1>
          <p className="text-sm text-muted">@{user.username}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 flex gap-6">
        <div className="flex items-center gap-1.5 text-sm text-muted">
          <Users className="h-4 w-4" />
          <span className="font-medium text-text">{user._count.follows}</span> following
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted">
          <Calendar className="h-4 w-4" />
          Joined {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
        </div>
      </div>

      {/* Followed creators */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-primary">
          Following ({user._count.follows})
        </h2>
        {user.follows.length > 0 ? (
          <div className="mt-3 space-y-2">
            {user.follows.map((f) => (
              <Link
                key={f.creator.slug}
                href={`/creator/${f.creator.slug}`}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-surface p-3 transition-colors hover:bg-bg"
              >
                <div>
                  <p className="text-sm font-medium text-text">
                    {f.creator.displayName}
                  </p>
                  <p className="text-xs text-muted">{f.creator.tier}</p>
                </div>
                {f.creator.currentScore && (
                  <ScoreBadge score={f.creator.currentScore.rmtScore} size="sm" />
                )}
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">Not following any creators yet.</p>
        )}
      </div>

      {/* Recent comments */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-primary">
          Recent Comments ({user._count.comments})
        </h2>
        {user.comments.length > 0 ? (
          <div className="mt-3 space-y-3">
            {user.comments.map((c) => (
              <Link
                key={c.id}
                href={`/tip/${c.tip.id}`}
                className="block rounded-lg border border-gray-200 bg-surface p-3 transition-colors hover:bg-bg"
              >
                <p className="text-xs text-muted">
                  On {c.tip.stock.symbol} &middot;{" "}
                  {new Date(c.createdAt).toLocaleDateString()}
                </p>
                <p className="mt-1 text-sm text-text line-clamp-2">{c.content}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">No comments yet.</p>
        )}
      </div>
    </div>
  );
}
