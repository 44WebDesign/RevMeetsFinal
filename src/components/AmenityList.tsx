import { parseAmenities } from "@/lib/amenities";

// Icon block of amenities, shown on venue and event detail pages.
export function AmenityList({
  amenities,
  accent = "#00BCD4",
}: {
  amenities: string | null | undefined;
  accent?: string;
}) {
  const items = parseAmenities(amenities);
  if (items.length === 0) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
        gap: ".6rem",
      }}
    >
      {items.map((a) => (
        <div
          key={a.key}
          className="card-surface"
          style={{
            display: "flex",
            alignItems: "center",
            gap: ".65rem",
            padding: ".6rem .8rem",
          }}
        >
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `${accent}14`,
              border: `1px solid ${accent}33`,
              color: accent,
              fontSize: ".9rem",
            }}
          >
            <i className={`fas ${a.icon}`} />
          </span>
          <span style={{ fontSize: ".82rem", fontWeight: 600 }}>{a.label}</span>
        </div>
      ))}
    </div>
  );
}
