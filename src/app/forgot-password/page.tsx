"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setSent(true);
    setBusy(false);
  }

  return (
    <section className="section" style={{ background: "var(--bg)", minHeight: "calc(100vh - 64px)" }}>
      <div style={{ maxWidth: 440, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div className="sec-label">Account Recovery</div>
          <div className="sec-title" style={{ fontSize: "clamp(2rem,4vw,3rem)" }}>RESET PASSWORD</div>
        </div>

        {sent ? (
          <div className="card-surface" style={{ padding: "2rem", textAlign: "center" }}>
            <i className="fas fa-envelope-circle-check" style={{ fontSize: "2rem", color: "var(--or)", marginBottom: "1rem" }} />
            <p style={{ color: "rgba(245,245,245,.85)", lineHeight: 1.7 }}>
              If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset
              link. It&apos;s valid for one hour — check your inbox (and spam).
            </p>
            <Link href="/login" className="btn-ghost" style={{ marginTop: "1.5rem" }}>
              Back to log in
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="card-surface" style={{ padding: "2rem" }}>
            <p style={{ color: "var(--mut)", fontSize: ".88rem", marginBottom: "1.25rem" }}>
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
            <div style={{ marginBottom: "1.25rem" }}>
              <label className="field-label">Email</label>
              <input type="email" className="field-input" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>
            <button type="submit" className="btn-or-lg" style={{ width: "100%", textAlign: "center" }} disabled={busy}>
              {busy ? "Sending…" : "Send Reset Link"}
            </button>
            <p style={{ textAlign: "center", fontSize: ".85rem", color: "var(--mut)", marginTop: "1.25rem" }}>
              Remembered it?{" "}
              <Link href="/login" style={{ color: "var(--or)", textDecoration: "none", fontWeight: 600 }}>Log in</Link>
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
