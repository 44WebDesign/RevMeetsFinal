"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// "Enquire" button + form on a venue page. Prompts login if needed; on submit
// the venue owner gets a notification + email.
export function EnquiryButton({
  venueId,
  venueName,
  loggedIn,
  isOwner,
}: {
  venueId: string;
  venueName: string;
  loggedIn: boolean;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (isOwner) return null;

  function start() {
    if (!loggedIn) {
      router.push(`/login?next=${encodeURIComponent(`/venues`)}`);
      return;
    }
    setOpen(true);
  }

  async function submit() {
    if (message.trim().length < 5) {
      setError("Add a short message");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/venues/${venueId}/enquiry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setDone(true);
      setOpen(false);
    } else {
      setError(data.error ?? "Could not send enquiry");
    }
  }

  if (done) {
    return (
      <div className="card-surface" style={{ padding: ".85rem 1rem", fontSize: ".85rem", color: "#7fd884", border: "1px solid rgba(127,216,132,.35)" }}>
        <i className="fas fa-circle-check" /> Enquiry sent — the venue will be in touch.
      </div>
    );
  }

  if (!open) {
    return (
      <button className="btn-or" onClick={start} style={{ width: "100%", textAlign: "center" }}>
        <i className="fas fa-envelope" /> Enquire about this venue
      </button>
    );
  }

  return (
    <div className="card-surface" style={{ padding: "1rem" }}>
      <label className="field-label">Your enquiry to {venueName}</label>
      <textarea
        className="field-textarea"
        rows={4}
        placeholder="Tell them about your event — date, rough numbers, what you need…"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      {error && <p style={{ fontSize: ".8rem", color: "#ff6b5e", marginTop: ".5rem" }}>{error}</p>}
      <div style={{ display: "flex", gap: ".5rem", marginTop: ".6rem" }}>
        <button onClick={submit} className="btn-or" disabled={busy}>
          {busy ? "Sending…" : "Send enquiry"}
        </button>
        <button onClick={() => setOpen(false)} className="btn-ghost">Cancel</button>
      </div>
    </div>
  );
}
