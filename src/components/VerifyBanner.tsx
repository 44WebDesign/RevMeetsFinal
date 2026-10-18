"use client";

import { useState } from "react";

// Shown at the top of every page for a logged-in user whose email isn't yet
// verified. Lets them resend the confirmation email without leaving the page.
export function VerifyBanner() {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

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
      setState("done");
      setMsg(data?.alreadyVerified ? "Your email is already verified." : "Confirmation email sent — check your inbox.");
    } catch {
      setState("error");
      setMsg("Couldn't reach the server — try again.");
    }
  }

  return (
    <div
      style={{
        background: "rgba(255,95,31,.12)",
        borderBottom: "1px solid rgba(255,95,31,.3)",
        color: "var(--txt)",
        padding: ".6rem 1.25rem",
        fontSize: ".85rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: ".75rem",
        flexWrap: "wrap",
        textAlign: "center",
      }}
    >
      <span>
        <i className="fas fa-envelope-circle-check" style={{ color: "var(--or)", marginRight: 6 }} />
        Please confirm your email address to secure your account.
      </span>
      {state === "done" || state === "error" ? (
        <span style={{ color: state === "error" ? "#ff6b5e" : "#9be29e", fontWeight: 600 }}>{msg}</span>
      ) : (
        <button
          onClick={resend}
          disabled={state === "loading"}
          className="btn-or"
          style={{ padding: ".3rem .8rem", fontSize: ".78rem" }}
        >
          {state === "loading" ? <><i className="fas fa-spinner fa-spin" /> Sending…</> : "Resend email"}
        </button>
      )}
    </div>
  );
}
