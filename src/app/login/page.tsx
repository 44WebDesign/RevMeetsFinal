import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import { googleConfigured } from "@/lib/google";

export const metadata = { title: "Log In — RevMeet" };

export default function LoginPage() {
  const googleEnabled = googleConfigured();
  return (
    <section className="section" style={{ background: "var(--bg)", minHeight: "calc(100vh - 64px)" }}>
      <div style={{ maxWidth: 440, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div className="sec-label">Welcome Back</div>
          <div className="sec-title" style={{ fontSize: "clamp(2rem,4vw,3rem)" }}>LOG IN</div>
        </div>
        <Suspense fallback={<div className="card-surface" style={{ padding: "2rem" }}>Loading…</div>}>
          <LoginForm googleEnabled={googleEnabled} />
        </Suspense>
      </div>
    </section>
  );
}
