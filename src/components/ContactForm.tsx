"use client";

import { useState } from "react";

export function ContactForm({ defaultEmail = "" }: { defaultEmail?: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState(defaultEmail);
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "loading") return;
    setState("loading");
    setMsg("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, company }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState("error");
        setMsg(data?.error || "Something went wrong — please try again.");
        return;
      }
      setState("done");
      setMsg(data?.message || "Thanks — your message has been sent.");
      setName("");
      setMessage("");
    } catch {
      setState("error");
      setMsg("Couldn't reach the server — please try again.");
    }
  }

  if (state === "done") {
    return (
      <div className="card-surface" style={{ padding: "1.5rem", display: "flex", alignItems: "center", gap: ".75rem", color: "#9be29e" }}>
        <i className="fas fa-circle-check" style={{ fontSize: "1.3rem" }} />
        <span style={{ fontSize: ".92rem" }}>{msg}</span>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card-surface" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <label className="field-label">Your name</label>
        <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} />
      </div>
      <div>
        <label className="field-label">Your email</label>
        <input type="email" className="field-input" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={200} />
      </div>
      <div>
        <label className="field-label">Message</label>
        <textarea className="field-textarea" rows={6} value={message} onChange={(e) => setMessage(e.target.value)} required maxLength={4000} />
      </div>
      {/* Honeypot: hidden from users, catches bots */}
      <input
        type="text"
        name="company"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <button type="submit" className="btn-or" disabled={state === "loading"}>
          {state === "loading" ? <><i className="fas fa-spinner fa-spin" /> Sending…</> : <><i className="fas fa-paper-plane" /> Send message</>}
        </button>
        {state === "error" && <span style={{ fontSize: ".82rem", color: "#ff6b5e" }}><i className="fas fa-circle-exclamation" /> {msg}</span>}
      </div>
    </form>
  );
}
