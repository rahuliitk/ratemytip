"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ScoreBadge } from "@/components/shared/score-badge";
import { TipStatusBadge } from "@/components/tip/tip-status-badge";
import { formatPrice, formatPercent } from "@/lib/utils/format";
import type { TipStatus } from "@/types";
import {
  ArrowLeft,
  Loader2,
  ShieldCheck,
  ShieldOff,
  Flag,
  ExternalLink,
} from "lucide-react";

interface CreatorDetail {
  id: string;
  slug: string;
  displayName: string;
  bio: string | null;
  profileImageUrl: string | null;
  isActive: boolean;
  isVerified: boolean;
  tier: string;
  specializations: string[];
  totalTips: number;
  activeTips: number;
  completedTips: number;
  followerCount: number;
  firstTipAt: string | null;
  lastTipAt: string | null;
  createdAt: string;
  platforms: {
    id: string;
    platform: string;
    platformHandle: string;
    platformUrl: string;
    followerCount: number;
    lastScrapedAt: string | null;
  }[];
  currentScore: {
    rmtScore: number;
    accuracyScore: number;
    riskAdjustedScore: number;
    consistencyScore: number;
    volumeFactorScore: number;
    accuracyRate: number;
    avgReturnPct: number;
    totalScoredTips: number;
    winStreak: number;
    lossStreak: number;
  } | null;
  recentTips: {
    id: string;
    direction: string;
    entryPrice: number;
    target1: number;
    stopLoss: number;
    status: TipStatus;
    timeframe: string;
    tipTimestamp: string;
    returnPct: number | null;
    stock: { symbol: string; name: string };
  }[];
  moderationActions: {
    id: string;
    action: string;
    reason: string;
    createdAt: string;
    admin: { name: string };
  }[];
}

