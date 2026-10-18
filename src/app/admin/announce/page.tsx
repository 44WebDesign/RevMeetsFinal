import { AnnounceForm } from "@/components/admin/AnnounceForm";

export const dynamic = "force-dynamic";

export default function AdminAnnounce() {
  return (
    <div>
      <h1 className="hd" style={{ fontSize: "1.9rem", marginBottom: ".5rem" }}>Announce</h1>
      <p style={{ color: "var(--mut)", fontSize: ".85rem", marginBottom: "1.5rem", maxWidth: 640 }}>
        Send a message to a group of members. Account holders get an in-app notification; everyone
        in the group is emailed too when Resend is configured. Use sparingly — it reaches real inboxes.
      </p>
      <AnnounceForm />
    </div>
  );
}
