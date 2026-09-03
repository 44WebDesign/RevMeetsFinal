import Link from "next/link";
import { HeroSearch } from "@/components/HeroSearch";
import { EventCard } from "@/components/EventCard";
import { ClubCard } from "@/components/ClubCard";
import { VenueCard } from "@/components/VenueCard";
import { MapView } from "@/components/MapView";
import {
  getEvents,
  getClubs,
  getVenues,
  getStats,
  getEventMapPoints,
} from "@/lib/queries";
import { EVENT_TYPE_COLORS } from "@/lib/enums";
import { getSession } from "@/lib/auth";

// Rendered per-request so the build never needs a live database connection.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();
  const [events, clubs, venues, stats, mapPoints] = await Promise.all([
    getEvents({ take: 4 }, session?.sub),
    getClubs(),
    getVenues(),
    getStats(),
    getEventMapPoints(),
  ]);

  return (
    <>
      {/* HERO */}
      <section
        style={{
          minHeight: "100vh",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "80px 1.5rem 4rem",
          overflow: "hidden",
          marginTop: -64,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1920&q=80') center/cover",
            filter: "brightness(.3) saturate(.7)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom,rgba(8,8,8,.4) 0%,rgba(8,8,8,.15) 40%,rgba(8,8,8,.9) 85%,var(--bg) 100%)",
          }}
        />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 920, width: "100%" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: ".5rem",
              background: "rgba(255,95,31,.12)",
              border: "1px solid rgba(255,95,31,.25)",
              color: "var(--or)",
              padding: ".35rem 1rem",
              borderRadius: 100,
              fontSize: ".72rem",
              fontWeight: 700,
              letterSpacing: ".1em",
              textTransform: "uppercase",
              marginBottom: "1.5rem",
            }}
          >
            <i className="fas fa-circle" style={{ fontSize: ".4rem" }} /> Live Events Across the UK
          </div>
          <h1
            className="hd"
            style={{
              fontSize: "clamp(3.5rem,9vw,7.5rem)",
              lineHeight: 0.95,
              letterSpacing: ".03em",
              marginBottom: "1.25rem",
            }}
          >
            FIND YOUR NEXT
            <br />
            <span style={{ color: "var(--or)" }}>CAR EVENT</span>
          </h1>
          <p
            style={{
              fontSize: "1.05rem",
              color: "rgba(245,245,245,.7)",
              marginBottom: "2.5rem",
              maxWidth: 560,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Discover car shows, track days, night cruises, and meetups near you.
            Connect with the community that lives for the drive.
          </p>
          <HeroSearch />
          <div
            style={{
              display: "flex",
              gap: ".5rem",
              justifyContent: "center",
              flexWrap: "wrap",
              marginTop: "1.5rem",
            }}
          >
            <span style={{ fontSize: ".75rem", color: "var(--mut)", alignSelf: "center" }}>
              Popular:
            </span>
            {[
              ["Car Shows", "car-shows"],
              ["Track Days", "track-days"],
              ["JDM Meets", "jdm-meets"],
              ["Drift Events", "drift-events"],
              ["Cruises", "night-cruises"],
            ].map(([label, slug]) => (
              <Link key={slug} href={`/events/type/${slug}`} className="tag">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* STATS — only shown once there's enough real activity to be credible. */}
      {stats.events >= 6 && (
        <div
          style={{
            background: "var(--card)",
            borderTop: "1px solid var(--bdr)",
            borderBottom: "1px solid var(--bdr)",
            padding: "1.5rem 2rem",
          }}
        >
          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: "1rem",
              textAlign: "center",
            }}
            className="stats-inner"
          >
            <Stat n={statNum(stats.events)} l="Events Listed" />
            <Stat n={statNum(stats.users)} l="Registered Members" />
            <Stat n={statNum(stats.venues)} l="Clubs & Venues" />
            <Stat n={statNum(stats.cities)} l="Cities Covered" />
          </div>
        </div>
      )}

      {/* HOW IT WORKS */}
      <section id="how" className="section" style={{ background: "var(--bg)" }}>
        <div className="container">
          <div className="sec-label">How It Works</div>
          <div className="sec-title">
            GET STARTED IN
            <br />
            THREE SIMPLE STEPS
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: "2rem",
              marginTop: "3rem",
            }}
            className="how-grid"
          >
            <Step n="01" icon="fa-map-location-dot" title="Search Your Area" body="Enter your location and browse upcoming car events on our interactive map. Filter by event type, date, distance and more." />
            <Step n="02" icon="fa-ticket" title="Register & Book" body="Found something you love? Create a free account, register for events, and get all the details delivered straight to you." />
            <Step n="03" icon="fa-flag-checkered" title="Show Up & Connect" body="Turn up, meet fellow enthusiasts, share your build, and be part of a community as passionate about cars as you are." />
          </div>
        </div>
      </section>

      {/* MAP */}
      <section id="map-sec" className="section" style={{ background: "var(--bg2)" }}>
        <div className="container">
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "1rem",
              marginBottom: "1.5rem",
            }}
          >
            <div>
              <div className="sec-label">Interactive Map</div>
              <div className="sec-title">EVENTS NEAR YOU</div>
            </div>
            <Link href="/map" className="btn-or">
              <i className="fas fa-expand" /> Open Full Map
            </Link>
          </div>
          <MapView points={mapPoints} height={500} />
          <div
            style={{
              display: "flex",
              gap: "1.5rem",
              marginTop: "1rem",
              flexWrap: "wrap",
            }}
          >
            {Object.entries({
              "Car Show": EVENT_TYPE_COLORS.CAR_SHOW,
              "Track Day": EVENT_TYPE_COLORS.TRACK_DAY,
              Cruise: EVENT_TYPE_COLORS.NIGHT_CRUISE,
              Meet: EVENT_TYPE_COLORS.MEET,
              Drift: EVENT_TYPE_COLORS.DRIFT_EVENT,
            }).map(([label, color]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: ".4rem", fontSize: ".8rem", color: "var(--mut)" }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
                {label}
              </div>
            ))}
            <div style={{ marginLeft: "auto", fontSize: ".75rem", color: "var(--mut)" }}>
              <i className="fas fa-info-circle" /> Click a pin for details
            </div>
          </div>
        </div>
      </section>

      {/* EVENTS */}
      <section id="events" className="section" style={{ background: "var(--bg)" }}>
        <div className="container">
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: ".5rem" }}>
            <div>
              <div className="sec-label">Don&apos;t Miss Out</div>
              <div className="sec-title">FEATURED EVENTS</div>
            </div>
            <Link href="/events" className="btn-ghost">
              View All <i className="fas fa-arrow-right" />
            </Link>
          </div>
          <div className="sec-sub">
            Hand-picked events from across the UK — from underground meets to massive car shows.
          </div>
          {events.length === 0 ? (
            <EmptyState text="No events yet — be the first to host one." />
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))",
                gap: "1.5rem",
                marginTop: "2.5rem",
              }}
            >
              {events.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CLUBS */}
      <section id="clubs" className="section" style={{ background: "var(--bg2)" }}>
        <div className="container">
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: ".5rem" }}>
            <div>
              <div className="sec-label">Top Rated</div>
              <div className="sec-title">FEATURED CLUBS</div>
            </div>
            <Link href="/clubs" className="btn-ghost">
              View All <i className="fas fa-arrow-right" />
            </Link>
          </div>
          <div className="sec-sub">Join established clubs running regular events near you.</div>
          {clubs.length === 0 ? (
            <EmptyState text="No clubs yet." />
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))",
                gap: "1.5rem",
                marginTop: "2.5rem",
              }}
            >
              {clubs.slice(0, 4).map((c) => (
                <ClubCard key={c.id} club={c} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* VENUES */}
      <section id="venues" className="section" style={{ background: "var(--bg)" }}>
        <div className="container">
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: ".5rem" }}>
            <div>
              <div className="sec-label">Great Locations</div>
              <div className="sec-title">FEATURED VENUES</div>
            </div>
            <Link href="/venues" className="btn-ghost">
              View All <i className="fas fa-arrow-right" />
            </Link>
          </div>
          <div className="sec-sub">
            Discover venues offering themselves up as the perfect spot for your next meet.
          </div>
          {venues.length === 0 ? (
            <EmptyState text="No venues yet — list yours to get discovered." />
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))",
                gap: "1.5rem",
                marginTop: "2.5rem",
              }}
            >
              {venues.slice(0, 4).map((v) => (
                <VenueCard key={v.id} venue={v} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SIGN UP */}
      <section id="signup" className="section" style={{ background: "var(--bg2)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <div className="sec-label">Join Today</div>
            <div className="sec-title">CHOOSE YOUR ACCOUNT TYPE</div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
              gap: "2rem",
              marginTop: "2rem",
            }}
          >
            <SignupCard
              icon="fa-user"
              title="Car Enthusiast"
              body="Find and attend events, connect with clubs, and never miss a meet near you."
              features={[
                "Browse all events for free",
                "Register for events in one tap",
                "Follow your favourite clubs & venues",
                "Get reminders and event alerts",
              ]}
              cta="Join Free"
              href="/register?role=ENTHUSIAST"
            />
            <SignupCard
              icon="fa-flag-checkered"
              title="Event Host / Club"
              body="List your events, manage registrations, and reach thousands of enthusiasts."
              features={[
                "Create unlimited events",
                "Manage attendees & registrations",
                "Build a club profile & following",
                "Featured event placement",
              ]}
              cta="Register as Host"
              href="/register?role=ORGANISER"
            />
            <SignupCard
              icon="fa-warehouse"
              title="Venue"
              body="Promote your space as the perfect location for meets, shows and track days."
              features={[
                "Publish a venue profile on the map",
                "Get discovered by organisers",
                "Showcase amenities & capacity",
                "Grow a follower base",
              ]}
              cta="List Your Venue"
              href="/register?role=VENUE"
            />
          </div>
        </div>
      </section>
    </>
  );
}

