"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SaveButton({
  eventId,
  initialSaved,
  loggedIn,
}: {
  eventId: string;
  initialSaved: boolean;
  loggedIn: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!loggedIn) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/events/${eventId}/save`, { method: "POST" });
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
      className="btn-ghost"
      aria-pressed={saved}
      style={{ display: "inline-flex", alignItems: "center", gap: ".4rem", width: "100%", justifyContent: "center" }}
    >
      <i className={saved ? "fas fa-bookmark" : "far fa-bookmark"} style={{ color: saved ? "var(--or)" : undefined }} />
      {saved ? "Saved" : "Save for later"}
    </button>
  );
}
