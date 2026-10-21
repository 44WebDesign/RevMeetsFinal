import { ImageResponse } from "next/og";

// Shared 1200×630 social share card. Rendered on the server (cached by Next),
// so every event/club/venue gets a branded, legible preview on WhatsApp,
// Facebook, iMessage, X etc. — even listings with no uploaded photo. Uses the
// default font (no runtime font fetch) to stay dependency-free and robust.
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

export function ogCard({
  eyebrow,
  title,
  meta,
  accent = "#FF5F1F",
}: {
  eyebrow: string;
  title: string;
  meta?: string;
  accent?: string;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            `radial-gradient(1200px 600px at 78% -10%, ${hexToRgba(accent, 0.28)}, transparent 60%), linear-gradient(135deg, #141414 0%, #0a0a0a 100%)`,
          padding: "72px 80px",
          position: "relative",
        }}
      >
        {/* top accent rule */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 12, background: accent, display: "flex" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              background: hexToRgba(accent, 0.16),
              border: `2px solid ${hexToRgba(accent, 0.5)}`,
              color: accent,
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: 4,
              textTransform: "uppercase",
              padding: "10px 26px",
              borderRadius: 999,
            }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              display: "flex",
              color: "#ffffff",
              fontSize: title.length > 48 ? 72 : 92,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -1,
              maxWidth: 1040,
            }}
          >
            {title}
          </div>
          {meta ? (
            <div style={{ display: "flex", color: "#cfcfcf", fontSize: 40, fontWeight: 500 }}>{meta}</div>
          ) : null}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ color: accent, fontSize: 48, fontWeight: 800, letterSpacing: 2 }}>REV</span>
            <span style={{ color: "#ffffff", fontSize: 48, fontWeight: 800, letterSpacing: 2 }}>MEETS</span>
          </div>
          <div style={{ display: "flex", color: "#8a8a8a", fontSize: 30, fontWeight: 500 }}>
            UK car events &amp; meetups
          </div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
