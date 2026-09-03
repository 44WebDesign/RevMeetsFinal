import Link from "next/link";
import Image from "next/image";
import { eventTypeColor, eventTypeLabel } from "@/lib/enums";
import { formatDate } from "@/lib/utils";
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
  clubName?: string | null;
  amenities?: string;
  saved?: boolean;
  featured?: boolean;
};

export function EventCard({ event }: { event: EventCardData }) {
  const color = eventTypeColor(event.type);
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
            <FallbackCover accent={color} label={eventTypeLabel(event.type)} />
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
        <h3 style={{ fontSize: "1.08rem", fontWeight: 700, marginBottom: ".5rem", lineHeight: 1.25 }}>
          {event.title}
        </h3>
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
          <span style={{ fontSize: ".8rem", color: "var(--mut)" }}>
            <i className="fas fa-users" /> {event.attendees} going
          </span>
        </div>
        <span
          className="ev-btn"
          style={{
            display: "block",
            width: "100%",
            border: "1px solid var(--bdr2)",
            color: "#fff",
            padding: ".6rem",
            borderRadius: 6,
            fontSize: ".8rem",
            fontWeight: 600,
            textAlign: "center",
            marginTop: ".875rem",
          }}
        >
          View Event
        </span>
      </div>
      </Link>
    </div>
  );
}
