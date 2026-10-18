"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminEventActions } from "./AdminEventActions";

export type AdminEventRow = {
  id: string;
  slug: string;
  title: string;
  typeLabel: string;
  city: string;
  startsAtLabel: string;
  organiserName: string;
  organiserEmail: string;
  status: string;
  featured: boolean;
  isPast: boolean;
};

const BULK: { action: string; label: string; icon: string; danger?: boolean }[] = [
  { action: "publish", label: "Publish", icon: "fa-eye" },
  { action: "draft", label: "Hide", icon: "fa-eye-slash" },
  { action: "cancel", label: "Cancel", icon: "fa-ban" },
  { action: "unfeature", label: "Unfeature", icon: "fa-star-half-stroke" },
  { action: "delete", label: "Delete", icon: "fa-trash", danger: true },
];

export function AdminEventsTable({ events }: { events: AdminEventRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const allChecked = events.length > 0 && selected.size === events.length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelected(allChecked ? new Set() : new Set(events.map((e) => e.id)));
  }

  async function bulk(action: string) {
    if (selected.size === 0) return;
    if (action === "delete" && !confirm(`Delete ${selected.size} event(s)? This cannot be undone.`)) return;
    setBusy(true);
    await fetch("/api/admin/events/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...selected], action }),
    });
    setBusy(false);
    setSelected(new Set());
    router.refresh();
  }

  return (
    <div>
      {selected.size > 0 && (
        <div className="admin-bulk-bar">
          <span style={{ fontWeight: 700, fontSize: ".85rem" }}>{selected.size} selected</span>
          <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap", marginLeft: "auto" }}>
            {BULK.map((b) => (
              <button
                key={b.action}
                onClick={() => bulk(b.action)}
                disabled={busy}
                className="btn-ghost"
                style={{ fontSize: ".78rem", padding: ".35rem .6rem", color: b.danger ? "#ff6b5e" : undefined, borderColor: b.danger ? "rgba(244,67,54,.4)" : undefined }}
              >
                <i className={`fas ${b.icon}`} /> {b.label}
              </button>
            ))}
            <button onClick={() => setSelected(new Set())} className="btn-ghost" style={{ fontSize: ".78rem", padding: ".35rem .6rem" }}>Clear</button>
          </div>
        </div>
      )}

      <div className="card-surface" style={{ overflow: "hidden" }}>
        {events.length === 0 ? (
          <div style={{ padding: "2.5rem", textAlign: "center", color: "var(--mut)" }}>No events match these filters.</div>
        ) : (
          <>
            <label style={{ display: "flex", alignItems: "center", gap: ".6rem", padding: ".6rem 1.25rem", borderBottom: "1px solid var(--bdr)", fontSize: ".78rem", color: "var(--mut)", cursor: "pointer" }}>
              <input type="checkbox" checked={allChecked} onChange={toggleAll} /> Select all on this page
            </label>
            {events.map((e) => (
              <div key={e.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem", borderTop: "1px solid var(--bdr)", flexWrap: "wrap" }}>
                <input type="checkbox" checked={selected.has(e.id)} onChange={() => toggle(e.id)} style={{ flexShrink: 0 }} />
                <div style={{ minWidth: 200, flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: ".9rem" }}>
                    <Link href={`/events/${e.slug}`} style={{ color: "inherit", textDecoration: "none" }}>{e.title}</Link>
                    {e.featured && <span className="pill" style={{ marginLeft: ".5rem", background: "rgba(255,215,0,.15)", color: "#FFD700", border: "1px solid rgba(255,215,0,.4)" }}><i className="fas fa-star" /> Featured</span>}
                    {e.status !== "PUBLISHED" && <span className="pill" style={{ marginLeft: ".5rem", background: "var(--bdr2)", color: "var(--mut)" }}>{e.status}</span>}
                    {e.isPast && <span className="pill" style={{ marginLeft: ".5rem", background: "rgba(8,8,8,.5)", color: "var(--mut)", border: "1px solid var(--bdr2)" }}>Past</span>}
                  </div>
                  <div style={{ fontSize: ".76rem", color: "var(--mut)" }}>
                    {e.typeLabel} · {e.city} · {e.startsAtLabel} · by {e.organiserName} ({e.organiserEmail})
                  </div>
                </div>
                <AdminEventActions eventId={e.id} status={e.status} featured={e.featured} />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
