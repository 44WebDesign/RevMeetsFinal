"use client";

import { useState } from "react";

const SEGMENTS: [string, string][] = [
  ["ALL", "All members"],
  ["ENTHUSIAST", "Enthusiasts"],
  ["ORGANISER", "Organisers / clubs"],
  ["VENUE", "Venues"],
  ["ADMIN", "Admins"],
  ["NEWSLETTER", "Newsletter subscribers (email only)"],
];

export function AnnounceForm() {
  const [segment, setSegment] = useState("ALL");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<string>("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "loading") return;
    const label = SEGMENTS.find((s) => s[0] === segment)?.[1] ?? segment;
    if (!confirm(`Send this announcement to “${label}”? This can't be undone.`)) return;
    setState("loading");
    setResult("");
    try {
      const res = await fetch("/api/admin/announce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segment, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState("error");
        setResult(data?.error || "Something went wrong.");
        return;
      }
      setState("done");
      const emailNote = data.emailConfigured
        ? `${data.emailQueued} email${data.emailQueued === 1 ? "" : "s"} sending in the background`
        : "emails skipped (Resend not configured)";
      setResult(`Queued for ${data.recipients} recipient${data.recipients === 1 ? "" : "s"} — ${data.inApp} in-app, ${emailNote}.`);
      setSubject("");
      setMessage("");
    } catch {
      setState("error");
      setResult("Couldn't reach the server — please try again.");
    }
  }

  return (
    <form onSubmit={submit} className="card-surface" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 640 }}>
      <div>
        <label className="field-label">Send to</label>
        <select className="field-select" value={segment} onChange={(e) => setSegment(e.target.value)}>
          {SEGMENTS.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="field-label">Subject</label>
        <input className="field-input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. New feature: save events for later" maxLength={140} required />
      </div>
      <div>
        <label className="field-label">Message</label>
        <textarea className="field-textarea" value={message} onChange={(e) => setMessage(e.target.value)} rows={6} placeholder="Write your announcement…" maxLength={4000} required />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <button type="submit" className="btn-or" disabled={state === "loading"}>
          {state === "loading" ? <><i className="fas fa-spinner fa-spin" /> Sending…</> : <><i className="fas fa-paper-plane" /> Send announcement</>}
        </button>
        {result && (
          <span style={{ fontSize: ".82rem", color: state === "error" ? "#ff6b5e" : "#9be29e" }}>
            <i className={`fas ${state === "error" ? "fa-circle-exclamation" : "fa-circle-check"}`} /> {result}
          </span>
        )}
      </div>
    </form>
  );
}
