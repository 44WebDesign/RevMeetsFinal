import Link from "next/link";

export type VenueCardData = {
  id: string;
  slug: string;
  name: string;
  description: string;
  city: string;
  address: string;
  imageUrl?: string | null;
  categories: string;
  followers: number;
  capacity?: number | null;
};

const FALLBACK =
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=300&q=80";

export function VenueCard({ venue }: { venue: VenueCardData }) {
  const cats = venue.categories
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, 3);

  return (
    <Link
      href={`/venues/${venue.slug}`}
      className="card-surface"
      style={{
        overflow: "hidden",
        display: "flex",
        transition: "all .3s",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={{ width: 130, flexShrink: 0, overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={venue.imageUrl || FALLBACK}
          alt={venue.name}
          style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(.8)" }}
        />
      </div>
      <div style={{ padding: "1.25rem", flex: 1 }}>
        <div style={{ display: "flex", gap: ".35rem", flexWrap: "wrap", marginBottom: ".5rem" }}>
          {cats.map((c) => (
            <span
              key={c}
              className="pill"
              style={{
                background: "rgba(0,188,212,.08)",
                border: "1px solid rgba(0,188,212,.2)",
                color: "#00BCD4",
              }}
            >
              {c}
            </span>
          ))}
        </div>
        <h3 style={{ fontSize: ".95rem", fontWeight: 700, marginBottom: ".3rem" }}>{venue.name}</h3>
        <div
          style={{
            fontSize: ".78rem",
            color: "var(--mut)",
            marginBottom: ".5rem",
            display: "flex",
            alignItems: "center",
            gap: ".3rem",
          }}
        >
          <i className="fas fa-location-dot" /> {venue.city}
        </div>
        <p
          style={{
            fontSize: ".8rem",
            color: "var(--mut)",
            lineHeight: 1.6,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {venue.description}
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: ".75rem",
            fontSize: ".82rem",
          }}
        >
          <span>
            {venue.capacity ? (
              <>
                <span style={{ color: "#00BCD4" }}>
                  <i className="fas fa-users" />
                </span>{" "}
                up to {venue.capacity}
              </>
            ) : (
              <span style={{ color: "var(--mut)" }}>Flexible capacity</span>
            )}
          </span>
          <span style={{ color: "var(--mut)" }}>
            <i className="fas fa-heart" /> {venue.followers}
          </span>
        </div>
      </div>
    </Link>
  );
}
