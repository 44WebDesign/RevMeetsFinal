import type { Metadata } from "next";
import Link from "next/link";
import { MapView } from "@/components/MapView";
import { JsonLd } from "@/components/JsonLd";
import { BrowserFrame, DashboardMock, AdminMock, GrowthMock } from "@/components/HowItWorksVisuals";
import { eventTypeColor } from "@/lib/enums";
import { absoluteUrl } from "@/lib/site";
import type { MapPoint } from "@/components/MapView";

export const dynamic = "force-dynamic";

const DESC =
  "How RevMeet works — for enthusiasts finding car events near them, for clubs and organisers growing their audience, and for venues getting discovered. Free to browse, free to join.";

export const metadata: Metadata = {
  title: "How It Works",
  description: DESC,
  alternates: { canonical: "/how-it-works" },
  openGraph: { title: "How RevMeet Works", description: DESC, url: absoluteUrl("/how-it-works") },
};

// A few illustrative pins for the live map demo.
const DEMO_POINTS: MapPoint[] = [
  { id: "d1", slug: "#", lat: 51.5074, lng: -0.1278, title: "London Supercar Show", type: "SUPERCAR_MEET", color: eventTypeColor("SUPERCAR_MEET"), subtitle: "London · Sat 12 Sep", href: "/events", kind: "event" },
  { id: "d2", slug: "#", lat: 53.8008, lng: -1.5491, title: "Leeds Night Cruise", type: "NIGHT_CRUISE", color: eventTypeColor("NIGHT_CRUISE"), subtitle: "Leeds · Fri 18 Sep", href: "/events", kind: "event" },
  { id: "d3", slug: "#", lat: 52.4862, lng: -1.8904, title: "Midlands Tuner Festival", type: "CAR_SHOW", color: eventTypeColor("CAR_SHOW"), subtitle: "Birmingham · Sun 27 Sep", href: "/events", kind: "event" },
];

