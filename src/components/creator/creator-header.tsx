import Image from "next/image";
import { cn } from "@/lib/utils";
import { ScoreRing } from "@/components/shared/score-ring";
import type { CreatorDetail } from "@/types";
import { ExternalLink, BadgeCheck } from "lucide-react";

interface CreatorHeaderProps {
  readonly creator: CreatorDetail;
}

const TIER_STYLES: Record<string, string> = {
  DIAMOND: "bg-violet-100 text-violet-700",
  PLATINUM: "bg-blue-100 text-blue-700",
  GOLD: "bg-amber-100 text-amber-700",
  SILVER: "bg-bg-alt text-muted",
  BRONZE: "bg-orange-100 text-orange-700",
  UNRATED: "bg-bg-alt text-muted",
};

const PLATFORM_LABELS: Record<string, string> = {
  TWITTER: "Twitter/X",
  YOUTUBE: "YouTube",
  TELEGRAM: "Telegram",
  WEBSITE: "Website",
};

export function CreatorHeader({ creator }: CreatorHeaderProps): React.ReactElement {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-surface shadow-sm">
      {/* Gradient banner */}
      <div className="h-32 bg-gradient-to-r from-slate-900 to-slate-800" />

      <div className="flex flex-col gap-6 px-6 pb-6 sm:flex-row sm:items-start">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {creator.profileImageUrl ? (
            <Image
              src={creator.profileImageUrl}
              alt={creator.displayName}
              width={96}
              height={96}
              className="-mt-16 h-24 w-24 rounded-full object-cover ring-4 ring-surface shadow-md"
              unoptimized
            />
          ) : (
            <div className="-mt-16 flex h-24 w-24 items-center justify-center rounded-full bg-bg-alt text-2xl font-bold text-accent ring-4 ring-surface shadow-md">
              {creator.displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Info section */}
        <div className="min-w-0 flex-1 pt-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-text">
              {creator.displayName}
            </h1>
            {creator.isVerified && (
              <BadgeCheck className="h-5 w-5 flex-shrink-0 text-accent" />
            )}
          </div>

          {/* Tier + Specializations */}
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-xs font-semibold",
                TIER_STYLES[creator.tier] ?? TIER_STYLES.UNRATED,
              )}
            >
              {creator.tier}
            </span>
            {creator.specializations.map((spec) => (
              <span
                key={spec}
                className="rounded-md bg-bg-alt px-2 py-0.5 text-xs text-muted"
              >
                {spec}
              </span>
            ))}
          </div>

          {/* Bio */}
          {creator.bio && (
            <p className="mt-2.5 text-sm leading-relaxed text-muted">
              {creator.bio}
            </p>
          )}

          {/* Platform links */}
          {creator.platforms.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {creator.platforms.map((platform) => (
                <a
                  key={platform.id}
                  href={platform.platformUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:bg-bg-alt hover:text-text"
                >
                  {PLATFORM_LABELS[platform.platform] ?? platform.platform}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Score Ring */}
        <div className="flex flex-shrink-0 justify-center sm:justify-end sm:pt-2">
          {creator.score ? (
            <ScoreRing
              score={creator.score.rmtScore}
              size="lg"
              confidenceInterval={creator.score.confidenceInterval}
            />
          ) : (
            <div className="flex h-[120px] w-[120px] items-center justify-center rounded-full border-4 border-border/60">
              <span className="text-sm text-muted">Unrated</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
