import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ScoreBadge } from "@/components/shared/score-badge";
import { Calendar, Users, MessageSquare, UserCheck } from "lucide-react";

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
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Profile Card */}
      <div className="rounded-xl border border-border/60 bg-surface p-6 shadow-sm sm:p-8">
        {/* Avatar + Name */}
        <div className="flex items-center gap-5">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.displayName}
              width={72}
              height={72}
              className="h-[72px] w-[72px] rounded-full object-cover ring-2 ring-border/40 ring-offset-2"
              unoptimized
            />
          ) : (
            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-accent/10 text-2xl font-bold text-accent ring-2 ring-border/40 ring-offset-2">
              {user.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-text">
              {user.displayName}
            </h1>
            <p className="text-sm text-muted">@{user.username}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-border/60 bg-bg-alt/50 p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-muted">
              <UserCheck className="h-4 w-4" />
            </div>
            <p className="mt-1.5 text-xl font-bold tabular-nums text-text">
              {user._count.follows}
            </p>
            <p className="text-xs text-muted">Following</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-bg-alt/50 p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-muted">
              <MessageSquare className="h-4 w-4" />
            </div>
            <p className="mt-1.5 text-xl font-bold tabular-nums text-text">
              {user._count.comments}
            </p>
            <p className="text-xs text-muted">Comments</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-bg-alt/50 p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-muted">
              <Calendar className="h-4 w-4" />
            </div>
            <p className="mt-1.5 text-sm font-semibold text-text">
              {new Date(user.createdAt).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </p>
            <p className="text-xs text-muted">Joined</p>
          </div>
        </div>
      </div>

      {/* Following Section */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-text">
          Following{" "}
          <span className="text-sm font-normal text-muted">
            ({user._count.follows})
          </span>
        </h2>
        {user.follows.length > 0 ? (
          <div className="mt-4 space-y-2">
            {user.follows.map((f) => (
              <Link
                key={f.creator.slug}
                href={`/creator/${f.creator.slug}`}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-surface p-4 shadow-sm transition-all duration-200 hover:border-accent/30 hover:shadow-md"
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
          <div className="mt-4 rounded-xl border border-border/60 bg-surface p-8 text-center shadow-sm">
            <Users className="mx-auto h-8 w-8 text-muted" />
            <p className="mt-2 text-sm text-muted">
              Not following any creators yet.
            </p>
          </div>
        )}
      </div>

      {/* Recent Comments Section */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-text">
          Recent Comments{" "}
          <span className="text-sm font-normal text-muted">
            ({user._count.comments})
          </span>
        </h2>
        {user.comments.length > 0 ? (
          <div className="mt-4 space-y-2">
            {user.comments.map((c) => (
              <Link
                key={c.id}
                href={`/tip/${c.tip.id}`}
                className="block rounded-xl border border-border/60 bg-surface p-4 shadow-sm transition-all duration-200 hover:border-accent/30 hover:shadow-md"
              >
                <div className="flex items-center gap-2 text-xs text-muted">
                  <span className="rounded-md bg-bg-alt px-1.5 py-0.5 font-medium text-text-secondary">
                    {c.tip.stock.symbol}
                  </span>
                  <span>&middot;</span>
                  <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary line-clamp-2">
                  {c.content}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-border/60 bg-surface p-8 text-center shadow-sm">
            <MessageSquare className="mx-auto h-8 w-8 text-muted" />
            <p className="mt-2 text-sm text-muted">No comments yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
