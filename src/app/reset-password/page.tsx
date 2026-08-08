import { Suspense } from "react";
import { ResetForm } from "./ResetForm";

export const metadata = { title: "Reset Password", robots: { index: false } };

export default function ResetPasswordPage() {
  return (
    <section className="section" style={{ background: "var(--bg)", minHeight: "calc(100vh - 64px)" }}>
      <div style={{ maxWidth: 440, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div className="sec-label">Almost There</div>
          <div className="sec-title" style={{ fontSize: "clamp(2rem,4vw,3rem)" }}>NEW PASSWORD</div>
        </div>
        <Suspense fallback={<div className="card-surface" style={{ padding: "2rem" }}>Loading…</div>}>
          <ResetForm />
        </Suspense>
      </div>
    </section>
  );
}
