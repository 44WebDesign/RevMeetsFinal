import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin", robots: { index: false } };

const NAV = [
  { href: "/admin", label: "Overview", icon: "fa-gauge-high" },
  { href: "/admin/reports", label: "Reports", icon: "fa-flag" },
  { href: "/admin/events", label: "Events", icon: "fa-calendar" },
  { href: "/admin/listings", label: "Listings", icon: "fa-circle-check" },
  { href: "/admin/users", label: "Users", icon: "fa-users" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/");

  return (
    <section className="section" style={{ background: "var(--bg)" }}>
      <div className="container">
        <div style={{ display: "flex", alignItems: "center", gap: ".6rem", marginBottom: "1.5rem" }}>
          <span className="pill" style={{ background: "var(--or)", color: "#fff" }}>
            <i className="fas fa-shield-halved" /> Admin
          </span>
          <span style={{ color: "var(--mut)", fontSize: ".85rem" }}>Moderation console</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "1.5rem" }} className="admin-grid">
          <aside>
            <nav style={{ display: "flex", flexDirection: "column", gap: ".25rem", position: "sticky", top: 80 }}>
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: ".6rem",
                    padding: ".6rem .8rem",
                    borderRadius: 6,
                    color: "var(--txt)",
                    textDecoration: "none",
                    fontSize: ".88rem",
                    fontWeight: 600,
                    border: "1px solid var(--bdr)",
                  }}
                >
                  <i className={`fas ${n.icon}`} style={{ width: 16, color: "var(--or)" }} /> {n.label}
                </Link>
              ))}
              <Link href="/dashboard" style={{ padding: ".6rem .8rem", fontSize: ".8rem", color: "var(--mut)", textDecoration: "none" }}>
                ← Back to dashboard
              </Link>
            </nav>
          </aside>
          <div style={{ minWidth: 0 }}>{children}</div>
        </div>
      </div>

      <style>{`@media (max-width: 760px){.admin-grid{grid-template-columns:1fr !important}}`}</style>
    </section>
  );
}
