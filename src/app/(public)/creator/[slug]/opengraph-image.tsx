import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Creator Profile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<ImageResponse> {
  const { slug } = await params;
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
          }}
        >
          <div style={{ fontSize: 56, fontWeight: 700 }}>{name}</div>
        </div>
        <div style={{ fontSize: 22, opacity: 0.7 }}>
          Every Call. Rated. | ratemytip.com
        </div>
      </div>
    ),
    { ...size }
  );
}
