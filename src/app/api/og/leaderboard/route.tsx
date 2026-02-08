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

interface LeaderboardEntry {
  readonly rank: number;
  readonly name: string;
  readonly score: number;
  readonly accuracy: string;
}

export async function GET(): Promise<ImageResponse> {
  // Note: In edge runtime, we can't use Prisma directly.
  // In production, fetch from an internal API endpoint or use fetch().
  // For now, use placeholder data.
  const topCreators: readonly LeaderboardEntry[] = [
    { rank: 1, name: "Top Creator 1", score: 92, accuracy: "84.2%" },
    { rank: 2, name: "Top Creator 2", score: 87, accuracy: "79.5%" },
    { rank: 3, name: "Top Creator 3", score: 81, accuracy: "76.1%" },
    { rank: 4, name: "Top Creator 4", score: 78, accuracy: "72.8%" },
    { rank: 5, name: "Top Creator 5", score: 74, accuracy: "70.3%" },
  ];

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
            fontSize: 32,
            fontWeight: 700,
            color: "#1A202C",
            marginTop: "24px",
          }}
        >
          Top Stock Tip Creators
        </div>
        <div style={{ fontSize: 18, color: "#718096", marginTop: "4px" }}>
          Ranked by RMT Score — Verified Track Records
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "28px",
            gap: "0px",
          }}
        >
          {/* Table Header */}
          <div
            style={{
              display: "flex",
              padding: "12px 20px",
              backgroundColor: "#1A365D",
              borderRadius: "8px 8px 0 0",
              color: "white",
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            <div style={{ width: "60px" }}>Rank</div>
            <div style={{ flex: 1 }}>Creator</div>
            <div style={{ width: "120px", textAlign: "center" }}>
              RMT Score
            </div>
            <div style={{ width: "120px", textAlign: "center" }}>
              Accuracy
            </div>
          </div>

          {/* Table Rows */}
          {topCreators.map((creator) => (
            <div
              key={creator.rank}
              style={{
                display: "flex",
                padding: "14px 20px",
                backgroundColor:
                  creator.rank % 2 === 0 ? "#EDF2F7" : "#FFFFFF",
                alignItems: "center",
                fontSize: 18,
                borderBottom: "1px solid #E2E8F0",
              }}
            >
              <div
                style={{
                  width: "60px",
                  fontWeight: 700,
                  color: "#1A365D",
                }}
              >
                #{creator.rank}
              </div>
              <div style={{ flex: 1, fontWeight: 600, color: "#1A202C" }}>
                {creator.name}
              </div>
              <div
                style={{
                  width: "120px",
                  textAlign: "center",
                  fontWeight: 700,
                  color: getScoreColor(creator.score),
                }}
              >
                {creator.score}
              </div>
              <div
                style={{
                  width: "120px",
                  textAlign: "center",
                  color: "#718096",
                }}
              >
                {creator.accuracy}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            fontSize: 16,
            color: "#718096",
            marginTop: "auto",
          }}
        >
          Every Call. Rated.
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
