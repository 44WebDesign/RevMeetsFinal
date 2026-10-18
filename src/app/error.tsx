"use client";

import Link from "next/link";
import { useEffect } from "react";

// App-wide error boundary — shown instead of Next.js's raw error screen when a
// page throws. Keeps the branding and offers a retry + a way home.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  return (
    <section className="section" style={{ background: "var(--bg)", minHeight: "70vh", display: "flex", alignItems: "center" }}>
      <div style={{ maxWidth: 520, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: "2.5rem", color: "var(--or)", marginBottom: "1rem" }}>
          <i className="fas fa-triangle-exclamation" />
        </div>
        <h1 className="hd" style={{ fontSize: "clamp(1.8rem,4vw,2.5rem)", marginBottom: ".75rem" }}>
          SOMETHING WENT WRONG
        </h1>
        <p style={{ color: "var(--mut)", lineHeight: 1.7, marginBottom: "1.75rem" }}>
          Sorry — an unexpected error occurred. It&apos;s been logged. You can try again, or head back
          to the homepage.
        </p>
        <div style={{ display: "flex", gap: ".75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={reset} className="btn-or">
            <i className="fas fa-rotate-right" /> Try again
          </button>
          <Link href="/" className="btn-ghost">Back to home</Link>
          <Link href="/contact" className="btn-ghost">Contact us</Link>
        </div>
        {error.digest && (
          <p style={{ fontSize: ".72rem", color: "var(--mut)", marginTop: "1.5rem" }}>Reference: {error.digest}</p>
        )}
      </div>
    </section>
  );
}
