import Link from "next/link";
import { eventTypeColor, eventTypeLabel } from "@/lib/enums";
import { formatDate } from "@/lib/utils";

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
};

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80";

export function EventCard({ event }: { event: EventCardData }) {
  const color = eventTypeColor(event.type);
  return (
    <Link
      href={`/events/${event.slug}`}
      className="card-surface"
      style={{
        overflow: "hidden",
        transition: "all .3s",
        cursor: "pointer",
        textDecoration: "none",
        color: "inherit",
        display: "block",
      }}
    >
      <div style={{ height: 180, position: "relative", overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={event.imageUrl || FALLBACK_IMG}
          alt={event.title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "brightness(.85)",
          }}
        />
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
        <h3 style={{ fontSize: ".95rem", fontWeight: 700, marginBottom: ".5rem", lineHeight: 1.3 }}>
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
  );
}
