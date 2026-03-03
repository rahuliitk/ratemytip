import type { CreatorPlatformInfo } from "@/types";
import { ExternalLink } from "lucide-react";

interface CreatorPlatformsProps {
  readonly platforms: readonly CreatorPlatformInfo[];
}

const PLATFORM_ICONS: Record<string, string> = {
  TWITTER: "X",
  YOUTUBE: "YT",
  TELEGRAM: "TG",
  WEBSITE: "WEB",
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
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted transition-colors hover:bg-bg-alt hover:text-text"
        >
          <span className="text-xs font-semibold">
            {PLATFORM_ICONS[platform.platform] ?? "LINK"}
          </span>
          <span>@{platform.platformHandle}</span>
          {platform.followerCount > 0 && (
            <span className="ml-1 text-xs text-muted-light">
              {platform.followerCount >= 1000
                ? `${(platform.followerCount / 1000).toFixed(1)}K`
                : platform.followerCount}
            </span>
          )}
          <ExternalLink className="h-3 w-3 text-muted" />
        </a>
      ))}
    </div>
  );
}
