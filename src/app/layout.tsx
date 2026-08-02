import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { getSession } from "@/lib/auth";

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
  title: "RevMeet — Find Car Events & Meetups",
  description:
    "Discover car shows, track days, night cruises and meetups near you. The UK's platform for the car community — search by map or list.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <html lang="en" className={`${bebas.variable} ${inter.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
        />
      </head>
      <body>
        <Nav session={session} />
        <main style={{ paddingTop: 64, minHeight: "calc(100vh - 64px)" }}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
