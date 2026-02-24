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
  YOUTUBE: "bg-[#C53030]/10 text-[#C53030] hover:bg-[#C53030]/15",
  TELEGRAM: "bg-[#2B6CB0]/10 text-[#2B6CB0] hover:bg-[#2B6CB0]/15",
  WEBSITE: "bg-gray-100 text-gray-700 hover:bg-gray-200",
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