export default function HowItWorksPage() {
  const howToLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to find and attend car events on RevMeet",
    description: DESC,
    step: [
      { "@type": "HowToStep", position: 1, name: "Search your area", text: "Browse upcoming car events on the interactive map or list. Filter by type, date, distance and amenities." },
      { "@type": "HowToStep", position: 2, name: "Register & save", text: "Create a free account, register for events in one tap, save the ones you like, and follow your favourite clubs and venues." },
      { "@type": "HowToStep", position: 3, name: "Show up & connect", text: "Turn up, meet fellow enthusiasts, share photos of the day and your build, and leave a review." },
    ],
  };

  return (
    <>
      <JsonLd data={howToLd} />

      {/* HERO */}
      <section className="section" style={{ background: "var(--bg)", paddingBottom: "2.5rem" }}>
        <div className="container" style={{ maxWidth: 820, textAlign: "center" }}>
          <div className="sec-label" style={{ textAlign: "center" }}>How It Works</div>
          <h1 className="hd" style={{ fontSize: "clamp(2.5rem,6vw,4.5rem)", lineHeight: 1, marginBottom: "1rem" }}>
            ONE PLACE FOR THE<br /><span style={{ color: "var(--or)" }}>WHOLE CAR SCENE</span>
          </h1>
          <p style={{ color: "rgba(245,245,245,.75)", fontSize: "1.05rem", maxWidth: 620, margin: "0 auto 1.75rem" }}>
            RevMeet connects the people who <strong>go</strong> to car events, the clubs and organisers who <strong>run</strong> them,
            and the venues that <strong>host</strong> them. Browsing is free. Joining is free. Here&apos;s how each side works.
          </p>
          <div style={{ display: "flex", gap: ".75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <a href="#enthusiasts" className="btn-ghost">I&apos;m an enthusiast</a>
            <a href="#organisers" className="btn-ghost">I run events / a club</a>
            <a href="#venues" className="btn-ghost">I have a venue</a>
          </div>
        </div>
      </section>

      {/* THE 3 STEPS */}
      <section className="section home-sec" style={{ background: "var(--bg2)" }}>
        <div className="container">
          <div className="sec-label">Getting started</div>
          <h2 className="sec-title" style={{ fontSize: "clamp(1.8rem,4vw,2.75rem)" }}>THREE SIMPLE STEPS</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "1.5rem", marginTop: "2.5rem" }}>
            <Step n="01" icon="fa-map-location-dot" title="Search your area" body="Open the interactive map or switch to a list. Filter by event type, date, distance from you, and the amenities you need — parking, food, EV charging, track access and more." />
            <Step n="02" icon="fa-ticket" title="Register & save" body="Create a free account, register for events in one tap, and save the ones you're weighing up. Follow clubs and venues to hear the moment they announce something." />
            <Step n="03" icon="fa-flag-checkered" title="Show up & connect" body="Get a reminder before the day. Turn up, meet the community, add photos to the event's gallery, show off your build, and leave a review." />
          </div>
        </div>
      </section>

      {/* ENTHUSIASTS */}
      <section id="enthusiasts" className="section home-sec" style={{ background: "var(--bg)" }}>
        <div className="container">
          <TwoCol
            label="For enthusiasts"
            title="FIND EVENTS NEAR YOU"
            body="Discovery is the whole point. Search by map or list, use “near me” to sort by distance, and filter down to exactly the kind of meet you're after. Save events for later, follow the clubs and venues you rate, and get a weekly digest of what's coming up around you."
            bullets={[
              "Interactive map + list, filter by type, date, distance & amenities",
              "“Near me” geolocation with nearest-first results",
              "Save events, follow clubs & venues, get reminders",
              "Weekly “events near you” email (opt-in)",
              "Build a profile with your garage & photos, and review events",
            ]}
            visual={
              <div>
                <MapView points={DEMO_POINTS} center={[52.8, -1.6]} zoom={6} height={300} />
                <p style={{ fontSize: ".76rem", color: "var(--mut)", marginTop: ".5rem", textAlign: "center" }}>
                  <i className="fas fa-hand-pointer" /> Click a pin to preview the event.
                </p>
              </div>
            }
          />
        </div>
      </section>

      {/* ORGANISERS & CLUBS */}
      <section id="organisers" className="section home-sec" style={{ background: "var(--bg2)" }}>
        <div className="container">
          <TwoCol
            reverse
            label="For organisers & clubs"
            title="GROW YOUR AUDIENCE & FIND NEW MEMBERS"
            body="List your events for free and put them in front of enthusiasts who are actively looking. Build a club profile people can follow — then every time you publish an event, your followers get an in-app alert and email, and nearby members see it in their weekly digest. It's the flywheel that turns one-off attendees into regulars."
            bullets={[
              "Free, unlimited event listings with their own pages & registrations",
              "A club profile people follow — announcements reach them automatically",
              "New-event alerts to followers (in-app + email) + the local digest",
              "Recurring events (weekly / fortnightly / monthly) in one go",
              "Optional paid “Featured” placement + homepage Spotlight for a boost",
            ]}
            visual={<GrowthMock />}
          />
          <div style={{ marginTop: "2.5rem" }}>
            <h3 className="hd" style={{ fontSize: "1.4rem", marginBottom: ".4rem" }}>See what's working</h3>
            <p style={{ color: "var(--mut)", fontSize: ".92rem", maxWidth: 640, marginBottom: "1.25rem" }}>
              Your dashboard shows registrations over time, your top events, saves and ratings — so you can double down on what your audience turns out for.
            </p>
            <BrowserFrame url="revmeet.co.uk/dashboard/analytics">
              <DashboardMock />
            </BrowserFrame>
          </div>
        </div>
      </section>

      {/* VENUES */}
      <section id="venues" className="section home-sec" style={{ background: "var(--bg)" }}>
        <div className="container">
          <TwoCol
            label="For venues"
            title="GET DISCOVERED & TAKE BOOKINGS"
            body="Put your space on the map as a location for meets, shows and track days. Organisers hunting for a venue can find you by area and amenities, see your capacity and photos, and send an enquiry straight to your inbox. Earn a Verified badge to stand out, and feature your listing when it matters."
            bullets={[
              "A profile on the map with amenities, capacity, photos & website",
              "“Enquire” button — booking leads land in your inbox (in-app + email)",
              "Verified badge (admin-checked) for extra trust",
              "Appear as a suggested location and in venue search & filters",
              "Optional paid Featured placement + homepage Spotlight",
            ]}
            visual={
              <div className="card-surface" style={{ padding: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: ".75rem" }}>
                  <span className="hd" style={{ fontSize: "1.2rem" }}>Harewood Speed Hillclimb</span>
                  <span className="pill" style={{ background: "rgba(74,163,255,.15)", color: "#4aa3ff", border: "1px solid rgba(74,163,255,.4)" }}><i className="fas fa-circle-check" /> Verified</span>
                </div>
                <div style={{ fontSize: ".8rem", color: "var(--mut)", marginBottom: "1rem" }}><i className="fas fa-location-dot" style={{ color: "#00BCD4" }} /> Leeds · up to 500</div>
                <div style={{ fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".1em", color: "var(--mut)", marginBottom: ".4rem" }}>Host an event here?</div>
                <span className="btn-or" style={{ display: "block", textAlign: "center" }}><i className="fas fa-envelope" /> Enquire about this venue</span>
              </div>
            }
          />
        </div>
      </section>

      {/* TRUST & MODERATION */}
      <section className="section home-sec" style={{ background: "var(--bg2)" }}>
        <div className="container">
          <div className="sec-label">Kept clean</div>
          <h2 className="sec-title" style={{ fontSize: "clamp(1.8rem,4vw,2.75rem)" }}>MODERATED &amp; TRUSTWORTHY</h2>
          <p className="sec-sub" style={{ marginBottom: "2rem", maxWidth: 640 }}>
            A moderation console keeps the platform healthy. Anyone can flag an event, review or photo; admins work a reports queue, manage users, and grant the Verified badge to genuine clubs and venues.
          </p>
          <BrowserFrame url="revmeet.co.uk/admin">
            <AdminMock />
          </BrowserFrame>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "1rem", marginTop: "1.5rem" }}>
            <MiniFeature icon="fa-flag" title="Reporting queue" body="Members flag anything off; admins resolve, dismiss or remove it." />
            <MiniFeature icon="fa-circle-check" title="Verified listings" body="Trust badges granted after a real check — never sold as a label." />
            <MiniFeature icon="fa-user-shield" title="User management" body="Change roles, suspend bad actors, keep accounts in order." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section home-sec" style={{ background: "var(--bg)" }}>
        <div className="container" style={{ textAlign: "center", maxWidth: 720 }}>
          <div className="sec-label" style={{ textAlign: "center" }}>Ready?</div>
          <h2 className="sec-title" style={{ fontSize: "clamp(1.8rem,4vw,2.75rem)" }}>JOIN THE COMMUNITY</h2>
          <p className="sec-sub" style={{ margin: "0 auto 2rem", maxWidth: 520 }}>
            Free to browse, free to join. Pick how you want to get started.
          </p>
          <div style={{ display: "flex", gap: ".75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register?role=ENTHUSIAST" className="btn-or-lg">Join as an enthusiast</Link>
            <Link href="/register?role=ORGANISER" className="btn-ghost-lg">Register as a host / club</Link>
            <Link href="/register?role=VENUE" className="btn-ghost-lg">List your venue</Link>
          </div>
          <p style={{ marginTop: "1.25rem", fontSize: ".85rem", color: "var(--mut)" }}>
            Just browsing? <Link href="/events" style={{ color: "var(--or)", textDecoration: "none" }}>Explore events →</Link>
          </p>
        </div>
      </section>
    </>
  );
}

