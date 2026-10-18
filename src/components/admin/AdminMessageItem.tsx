"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type AdminMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  replied: boolean;
  createdLabel: string;
};

export function AdminMessageItem({ m }: { m: AdminMessage }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function send() {
    if (reply.trim().length < 2) return;
    setBusy(true);
    setError("");
    const res = await fetch(`/api/admin/messages/${m.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error || "Couldn't send the reply.");
      return;
    }
    setReply("");
    setOpen(false);
    router.refresh();
  }

  async function toggleHandled() {
    setBusy(true);
    await fetch(`/api/admin/messages/${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handled: !m.replied }),
    });
    setBusy(false);
    router.refresh();
  }

  async function del() {
    if (!confirm("Delete this message?")) return;
    setBusy(true);
    await fetch(`/api/admin/messages/${m.id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  return (
    <div style={{ padding: "1.1rem 1.25rem", borderTop: "1px solid var(--bdr)" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ minWidth: 220 }}>
          <span style={{ fontWeight: 700, fontSize: ".9rem" }}>{m.name}</span>{" "}
          <a href={`mailto:${m.email}`} style={{ color: "var(--or)", textDecoration: "none", fontSize: ".82rem" }}>{m.email}</a>
          {m.replied ? (
            <span className="pill" style={{ marginLeft: ".5rem", background: "rgba(76,175,80,.15)", color: "#7fd884", border: "1px solid rgba(76,175,80,.4)" }}>Replied</span>
          ) : (
            <span className="pill" style={{ marginLeft: ".5rem", background: "rgba(255,95,31,.15)", color: "var(--or)", border: "1px solid rgba(255,95,31,.35)" }}>New</span>
          )}
        </div>
        <span style={{ fontSize: ".74rem", color: "var(--mut)", whiteSpace: "nowrap" }}>{m.createdLabel}</span>
      </div>

      <p style={{ color: "rgba(245,245,245,.85)", fontSize: ".88rem", lineHeight: 1.6, margin: ".6rem 0 .75rem", whiteSpace: "pre-wrap" }}>{m.message}</p>

      <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
        <button onClick={() => setOpen((o) => !o)} className="btn-ghost" style={{ fontSize: ".78rem", padding: ".35rem .6rem" }}>
          <i className="fas fa-reply" /> {open ? "Cancel" : "Reply"}
        </button>
        <button onClick={toggleHandled} disabled={busy} className="btn-ghost" style={{ fontSize: ".78rem", padding: ".35rem .6rem" }}>
          <i className={`fas ${m.replied ? "fa-rotate-left" : "fa-check"}`} /> {m.replied ? "Mark new" : "Mark handled"}
        </button>
        <button onClick={del} disabled={busy} className="btn-ghost" style={{ fontSize: ".78rem", padding: ".35rem .6rem", color: "#ff6b5e", borderColor: "rgba(244,67,54,.4)" }}>
          <i className="fas fa-trash" /> Delete
        </button>
      </div>

      {open && (
        <div style={{ marginTop: ".75rem", display: "flex", flexDirection: "column", gap: ".5rem" }}>
          <textarea
            className="field-textarea"
            rows={4}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder={`Reply to ${m.name}… (sent to ${m.email})`}
            maxLength={4000}
            autoFocus
          />
          <div style={{ display: "flex", gap: ".5rem", alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={send} disabled={busy || reply.trim().length < 2} className="btn-or" style={{ fontSize: ".82rem" }}>
              {busy ? <><i className="fas fa-spinner fa-spin" /> Sending…</> : <><i className="fas fa-paper-plane" /> Send reply</>}
            </button>
            {error && <span style={{ fontSize: ".78rem", color: "#ff6b5e" }}>{error}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
