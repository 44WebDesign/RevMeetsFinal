import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { AreaChart, BarList } from "@/components/Charts";
import { eventTypeLabel } from "@/lib/enums";

export const dynamic = "force-dynamic";
export const metadata = { title: "Analytics", robots: { index: false } };

const WEEKS = 12;
const DAY = 86_400_000;

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard/analytics");
  if (user.role === "ENTHUSIAST") redirect("/dashboard");

  // Everything scoped to events this account organises.
  const [events, registrations, saves, eventReviews, ownerReviews, photoCount] = await Promise.all([
    prisma.event.findMany({
      where: { organiserId: user.id },
      select: { id: true, slug: true, title: true, type: true, status: true },
    }),
    prisma.registration.findMany({
      where: { event: { organiserId: user.id } },
      select: { createdAt: true, eventId: true },
    }),
    prisma.savedEvent.findMany({
      where: { event: { organiserId: user.id } },
      select: { createdAt: true },
    }),
    prisma.review.findMany({
      where: { event: { organiserId: user.id } },
      select: { rating: true },
    }),
    // Reviews on the account's own club / venue profiles (if any).
    prisma.review.findMany({
      where: {
        OR: [
          ...(user.club ? [{ clubId: user.club.id }] : []),
          ...(user.venue ? [{ venueId: user.venue.id }] : []),
        ],
      },
      select: { rating: true },
    }),
    prisma.photo.count({ where: { event: { organiserId: user.id } } }),
  ]);

  const totalRegs = registrations.length;
  const totalSaves = saves.length;
  const allReviews = [...eventReviews, ...ownerReviews];
  const avgRating =
    allReviews.length > 0 ? allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length : null;

  // ---- Registrations per week (last 12 weeks) ----
  const now = Date.now();
  const weekStart = (i: number) => now - (WEEKS - 1 - i) * 7 * DAY; // oldest → newest
  const buckets = Array.from({ length: WEEKS }, (_, i) => ({
    start: weekStart(i),
    label: new Date(weekStart(i)).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    value: 0,
  }));
  for (const r of registrations) {
    const t = r.createdAt.getTime();
    if (t < buckets[0].start) continue;
    const idx = Math.min(WEEKS - 1, Math.floor((t - buckets[0].start) / (7 * DAY)));
    if (idx >= 0) buckets[idx].value += 1;
  }
  const regsInWindow = buckets.reduce((s, b) => s + b.value, 0);

  // ---- Top events by registrations ----
  const regByEvent = new Map<string, number>();
  for (const r of registrations) regByEvent.set(r.eventId, (regByEvent.get(r.eventId) ?? 0) + 1);
  const topEvents = events
    .map((e) => ({ label: e.title, value: regByEvent.get(e.id) ?? 0, href: `/events/${e.slug}` }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // ---- Registrations by event type ----
  const regByType = new Map<string, number>();
  for (const e of events) {
    const c = regByEvent.get(e.id) ?? 0;
    regByType.set(e.type, (regByType.get(e.type) ?? 0) + c);
  }
  const typeBars = [...regByType.entries()]
    .map(([type, value]) => ({ label: eventTypeLabel(type), value }))
    .filter((t) => t.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <section className="section" style={{ background: "var(--bg)" }}>
      <div className="container" style={{ maxWidth: 1000 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
          <div>
            <div className="sec-label">Insights</div>
            <div className="sec-title" style={{ fontSize: "clamp(1.8rem,4vw,2.75rem)" }}>ANALYTICS</div>
          </div>
          <Link href="/dashboard" className="btn-ghost">
            <i className="fas fa-arrow-left" /> Back to dashboard
          </Link>
        </div>

        {/* Headline stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "1rem", marginBottom: "2rem" }}>
          <Stat label="Events" value={events.length} icon="fa-calendar" />
          <Stat label="Total registrations" value={totalRegs} icon="fa-users" />
          <Stat label="Saves / bookmarks" value={totalSaves} icon="fa-bookmark" />
          <Stat label="Event photos" value={photoCount} icon="fa-camera" />
          <Stat label="Avg rating" value={avgRating !== null ? `${avgRating.toFixed(1)}★` : "—"} icon="fa-star" />
        </div>

        {events.length === 0 ? (
          <div className="card-surface" style={{ padding: "3rem", textAlign: "center", color: "var(--mut)" }}>
            <p style={{ marginBottom: "1rem" }}>No events yet — analytics appear once you publish and people start registering.</p>
            <Link href="/dashboard/events/new" className="btn-or-lg">Create your first event</Link>
          </div>
        ) : (
          <>
            {/* Registrations over time */}
            <div className="card-surface" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: ".5rem", marginBottom: "1rem" }}>
                <h2 className="hd" style={{ fontSize: "1.3rem" }}>Registrations over time</h2>
                <span style={{ fontSize: ".8rem", color: "var(--mut)" }}>{regsInWindow} in the last {WEEKS} weeks</span>
              </div>
              <AreaChart data={buckets} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }} className="analytics-grid">
              <div className="card-surface" style={{ padding: "1.5rem" }}>
                <h2 className="hd" style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>Top events</h2>
                <BarList items={topEvents} emptyText="No registrations yet." />
              </div>
              <div className="card-surface" style={{ padding: "1.5rem" }}>
                <h2 className="hd" style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>Registrations by type</h2>
                <BarList items={typeBars} accent="#00BCD4" emptyText="No registrations yet." />
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`@media (max-width: 720px){.analytics-grid{grid-template-columns:1fr !important}}`}</style>
    </section>
  );
}

function Stat({ label, value, icon }: { label: string; value: number | string; icon: string }) {
  return (
    <div className="card-surface" style={{ padding: "1.25rem" }}>
      <div style={{ color: "var(--or)", fontSize: "1.1rem", marginBottom: ".4rem" }}>
        <i className={`fas ${icon}`} />
      </div>
      <div className="hd" style={{ fontSize: "2rem", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: ".78rem", color: "var(--mut)" }}>{label}</div>
    </div>
  );
}
