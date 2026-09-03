// Branded placeholder shown when a listing has no image. Uses the accent colour
// (event-type colour, or club/venue accent) so a grid of image-less cards shows
// varied, intentional-looking covers instead of one repeated stock photo.

function hexToRgba(hex: string, alpha: number): string {
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function FallbackCover({
  accent = "#FF5F1F",
  icon = "fa-car-side",
  label,
}: {
  accent?: string;
  icon?: string;
  label?: string;
}) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `radial-gradient(circle at 30% 25%, ${hexToRgba(accent, 0.32)}, transparent 62%), linear-gradient(135deg, #171717 0%, #0c0c0c 100%)`,
        overflow: "hidden",
      }}
    >
      {/* faint diagonal streak for a bit of motion/texture */}
      <span
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(115deg, transparent 40%, ${hexToRgba(accent, 0.1)} 50%, transparent 60%)`,
        }}
      />
      <i className={`fas ${icon}`} style={{ fontSize: "2.4rem", color: accent, opacity: 0.3 }} />
      {label && (
        <span style={{ position: "absolute", bottom: 8, right: 10, fontSize: ".6rem", letterSpacing: ".12em", textTransform: "uppercase", color: hexToRgba(accent, 0.55), fontWeight: 700 }}>
          {label}
        </span>
      )}
    </div>
  );
}
