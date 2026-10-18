import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { VerifyBanner } from "@/components/VerifyBanner";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { siteUrl, absoluteUrl, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";

// Fonts are self-hosted from committed woff2 files (src/app/fonts) via
// next/font/local — no network fetch at build OR runtime, so the build can
// never flake on a Google Fonts outage.
const bebas = localFont({
  src: "./fonts/bebas-neue-400.woff2",
  weight: "400",
  variable: "--font-bebas",
  display: "swap",
});
const inter = localFont({
  // Variable font covering the 300–800 weights the design uses.
  src: "./fonts/inter-var.woff2",
  weight: "100 900",
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "RevMeet — Find Car Events & Meetups Near You",
    template: "%s · RevMeet",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "car events",
    "car shows",
    "track days",
    "car meets",
    "night cruises",
    "drift events",
    "JDM meets",
    "car clubs UK",
    "car meetups near me",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "RevMeet — Find Car Events & Meetups Near You",
    description: SITE_DESCRIPTION,
    url: siteUrl(),
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "RevMeet — Find Car Events & Meetups Near You",
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // Soft email-verification nudge: show a dismissable banner to logged-in users
  // whose address isn't confirmed yet. Never blocks any action.
  let unverified = false;
  if (session) {
    const u = await prisma.user
      .findUnique({ where: { id: session.sub }, select: { emailVerified: true } })
      .catch(() => null);
    unverified = !!u && !u.emailVerified;
  }

  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: siteUrl(),
    description: SITE_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl("/events")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en" className={`${bebas.variable} ${inter.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
        />
      </head>
      <body>
        <JsonLd data={websiteLd} />
        <Nav session={session} />
        <main style={{ paddingTop: 64, minHeight: "calc(100vh - 64px)" }}>
          {unverified && <VerifyBanner />}
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
