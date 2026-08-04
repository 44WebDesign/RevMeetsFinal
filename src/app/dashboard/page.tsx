import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { EventCard } from "@/components/EventCard";
import { ROLE_LABELS, eventTypeLabel } from "@/lib/enums";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Dashboard", robots: { index: false } };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");

  const isHost = user.role === "ORGANISER" || user.role === "ADMIN";
  const isVenue = user.role === "VENUE";

  return (
    <section className="section" style={{ background: "var(--bg)" }}>
      <div className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
          <div>
            <div className="sec-label">{ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ?? user.role}</div>
            <div className="sec-title" style={{ fontSize: "clamp(2rem,4vw,3rem)" }}>
              HI, {user.name.split(" ")[0].toUpperCase()}
            </div>
          </div>
          {(isHost || isVenue) && (
            <Link href="/dashboard/events/new" className="btn-or-lg">
              <i className="fas fa-plus" /> Create Event
            </Link>
          )}
        </div>

        {/* Quick links */}
        <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap", marginBottom: "2.5rem" }}>
          {user.club && (
            <Link href="/dashboard/club" className="btn-ghost">
              <i className="fas fa-users-gear" /> Edit Club Profile
            </Link>
          )}
          {user.venue && (
            <Link href="/dashboard/venue" className="btn-ghost">
              <i className="fas fa-warehouse" /> Edit Venue Profile
            </Link>
          )}
          {user.club && (
            <Link href={`/clubs/${user.club.slug}`} className="btn-ghost">
              <i className="fas fa-eye" /> View Public Club Page
            </Link>
          )}
          {user.venue && (
            <Link href={`/venues/${user.venue.slug}`} className="btn-ghost">
              <i className="fas fa-eye" /> View Public Venue Page
            </Link>
          )}
        </div>

        {isHost || isVenue ? (
          <HostDashboard userId={user.id} />
        ) : (
          <EnthusiastDashboard userId={user.id} />
        )}
      </div>
    </section>
  );
}

async function HostDashboard({ userId }: { userId: string }) {
  const events = await prisma.event.findMany({
    where: { organiserId: userId },
    orderBy: { startsAt: "asc" },
    include: { _count: { select: { registrations: true } }, club: { select: { name: true } } },
  });

  const totalAttendees = events.reduce((s, e) => s + e._count.registrations, 0);

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
        <StatCard label="Events" value={events.length} icon="fa-calendar" />
        <StatCard label="Total registrations" value={totalAttendees} icon="fa-users" />
        <StatCard label="Published" value={events.filter((e) => e.status === "PUBLISHED").length} icon="fa-bullhorn" />
        <StatCard label="Drafts" value={events.filter((e) => e.status === "DRAFT").length} icon="fa-pen" />
      </div>

      <h2 className="hd" style={{ fontSize: "1.75rem", marginBottom: "1.25rem" }}>Your Events</h2>
      {events.length === 0 ? (
        <div className="card-surface" style={{ padding: "3rem", textAlign: "center", color: "var(--mut)" }}>
          <p style={{ marginBottom: "1rem" }}>You haven&apos;t created any events yet.</p>
          <Link href="/dashboard/events/new" className="btn-or-lg">Create your first event</Link>
        </div>
      ) : (
        <div className="card-surface" style={{ overflow: "hidden" }}>
          {events.map((e, i) => (
            <div
              key={e.id}
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
                  {e.title}
                  {e.status !== "PUBLISHED" && (
                    <span className="pill" style={{ marginLeft: ".5rem", background: e.status === "DRAFT" ? "var(--bdr2)" : "rgba(244,67,54,.2)", color: e.status === "DRAFT" ? "var(--mut)" : "#ff6b5e" }}>
                      {e.status}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: ".8rem", color: "var(--mut)", marginTop: ".25rem" }}>
                  {eventTypeLabel(e.type)} · {formatDate(e.startsAt)} · {e.city} · {e._count.registrations} going
                </div>
              </div>
              <div style={{ display: "flex", gap: ".5rem" }}>
                <Link href={`/events/${e.slug}`} className="btn-ghost">View</Link>
                <Link href={`/dashboard/events/${e.id}/edit`} className="btn-or">Manage</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

async function EnthusiastDashboard({ userId }: { userId: string }) {
  const [registrations, clubFollows, venueFollows] = await Promise.all([
    prisma.registration.findMany({
      where: { userId },
      include: {
        event: { include: { _count: { select: { registrations: true } }, club: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.clubFollow.findMany({ where: { userId }, include: { club: true } }),
    prisma.venueFollow.findMany({ where: { userId }, include: { venue: true } }),
  ]);

  const upcoming = registrations
    .filter((r) => r.event.startsAt >= new Date(Date.now() - 86400000))
    .map((r) => r.event);

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
        <StatCard label="Registered events" value={registrations.length} icon="fa-ticket" />
        <StatCard label="Clubs followed" value={clubFollows.length} icon="fa-users-gear" />
        <StatCard label="Venues followed" value={venueFollows.length} icon="fa-warehouse" />
      </div>

      <h2 className="hd" style={{ fontSize: "1.75rem", marginBottom: "1.25rem" }}>Events You&apos;re Attending</h2>
      {upcoming.length === 0 ? (
        <div className="card-surface" style={{ padding: "3rem", textAlign: "center", color: "var(--mut)" }}>
          <p style={{ marginBottom: "1rem" }}>You haven&apos;t registered for any events yet.</p>
          <Link href="/events" className="btn-or-lg">Browse events</Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: "1.5rem" }}>
          {upcoming.map((e) => (
            <EventCard
              key={e.id}
              event={{
                id: e.id,
                slug: e.slug,
                title: e.title,
                description: e.description,
                type: e.type,
                city: e.city,
                startsAt: e.startsAt.toISOString(),
                imageUrl: e.imageUrl,
                attendees: e._count.registrations,
                clubName: e.club?.name ?? null,
              }}
            />
          ))}
        </div>
      )}

      {(clubFollows.length > 0 || venueFollows.length > 0) && (
        <>
          <h2 className="hd" style={{ fontSize: "1.75rem", margin: "2.5rem 0 1.25rem" }}>Following</h2>
          <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
            {clubFollows.map((f) => (
              <Link key={f.id} href={`/clubs/${f.club.slug}`} className="tag">
                <i className="fas fa-users-gear" style={{ color: "var(--or)", marginRight: 5 }} /> {f.club.name}
              </Link>
            ))}
            {venueFollows.map((f) => (
              <Link key={f.id} href={`/venues/${f.venue.slug}`} className="tag">
                <i className="fas fa-warehouse" style={{ color: "#00BCD4", marginRight: 5 }} /> {f.venue.name}
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
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
