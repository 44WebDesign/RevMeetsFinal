"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminEventActions({
  eventId,
  status,
  featured,
}: {
  eventId: string;
  status: string;
  featured: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    await fetch(`/api/admin/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    router.refresh();
  }

  async function del() {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    setBusy(true);
    await fetch(`/api/admin/events/${eventId}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  return (
    <div style={{ display: "flex", gap: ".4rem", alignItems: "center", flexWrap: "wrap" }}>
      <select
        className="field-select"
        value={status}
        disabled={busy}
        onChange={(e) => patch({ status: e.target.value })}
        style={{ width: "auto", padding: ".35rem .5rem", fontSize: ".78rem" }}
      >
        <option value="PUBLISHED">Published</option>
        <option value="DRAFT">Hidden (draft)</option>
        <option value="CANCELLED">Cancelled</option>
      </select>
      {featured && (
        <button
          className="btn-ghost"
          disabled={busy}
          onClick={() => patch({ featured: false })}
          style={{ fontSize: ".78rem", padding: ".35rem .6rem", color: "#FFD700", borderColor: "rgba(255,215,0,.4)" }}
        >
          Unfeature
        </button>
      )}
      <button
        className="btn-ghost"
        disabled={busy}
        onClick={del}
        style={{ fontSize: ".78rem", padding: ".35rem .6rem", color: "#ff6b5e", borderColor: "rgba(244,67,54,.4)" }}
      >
        Delete
      </button>
    </div>
  );
}
