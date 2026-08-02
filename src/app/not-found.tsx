import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section" style={{ background: "var(--bg)", textAlign: "center", minHeight: "calc(100vh - 64px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div>
        <div className="hd" style={{ fontSize: "6rem", color: "var(--or)", lineHeight: 1 }}>404</div>
        <h1 className="hd" style={{ fontSize: "2rem", marginBottom: "1rem" }}>PAGE NOT FOUND</h1>
        <p style={{ color: "var(--mut)", marginBottom: "2rem" }}>
          That page has left the meet. Let&apos;s get you back on the road.
        </p>
        <Link href="/" className="btn-or-lg">Back to Home</Link>
      </div>
    </section>
  );
}
