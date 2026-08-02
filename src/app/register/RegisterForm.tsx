"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

const ROLE_OPTIONS = [
  { value: "ENTHUSIAST", label: "Car Enthusiast", icon: "fa-user", blurb: "Find & attend events" },
  { value: "ORGANISER", label: "Event Host / Club", icon: "fa-flag-checkered", blurb: "Create & promote events" },
  { value: "VENUE", label: "Venue", icon: "fa-warehouse", blurb: "Promote your location" },
] as const;

export function RegisterForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const initialRole = (sp.get("role") as string) || "ENTHUSIAST";

  const [role, setRole] = useState(
    ROLE_OPTIONS.some((r) => r.value === initialRole) ? initialRole : "ENTHUSIAST",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setError(
        data.details
          ? Object.values(data.details).flat().join(", ")
          : data.error ?? "Could not create account",
      );
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card-surface" style={{ padding: "2rem" }}>
      <label className="field-label" style={{ marginBottom: ".6rem" }}>I am a…</label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: ".6rem", marginBottom: "1.5rem" }} className="role-grid">
        {ROLE_OPTIONS.map((r) => (
          <button
            type="button"
            key={r.value}
            onClick={() => setRole(r.value)}
            style={{
              background: role === r.value ? "rgba(255,95,31,.1)" : "var(--bg)",
              border: `1px solid ${role === r.value ? "var(--or)" : "var(--bdr2)"}`,
              borderRadius: 8,
              padding: "1rem .75rem",
              cursor: "pointer",
              color: role === r.value ? "var(--or)" : "var(--mut)",
              textAlign: "center",
              transition: "all .2s",
            }}
          >
            <i className={`fas ${r.icon}`} style={{ fontSize: "1.25rem", display: "block", marginBottom: ".4rem" }} />
            <span style={{ fontSize: ".8rem", fontWeight: 700, color: role === r.value ? "#fff" : "var(--txt)", display: "block" }}>
              {r.label}
            </span>
            <span style={{ fontSize: ".68rem" }}>{r.blurb}</span>
          </button>
        ))}
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label className="field-label">Full name</label>
        <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name" />
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label className="field-label">Email</label>
        <input type="email" className="field-input" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
      </div>
      <div style={{ marginBottom: "1.5rem" }}>
        <label className="field-label">Password</label>
        <input type="password" className="field-input" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="At least 8 characters" />
      </div>

      {error && (
        <div style={{ background: "rgba(244,67,54,.1)", border: "1px solid rgba(244,67,54,.3)", color: "#ff6b5e", padding: ".75rem 1rem", borderRadius: 6, fontSize: ".85rem", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      <button type="submit" className="btn-or-lg" style={{ width: "100%", textAlign: "center" }} disabled={busy}>
        {busy ? "Creating…" : "Create Account"}
      </button>

      <p style={{ textAlign: "center", fontSize: ".85rem", color: "var(--mut)", marginTop: "1.25rem" }}>
        Already have an account?{" "}
        <Link href="/login" style={{ color: "var(--or)", textDecoration: "none", fontWeight: 600 }}>
          Log in
        </Link>
      </p>

      <style jsx>{`
        @media (max-width: 520px) {
          .role-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </form>
  );
}
