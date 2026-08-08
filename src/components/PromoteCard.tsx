"use client";

import { useState } from "react";
import { formatDate } from "@/lib/utils";

export function PromoteCard({
  eventId,
  stripeEnabled,
  priceLabel,
  days,
  featuredUntil,
  notice,
}: {
  eventId: string;
  stripeEnabled: boolean;
  priceLabel: string;
  days: number;
  featuredUntil: string | null;
  notice?: "cancelled" | null;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = featuredUntil ? new Date(featuredUntil) > new Date() : false;

  async function promote() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/events/${eventId}/promote`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.url) {
      window.location.href = data.url; // to Stripe Checkout
    } else {
      setError(data.error ?? "Could not start checkout");
      setBusy(false);
    }
  }

  return (
    <div
      className="card-surface"
      style={{ padding: "1.5rem", marginBottom: "1.5rem", borderColor: active ? "rgba(255,215,0,.4)" : "var(--bdr)" }}
    >
      <h2 className="hd" style={{ fontSize: "1.4rem", marginBottom: ".5rem" }}>
        <i className="fas fa-star" style={{ color: "#FFD700" }} /> Featured Placement
      </h2>

      {active ? (
        <>
          <p style={{ color: "#7fd884", fontSize: ".9rem", marginBottom: ".75rem" }}>
            <i className="fas fa-circle-check" /> This event is featured until{" "}
            <strong>{formatDate(featuredUntil!)}</strong> — it sorts first in listings and
            shows a Featured badge.
          </p>
          {stripeEnabled && (
            <button className="btn-ghost" onClick={promote} disabled={busy}>
              {busy ? "…" : `Extend by ${days} days — ${priceLabel}`}
            </button>
          )}
        </>
      ) : (
        <>
          <p style={{ color: "var(--mut)", fontSize: ".9rem", marginBottom: "1rem" }}>
            Promote this event to the top of search, category and map listings with a gold
            Featured badge for <strong>{days} days</strong>.
          </p>
          {notice === "cancelled" && (
            <p style={{ fontSize: ".82rem", color: "var(--mut)", marginBottom: ".75rem" }}>
              Checkout cancelled — no charge was made.
            </p>
          )}
          {stripeEnabled ? (
            <button className="btn-or-lg" onClick={promote} disabled={busy}>
              {busy ? "Starting checkout…" : `Feature for ${priceLabel} / ${days} days`}
            </button>
          ) : (
            <p style={{ fontSize: ".85rem", color: "var(--mut)" }}>
              <i className="fas fa-circle-info" /> Paid promotion isn&apos;t enabled on this
              site yet.
            </p>
          )}
        </>
      )}
      {error && <p style={{ fontSize: ".8rem", color: "#ff6b5e", marginTop: ".6rem" }}>{error}</p>}
    </div>
  );
}
