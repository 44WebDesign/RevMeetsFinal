import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { Breadcrumbs, breadcrumbLd } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

const DESC = "Get in touch with the RevMeets team — questions, feedback, listing help or anything else.";

export const metadata: Metadata = {
  title: "Contact",
  description: DESC,
  alternates: { canonical: "/contact" },
  openGraph: { title: "Contact RevMeets", description: DESC, url: absoluteUrl("/contact") },
};

export default async function ContactPage() {
  const session = await getSession();
  const email = session ? (await prisma.user.findUnique({ where: { id: session.sub }, select: { email: true } }))?.email ?? "" : "";
  const support = process.env.SUPPORT_EMAIL;
  const crumbs = [{ label: "Home", href: "/" }, { label: "Contact" }];

  return (
    <section className="section" style={{ background: "var(--bg)" }}>
      <JsonLd data={breadcrumbLd(crumbs, absoluteUrl)} />
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <Breadcrumbs items={crumbs} />
        <div className="sec-label">Get in touch</div>
        <h1 className="sec-title" style={{ fontSize: "clamp(2rem,4vw,3rem)" }}>CONTACT US</h1>
        <p className="sec-sub" style={{ marginBottom: "1.75rem" }}>
          Questions, feedback or need a hand with a listing? Send us a message and we&apos;ll get back to you.
          {support && (
            <>
              {" "}You can also email{" "}
              <a href={`mailto:${support}`} style={{ color: "var(--or)", textDecoration: "none" }}>{support}</a>.
            </>
          )}
        </p>
        <ContactForm defaultEmail={email} />
      </div>
    </section>
  );
}
