"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SessionPayload } from "@/lib/auth";
import { NotificationBell } from "./NotificationBell";

export function Nav({ session }: { session: SessionPayload | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    setLoggingOut(false);
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  const links = [
    { href: "/events", label: "Events" },
    { href: "/map", label: "Map" },
    { href: "/clubs", label: "Clubs" },
    { href: "/venues", label: "Venues" },
    { href: "/#how", label: "How It Works" },
  ];

  return (
    <nav className="site-nav">
      <Link href="/" className="logo">
        REV<span>MEET</span>
      </Link>

      <ul className="nav-links" style={{ display: "none" }} data-desktop>
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href}>{l.label}</Link>
          </li>
        ))}
      </ul>

      <div className="nav-actions" style={{ display: "none" }} data-desktop>
        {session ? (
          <>
            {session.role === "ADMIN" && (
              <Link href="/admin" className="btn-ghost" style={{ color: "var(--or)", borderColor: "rgba(255,95,31,.4)" }}>
                <i className="fas fa-shield-halved" /> Admin
              </Link>
            )}
            <NotificationBell />
            <Link href="/dashboard" className="btn-ghost">
              <i className="fas fa-gauge-high" /> Dashboard
            </Link>
            <button className="btn-or" onClick={logout} disabled={loggingOut}>
              {loggingOut ? "…" : "Log Out"}
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="btn-ghost">
              Log In
            </Link>
            <Link href="/register" className="btn-or">
              Sign Up Free
            </Link>
          </>
        )}
      </div>

      {/* Mobile toggle */}
      <button
        aria-label="Menu"
        onClick={() => setOpen((o) => !o)}
        data-mobile-toggle
        style={{
          background: "transparent",
          border: "none",
          color: "#fff",
          fontSize: "1.25rem",
          cursor: "pointer",
        }}
      >
        <i className={open ? "fas fa-xmark" : "fas fa-bars"} />
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            top: 64,
            left: 0,
            right: 0,
            background: "rgba(8,8,8,.98)",
            borderBottom: "1px solid var(--bdr)",
            padding: "1rem 2rem 1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: ".75rem",
          }}
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              style={{
                color: "var(--mut)",
                textDecoration: "none",
                textTransform: "uppercase",
                fontSize: ".85rem",
                letterSpacing: ".06em",
                padding: ".4rem 0",
              }}
            >
              {l.label}
            </Link>
          ))}
          <div style={{ display: "flex", gap: ".75rem", marginTop: ".5rem", alignItems: "center", flexWrap: "wrap" }}>
            {session ? (
              <>
                <NotificationBell />
                {session.role === "ADMIN" && (
                  <Link href="/admin" className="btn-ghost" onClick={() => setOpen(false)}>
                    Admin
                  </Link>
                )}
                <Link href="/dashboard" className="btn-ghost" onClick={() => setOpen(false)}>
                  Dashboard
                </Link>
                <button className="btn-or" onClick={logout} disabled={loggingOut}>
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-ghost" onClick={() => setOpen(false)}>
                  Log In
                </Link>
                <Link href="/register" className="btn-or" onClick={() => setOpen(false)}>
                  Sign Up Free
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @media (min-width: 900px) {
          :global(.site-nav [data-desktop]) {
            display: flex !important;
          }
          :global(.site-nav [data-mobile-toggle]) {
            display: none;
          }
        }
      `}</style>
    </nav>
  );
}
