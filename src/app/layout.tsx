import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { getSession } from "@/lib/auth";
import { siteUrl, absoluteUrl, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";

// Self-hosted at build time — no runtime CDN dependency for fonts.
const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
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
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
