import Link from "next/link";
import Image from "next/image";
import { eventTypeColor, eventTypeLabel } from "@/lib/enums";
import { formatDate } from "@/lib/utils";
import { dateProximity, spacesLeft, isFillingUp } from "@/lib/urgency";
import { AmenityIcons } from "./AmenityIcons";
import { SaveIconButton } from "./SaveIconButton";
import { FallbackCover } from "./FallbackCover";

export type EventCardData = {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: string;
  city: string;
  startsAt: string | Date;
  imageUrl?: string | null;
  attendees: number;
  capacity?: number | null;
  clubName?: string | null;
  amenities?: string;
  saved?: boolean;
  featured?: boolean;
  rating?: number | null;
  reviewCount?: number;
};

export function EventCard({ event }: { event: EventCardData }) {
  const color = eventTypeColor(event.type);
  const proximity = dateProximity(event.startsAt);
  const filling = isFillingUp(event.capacity, event.attendees);
  const left = spacesLeft(event.capacity, event.attendees);
  return (
    <div className="card-surface event-card" style={{ overflow: "hidden", position: "relative", transition: "all .3s" }}>
      {/* Save button — sibling of the link (valid HTML), stacked above it */}
      <div style={{ position: "absolute", top: ".6rem", right: ".6rem", zIndex: 2 }}>
        <SaveIconButton eventId={event.id} initialSaved={event.saved ?? false} />
      </div>

      <Link
        href={`/events/${event.slug}`}
        className="ev-card-link"
        style={{ textDecoration: "none", color: "inherit", display: "block" }}
      >
        <div style={{ height: 180, position: "relative", overflow: "hidden" }}>
          {event.imageUrl ? (
            <Image
              src={event.imageUrl}
              alt={event.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
              style={{ objectFit: "cover", filter: "brightness(.85)" }}
            />
          ) : (
            <FallbackCover accent={color} />
          )}
          <span
            className="pill"
            style={{
              position: "absolute",
              top: ".75rem",
              left: ".75rem",
              background: color,
              color: "#fff",
            }}
          >
            {eventTypeLabel(event.type)}
          </span>
          {event.featured && (
            <span
              className="pill"
              style={{
                position: "absolute",
                bottom: ".75rem",
                left: ".75rem",
                background: "rgba(8,8,8,.75)",
                color: "#FFD700",
                border: "1px solid rgba(255,215,0,.4)",
              }}
            >
              <i className="fas fa-star" /> Featured
            </span>
          )}
          {/* Honest urgency: near-full wins over date proximity */}
          {filling && left !== null ? (
            <span
              className="pill"
              style={{
                position: "absolute",
                bottom: ".75rem",
                right: ".75rem",
                background: "rgba(8,8,8,.8)",
                color: "#ffbf47",
                border: "1px solid rgba(255,191,71,.45)",
              }}
            >
              <i className="fas fa-fire" /> {left} left
            </span>
          ) : proximity ? (
            <span
              className="pill"
              style={{
                position: "absolute",
                bottom: ".75rem",
                right: ".75rem",
                background: proximity.urgent ? color : "rgba(8,8,8,.8)",
                color: "#fff",
                border: proximity.urgent ? "none" : `1px solid ${color}`,
              }}
            >
              {proximity.label}
            </span>
          ) : null}
        </div>
      <div style={{ padding: "1.25rem" }}>
        <div
          style={{
            display: "flex",
            gap: "1rem",
            fontSize: ".75rem",
            color: "var(--mut)",
            marginBottom: ".6rem",
            flexWrap: "wrap",
          }}
        >
          <span>
            <i className="fas fa-calendar-alt" /> {formatDate(event.startsAt)}
          </span>
          <span>
            <i className="fas fa-location-dot" /> {event.city}
          </span>
        </div>
        <h3 style={{ fontSize: "1.08rem", fontWeight: 700, marginBottom: ".4rem", lineHeight: 1.25 }}>
          {event.title}
        </h3>
        {event.rating != null && (event.reviewCount ?? 0) > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: ".35rem", marginBottom: ".5rem", fontSize: ".78rem" }}>
            <span style={{ color: "var(--or)", fontWeight: 700 }}>
              <i className="fas fa-star" /> {event.rating.toFixed(1)}
            </span>
            <span style={{ color: "var(--mut)" }}>
              ({event.reviewCount} review{event.reviewCount === 1 ? "" : "s"})
            </span>
          </div>
        )}
        <p
          style={{
            fontSize: ".82rem",
            color: "var(--mut)",
            lineHeight: 1.6,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {event.description}
        </p>
        <AmenityIcons amenities={event.amenities} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "1rem",
            paddingTop: "1rem",
            borderTop: "1px solid var(--bdr)",
          }}
        >
          <span style={{ fontSize: ".78rem", color: "var(--mut)" }}>
            {event.clubName ? (
              <>
                <i className="fas fa-users-gear" /> {event.clubName}
              </>
            ) : (
              <>
                <i className="fas fa-user" /> Independent
              </>
            )}
          </span>
          <span style={{ fontSize: ".82rem", color: "var(--txt)", fontWeight: 600 }}>
            <i className="fas fa-users" style={{ color: "var(--or)" }} /> {event.attendees}{" "}
            <span style={{ color: "var(--mut)", fontWeight: 400 }}>going</span>
          </span>
        </div>
        <span
          className="ev-btn"
          style={{
            display: "block",
            width: "100%",
            background: "rgba(255,95,31,.12)",
            border: "1px solid rgba(255,95,31,.4)",
            color: "var(--or)",
            padding: ".6rem",
            borderRadius: 6,
            fontSize: ".82rem",
            fontWeight: 700,
            textAlign: "center",
            marginTop: ".875rem",
          }}
        >
          View Event <i className="fas fa-arrow-right" style={{ fontSize: ".7rem" }} />
        </span>
      </div>
      </Link>
    </div>
  );
}
