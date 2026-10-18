"use client";

// Catches errors thrown in the root layout itself (which the regular
// error.tsx boundary can't reach) and reports them to Sentry when configured.
// Must render its own <html>/<body> because it replaces the whole document.
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0b0b",
          color: "#e8e8e8",
          fontFamily: "Arial, Helvetica, sans-serif",
          padding: 24,
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <h1 style={{ fontSize: 22, color: "#fff", margin: "0 0 10px" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#aaa", fontSize: 14, lineHeight: 1.6, margin: "0 0 20px" }}>
            An unexpected error occurred. Please try again — if it keeps
            happening, let us know.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#FF5F1F",
              color: "#fff",
              border: "none",
              padding: "10px 22px",
              borderRadius: 6,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