// Honest stat display: show the exact number while small, and only round down
// to a "N+" once it's genuinely large — never inflate.
function statNum(n: number): string {
  if (n < 20) return String(n);
  if (n < 100) return `${Math.floor(n / 10) * 10}+`;
  return `${Math.floor(n / 50) * 50}+`;
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <div className="hd" style={{ fontSize: "2.25rem", color: "var(--or)" }}>
        {n}
      </div>
      <div style={{ fontSize: ".8rem", color: "var(--mut)" }}>{l}</div>
    </div>
  );
}

function Step({ n, icon, title, body }: { n: string; icon: string; title: string; body: string }) {
  return (
    <div
      className="card-surface"
      style={{ padding: "2rem", transition: "border-color .3s" }}
    >
      <div className="hd" style={{ fontSize: "5rem", color: "var(--bdr2)", lineHeight: 1, marginBottom: ".5rem" }}>
        {n}
      </div>
      <div
        style={{
          width: 48,
          height: 48,
          background: "rgba(255,95,31,.1)",
          border: "1px solid rgba(255,95,31,.2)",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.25rem",
          color: "var(--or)",
          marginBottom: "1.25rem",
        }}
      >
        <i className={`fas ${icon}`} />
      </div>
      <h3 className="hd" style={{ fontSize: "1.5rem", marginBottom: ".75rem" }}>
        {title}
      </h3>
      <p style={{ fontSize: ".9rem", color: "var(--mut)", lineHeight: 1.7 }}>{body}</p>
    </div>
  );
}

