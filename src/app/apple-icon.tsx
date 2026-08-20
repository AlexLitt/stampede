import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F4F1E8",
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="140" height="110" viewBox="0 0 36 28" fill="none">
          <path
            d="M2 22 L9 6 L16 16 L24 4 L34 20"
            stroke="#141413"
            strokeWidth="2.4"
            strokeLinejoin="round"
            strokeLinecap="square"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
