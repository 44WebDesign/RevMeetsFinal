import Link from "next/link";
import Image from "next/image";

export type ClubCardData = {
  id: string;
  slug: string;
  name: string;
  description: string;
  location: string;
  imageUrl?: string | null;
  categories: string;
  followers: number;
  events: number;
};

const FALLBACK =
  "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=300&q=80";

export function ClubCard({ club }: { club: ClubCardData }) {
  const cats = club.categories
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, 3);

  return (
    <Link
      href={`/clubs/${club.slug}`}
      className="card-surface"
      style={{
        overflow: "hidden",
        display: "flex",
        transition: "all .3s",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={{ width: 130, flexShrink: 0, overflow: "hidden", position: "relative" }}>
        <Image
          src={club.imageUrl || FALLBACK}
          alt={club.name}
          fill
          sizes="130px"
          style={{ objectFit: "cover", filter: "brightness(.8)" }}
        />
      </div>
      <div style={{ padding: "1.25rem", flex: 1 }}>
        <div style={{ display: "flex", gap: ".35rem", flexWrap: "wrap", marginBottom: ".5rem" }}>
          {cats.map((c) => (
            <span
              key={c}
              className="pill"
              style={{
                background: "rgba(255,95,31,.08)",
                border: "1px solid rgba(255,95,31,.15)",
                color: "var(--or)",
              }}
            >
              {c}
            </span>
          ))}
        </div>
        <h3 style={{ fontSize: ".95rem", fontWeight: 700, marginBottom: ".3rem" }}>{club.name}</h3>
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
          <i className="fas fa-location-dot" /> {club.location}
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
          {club.description}
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
            <span style={{ color: "var(--or)" }}>
              <i className="fas fa-calendar-check" />
            </span>{" "}
            {club.events} events
          </span>
          <span style={{ color: "var(--mut)" }}>
            <i className="fas fa-heart" /> {club.followers} followers
          </span>
        </div>
      </div>
    </Link>
  );
}
