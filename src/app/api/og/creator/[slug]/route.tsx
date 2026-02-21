import { ImageResponse } from "@vercel/og";

export const runtime = "edge";

function getScoreColor(score: number): string {
  if (score >= 90) return "#276749";
  if (score >= 75) return "#2F855A";
  if (score >= 60) return "#2B6CB0";
  if (score >= 45) return "#C05621";
  if (score >= 30) return "#C53030";
  return "#9B2C2C";
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
): Promise<ImageResponse> {
  const { slug } = await params;

  // Note: In edge runtime, we can't use Prisma directly.
  // Fetch from API instead, or use a simplified approach.
  // For now, generate a generic OG image with the slug.

  const score = 75; // placeholder
  const name = slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#F7FAFC",
          padding: "40px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 700, color: "#1A365D" }}>
            RateMyTip
          </div>
          <div style={{ fontSize: 18, color: "#718096" }}>ratemytip.com</div>
        </div>
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            gap: "40px",
            marginTop: "40px",
          }}
        >
          <div
            style={{
              width: 160,
              height: 160,
              borderRadius: "50%",
              backgroundColor: getScoreColor(score),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
            }}
          >
            <div style={{ fontSize: 48, fontWeight: 700, color: "white" }}>
              {score}
            </div>
            <div style={{ fontSize: 16, color: "white", opacity: 0.9 }}>
              RMT Score
            </div>
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "8px" }}
          >
            <div style={{ fontSize: 36, fontWeight: 700, color: "#1A202C" }}>
              {name}
            </div>
            <div style={{ fontSize: 20, color: "#718096" }}>
              Verified Track Record
            </div>
          </div>
        </div>
        <div style={{ fontSize: 18, color: "#718096", marginTop: "20px" }}>
          Every Call. Rated.
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
