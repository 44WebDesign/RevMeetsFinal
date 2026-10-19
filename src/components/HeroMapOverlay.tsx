import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

// Hero centrepiece: a glowing stylised UK map with a live "radar" sweep and
// pulsing event pins, plus floating mini event cards that link to real events.
// Reads instantly as "live car events all across the UK" without depending on
// live map tiles, so it renders identically everywhere. The map is decorative;
// the cards are real, tappable links.

type HeroCard = {
  slug: string;
  title: string;
  city: string;
  startsAt: string | Date;
  imageUrl?: string | null;
  color?: string;
};

// Equirectangular projection tuned to the UK, with a longitude squeeze so the
// silhouette keeps its real proportions. x = west→east, y = north→south.
const B = { lngMin: -8.6, lngMax: 1.9, latMin: 49.8, latMax: 59.0 };
const W = 270;
const H = 390;
function project(lat: number, lng: number): [number, number] {
  const x = ((lng - B.lngMin) / (B.lngMax - B.lngMin)) * W;
  const y = ((B.latMax - lat) / (B.latMax - B.latMin)) * H;
  return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
}

// Great Britain coastline waypoints (clockwise from Land's End). Stylised, not
// survey-accurate — enough to read instantly as "the UK".
const GB: [number, number][] = [
  [50.07, -5.72], [50.34, -4.14], [50.6, -2.46], [50.77, -1.29], [50.83, -0.14],
  [51.13, 1.31], [51.58, 0.9], [52.08, 1.72], [52.94, 1.74], [52.8, 0.33],
  [53.18, 0.35], [53.58, -0.07], [54.11, -0.09], [54.62, -1.18], [55.01, -1.42],
  [55.77, -1.98], [56.06, -2.6], [57.17, -2.08], [57.7, -3.9], [58.64, -3.07],
  [58.55, -4.8], [58.25, -5.0], [57.3, -5.8], [56.8, -5.9], [55.7, -5.78],
  [55.3, -5.8], [54.86, -5.0], [54.1, -3.6], [53.4, -3.18], [53.33, -4.64],
  [52.8, -4.75], [52.1, -4.7], [51.68, -5.3], [51.6, -4.2], [51.38, -3.56],
  [51.21, -4.2], [50.23, -3.78],
];

// Pins at real UK city coordinates (same projection → they land on the map).
// A few carry a label so the map reads as real places, not abstract dots.
const PINS: { lat: number; lng: number; label?: string }[] = [
  { lat: 51.51, lng: -0.13, label: "London" },
  { lat: 53.48, lng: -2.24, label: "Manchester" },
  { lat: 55.95, lng: -3.19, label: "Edinburgh" },
  { lat: 53.8, lng: -1.55 },
  { lat: 55.86, lng: -4.25 },
  { lat: 51.48, lng: -3.18 },
  { lat: 52.49, lng: -1.89 },
  { lat: 51.45, lng: -2.59 },
  { lat: 54.98, lng: -1.62 },
  { lat: 57.15, lng: -2.09 },
  { lat: 52.63, lng: 1.3 },
  { lat: 50.82, lng: -0.14 },
];

// Centre of the sweep/glow, roughly the middle of England.
const [CX, CY] = project(53.0, -1.8);

