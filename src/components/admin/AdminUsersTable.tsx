"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminUserActions } from "./AdminUserActions";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  roleLabel: string;
  role: string;
  suspended: boolean;
  avatarColor: string;
  initials: string;
  eventsCount: number;
  joinedLabel: string;
  clubSlug: string | null;
  venueSlug: string | null;
  isSelf: boolean;
  isAdmin: boolean;
};

const BULK: { action: string; label: string; icon: string; danger?: boolean }[] = [
  { action: "suspend", label: "Suspend", icon: "fa-ban" },
  { action: "unsuspend", label: "Unsuspend", icon: "fa-circle-check" },
  { action: "delete", label: "Delete", icon: "fa-trash", danger: true },
];

export function AdminUsersTable({ users }: { users: AdminUserRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  // Your own account can't be bulk-acted on.
  const selectable = users.filter((u) => !u.isSelf);
  const allChecked = selectable.length > 0 && selectable.every((u) => selected.has(u.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelected(allChecked ? new Set() : new Set(selectable.map((u) => u.id)));
  }

  async function bulk(action: string) {
    if (selected.size === 0) return;
    if (action === "delete" && !confirm(`Delete ${selected.size} user(s) and all their content? This cannot be undone.`)) return;
    setBusy(true);
    await fetch("/api/admin/users/bulk", {
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
        {users.length === 0 ? (
          <div style={{ padding: "2.5rem", textAlign: "center", color: "var(--mut)" }}>No users match these filters.</div>
        ) : (
          <>
            <label style={{ display: "flex", alignItems: "center", gap: ".6rem", padding: ".6rem 1.25rem", borderBottom: "1px solid var(--bdr)", fontSize: ".78rem", color: "var(--mut)", cursor: "pointer" }}>
              <input type="checkbox" checked={allChecked} onChange={toggleAll} /> Select all on this page
            </label>
            {users.map((u) => (
              <div key={u.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem", borderTop: "1px solid var(--bdr)", flexWrap: "wrap" }}>
                <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggle(u.id)} disabled={u.isSelf} style={{ flexShrink: 0, opacity: u.isSelf ? 0.3 : 1 }} />
                <div style={{ display: "flex", alignItems: "center", gap: ".7rem", minWidth: 220, flex: 1 }}>
                  <span style={{ width: 34, height: 34, borderRadius: "50%", background: u.avatarColor, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: ".72rem", flexShrink: 0 }}>
                    {u.initials}
                  </span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: ".9rem" }}>
                      {u.name}
                      {u.isAdmin && <span className="pill" style={{ marginLeft: ".5rem", background: "rgba(255,95,31,.15)", color: "var(--or)", border: "1px solid rgba(255,95,31,.35)" }}>Admin</span>}
                      {u.suspended && <span className="pill" style={{ marginLeft: ".5rem", background: "rgba(244,67,54,.2)", color: "#ff6b5e" }}>Suspended</span>}
                      {u.isSelf && <span className="pill" style={{ marginLeft: ".5rem", background: "var(--bdr2)", color: "var(--mut)" }}>You</span>}
                    </div>
                    <div style={{ fontSize: ".76rem", color: "var(--mut)" }}>
                      {u.email} · {u.roleLabel} · {u.eventsCount} events · joined {u.joinedLabel}
                    </div>
                    {(u.clubSlug || u.venueSlug) && (
                      <div style={{ fontSize: ".74rem", marginTop: ".2rem", display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
                        {u.clubSlug && <Link href={`/clubs/${u.clubSlug}`} style={{ color: "var(--or)", textDecoration: "none" }}><i className="fas fa-users-gear" /> View club ↗</Link>}
                        {u.venueSlug && <Link href={`/venues/${u.venueSlug}`} style={{ color: "#00BCD4", textDecoration: "none" }}><i className="fas fa-warehouse" /> View venue ↗</Link>}
                      </div>
                    )}
                  </div>
                </div>
                <AdminUserActions userId={u.id} role={u.role} suspended={u.suspended} isSelf={u.isSelf} />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
