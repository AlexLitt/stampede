import { ImageResponse } from "next/og";

export const alt =
  "Stampede — weekly rank of what vibe-coders ship versus empty holes that already bill";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#F4F1E8",
          color: "#141413",
          border: "16px solid #141413",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 92,
            fontWeight: 700,
            letterSpacing: -2,
            textTransform: "uppercase",
            lineHeight: 1,
          }}
        >
          Stampede
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            maxWidth: 900,
            fontSize: 28,
            lineHeight: 1.35,
            textAlign: "center",
            color: "#45433F",
          }}
        >
          Weekly rank of what vibe-coders ship. Stampede — skip. Empty — steal.
        </div>
      </div>
    ),
    { ...size },
  );
}
