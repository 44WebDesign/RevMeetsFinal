"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type Notification = {
  id: string;
  type: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

const ICONS: Record<string, string> = {
  REGISTRATION: "fa-user-check",
  REVIEW: "fa-star",
  NEW_EVENT: "fa-calendar-plus",
  REMINDER: "fa-bell",
  PHOTO: "fa-camera",
  FOLLOW: "fa-heart",
  ENQUIRY: "fa-envelope",
};

// Bell menu with an unread badge. Polls the notifications API periodically and
// on open. Rendered only for signed-in users (see Nav).
export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.notifications ?? []);
      setUnread(data.unread ?? 0);
      setLoaded(true);
    } catch {
      /* ignore transient errors */
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      await load();
      if (unread > 0) {
        setUnread(0);
        setItems((prev) => prev.map((n) => ({ ...n, read: true })));
        fetch("/api/notifications/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }).catch(() => {});
      }
    }
  }

  function openItem(n: Notification) {
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={toggle}
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
        style={{
          background: "transparent",
          border: "1px solid var(--bdr)",
          borderRadius: 8,
          color: "#fff",
          width: 40,
          height: 40,
          cursor: "pointer",
          position: "relative",
          fontSize: "1rem",
        }}
      >
        <i className="fas fa-bell" />
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              minWidth: 18,
              height: 18,
              padding: "0 4px",
              borderRadius: 9,
              background: "var(--or)",
              color: "#fff",
              fontSize: ".68rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: 48,
            right: 0,
            width: 340,
            maxWidth: "calc(100vw - 2rem)",
            background: "rgba(12,12,12,.99)",
            border: "1px solid var(--bdr)",
            borderRadius: 12,
            boxShadow: "0 12px 40px rgba(0,0,0,.6)",
            overflow: "hidden",
            zIndex: 200,
          }}
        >
          <div style={{ padding: ".85rem 1rem", borderBottom: "1px solid var(--bdr)", fontWeight: 700, fontSize: ".9rem" }}>
            Notifications
          </div>
          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            {!loaded ? (
              <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--mut)", fontSize: ".85rem" }}>Loading…</div>
            ) : items.length === 0 ? (
              <div style={{ padding: "2rem 1.5rem", textAlign: "center", color: "var(--mut)", fontSize: ".85rem" }}>
                <i className="fas fa-bell-slash" style={{ fontSize: "1.5rem", opacity: 0.4, display: "block", marginBottom: ".5rem" }} />
                You&apos;re all caught up.
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => openItem(n)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    display: "flex",
                    gap: ".7rem",
                    alignItems: "flex-start",
                    padding: ".8rem 1rem",
                    background: n.read ? "transparent" : "rgba(255,95,31,.07)",
                    border: "none",
                    borderBottom: "1px solid var(--bdr)",
                    cursor: n.link ? "pointer" : "default",
                    color: "inherit",
                  }}
                >
                  <span style={{ color: "var(--or)", marginTop: 2, flexShrink: 0 }}>
                    <i className={`fas ${ICONS[n.type] ?? "fa-circle-info"}`} />
                  </span>
                  <span style={{ flex: 1 }}>
                    <span style={{ display: "block", fontSize: ".84rem", lineHeight: 1.45 }}>{n.message}</span>
                    <span style={{ display: "block", fontSize: ".72rem", color: "var(--mut)", marginTop: 2 }}>{timeAgo(n.createdAt)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            style={{ display: "block", padding: ".7rem 1rem", textAlign: "center", fontSize: ".8rem", color: "var(--mut)", textDecoration: "none", borderTop: "1px solid var(--bdr)" }}
          >
            Go to dashboard
          </Link>
        </div>
      )}
    </div>
  );
}