export default function AdminCreatorDetailPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [creator, setCreator] = useState<CreatorDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [moderationReason, setModerationReason] = useState("");

  const fetchCreator = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/creators?id=${id}`);
      const data = await res.json();
      if (data.success) {
        setCreator(data.data);
      }
    } catch {
      // Silently handle
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCreator();
  }, [fetchCreator]);

  async function handleModeration(
    action: "ACTIVATED" | "DEACTIVATED" | "FLAGGED" | "UNFLAGGED"
  ): Promise<void> {
    if (!moderationReason.trim() && action !== "ACTIVATED") return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/creators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: id,
          action,
          reason: moderationReason || `Creator ${action.toLowerCase()}`,
        }),
      });
      if (res.ok) {
        setModerationReason("");
        await fetchCreator();
      }
    } catch {
      // Silently handle
    } finally {
      setActionLoading(false);
    }
  }

  async function handleToggleActive(): Promise<void> {
    if (!creator) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/creators`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          isActive: !creator.isActive,
        }),
      });
      if (res.ok) {
        await fetchCreator();
      }
    } catch {
      // Silently handle
    } finally {
      setActionLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="py-24 text-center">
        <p className="text-muted">Creator not found</p>
        <button
          type="button"
          onClick={() => router.push("/admin/creators")}
          className="mt-4 text-sm text-accent hover:underline"
        >
          Back to creators
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/admin/creators"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Creators
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between rounded-2xl bg-white shadow-[0_1px_3px_0_rgba(26,54,93,0.06),0_1px_2px_-1px_rgba(26,54,93,0.06)] p-6">
        <div className="flex items-center gap-4">
          {creator.profileImageUrl ? (
            <img
              src={creator.profileImageUrl}
              alt={creator.displayName}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-2xl font-bold text-accent">
              {creator.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gradient-primary">
                {creator.displayName}
              </h1>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  creator.isActive
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {creator.isActive ? "Active" : "Inactive"}
              </span>
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-muted">
                {creator.tier}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted">/{creator.slug}</p>
            {creator.bio && (
              <p className="mt-2 max-w-lg text-sm text-text">{creator.bio}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {creator.currentScore && (
            <ScoreBadge score={creator.currentScore.rmtScore} size="lg" />
          )}
          <Link
            href={`/creator/${creator.slug}`}
            className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Public Profile
          </Link>
        </div>
      </div>

      {/* Stats + Score Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {[
          { label: "Total Tips", value: creator.totalTips },
          { label: "Active Tips", value: creator.activeTips },
          { label: "Completed Tips", value: creator.completedTips },
          { label: "Followers", value: creator.followerCount.toLocaleString("en-IN") },
          {
            label: "Accuracy",
            value: creator.currentScore
              ? `${(creator.currentScore.accuracyRate * 100).toFixed(1)}%`
              : "-",
          },
          {
            label: "Avg Return",
            value: creator.currentScore
              ? formatPercent(creator.currentScore.avgReturnPct)
              : "-",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl bg-white shadow-[0_1px_2px_0_rgba(26,54,93,0.04)] p-4"
          >
            <p className="text-xs text-muted">{stat.label}</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-text">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Score Breakdown */}
      {creator.currentScore && (
        <div className="rounded-2xl bg-white shadow-[0_1px_3px_0_rgba(26,54,93,0.06),0_1px_2px_-1px_rgba(26,54,93,0.06)] p-6">
          <h2 className="text-sm font-semibold text-primary">Score Breakdown</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Accuracy (40%)", value: creator.currentScore.accuracyScore },
              { label: "Risk-Adjusted (30%)", value: creator.currentScore.riskAdjustedScore },
              { label: "Consistency (20%)", value: creator.currentScore.consistencyScore },
              { label: "Volume (10%)", value: creator.currentScore.volumeFactorScore },
            ].map((comp) => (
              <div key={comp.label}>
                <p className="text-xs text-muted">{comp.label}</p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-2 flex-1 rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-accent"
                      style={{ width: `${Math.min(comp.value, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium tabular-nums text-text">
                    {comp.value.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Platforms */}
      {creator.platforms.length > 0 && (
        <div className="rounded-2xl bg-white shadow-[0_1px_3px_0_rgba(26,54,93,0.06),0_1px_2px_-1px_rgba(26,54,93,0.06)] p-6">
          <h2 className="text-sm font-semibold text-primary">Platforms</h2>
          <div className="mt-3 space-y-2">
            {creator.platforms.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded bg-bg p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded bg-gray-200 px-2 py-0.5 text-xs font-medium">
                    {p.platform}
                  </span>
                  <a
                    href={p.platformUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-accent hover:underline"
                  >
                    @{p.platformHandle}
                  </a>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted">
                  <span>{p.followerCount.toLocaleString()} followers</span>
                  <span>
                    Last scraped:{" "}
                    {p.lastScrapedAt
                      ? new Date(p.lastScrapedAt).toLocaleDateString("en-IN")
                      : "Never"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Moderation Actions */}
      <div className="rounded-2xl bg-white shadow-[0_1px_3px_0_rgba(26,54,93,0.06),0_1px_2px_-1px_rgba(26,54,93,0.06)] p-6">
        <h2 className="text-sm font-semibold text-primary">Moderation</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={moderationReason}
            onChange={(e) => setModerationReason(e.target.value)}
            placeholder="Reason for moderation action..."
            className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleToggleActive}
              disabled={actionLoading}
              className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-text hover:bg-gray-200 disabled:opacity-50"
            >
              {creator.isActive ? (
                <ShieldOff className="h-4 w-4" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              {creator.isActive ? "Deactivate" : "Activate"}
            </button>
            <button
              type="button"
              onClick={() => handleModeration("FLAGGED")}
              disabled={actionLoading || !moderationReason.trim()}
              className="inline-flex items-center gap-1 rounded-md bg-warning/10 px-3 py-2 text-sm font-medium text-warning hover:bg-warning/20 disabled:opacity-50"
            >
              <Flag className="h-4 w-4" />
              Flag
            </button>
          </div>
        </div>

        {/* Moderation History */}
        {creator.moderationActions.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-muted">History</p>
            {creator.moderationActions.map((action) => (
              <div
                key={action.id}
                className="flex items-center justify-between rounded bg-bg p-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded bg-gray-200 px-1.5 py-0.5 font-medium">
                    {action.action}
                  </span>
                  <span className="text-muted">{action.reason}</span>
                </div>
                <div className="flex items-center gap-2 text-muted">
                  <span>{action.admin.name}</span>
                  <span>
                    {new Date(action.createdAt).toLocaleDateString("en-IN")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Tips */}
      <div className="rounded-2xl bg-white shadow-[0_1px_3px_0_rgba(26,54,93,0.06),0_1px_2px_-1px_rgba(26,54,93,0.06)] p-6">
        <h2 className="text-sm font-semibold text-primary">
          Recent Tips ({creator.recentTips.length})
        </h2>
        {creator.recentTips.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No tips recorded yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-2 text-xs font-semibold uppercase text-muted">
                    Stock
                  </th>
                  <th className="pb-2 text-xs font-semibold uppercase text-muted">
                    Direction
                  </th>
                  <th className="pb-2 text-right text-xs font-semibold uppercase text-muted">
                    Entry
                  </th>
                  <th className="pb-2 text-right text-xs font-semibold uppercase text-muted">
                    Target
                  </th>
                  <th className="pb-2 text-right text-xs font-semibold uppercase text-muted">
                    SL
                  </th>
                  <th className="pb-2 text-xs font-semibold uppercase text-muted">
                    Status
                  </th>
                  <th className="pb-2 text-right text-xs font-semibold uppercase text-muted">
                    Return
                  </th>
                  <th className="pb-2 text-xs font-semibold uppercase text-muted">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {creator.recentTips.map((tip) => (
                  <tr key={tip.id} className="hover:bg-[#2B6CB0]/5">
                    <td className="py-2 text-sm font-medium text-text">
                      <Link
                        href={`/tip/${tip.id}`}
                        className="hover:underline"
                      >
                        {tip.stock.symbol}
                      </Link>
                    </td>
                    <td className="py-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                          tip.direction === "BUY"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {tip.direction}
                      </span>
                    </td>
                    <td className="py-2 text-right text-sm tabular-nums text-muted">
                      {formatPrice(tip.entryPrice)}
                    </td>
                    <td className="py-2 text-right text-sm tabular-nums text-success">
                      {formatPrice(tip.target1)}
                    </td>
                    <td className="py-2 text-right text-sm tabular-nums text-danger">
                      {formatPrice(tip.stopLoss)}
                    </td>
                    <td className="py-2">
                      <TipStatusBadge status={tip.status} />
                    </td>
                    <td className="py-2 text-right text-sm tabular-nums">
                      {tip.returnPct !== null ? (
                        <span
                          className={
                            tip.returnPct >= 0 ? "text-success" : "text-danger"
                          }
                        >
                          {formatPercent(tip.returnPct)}
                        </span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td className="py-2 text-xs text-muted">
                      {new Date(tip.tipTimestamp).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
