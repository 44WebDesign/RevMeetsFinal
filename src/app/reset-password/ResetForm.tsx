"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!token) {
    return (
      <div className="card-surface" style={{ padding: "2rem", textAlign: "center", color: "var(--mut)" }}>
        This reset link is missing its token.{" "}
        <Link href="/forgot-password" style={{ color: "var(--or)" }}>Request a new one</Link>.
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setError(
        data.details ? Object.values(data.details).flat().join(", ") : data.error ?? "Could not reset password",
      );
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card-surface" style={{ padding: "2rem" }}>
      <div style={{ marginBottom: "1rem" }}>
        <label className="field-label">New password</label>
        <input type="password" className="field-input" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="At least 8 characters" />
      </div>
      <div style={{ marginBottom: "1.25rem" }}>
        <label className="field-label">Confirm password</label>
        <input type="password" className="field-input" value={confirm} onChange={(e) => setConfirm(e.target.value)} required placeholder="Re-enter password" />
      </div>
      {error && (
        <div style={{ background: "rgba(244,67,54,.1)", border: "1px solid rgba(244,67,54,.3)", color: "#ff6b5e", padding: ".75rem 1rem", borderRadius: 6, fontSize: ".85rem", marginBottom: "1rem" }}>
          {error}
        </div>
      )}
      <button type="submit" className="btn-or-lg" style={{ width: "100%", textAlign: "center" }} disabled={busy}>
        {busy ? "Saving…" : "Set New Password"}
      </button>
    </form>
  );
}
