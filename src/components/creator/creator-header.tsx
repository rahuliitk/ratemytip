import { ScoreRing } from "@/components/shared/score-ring";
import type { CreatorDetail } from "@/types";
import { ExternalLink } from "lucide-react";

interface CreatorHeaderProps {
  readonly creator: CreatorDetail;
}

const TIER_COLORS: Record<string, string> = {
  DIAMOND: "bg-purple-100 text-purple-800",
  PLATINUM: "bg-blue-100 text-blue-800",
  GOLD: "bg-yellow-100 text-yellow-800",
  SILVER: "bg-gray-200 text-gray-700",
  BRONZE: "bg-orange-100 text-orange-700",
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
    <div className="flex flex-col gap-6 rounded-lg border border-gray-200 bg-surface p-6 sm:flex-row sm:items-start">
      {/* Avatar + Info */}
      <div className="flex flex-1 items-start gap-4">
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
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-primary">
              {creator.displayName}
            </h1>
            {creator.isVerified && (
              <span className="text-sm text-accent">Verified</span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span
              className={`rounded px-2 py-0.5 text-xs font-semibold ${
                TIER_COLORS[creator.tier] ?? TIER_COLORS.UNRATED
              }`}
            >
              {creator.tier}
            </span>
            {creator.specializations.map((spec) => (
              <span
                key={spec}
                className="rounded bg-gray-100 px-2 py-0.5 text-xs text-muted"
              >
                {spec}
              </span>
            ))}
          </div>

          {creator.bio && (
            <p className="mt-2 text-sm text-muted">{creator.bio}</p>
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
                  className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
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
            confidenceInterval={creator.score.confidenceInterval}
          />
        ) : (
          <div className="flex h-[120px] w-[120px] items-center justify-center rounded-full border-4 border-gray-200">
            <span className="text-sm text-muted">Unrated</span>
          </div>
        )}
      </div>
    </div>
  );
}
