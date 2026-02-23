import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Creator Profile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function getScoreColor(score: number): string {
  if (score >= 90) return "#276749";
  if (score >= 75) return "#2F855A";
  if (score >= 60) return "#2B6CB0";
  if (score >= 45) return "#C05621";
  if (score >= 30) return "#C53030";
  return "#9B2C2C";
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<ImageResponse> {
  const { slug } = await params;
  let name = slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  let score = 0;
  let accuracy = "N/A";
  let totalTips = 0;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/v1/creators/${slug}`, {
      next: { revalidate: 600 },
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        name = json.data.displayName ?? name;
        score = json.data.score?.rmtScore ?? 0;
        accuracy = json.data.score
          ? `${(json.data.score.accuracyRate * 100).toFixed(1)}%`
          : "N/A";
        totalTips = json.data.stats?.totalTips ?? 0;
      }
    }
  } catch {
    // Fall back to slug-based display
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#1A365D",
          color: "white",
          padding: "60px",
        }}
      >
        <div style={{ fontSize: 28, opacity: 0.8 }}>RateMyTip</div>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: "40px",
          }}
        >
          {score > 0 && (
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                backgroundColor: getScoreColor(score),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
              }}
            >
              <div style={{ fontSize: 40, fontWeight: 700 }}>
                {Math.round(score)}
              </div>
              <div style={{ fontSize: 12, opacity: 0.9 }}>RMT</div>
            </div>
          )}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "8px" }}
          >
            <div style={{ fontSize: 56, fontWeight: 700 }}>{name}</div>
            <div style={{ fontSize: 22, opacity: 0.7 }}>
              {accuracy !== "N/A" ? `${accuracy} accuracy` : ""}{" "}
              {totalTips > 0 ? `· ${totalTips} tips tracked` : ""}
            </div>
          </div>
        </div>
        <div style={{ fontSize: 22, opacity: 0.7 }}>
          Every Call. Rated. | ratemytip.com
        </div>
      </div>
    ),
    { ...size }
  );
}
