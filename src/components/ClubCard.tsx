import Link from "next/link";
import Image from "next/image";
import { FallbackCover } from "./FallbackCover";

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
  featured?: boolean;
  rating?: number | null;
  reviewCount?: number;
};

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
        {club.imageUrl ? (
          <Image
            src={club.imageUrl}
            alt={club.name}
            fill
            sizes="130px"
            style={{ objectFit: "cover", filter: "brightness(.8)" }}
          />
        ) : (
          <FallbackCover accent="#FF5F1F" icon="fa-users-gear" />
        )}
        {club.featured && (
          <span className="pill" style={{ position: "absolute", top: ".5rem", left: ".5rem", background: "rgba(8,8,8,.75)", color: "#FFD700", border: "1px solid rgba(255,215,0,.4)" }}>
            <i className="fas fa-star" /> Featured
          </span>
        )}
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
        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: ".3rem", lineHeight: 1.25 }}>{club.name}</h3>
        <div
          style={{
            fontSize: ".78rem",
            color: "var(--mut)",
            marginBottom: ".5rem",
            display: "flex",
            alignItems: "center",
            gap: ".6rem",
            flexWrap: "wrap",
          }}
        >
          <span><i className="fas fa-location-dot" /> {club.location}</span>
          {club.rating != null && (
            <span style={{ color: "var(--or)", fontWeight: 600 }}>
              <i className="fas fa-star" /> {club.rating.toFixed(1)}
              <span style={{ color: "var(--mut)", fontWeight: 400 }}> ({club.reviewCount})</span>
            </span>
          )}
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
