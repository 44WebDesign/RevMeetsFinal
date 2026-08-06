import { parseAmenities } from "@/lib/amenities";

// Compact icon-only amenity row for list cards. Hover shows the label; an
// overflow badge covers anything beyond `max`.
export function AmenityIcons({
  amenities,
  max = 5,
}: {
  amenities: string | null | undefined;
  max?: number;
}) {
  const items = parseAmenities(amenities);
  if (items.length === 0) return null;
  const shown = items.slice(0, max);
  const extra = items.length - shown.length;

  const box: React.CSSProperties = {
    width: 24,
    height: 24,
    borderRadius: 5,
    background: "rgba(255,255,255,.04)",
    border: "1px solid var(--bdr)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: ".62rem",
    color: "var(--mut)",
    flexShrink: 0,
  };

  return (
    <div style={{ display: "flex", gap: ".3rem", marginTop: ".6rem", flexWrap: "wrap" }}>
      {shown.map((a) => (
        <span key={a.key} title={a.label} aria-label={a.label} style={box}>
          <i className={`fas ${a.icon}`} />
        </span>
      ))}
      {extra > 0 && (
        <span
          title={items.slice(max).map((a) => a.label).join(", ")}
          style={{ ...box, width: "auto", padding: "0 .4rem", fontWeight: 700 }}
        >
          +{extra}
        </span>
      )}
    </div>
  );
}