export function HeroMapOverlay({ cards = [] }: { cards?: HeroCard[] }) {
  const outline = GB.map((p) => project(p[0], p[1]).join(",")).join(" ");
  const corners = ["tl", "tr", "bl", "br"] as const;

  return (
    <div className="rm-hero-overlay">
      <svg className="rm-hero-map" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" aria-hidden>
        <defs>
          <radialGradient id="rmSweep" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,95,31,0.35)" />
            <stop offset="100%" stopColor="rgba(255,95,31,0)" />
          </radialGradient>
          <clipPath id="rmClip">
            <polygon points={outline} />
          </clipPath>
        </defs>

        {/* faint concentric "radar" rings behind the landmass */}
        {[60, 110, 165].map((r) => (
          <circle key={r} cx={CX} cy={CY} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
        ))}

        {/* rotating sweep wedge, clipped to the UK silhouette */}
        <g clipPath="url(#rmClip)">
          <g className="rm-hero-sweep" style={{ transformOrigin: `${CX}px ${CY}px` }}>
            <path d={`M ${CX} ${CY} L ${CX} ${CY - 220} A 220 220 0 0 1 ${CX + 180} ${CY - 128} Z`} fill="url(#rmSweep)" />
          </g>
        </g>

        <polygon
          points={outline}
          fill="rgba(255,95,31,0.06)"
          stroke="rgba(255,255,255,0.42)"
          strokeWidth={1.3}
          strokeLinejoin="round"
        />

        {PINS.map((p, i) => {
          const [x, y] = project(p.lat, p.lng);
          return (
            <g key={i}>
              <circle className="rm-hero-ring" cx={x} cy={y} fill="none" stroke="#FF5F1F" strokeWidth={1} style={{ animationDelay: `${(i % 5) * 0.5}s` }} />
              <circle cx={x} cy={y} r={3} fill="#FF5F1F" />
              <circle cx={x} cy={y} r={3} fill="#FF7A43" opacity={0.6} className="rm-hero-glow" style={{ animationDelay: `${(i % 5) * 0.5}s` }} />
              {p.label && (
                <text x={x + 6} y={y + 3} className="rm-hero-pinlabel">{p.label}</text>
              )}
            </g>
          );
        })}
      </svg>

      {cards.slice(0, 4).map((c, i) => (
        <Link key={c.slug} href={`/events/${c.slug}`} className={`rm-hero-card rm-hero-card-${corners[i]}`} aria-label={`${c.title} — ${c.city}`}>
          <div className="rm-hero-card-thumb" style={{ borderColor: c.color || "#FF5F1F" }}>
            {c.imageUrl ? (
              <Image src={c.imageUrl} alt="" fill sizes="64px" style={{ objectFit: "cover" }} />
            ) : (
              <span style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${c.color || "#FF5F1F"}55, #0c0c0c)` }} />
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="rm-hero-card-title">{c.title}</div>
            <div className="rm-hero-card-meta">
              <i className="fas fa-location-dot" style={{ color: c.color || "#FF5F1F" }} /> {c.city} · {formatDate(c.startsAt)}
            </div>
          </div>
        </Link>
      ))}

      <style>{`
        .rm-hero-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }
        .rm-hero-map {
          position: absolute;
          top: 50%;
          left: 50%;
          height: clamp(340px, 86%, 660px);
          width: auto;
          transform: translate(-50%, -52%);
          opacity: 0.38;
          filter: drop-shadow(0 0 26px rgba(255, 95, 31, 0.22));
        }
        .rm-hero-pinlabel {
          fill: rgba(255,255,255,0.85);
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.02em;
          paint-order: stroke;
          stroke: rgba(0,0,0,0.55);
          stroke-width: 2px;
        }
        .rm-hero-ring { r: 3; opacity: 0; }
        .rm-hero-glow { filter: blur(2px); }
        @media (prefers-reduced-motion: no-preference) {
          .rm-hero-ring { animation: rmHeroPulse 3s ease-out infinite; }
          .rm-hero-glow { animation: rmHeroGlow 3s ease-in-out infinite; }
          .rm-hero-sweep { animation: rmHeroSweep 7s linear infinite; }
        }
        @keyframes rmHeroPulse {
          0% { r: 3; opacity: 0.6; }
          70% { opacity: 0; }
          100% { r: 13; opacity: 0; }
        }
        @keyframes rmHeroGlow {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 0.8; }
        }
        @keyframes rmHeroSweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .rm-hero-card {
          position: absolute;
          display: none;
          align-items: center;
          gap: 0.6rem;
          width: 212px;
          padding: 0.55rem 0.7rem;
          background: rgba(13, 13, 13, 0.74);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          backdrop-filter: blur(6px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
          pointer-events: auto;
          text-decoration: none;
          transition: transform 0.18s ease, border-color 0.18s ease;
        }
        .rm-hero-card:hover {
          border-color: rgba(255, 95, 31, 0.5);
          transform: translateY(-2px) scale(1.02);
        }
        .rm-hero-card-tl { top: 16%; left: 3%; }
        .rm-hero-card-tr { top: 16%; right: 3%; }
        .rm-hero-card-bl { bottom: 17%; left: 3%; }
        .rm-hero-card-br { bottom: 17%; right: 3%; }
        @media (prefers-reduced-motion: no-preference) {
          .rm-hero-card-tl { animation: rmHeroFloat 6s ease-in-out infinite; }
          .rm-hero-card-tr { animation: rmHeroFloat 6s ease-in-out infinite 1s; }
          .rm-hero-card-bl { animation: rmHeroFloat 6s ease-in-out infinite 2s; }
          .rm-hero-card-br { animation: rmHeroFloat 6s ease-in-out infinite 3s; }
        }
        @keyframes rmHeroFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .rm-hero-card-thumb {
          position: relative;
          flex: 0 0 48px;
          width: 48px;
          height: 48px;
          border-radius: 7px;
          overflow: hidden;
          border: 2px solid #FF5F1F;
        }
        .rm-hero-card-title {
          font-size: 0.8rem;
          font-weight: 700;
          color: #fff;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-align: left;
        }
        .rm-hero-card-meta {
          font-size: 0.68rem;
          color: #c7c7c7;
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-align: left;
        }
        /* Map is a quiet backdrop on phones/tablets (the live strip carries the
           message there); it grows brighter and the floating cards appear as
           the viewport widens enough to clear the centred headline + search. */
        @media (min-width: 768px) {
          .rm-hero-map { opacity: 0.6; }
        }
        @media (min-width: 1024px) {
          .rm-hero-map { opacity: 0.72; }
          .rm-hero-card-tl, .rm-hero-card-tr { display: flex; }
        }
        @media (min-width: 1440px) {
          .rm-hero-card-bl, .rm-hero-card-br { display: flex; }
        }
      `}</style>
    </div>
  );
}
