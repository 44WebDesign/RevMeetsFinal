import Image from "next/image";
import { formatDate } from "@/lib/utils";

// Decorative hero layer: a stylised UK map outline with pulsing "event" pins
// over the photo, plus (on wide screens) a couple of floating mini event cards.
// Communicates "car events all across the UK" without depending on live map
// tiles, so it renders identically everywhere. Purely presentational.

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
const PINS: [number, number][] = [
  [51.51, -0.13], [53.48, -2.24], [53.8, -1.55], [55.86, -4.25], [55.95, -3.19],
  [51.48, -3.18], [52.49, -1.89], [51.45, -2.59], [54.98, -1.62], [57.15, -2.09],
];

export function HeroMapOverlay({ cards = [] }: { cards?: HeroCard[] }) {
  const outline = GB.map((p) => project(p[0], p[1]).join(",")).join(" ");

  return (
    <div className="rm-hero-overlay" aria-hidden>
      <svg className="rm-hero-map" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        <polygon
          points={outline}
          fill="rgba(255,95,31,0.05)"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth={1.1}
          strokeLinejoin="round"
        />
        {PINS.map(([lat, lng], i) => {
          const [x, y] = project(lat, lng);
          return (
            <g key={i}>
              <circle className="rm-hero-ring" cx={x} cy={y} fill="none" stroke="#FF5F1F" strokeWidth={1} style={{ animationDelay: `${(i % 5) * 0.5}s` }} />
              <circle cx={x} cy={y} r={2.6} fill="#FF5F1F" />
              <circle cx={x} cy={y} r={2.6} fill="#FF5F1F" opacity={0.5} className="rm-hero-glow" style={{ animationDelay: `${(i % 5) * 0.5}s` }} />
            </g>
          );
        })}
      </svg>

      {cards.slice(0, 2).map((c, i) => (
        <div key={c.slug} className={`rm-hero-card rm-hero-card-${i}`}>
          <div className="rm-hero-card-thumb">
            {c.imageUrl ? (
              <Image src={c.imageUrl} alt="" fill sizes="64px" style={{ objectFit: "cover" }} />
            ) : (
              <span style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${c.color || "#FF5F1F"}55, #0c0c0c)` }} />
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="rm-hero-card-title">{c.title}</div>
            <div className="rm-hero-card-meta">
              <i className="fas fa-location-dot" style={{ color: "#FF5F1F" }} /> {c.city} · {formatDate(c.startsAt)}
            </div>
          </div>
        </div>
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
          height: clamp(360px, 82%, 640px);
          width: auto;
          transform: translate(-50%, -52%);
          opacity: 0.55;
          filter: drop-shadow(0 0 20px rgba(255, 95, 31, 0.15));
        }
        .rm-hero-ring { r: 3; opacity: 0; }
        .rm-hero-glow { filter: blur(2px); }
        @media (prefers-reduced-motion: no-preference) {
          .rm-hero-ring { animation: rmHeroPulse 3s ease-out infinite; }
          .rm-hero-glow { animation: rmHeroGlow 3s ease-in-out infinite; }
        }
        @keyframes rmHeroPulse {
          0% { r: 3; opacity: 0.55; }
          70% { opacity: 0; }
          100% { r: 11; opacity: 0; }
        }
        @keyframes rmHeroGlow {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 0.75; }
        }
        .rm-hero-card {
          position: absolute;
          display: none;
          align-items: center;
          gap: 0.6rem;
          width: 210px;
          padding: 0.55rem 0.7rem;
          background: rgba(13, 13, 13, 0.72);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          backdrop-filter: blur(6px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
        }
        .rm-hero-card-0 { top: 20%; left: 3.5%; }
        .rm-hero-card-1 { bottom: 24%; right: 4%; }
        @media (prefers-reduced-motion: no-preference) {
          .rm-hero-card-0 { animation: rmHeroFloat 6s ease-in-out infinite; }
          .rm-hero-card-1 { animation: rmHeroFloat 6s ease-in-out infinite 1.5s; }
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
        }
        .rm-hero-card-title {
          font-size: 0.8rem;
          font-weight: 700;
          color: #fff;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .rm-hero-card-meta {
          font-size: 0.68rem;
          color: #bdbdbd;
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        @media (min-width: 1200px) {
          .rm-hero-card { display: flex; }
        }
      `}</style>
    </div>
  );
}
