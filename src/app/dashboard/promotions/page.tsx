import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getHostPromotions } from "@/lib/promotions";
import { stripeConfigured } from "@/lib/stripe";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Promotions", robots: { index: false } };

function money(pence: number, currency: string) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: currency.toUpperCase() }).format(
    pence / 100,
  );
}

export default async function PromotionsPage({
  searchParams,
}: {
  searchParams: Promise<{ promote?: string }>;
}) {
  const { promote } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard/promotions");
  if (user.role === "ENTHUSIAST") redirect("/dashboard");

  const promotions = await getHostPromotions(user.id);
  const totalSpent = promotions.reduce((s, p) => s + p.amount, 0);
  const active = promotions.filter((p) => p.live);
  const KIND_LABEL: Record<string, string> = { EVENT: "Event", CLUB: "Club", VENUE: "Venue" };

  return (
    <section className="section" style={{ background: "var(--bg)" }}>
      <div className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
          <div>
            <div className="sec-label">Monetise</div>
            <h1 className="sec-title" style={{ fontSize: "clamp(2rem,4vw,3rem)" }}>PROMOTIONS</h1>
          </div>
          <Link href="/dashboard" className="btn-ghost"><i className="fas fa-arrow-left" /> Dashboard</Link>
        </div>

        {promote === "error" && (
          <div className="card-surface" style={{ padding: "1rem 1.25rem", marginBottom: "1.5rem", border: "1px solid rgba(244,67,54,.3)", color: "#ff6b5e", fontSize: ".88rem" }}>
            We couldn&apos;t confirm that promotion. If you were charged, it will still apply
            shortly — otherwise no charge was made.
          </div>
        )}

        {/* Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
          <Stat label="Active promotions" value={String(active.length)} icon="fa-star" />
          <Stat label="Total promotions" value={String(promotions.length)} icon="fa-bullhorn" />
          <Stat label="Total spent" value={promotions.length ? money(totalSpent, promotions[0].currency) : "£0.00"} icon="fa-receipt" />
        </div>

        {promotions.length === 0 ? (
          <div className="card-surface" style={{ padding: "3rem", textAlign: "center", color: "var(--mut)" }}>
            <i className="fas fa-star" style={{ fontSize: "1.5rem", display: "block", marginBottom: ".75rem", color: "#FFD700" }} />
            <p style={{ marginBottom: "1rem" }}>You haven&apos;t promoted anything yet.</p>
            {stripeConfigured() ? (
              <p style={{ fontSize: ".85rem" }}>Open an event&apos;s <strong>Manage</strong> page, or your club/venue profile, to feature it.</p>
            ) : (
              <p style={{ fontSize: ".85rem" }}>Paid promotion isn&apos;t enabled on this site yet.</p>
            )}
          </div>
        ) : (
          <div className="card-surface" style={{ overflow: "hidden" }}>
            {promotions.map((p, i) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem",
                  padding: "1rem 1.25rem",
                  borderTop: i === 0 ? "none" : "1px solid var(--bdr)",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>
                    <span className="pill" style={{ marginRight: ".5rem", background: "var(--bdr2)", color: "var(--mut)" }}>{KIND_LABEL[p.kind]}</span>
                    {p.title}
                    <span className="pill" style={{ marginLeft: ".6rem", background: p.live ? "rgba(255,215,0,.15)" : "var(--bdr2)", color: p.live ? "#FFD700" : "var(--mut)", border: p.live ? "1px solid rgba(255,215,0,.4)" : "none" }}>
                      {p.live ? "Active" : "Expired"}
                    </span>
                  </div>
                  <div style={{ fontSize: ".8rem", color: "var(--mut)", marginTop: ".25rem" }}>
                    {money(p.amount, p.currency)} · {p.days} days · purchased {formatDate(p.createdAt)} · {p.live ? "until" : "ended"} {formatDate(p.expiresAt)}
                  </div>
                </div>
                {p.href && <Link href={p.href} className="btn-ghost">View</Link>}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="card-surface" style={{ padding: "1.25rem" }}>
      <div style={{ color: "var(--or)", fontSize: "1.1rem", marginBottom: ".4rem" }}>
        <i className={`fas ${icon}`} />
      </div>
      <div className="hd" style={{ fontSize: "1.8rem", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: ".78rem", color: "var(--mut)" }}>{label}</div>
    </div>
  );
}
