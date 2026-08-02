import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ClubForm } from "@/components/ClubForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Edit Club — RevMeet" };

export default async function ClubProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard/club");
  if (!user.club) redirect("/dashboard");

  return (
    <section className="section" style={{ background: "var(--bg)" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div className="sec-label">Your Club</div>
        <div className="sec-title" style={{ fontSize: "clamp(2rem,4vw,3rem)" }}>CLUB PROFILE</div>
        <p className="sec-sub" style={{ marginBottom: "2rem" }}>
          This is what the community sees on your public club page. Keep it fresh.
        </p>
        <ClubForm
          initial={{
            name: user.club.name,
            description: user.club.description,
            location: user.club.location,
            region: user.club.region ?? "",
            imageUrl: user.club.imageUrl ?? "",
            website: user.club.website ?? "",
            categories: user.club.categories ?? "",
          }}
        />
      </div>
    </section>
  );
}
