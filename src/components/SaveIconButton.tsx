"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Compact circular bookmark toggle used as an overlay on event cards.
// Handles logged-out users by redirecting to login on a 401.
export function SaveIconButton({
  eventId,
  initialSaved,
}: {
  eventId: string;
  initialSaved: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    const res = await fetch(`/api/events/${eventId}/save`, { method: "POST" });
    if (res.status === 401) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setSaved(data.saved);
    }
    setBusy(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save event"}
      title={saved ? "Saved" : "Save for later"}
      style={{
        width: 34,
        height: 34,
        borderRadius: "50%",
        border: "none",
        cursor: "pointer",
        background: "rgba(8,8,8,.6)",
        backdropFilter: "blur(4px)",
        color: saved ? "var(--or)" : "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: ".85rem",
        transition: "color .15s",
      }}
    >
      <i className={saved ? "fas fa-bookmark" : "far fa-bookmark"} />
    </button>
  );
}
