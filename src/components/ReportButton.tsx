"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { REPORT_REASONS } from "@/lib/enums";

// Small "Report" control for events and reviews. Opens a reason picker;
// prompts login if needed.
export function ReportButton({
  targetType,
  targetId,
  loggedIn,
  compact = false,
}: {
  targetType: "EVENT" | "REVIEW" | "PHOTO";
  targetId: string;
  loggedIn: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]);
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  function start() {
    if (!loggedIn) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setOpen(true);
  }

  async function submit() {
    setBusy(true);
    await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType, targetId, reason, detail: detail || null }),
    });
    setBusy(false);
    setDone(true);
    setOpen(false);
  }

  if (done) {
    return (
      <span style={{ fontSize: compact ? ".72rem" : ".8rem", color: "#7fd884" }}>
        <i className="fas fa-check" /> Reported — thank you
      </span>
    );
  }

  const trigger = (
    <button
      onClick={start}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        color: "var(--mut)",
        fontSize: compact ? ".72rem" : ".8rem",
        padding: 0,
      }}
    >
      <i className="fas fa-flag" /> Report
    </button>
  );

  if (!open) return trigger;

  return (
    <div className="card-surface" style={{ padding: "1rem", marginTop: ".5rem", maxWidth: 360 }}>
      <label className="field-label">Reason</label>
      <select className="field-select" value={reason} onChange={(e) => setReason(e.target.value)}>
        {REPORT_REASONS.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
      <textarea
        className="field-textarea"
        rows={2}
        style={{ marginTop: ".5rem" }}
        placeholder="Anything else? (optional)"
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
      />
      <div style={{ display: "flex", gap: ".5rem", marginTop: ".6rem" }}>
        <button onClick={submit} className="btn-or" disabled={busy}>
          {busy ? "Sending…" : "Submit report"}
        </button>
        <button onClick={() => setOpen(false)} className="btn-ghost">Cancel</button>
      </div>
    </div>
  );
}
