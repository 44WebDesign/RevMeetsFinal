import { Suspense } from "react";
import { RegisterForm } from "./RegisterForm";
import { googleConfigured } from "@/lib/google";

export const metadata = { title: "Sign Up", robots: { index: false, follow: true } };

export default function RegisterPage() {
  const googleEnabled = googleConfigured();
  return (
    <section className="section" style={{ background: "var(--bg)", minHeight: "calc(100vh - 64px)" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div className="sec-label">Join RevMeet</div>
          <div className="sec-title" style={{ fontSize: "clamp(2rem,4vw,3rem)" }}>CREATE YOUR ACCOUNT</div>
        </div>
        <Suspense fallback={<div className="card-surface" style={{ padding: "2rem" }}>Loading…</div>}>
          <RegisterForm googleEnabled={googleEnabled} />
        </Suspense>
      </div>
    </section>
  );
}
