import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

// Hero floating cards: real upcoming events that link through to the event,
// scattered around the hero and gently floating. (The map backdrop itself is a
// semi-transparent map image layer rendered by the hero in page.tsx — this
// component only draws the cards.)

type HeroCard = {
  slug: string;
  title: string;
  city: string;
  startsAt: string | Date;
  imageUrl?: string | null;
  color?: string;
};

// Scattered positions for the floating event cards — varied heights, edge
// insets, small rotations and float timings so they read as organically placed
// rather than grid-aligned. tier 1 (2 cards) shows at ≥1024px; tier 2 (4 more)
// at ≥1440px, where the side gutters are wide enough to clear the centred
// headline + search + chips. The two mid-height cards sit further in for a
// staggered, zigzag look.
const SLOTS: {
  pos: CSSProperties;
  rot: number;
  delay: string;
  dur: string;
  tier: 1 | 2;
}[] = [
  { pos: { top: "9%", right: "3%" }, rot: 2.5, delay: "0s", dur: "6.5s", tier: 1 },
  { pos: { top: "15%", left: "2.5%" }, rot: -3, delay: "1.3s", dur: "7s", tier: 1 },
  { pos: { top: "46%", right: "9.5%" }, rot: -2, delay: "2.5s", dur: "6.8s", tier: 2 },
  { pos: { top: "40%", left: "9.5%" }, rot: 3, delay: "0.7s", dur: "7.3s", tier: 2 },
  { pos: { bottom: "10%", right: "4.5%" }, rot: 3, delay: "1.9s", dur: "6.3s", tier: 2 },
  { pos: { bottom: "16%", left: "3%" }, rot: -2.5, delay: "3.1s", dur: "7s", tier: 2 },
];

export function HeroMapOverlay({ cards = [] }: { cards?: HeroCard[] }) {
  return (
    <div className="rm-hero-overlay">
      {cards.slice(0, SLOTS.length).map((c, i) => {
        const s = SLOTS[i];
        return (
          <div
            key={c.slug}
            className={`rm-hero-slot rm-hero-slot-t${s.tier}`}
            style={{ ...s.pos, animationDelay: s.delay, animationDuration: s.dur }}
          >
            <Link
              href={`/events/${c.slug}`}
              className="rm-hero-card"
              style={{ transform: `rotate(${s.rot}deg)` }}
              aria-label={`${c.title} — ${c.city}`}
            >
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
          </div>
        );
      })}

      <style>{`
        .rm-hero-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }
        /* Positioned, gently-floating wrapper; the card inside carries the
           rotation so the two transforms never fight. */
        .rm-hero-slot {
          position: absolute;
          display: none;
          width: 206px;
        }
        @media (prefers-reduced-motion: no-preference) {
          .rm-hero-slot {
            animation-name: rmHeroFloat;
            animation-timing-function: ease-in-out;
            animation-iteration-count: infinite;
          }
        }
        @keyframes rmHeroFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-9px); }
        }
        .rm-hero-card {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          width: 100%;
          padding: 0.55rem 0.7rem;
          background: rgba(13, 13, 13, 0.78);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          backdrop-filter: blur(6px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
          pointer-events: auto;
          text-decoration: none;
          transition: border-color 0.18s ease, box-shadow 0.18s ease;
        }
        .rm-hero-card:hover {
          border-color: rgba(255, 95, 31, 0.55);
          box-shadow: 0 12px 34px rgba(0, 0, 0, 0.55);
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
        @media (min-width: 1024px) {
          .rm-hero-slot-t1 { display: block; }
        }
        @media (min-width: 1440px) {
          .rm-hero-slot-t2 { display: block; }
        }
      `}</style>
    </div>
  );
}
