import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { getSession } from "@/lib/auth";

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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
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
