"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// "Danger zone" — lets a user permanently delete their own account. Requires
// typing DELETE to confirm, to avoid accidental clicks.
export function DeleteAccount() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function del() {
    if (confirmText !== "DELETE") return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Couldn't delete your account — please try again.");
        setBusy(false);
        return;
      }
      // Session cleared server-side; send them home with a fresh load.
      window.location.href = "/";
    } catch {
      setError("Couldn't reach the server — please try again.");
      setBusy(false);
    }
  }

  return (
    <div
      className="card-surface"
      style={{ padding: "1.5rem", marginTop: "2rem", borderColor: "rgba(244,67,54,.35)" }}
    >
      <h3 className="hd" style={{ fontSize: "1.1rem", marginBottom: ".4rem", color: "#ff6b5e" }}>
        <i className="fas fa-triangle-exclamation" /> Danger zone
      </h3>
      <p style={{ color: "var(--mut)", fontSize: ".85rem", lineHeight: 1.6, marginBottom: "1rem" }}>
        Permanently delete your account and everything tied to it — your profile, events, club or
        venue listing, reviews, photos, registrations and follows. This cannot be undone.
      </p>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="btn-ghost"
          style={{ color: "#ff6b5e", borderColor: "rgba(244,67,54,.4)" }}
        >
          <i className="fas fa-user-xmark" /> Delete my account
        </button>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: ".6rem", maxWidth: 360 }}>
          <label style={{ fontSize: ".82rem", color: "var(--mut)" }}>
            Type <strong style={{ color: "#ff6b5e" }}>DELETE</strong> to confirm:
          </label>
          <input
            className="field-input"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            autoFocus
          />
          <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
            <button
              onClick={del}
              disabled={busy || confirmText !== "DELETE"}
              className="btn-or"
              style={{ background: "#d7392b" }}
            >
              {busy ? <><i className="fas fa-spinner fa-spin" /> Deleting…</> : "Permanently delete"}
            </button>
            <button onClick={() => { setOpen(false); setConfirmText(""); setError(""); }} className="btn-ghost" disabled={busy}>
              Cancel
            </button>
          </div>
          {error && <p style={{ fontSize: ".78rem", color: "#ff6b5e", margin: 0 }}>{error}</p>}
        </div>
      )}
    </div>
  );
}
