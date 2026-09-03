"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Verify / unverify (and unfeature) a club or venue listing.
export function AdminListingActions({
  kind,
  id,
  verified,
  featured,
}: {
  kind: "clubs" | "venues";
  id: string;
  verified: boolean;
  featured: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    await fetch(`/api/admin/${kind}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div style={{ display: "flex", gap: ".4rem", alignItems: "center", flexWrap: "wrap" }}>
      <button
        className="btn-ghost"
        disabled={busy}
        onClick={() => patch({ verified: !verified })}
        style={{ fontSize: ".78rem", padding: ".35rem .6rem", ...(verified ? { color: "#4aa3ff", borderColor: "rgba(74,163,255,.4)" } : {}) }}
      >
        <i className={`fas ${verified ? "fa-circle-check" : "fa-circle-plus"}`} /> {verified ? "Verified" : "Verify"}
      </button>
      {featured && (
        <button
          className="btn-ghost"
          disabled={busy}
          onClick={() => patch({ featured: false })}
          style={{ fontSize: ".78rem", padding: ".35rem .6rem", color: "#FFD700", borderColor: "rgba(255,215,0,.4)" }}
        >
          Unfeature
        </button>
      )}
    </div>
  );
}