function SignupCard({
  icon,
  title,
  body,
  features,
  cta,
  href,
}: {
  icon: string;
  title: string;
  body: string;
  features: string[];
  cta: string;
  href: string;
}) {
  return (
    <div className="card-surface" style={{ padding: "2.5rem", textAlign: "center" }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          margin: "0 auto 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.75rem",
          background: "rgba(255,95,31,.12)",
          color: "var(--or)",
        }}
      >
        <i className={`fas ${icon}`} />
      </div>
      <h3 className="hd" style={{ fontSize: "2rem", marginBottom: ".75rem" }}>
        {title}
      </h3>
      <p style={{ fontSize: ".88rem", color: "var(--mut)", marginBottom: "1.5rem", lineHeight: 1.7 }}>
        {body}
      </p>
      <ul
        style={{
          listStyle: "none",
          textAlign: "left",
          marginBottom: "2rem",
          display: "flex",
          flexDirection: "column",
          gap: ".5rem",
          padding: 0,
        }}
      >
        {features.map((f) => (
          <li key={f} style={{ display: "flex", alignItems: "center", gap: ".6rem", fontSize: ".85rem", color: "rgba(245,245,245,.85)" }}>
            <i className="fas fa-check" style={{ color: "var(--or)", fontSize: ".75rem" }} /> {f}
          </li>
        ))}
      </ul>
      <Link href={href} className="btn-or-lg" style={{ width: "100%", textAlign: "center" }}>
        {cta}
      </Link>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div
      className="card-surface"
      style={{
        marginTop: "2.5rem",
        padding: "3rem",
        textAlign: "center",
        color: "var(--mut)",
      }}
    >
      <i className="fas fa-flag-checkered" style={{ fontSize: "1.5rem", marginBottom: ".75rem", display: "block" }} />
      {text}
    </div>
  );
}
