import type { CreatorPlatformInfo } from "@/types";

interface CreatorPlatformsProps {
  readonly platforms: readonly CreatorPlatformInfo[];
}

const PLATFORM_ICONS: Record<string, string> = {
  TWITTER: "𝕏",
  YOUTUBE: "▶",
  TELEGRAM: "✈",
  WEBSITE: "🌐",
};

const PLATFORM_COLORS: Record<string, string> = {
  TWITTER: "bg-black/5 text-black hover:bg-black/10",
  YOUTUBE: "bg-red-50 text-red-700 hover:bg-red-100",
  TELEGRAM: "bg-blue-50 text-blue-700 hover:bg-blue-100",
  WEBSITE: "bg-gray-50 text-gray-700 hover:bg-gray-100",
};

export function CreatorPlatforms({
  platforms,
}: CreatorPlatformsProps): React.ReactElement {
  if (platforms.length === 0) {
    return <></>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {platforms.map((platform) => (
        <a
          key={platform.id}
          href={platform.platformUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            PLATFORM_COLORS[platform.platform] ?? "bg-gray-50 text-gray-700 hover:bg-gray-100"
          }`}
        >
          <span className="text-base">
            {PLATFORM_ICONS[platform.platform] ?? "🔗"}
          </span>
          <span>@{platform.platformHandle}</span>
          {platform.followerCount > 0 && (
            <span className="ml-1 text-xs opacity-60">
              {platform.followerCount >= 1000
                ? `${(platform.followerCount / 1000).toFixed(1)}K`
                : platform.followerCount}
            </span>
          )}
        </a>
      ))}
    </div>
  );
}
