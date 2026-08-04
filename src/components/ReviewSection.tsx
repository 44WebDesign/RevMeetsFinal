"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type ReviewItem = {
  id: string;
  rating: number;
  body: string | null;
  author: string;
  avatarColor: string;
  createdAt: string;
};

export function Stars({ rating, size = ".85rem" }: { rating: number; size?: string }) {
  return (
    <span style={{ color: "var(--or)", fontSize: size, letterSpacing: "2px" }} aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(Math.round(rating))}
      <span style={{ color: "var(--bdr2)" }}>{"★".repeat(5 - Math.round(rating))}</span>
    </span>
  );
}

export function ReviewSection({
  eventId,
  reviews,
  average,
  canReview,
  myRating,
  loggedIn,
  eventStarted,
}: {
  eventId: string;
  reviews: ReviewItem[];
  average: number | null;
  canReview: boolean;
  myRating: number | null;
  loggedIn: boolean;
  eventStarted: boolean;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(myRating ?? 0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) {
      setError("Pick a star rating first");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/events/${eventId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, body: body || null }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setDone(true);
      router.refresh();
    } else {
      setError(data.error ?? "Could not save review");
    }
    setBusy(false);
  }

  return (
    <div style={{ marginTop: "2.5rem" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "1rem", flexWrap: "wrap" }}>
        <h2 className="hd" style={{ fontSize: "1.75rem" }}>Reviews ({reviews.length})</h2>
        {average !== null && (
          <span style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
            <Stars rating={average} />
            <span style={{ fontSize: ".9rem", color: "var(--mut)" }}>{average.toFixed(1)} average</span>
          </span>
        )}
      </div>

      {/* Review form */}
      {eventStarted && canReview && !done && (
        <form onSubmit={submit} className="card-surface" style={{ padding: "1.25rem", marginTop: "1rem" }}>
          <label className="field-label">{myRating ? "Update your review" : "Leave a review"}</label>
          <div style={{ fontSize: "1.5rem", cursor: "pointer", marginBottom: ".6rem" }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                style={{ color: n <= (hover || rating) ? "var(--or)" : "var(--bdr2)", padding: "0 2px" }}
                role="button"
                aria-label={`${n} stars`}
              >
                ★
              </span>
            ))}
          </div>
          <textarea
            className="field-textarea"
            rows={3}
            placeholder="How was it? (optional)"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          {error && <p style={{ fontSize: ".8rem", color: "#ff6b5e", marginTop: ".5rem" }}>{error}</p>}
          <button type="submit" className="btn-or" disabled={busy} style={{ marginTop: ".75rem" }}>
            {busy ? "Saving…" : "Submit Review"}
          </button>
        </form>
      )}
      {done && (
        <div className="card-surface" style={{ padding: "1rem 1.25rem", marginTop: "1rem", color: "#7fd884", fontSize: ".9rem" }}>
          <i className="fas fa-check" /> Thanks — your review is live.
        </div>
      )}
      {eventStarted && !canReview && loggedIn && !myRating && (
        <p style={{ color: "var(--mut)", fontSize: ".85rem", marginTop: ".75rem" }}>
          Only attendees can review this event.
        </p>
      )}
      {!eventStarted && (
        <p style={{ color: "var(--mut)", fontSize: ".85rem", marginTop: ".75rem" }}>
          Reviews open once the event starts.
        </p>
      )}

      {/* Review list */}
      <div style={{ display: "flex", flexDirection: "column", gap: ".75rem", marginTop: "1.25rem" }}>
        {reviews.map((r) => (
          <div key={r.id} className="card-surface" style={{ padding: "1rem 1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: ".6rem", marginBottom: ".4rem" }}>
              <span
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: r.avatarColor,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: ".7rem",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {r.author.slice(0, 2).toUpperCase()}
              </span>
              <span style={{ fontWeight: 600, fontSize: ".88rem" }}>{r.author}</span>
              <Stars rating={r.rating} size=".75rem" />
            </div>
            {r.body && (
              <p style={{ fontSize: ".85rem", color: "rgba(245,245,245,.8)", lineHeight: 1.6 }}>{r.body}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
