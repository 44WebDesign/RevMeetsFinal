"use client";

import { useState } from "react";

// "Events near you" email capture. The full band (`compact` off) is the
// orange-tinted homepage section; the compact variant is a slim inline form for
// the site-wide footer. Both post to /api/newsletter and share the state logic.
export function NewsletterSignup({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [area, setArea] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "loading") return;
    setState("loading");
    setMessage("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, area: area || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState("error");
        setMessage(data?.error || "Something went wrong — please try again.");
        return;
      }
      setState("done");
      setMessage(data?.message || "You're on the list!");
    } catch {
      setState("error");
      setMessage("Couldn't reach the server — please try again.");
    }
  }

  if (compact) {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "1rem 1.5rem", justifyContent: "space-between" }}>
        <div style={{ minWidth: 220, flex: "1 1 260px" }}>
          <div style={{ fontWeight: 700, fontSize: ".95rem", color: "#fff", display: "flex", alignItems: "center", gap: ".5rem" }}>
            <i className="fas fa-envelope-open-text" style={{ color: "var(--or)" }} /> Events near you, in your inbox
          </div>
          <div style={{ fontSize: ".8rem", color: "var(--mut)", marginTop: ".25rem" }}>
            A short weekly round-up of what&apos;s on near you. No spam, unsubscribe any time.
          </div>
        </div>
        {state === "done" ? (
          <div style={{ flex: "1 1 280px", color: "#9be29e", fontSize: ".85rem", display: "flex", alignItems: "center", gap: ".5rem" }}>
            <i className="fas fa-circle-check" /> {message}
          </div>
        ) : (
          <form onSubmit={submit} style={{ flex: "1 1 320px", display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
            <input
              type="email"
              required
              className="field-input"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ flex: "2 1 150px", minWidth: 0 }}
            />
            <input
              type="text"
              className="field-input"
              placeholder="Town / postcode"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              style={{ flex: "1 1 110px", minWidth: 0 }}
            />
            <button type="submit" disabled={state === "loading"} className="btn-or" style={{ whiteSpace: "nowrap" }}>
              {state === "loading" ? <i className="fas fa-spinner fa-spin" /> : <><i className="fas fa-bell" /> Notify me</>}
            </button>
            {state === "error" && <p style={{ flexBasis: "100%", fontSize: ".75rem", color: "#ff6b5e", margin: 0 }}>{message}</p>}
          </form>
        )}
      </div>
    );
  }

  return (
    <section className="section home-sec" style={{ background: "var(--bg)" }}>
      <div
        className="container"
        style={{
          background:
            "radial-gradient(circle at 15% 20%, rgba(255,95,31,.18), transparent 55%), linear-gradient(135deg, #17120e 0%, #0c0c0c 100%)",
          border: "1px solid rgba(255,95,31,.25)",
          borderRadius: 16,
          padding: "2.5rem clamp(1.25rem, 4vw, 3rem)",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "2rem",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ flex: "1 1 320px", minWidth: 0 }}>
            <div className="sec-label" style={{ color: "var(--or)" }}>
              <i className="fas fa-envelope-open-text" /> Never miss a meet
            </div>
            <h2 className="hd" style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", margin: ".3rem 0 .5rem" }}>
              EVENTS NEAR YOU, IN YOUR INBOX
            </h2>
            <p style={{ color: "var(--mut)", fontSize: ".95rem", maxWidth: 440, lineHeight: 1.6 }}>
              Get a short weekly round-up of car shows, track days, cruises and meets happening
              near you. No spam, unsubscribe any time.
            </p>
          </div>

          <div style={{ flex: "1 1 340px", minWidth: 0 }}>
            {state === "done" ? (
              <div
                style={{
                  background: "rgba(76,175,80,.12)",
                  border: "1px solid rgba(76,175,80,.4)",
                  borderRadius: 10,
                  padding: "1.25rem",
                  display: "flex",
                  alignItems: "center",
                  gap: ".75rem",
                  color: "#9be29e",
                }}
              >
                <i className="fas fa-circle-check" style={{ fontSize: "1.3rem" }} />
                <span style={{ fontSize: ".92rem" }}>{message}</span>
              </div>
            ) : (
              <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
                <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
                  <input
                    type="email"
                    required
                    className="field-input"
                    placeholder="Your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ flex: "2 1 180px", minWidth: 0 }}
                  />
                  <input
                    type="text"
                    className="field-input"
                    placeholder="Town or postcode (optional)"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    style={{ flex: "1 1 140px", minWidth: 0 }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={state === "loading"}
                  className="btn-or-lg"
                  style={{ width: "100%", textAlign: "center" }}
                >
                  {state === "loading" ? (
                    <><i className="fas fa-spinner fa-spin" /> Signing you up…</>
                  ) : (
                    <><i className="fas fa-bell" /> Notify me</>
                  )}
                </button>
                {state === "error" && (
                  <p style={{ fontSize: ".78rem", color: "#ff6b5e", margin: 0 }}>{message}</p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
