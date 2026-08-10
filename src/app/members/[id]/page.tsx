import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { PhotoGallery } from "@/components/PhotoGallery";
import { JsonLd } from "@/components/JsonLd";
import { initials } from "@/lib/utils";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

const getMember = cache((id: string) =>
  prisma.user.findUnique({
    where: { id },
    include: {
      club: { select: { name: true, slug: true } },
      venue: { select: { name: true, slug: true } },
      photos: {
        where: { eventId: null },
        orderBy: { createdAt: "desc" },
        take: 60,
      },
      _count: { select: { events: true } },
    },
  }),
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const member = await getMember(id);
  if (!member || member.suspended) return { title: "Member not found", robots: { index: false } };

  const car = [member.carYear, member.carMake, member.carModel].filter(Boolean).join(" ");
  const desc = member.bio || (car ? `${member.name} drives a ${car}.` : `${member.name} on RevMeet.`);

  return {
    title: `${member.name} — Member Profile`,
    description: desc.slice(0, 155),
    alternates: { canonical: `/members/${member.id}` },
    openGraph: {
      type: "profile",
      title: member.name,
      description: desc.slice(0, 155),
      url: absoluteUrl(`/members/${member.id}`),
    },
  };
}

export default async function MemberProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  const member = await getMember(id);

  if (!member || member.suspended) notFound();

  const isSelf = session?.sub === member.id;
  const car = [member.carYear, member.carMake, member.carModel].filter(Boolean).join(" ");
  const photos = member.photos.map((p) => ({
    id: p.id,
    url: p.url,
    caption: p.caption,
    uploaderId: p.uploaderId,
    uploaderName: member.name,
    avatarColor: member.avatarColor,
  }));

  const personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: member.name,
    url: absoluteUrl(`/members/${member.id}`),
    ...(member.bio ? { description: member.bio } : {}),
  };

  return (
    <>
      <JsonLd data={personLd} />
      <section className="section" style={{ background: "var(--bg)" }}>
        <div className="container" style={{ maxWidth: 900 }}>
          <div style={{ display: "flex", gap: "1.25rem", alignItems: "center", flexWrap: "wrap" }}>
            <span
              style={{
                width: 84,
                height: 84,
                borderRadius: "50%",
                background: member.avatarColor,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "2rem",
                flexShrink: 0,
              }}
            >
              {initials(member.name) || "?"}
            </span>
            <div style={{ flex: 1, minWidth: 200 }}>
              <h1 className="hd" style={{ fontSize: "clamp(1.8rem,4vw,2.75rem)", lineHeight: 1 }}>{member.name}</h1>
              {car && (
                <p style={{ color: "var(--or)", fontWeight: 600, marginTop: ".4rem" }}>
                  <i className="fas fa-car-side" /> {car}
                </p>
              )}
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: ".5rem", fontSize: ".85rem", color: "var(--mut)" }}>
                {member.club && (
                  <Link href={`/clubs/${member.club.slug}`} style={{ color: "var(--mut)", textDecoration: "none" }}>
                    <i className="fas fa-users-gear" style={{ color: "var(--or)" }} /> {member.club.name}
                  </Link>
                )}
                {member.venue && (
                  <Link href={`/venues/${member.venue.slug}`} style={{ color: "var(--mut)", textDecoration: "none" }}>
                    <i className="fas fa-warehouse" style={{ color: "#00BCD4" }} /> {member.venue.name}
                  </Link>
                )}
                <span><i className="fas fa-camera" /> {photos.length} photos</span>
              </div>
            </div>
            {isSelf && (
              <Link href="/account" className="btn-ghost">
                <i className="fas fa-pen" /> Edit profile
              </Link>
            )}
          </div>

          {member.bio && (
            <p style={{ color: "rgba(245,245,245,.82)", lineHeight: 1.8, marginTop: "1.5rem", maxWidth: 680, whiteSpace: "pre-wrap" }}>
              {member.bio}
            </p>
          )}

          <PhotoGallery
            title="Build Gallery"
            photos={photos}
            canAdd={isSelf}
            currentUserId={session?.sub ?? null}
            isAdmin={session?.role === "ADMIN"}
            emptyText={isSelf ? "Add the first photo of your build below." : "No build photos yet."}
            addPrompt="Add a photo of your build"
          />
        </div>
      </section>
    </>
  );
}
