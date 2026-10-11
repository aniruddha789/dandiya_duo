import { ImageResponse } from "next/og";

// OG template 1200x630. Code-rendered so it always matches the brand.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 48,
          background: "linear-gradient(135deg, #241343 0%, #2A1650 45%, #1B1030 100%)",
          color: "#FFF3E0",
          fontFamily: "sans-serif",
        }}
      >
        <svg width="150" height="150" viewBox="0 0 64 64">
          <line x1="14" y1="50" x2="50" y2="14" stroke="#FFB627" strokeWidth="7" strokeLinecap="round" />
          <line x1="50" y1="50" x2="14" y2="14" stroke="#FF4F8B" strokeWidth="7" strokeLinecap="round" />
          <path d="M32 20 C36 26 38 29 32 35 C26 29 28 26 32 20 Z" fill="#FFD700" />
        </svg>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 92, fontWeight: 800 }}>
            <span>Find your&nbsp;</span>
            <span style={{ color: "#FF4F8B" }}>DandiyaDuo.</span>
          </div>
          <div style={{ display: "flex", fontSize: 38, opacity: 0.85 }}>
            <span>Free. Mutual match only. Gone after the festival.</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
