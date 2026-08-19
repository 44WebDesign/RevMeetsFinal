import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AccountForm } from "./AccountForm";
import { ROLE_LABELS } from "@/lib/enums";
import type { Role } from "@/lib/enums";

export const dynamic = "force-dynamic";
export const metadata = { title: "Account Settings", robots: { index: false } };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  return (
    <section className="section" style={{ background: "var(--bg)" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div className="sec-label">Your Account</div>
        <div className="sec-title" style={{ fontSize: "clamp(2rem,4vw,3rem)" }}>ACCOUNT SETTINGS</div>
        <p className="sec-sub" style={{ marginBottom: "2rem" }}>
          Signed in as <strong>{user.email}</strong> · {ROLE_LABELS[user.role as Role] ?? user.role}
        </p>
        <AccountForm
          initial={{
            name: user.name,
            bio: user.bio ?? "",
            avatarColor: user.avatarColor,
            hasPassword: !!user.passwordHash,
            carMake: user.carMake ?? "",
            carModel: user.carModel ?? "",
            carYear: user.carYear ?? null,
            homeCity: user.homeCity ?? "",
            homeLat: user.homeLat ?? null,
            homeLng: user.homeLng ?? null,
            digestOptIn: user.digestOptIn,
            id: user.id,
          }}
        />
      </div>
    </section>
  );
}
