import Link from "next/link";
import Image from "next/image";
import { FallbackCover } from "./FallbackCover";
import type { SpotlightItem } from "@/lib/queries";

// Prominent homepage band showcasing currently-featured (paid) events, clubs
// and venues. Renders nothing when nothing is promoted.
export function Spotlight({ items }: { items: SpotlightItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="section home-sec" style={{ background: "var(--bg2)" }}>
      <div className="container">
        <div style={{ display: "flex", alignItems: "center", gap: ".6rem", marginBottom: "1.25rem" }}>
          <i className="fas fa-star" style={{ color: "#FFD700" }} />
          <div>
            <div className="sec-label" style={{ margin: 0 }}>Spotlight</div>
            <h2 className="hd" style={{ fontSize: "1.6rem" }}>Featured right now</h2>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "1.5rem" }}>
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className="card-surface"
              style={{ overflow: "hidden", textDecoration: "none", color: "inherit", position: "relative", display: "block", borderColor: "rgba(255,215,0,.35)" }}
            >
              <div style={{ position: "relative", height: 150, overflow: "hidden" }}>
                {it.imageUrl ? (
                  <Image src={it.imageUrl} alt={it.title} fill sizes="(max-width:640px) 100vw, 360px" style={{ objectFit: "cover", filter: "brightness(.8)" }} />
                ) : (
                  <FallbackCover accent={it.accent} icon={it.icon} />
                )}
                <span className="pill" style={{ position: "absolute", top: ".6rem", left: ".6rem", background: "rgba(8,8,8,.78)", color: "#FFD700", border: "1px solid rgba(255,215,0,.45)" }}>
                  <i className="fas fa-star" /> Featured
                </span>
              </div>
              <div style={{ padding: "1rem 1.15rem" }}>
                <div style={{ fontSize: ".7rem", textTransform: "uppercase", letterSpacing: ".08em", color: it.accent, fontWeight: 700, marginBottom: ".2rem" }}>
                  {it.kind}
                </div>
                <div style={{ fontWeight: 700, fontSize: "1.02rem", lineHeight: 1.25, marginBottom: ".3rem" }}>{it.title}</div>
                <div style={{ fontSize: ".8rem", color: "var(--mut)" }}>{it.subtitle}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
