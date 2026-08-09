"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ROLES, ROLE_LABELS, type Role } from "@/lib/enums";

export function AdminUserActions({
  userId,
  role,
  suspended,
  isSelf,
}: {
  userId: string;
  role: string;
  suspended: boolean;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    router.refresh();
  }

  async function del() {
    if (!confirm("Delete this user and all their content? This cannot be undone.")) return;
    setBusy(true);
    await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  return (
    <div style={{ display: "flex", gap: ".4rem", alignItems: "center", flexWrap: "wrap" }}>
      <select
        className="field-select"
        value={role}
        disabled={busy || isSelf}
        onChange={(e) => patch({ role: e.target.value })}
        style={{ width: "auto", padding: ".35rem .5rem", fontSize: ".78rem" }}
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>{ROLE_LABELS[r as Role]}</option>
        ))}
      </select>
      {!isSelf && (
        <>
          <button
            className="btn-ghost"
            disabled={busy}
            onClick={() => patch({ suspended: !suspended })}
            style={{ fontSize: ".78rem", padding: ".35rem .6rem", color: suspended ? "#7fd884" : "#ffb347", borderColor: suspended ? "rgba(127,216,132,.4)" : "rgba(255,179,71,.4)" }}
          >
            {suspended ? "Unsuspend" : "Suspend"}
          </button>
          <button
            className="btn-ghost"
            disabled={busy}
            onClick={del}
            style={{ fontSize: ".78rem", padding: ".35rem .6rem", color: "#ff6b5e", borderColor: "rgba(244,67,54,.4)" }}
          >
            Delete
          </button>
        </>
      )}
    </div>
  );
}
