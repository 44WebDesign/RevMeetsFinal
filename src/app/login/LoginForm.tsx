"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { GoogleButton, OrDivider } from "@/components/GoogleButton";

const OAUTH_ERRORS: Record<string, string> = {
  google_not_configured: "Google sign-in isn't configured on this server yet.",
  google_denied: "Google sign-in was cancelled.",
  google_failed: "Google sign-in failed. Please try again.",
  account_suspended: "This account has been suspended.",
};

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/dashboard";
  const oauthError = sp.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    oauthError ? OAUTH_ERRORS[oauthError] ?? "Sign-in failed." : null,
  );
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      router.push(next);
      router.refresh();
    } else {
      setError(data.error ?? "Could not log in");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card-surface" style={{ padding: "2rem" }}>
      {googleEnabled && (
        <>
          <GoogleButton next={next} label="Sign in with Google" />
          <OrDivider />
        </>
      )}
      <div style={{ marginBottom: "1rem" }}>
        <label className="field-label">Email</label>
        <input type="email" className="field-input" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
      </div>
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <label className="field-label">Password</label>
          <Link href="/forgot-password" style={{ fontSize: ".72rem", color: "var(--or)", textDecoration: "none" }}>
            Forgot password?
          </Link>
        </div>
        <input type="password" className="field-input" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Your password" />
      </div>

      {error && (
        <div style={{ background: "rgba(244,67,54,.1)", border: "1px solid rgba(244,67,54,.3)", color: "#ff6b5e", padding: ".75rem 1rem", borderRadius: 6, fontSize: ".85rem", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      <button type="submit" className="btn-or-lg" style={{ width: "100%", textAlign: "center" }} disabled={busy}>
        {busy ? "Logging in…" : "Log In"}
      </button>

      <p style={{ textAlign: "center", fontSize: ".85rem", color: "var(--mut)", marginTop: "1.25rem" }}>
        New to RevMeet?{" "}
        <Link href="/register" style={{ color: "var(--or)", textDecoration: "none", fontWeight: 600 }}>
          Create an account
        </Link>
      </p>
    </form>
  );
}
