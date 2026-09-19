import Link from "next/link";
import { MapView, type MapPoint } from "./MapView";
import { HeroSearch } from "./HeroSearch";

const POPULAR: [string, string][] = [
  ["Car Shows", "car-shows"],
  ["Track Days", "track-days"],
  ["JDM Meets", "jdm-meets"],
  ["Drift Events", "drift-events"],
  ["Cruises", "night-cruises"],
];

// Alternative homepage header: a full-screen interactive map with the search
// facility (and headline) overlaid. The map stays draggable — only the search
// panel, tags and scroll cue capture pointer events.
export function MapHero({ points }: { points: MapPoint[] }) {
  return (
    <section style={{ position: "relative", height: "100vh", minHeight: 560, marginTop: -64, overflow: "hidden" }}>
      {/* Full-bleed interactive map */}
      <div style={{ position: "absolute", inset: 0 }}>
        <MapView points={points} bare height="100%" center={[54.2, -2.6]} zoom={6} fitToPoints={points.length > 0} />
      </div>

      {/* Darken the top so the nav + headline stay legible over the map */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 420, background: "linear-gradient(to bottom, rgba(8,8,8,.92) 0%, rgba(8,8,8,.55) 45%, transparent 100%)", pointerEvents: "none", zIndex: 1 }} />
      {/* Blend the bottom into the page */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 160, background: "linear-gradient(to bottom, transparent, var(--bg))", pointerEvents: "none", zIndex: 1 }} />

      {/* Overlay content (wrapper ignores pointer events; panels re-enable them) */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "calc(64px + 4vh)", pointerEvents: "none", zIndex: 2 }}>
        <div style={{ width: "100%", maxWidth: 900, padding: "0 1.25rem", textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: ".5rem",
              background: "rgba(255,95,31,.14)", border: "1px solid rgba(255,95,31,.3)", color: "var(--or)",
              padding: ".35rem 1rem", borderRadius: 100, fontSize: ".72rem", fontWeight: 700,
              letterSpacing: ".1em", textTransform: "uppercase", marginBottom: "1.1rem",
              backdropFilter: "blur(4px)",
            }}
          >
            <i className="fas fa-circle" style={{ fontSize: ".4rem" }} /> Live Events Across the UK
          </div>
          <h1
            className="hd"
            style={{ fontSize: "clamp(2.5rem,7vw,5.5rem)", lineHeight: 0.95, letterSpacing: ".03em", marginBottom: ".9rem", textShadow: "0 2px 24px rgba(0,0,0,.8)" }}
          >
            FIND YOUR NEXT <span style={{ color: "var(--or)" }}>CAR EVENT</span>
          </h1>
          <p style={{ fontSize: "1.02rem", color: "rgba(245,245,245,.82)", maxWidth: 540, margin: "0 auto 1.75rem", textShadow: "0 1px 12px rgba(0,0,0,.9)" }}>
            Explore the map, or search car shows, track days, cruises and meets near you.
          </p>

          <div style={{ pointerEvents: "auto" }}>
            <HeroSearch />
          </div>

          <div style={{ display: "flex", gap: ".5rem", justifyContent: "center", flexWrap: "wrap", marginTop: "1.25rem", pointerEvents: "auto" }}>
            <span style={{ fontSize: ".75rem", color: "rgba(245,245,245,.7)", alignSelf: "center", textShadow: "0 1px 8px rgba(0,0,0,.9)" }}>Popular:</span>
            {POPULAR.map(([label, slug]) => (
              <Link key={slug} href={`/events/type/${slug}`} className="tag" style={{ background: "rgba(13,13,13,.7)", backdropFilter: "blur(4px)" }}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <a
        href="#discover"
        aria-label="Scroll to explore"
        style={{ position: "absolute", bottom: 22, left: "50%", transform: "translateX(-50%)", zIndex: 2, color: "rgba(245,245,245,.85)", fontSize: "1.1rem", textDecoration: "none", pointerEvents: "auto", textShadow: "0 1px 10px rgba(0,0,0,.9)" }}
      >
        <i className="fas fa-chevron-down" />
      </a>
    </section>
  );
}
