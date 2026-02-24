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
    <div className="rounded-2xl bg-white shadow-[0_1px_3px_0_rgba(26,54,93,0.06),0_1px_2px_-1px_rgba(26,54,93,0.06)] p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-primary">Creator&apos;s Analysis</h3>
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
        <div className="mt-4 flex flex-wrap gap-2">
          {imageUrls.map((url, i) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="overflow-hidden rounded-xl border border-gray-200/60"
            >
              <img
                src={url}
                alt={`Analysis image ${i + 1}`}
                className="h-32 w-auto object-cover"
              />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
