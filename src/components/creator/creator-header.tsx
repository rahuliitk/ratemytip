import Image from "next/image";
import { cn } from "@/lib/utils";
import { ScoreRing } from "@/components/shared/score-ring";
import type { CreatorDetail } from "@/types";
import { ExternalLink } from "lucide-react";

interface CreatorHeaderProps {
  readonly creator: CreatorDetail;
}

const TIER_COLORS: Record<string, string> = {
  DIAMOND: "bg-gradient-to-r from-purple-500 to-purple-400 text-white",
  PLATINUM: "bg-gradient-to-r from-blue-500 to-blue-400 text-white",
  GOLD: "bg-gradient-to-r from-yellow-500 to-yellow-400 text-white",
  SILVER: "bg-gradient-to-r from-gray-400 to-gray-300 text-white",
  BRONZE: "bg-gradient-to-r from-orange-500 to-orange-400 text-white",
  UNRATED: "bg-gray-100 text-gray-500",
};

const PLATFORM_LABELS: Record<string, string> = {
  TWITTER: "Twitter/X",
  YOUTUBE: "YouTube",
  TELEGRAM: "Telegram",
  WEBSITE: "Website",
};

export function CreatorHeader({ creator }: CreatorHeaderProps): React.ReactElement {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md">
      {/* Gradient banner */}
      <div className="h-24 bg-gradient-to-r from-[#0F2B4E] via-[#1A365D] to-[#2B6CB0]" />

      <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start">
        {/* Avatar + Info */}
        <div className="flex flex-1 items-start gap-4">
          {creator.profileImageUrl ? (
            <Image
              src={creator.profileImageUrl}
              alt={creator.displayName}
              width={80}
              height={80}
              className="-mt-14 h-20 w-20 rounded-full border-4 border-white object-cover shadow-md ring-4 ring-white"
              unoptimized
            />
          ) : (
            <div className="-mt-14 flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-[#1A365D]/10 to-[#2B6CB0]/10 text-2xl font-bold text-accent shadow-md ring-4 ring-white">
              {creator.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 pt-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gradient-primary">
                {creator.displayName}
              </h1>
              {creator.isVerified && (
                <span className="text-sm text-accent">Verified</span>
              )}
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  TIER_COLORS[creator.tier] ?? TIER_COLORS.UNRATED,
                )}
              >
                {creator.tier}
              </span>
              {creator.specializations.map((spec) => (
                <span
                  key={spec}
                  className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-muted"
                >
                  {spec}
                </span>
              ))}
            </div>

            {creator.bio && (
              <p className="mt-2.5 text-sm text-muted">{creator.bio}</p>
            )}

            {/* Platform links */}
            {creator.platforms.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-3">
                {creator.platforms.map((platform) => (
                  <a
                    key={platform.id}
                    href={platform.platformUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-accent transition-all duration-200 hover:bg-[#2B6CB0]/5 hover:underline"
                  >
                    {PLATFORM_LABELS[platform.platform] ?? platform.platform}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Score Ring */}
        <div className="flex justify-center sm:justify-end">
          {creator.score ? (
            <ScoreRing
              score={creator.score.rmtScore}
              size="lg"
              confidenceInterval={creator.score.confidenceInterval}
            />
          ) : (
            <div className="flex h-[120px] w-[120px] items-center justify-center rounded-full border-4 border-gray-100">
              <span className="text-sm text-muted">Unrated</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
