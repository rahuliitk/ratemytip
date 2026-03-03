import Image from "next/image";

interface TipExplanationProps {
  readonly content: string;
  readonly imageUrls: string[];
  readonly version: number;
  readonly updatedAt: string;
}

export function TipExplanation({
  content,
  imageUrls,
  version,
  updatedAt,
}: TipExplanationProps): React.ReactElement {
  return (
    <div className="rounded-xl border border-border/60 bg-bg-alt/50 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text">Creator&apos;s Analysis</h3>
        <span className="text-xs text-muted">
          {version > 1 && `v${version} · `}
          {new Date(updatedAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>
      <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-text">
        {content}
      </div>
      {imageUrls.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-3">
          {imageUrls.map((url, i) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="overflow-hidden rounded-lg shadow-sm transition-shadow duration-150 hover:shadow-md"
            >
              <Image
                src={url}
                alt={`Analysis image ${i + 1}`}
                width={256}
                height={128}
                className="h-32 w-auto object-cover"
                unoptimized
              />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