function Step({ n, icon, title, body }: { n: string; icon: string; title: string; body: string }) {
  return (
    <div className="card-surface" style={{ padding: "2rem" }}>
      <div className="hd" style={{ fontSize: "4rem", color: "var(--bdr2)", lineHeight: 1, marginBottom: ".25rem" }}>{n}</div>
      <div style={{ width: 46, height: 46, background: "rgba(255,95,31,.1)", border: "1px solid rgba(255,95,31,.2)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.15rem", color: "var(--or)", marginBottom: "1rem" }}>
        <i className={`fas ${icon}`} />
      </div>
      <h3 className="hd" style={{ fontSize: "1.4rem", marginBottom: ".6rem" }}>{title}</h3>
      <p style={{ fontSize: ".9rem", color: "var(--mut)", lineHeight: 1.7 }}>{body}</p>
    </div>
  );
}

function TwoCol({
  label,
  title,
  body,
  bullets,
  visual,
  reverse = false,
}: {
  label: string;
  title: string;
  body: string;
  bullets: string[];
  visual: React.ReactNode;
  reverse?: boolean;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem", alignItems: "center" }} className="hiw-two">
      <div style={{ order: reverse ? 2 : 1 }}>
        <div className="sec-label">{label}</div>
        <h2 className="hd" style={{ fontSize: "clamp(1.6rem,3.5vw,2.4rem)", marginBottom: ".85rem", lineHeight: 1.05 }}>{title}</h2>
        <p style={{ color: "rgba(245,245,245,.8)", lineHeight: 1.75, marginBottom: "1.1rem" }}>{body}</p>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: ".55rem" }}>
          {bullets.map((b) => (
            <li key={b} style={{ display: "flex", gap: ".6rem", fontSize: ".9rem", color: "rgba(245,245,245,.85)" }}>
              <i className="fas fa-check" style={{ color: "var(--or)", marginTop: ".2rem" }} /> {b}
            </li>
          ))}
        </ul>
      </div>
      <div style={{ order: reverse ? 1 : 2 }}>{visual}</div>
      <style>{`@media (max-width:820px){.hiw-two{grid-template-columns:1fr !important}.hiw-two>div{order:unset !important}}`}</style>
    </div>
  );
}

function MiniFeature({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="card-surface" style={{ padding: "1.25rem" }}>
      <div style={{ color: "var(--or)", fontSize: "1.1rem", marginBottom: ".5rem" }}><i className={`fas ${icon}`} /></div>
      <h3 style={{ fontSize: ".95rem", fontWeight: 700, marginBottom: ".3rem" }}>{title}</h3>
      <p style={{ fontSize: ".82rem", color: "var(--mut)", lineHeight: 1.6 }}>{body}</p>
    </div>
  );
}
