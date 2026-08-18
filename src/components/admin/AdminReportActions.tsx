"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminReportActions({
  reportId,
  targetType,
  targetId,
  targetExists,
}: {
  reportId: string;
  targetType: "EVENT" | "REVIEW" | "PHOTO";
  targetId: string;
  targetExists: boolean;
}) {
  const LABELS: Record<string, string> = { EVENT: "event", REVIEW: "review", PHOTO: "photo" };
  const targetLabel = LABELS[targetType] ?? "item";
  const DELETE_ENDPOINTS: Record<string, string> = {
    EVENT: `/api/admin/events/${targetId}`,
    REVIEW: `/api/admin/reviews/${targetId}`,
    PHOTO: `/api/admin/photos/${targetId}`,
  };
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function setStatus(status: string) {
    setBusy(true);
    await fetch(`/api/admin/reports/${reportId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(false);
    router.refresh();
  }

  async function removeTarget() {
    if (!confirm(`Delete the reported ${targetLabel} and resolve this report?`)) return;
    setBusy(true);
    await fetch(DELETE_ENDPOINTS[targetType], { method: "DELETE" });
    await fetch(`/api/admin/reports/${reportId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "RESOLVED" }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
      <button className="btn-ghost" disabled={busy} onClick={() => setStatus("DISMISSED")} style={{ fontSize: ".78rem", padding: ".35rem .6rem" }}>
        Dismiss
      </button>
      <button className="btn-ghost" disabled={busy} onClick={() => setStatus("RESOLVED")} style={{ fontSize: ".78rem", padding: ".35rem .6rem", color: "#7fd884", borderColor: "rgba(127,216,132,.4)" }}>
        Resolve
      </button>
      {targetExists && (
        <button className="btn-ghost" disabled={busy} onClick={removeTarget} style={{ fontSize: ".78rem", padding: ".35rem .6rem", color: "#ff6b5e", borderColor: "rgba(244,67,54,.4)" }}>
          Delete {targetLabel}
        </button>
      )}
    </div>
  );
}
