"use client";

import { useState } from "react";

// Shows the signed-in user's email + verification status in account settings,
// with a one-click resend when it isn't confirmed yet. Complements the
// site-wide banner so the control is always findable here too.
export function VerifyEmailRow({ email, verified }: { email: string; verified: boolean }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState(verified);

  async function resend() {
    if (state === "loading") return;
    setState("loading");
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState("error");
        setMsg(data?.error || "Couldn't send — try again shortly.");
        return;
      }
      if (data?.alreadyVerified) setDone(true);
      setState("done");
      setMsg(data?.alreadyVerified ? "Your email is already verified." : "Confirmation email sent — check your inbox.");
    } catch {
      setState("error");
      setMsg("Couldn't reach the server — try again.");
    }
  }

  return (
    <div
      className="card-surface"
      style={{
        padding: "1rem 1.25rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        flexWrap: "wrap",
        marginBottom: "1.5rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: ".6rem", minWidth: 0 }}>
        <i
          className={`fas ${done ? "fa-circle-check" : "fa-circle-exclamation"}`}
          style={{ color: done ? "#4CAF50" : "var(--or)" }}
        />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: ".9rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis" }}>{email}</div>
          <div style={{ fontSize: ".78rem", color: done ? "#9be29e" : "var(--mut)" }}>
            {done ? "Email verified" : "Email not confirmed yet"}
          </div>
        </div>
      </div>

      {!done && (
        <div style={{ display: "flex", alignItems: "center", gap: ".75rem", flexWrap: "wrap" }}>
          {msg && (
            <span style={{ fontSize: ".78rem", color: state === "error" ? "#ff6b5e" : "#9be29e" }}>{msg}</span>
          )}
          {state !== "done" && (
            <button onClick={resend} disabled={state === "loading"} className="btn-ghost" style={{ fontSize: ".8rem", whiteSpace: "nowrap" }}>
              {state === "loading" ? <><i className="fas fa-spinner fa-spin" /> Sending…</> : "Resend confirmation"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
