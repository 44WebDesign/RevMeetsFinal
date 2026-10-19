import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

// Mobile-only hero element: a horizontal, swipeable strip of real upcoming
// events plus a jump-to-map link. On phones the floating desktop cards are
// hidden, so this is what makes "live car events + map finder" tangible and
// tappable right in the hero.

type HeroCard = {
  slug: string;
  title: string;
  city: string;
  startsAt: string | Date;
  imageUrl?: string | null;
  color?: string;
};

export function HeroLiveStrip({ cards = [] }: { cards?: HeroCard[] }) {
  if (cards.length === 0) return null;

  return (
    <div className="rm-live">
      <div className="rm-live-head">
        <span className="rm-live-label">
          <span className="rm-live-dot" /> Live across the UK
        </span>
        <Link href="/map" className="rm-live-map">
          <i className="fas fa-map-location-dot" /> Open map
        </Link>
      </div>

      <div className="rm-live-scroll">
        {cards.slice(0, 6).map((c) => (
          <Link key={c.slug} href={`/events/${c.slug}`} className="rm-live-card" aria-label={`${c.title} — ${c.city}`}>
            <div className="rm-live-thumb">
              {c.imageUrl ? (
                <Image src={c.imageUrl} alt="" fill sizes="150px" style={{ objectFit: "cover" }} />
              ) : (
                <span style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${c.color || "#FF5F1F"}55, #0c0c0c)` }} />
              )}
              <span className="rm-live-pin" style={{ background: c.color || "#FF5F1F" }}>
                <i className="fas fa-location-dot" />
              </span>
            </div>
            <div className="rm-live-title">{c.title}</div>
            <div className="rm-live-meta">{c.city} · {formatDate(c.startsAt)}</div>
          </Link>
        ))}
      </div>

      <style>{`
        .rm-live { display: none; }
        /* Mobile + tablet: the floating desktop cards don't fit beside the
           centred headline/search until ≥1024px, so below that this swipeable
           strip carries the "live events" message instead. */
        @media (max-width: 1023px) {
          .rm-live {
            display: block;
            text-align: left;
            margin-top: 1.1rem;
            /* bleed to the screen edges so the scroll feels native */
            margin-left: -1.5rem;
            margin-right: -1.5rem;
          }
        }
        .rm-live-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.5rem;
          margin-bottom: 0.7rem;
        }
        .rm-live-label {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #fff;
        }
        .rm-live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #FF5F1F;
          box-shadow: 0 0 0 0 rgba(255, 95, 31, 0.6);
        }
        @media (prefers-reduced-motion: no-preference) {
          .rm-live-dot { animation: rmLiveDot 2s ease-out infinite; }
        }
        @keyframes rmLiveDot {
          0% { box-shadow: 0 0 0 0 rgba(255, 95, 31, 0.6); }
          100% { box-shadow: 0 0 0 9px rgba(255, 95, 31, 0); }
        }
        .rm-live-map {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--or);
          text-decoration: none;
          white-space: nowrap;
        }
        .rm-live-scroll {
          display: flex;
          gap: 0.75rem;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          padding: 0 1.5rem 0.5rem;
          scrollbar-width: none;
        }
        .rm-live-scroll::-webkit-scrollbar { display: none; }
        .rm-live-card {
          scroll-snap-align: start;
          flex: 0 0 158px;
          width: 158px;
          text-decoration: none;
          background: rgba(13, 13, 13, 0.72);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          overflow: hidden;
          backdrop-filter: blur(6px);
        }
        .rm-live-thumb {
          position: relative;
          width: 100%;
          height: 92px;
        }
        .rm-live-pin {
          position: absolute;
          bottom: 6px;
          left: 6px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 0.62rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
        }
        .rm-live-title {
          font-size: 0.82rem;
          font-weight: 700;
          color: #fff;
          line-height: 1.25;
          padding: 0.55rem 0.6rem 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .rm-live-meta {
          font-size: 0.7rem;
          color: #bdbdbd;
          padding: 0.2rem 0.6rem 0.65rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
    </div>
  );
}
