import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { EventForm } from "@/components/EventForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Create Event — RevMeet" };

export default async function NewEventPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard/events/new");
  if (user.role === "ENTHUSIAST") redirect("/dashboard");

  return (
    <section className="section" style={{ background: "var(--bg)" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <div className="sec-label">Host</div>
        <div className="sec-title" style={{ fontSize: "clamp(2rem,4vw,3rem)" }}>CREATE AN EVENT</div>
        <p className="sec-sub" style={{ marginBottom: "2rem" }}>
          Publish your event to the map and the community. You can save it as a draft first if you&apos;re not ready.
        </p>
        <EventForm mode="create" />
      </div>
    </section>
  );
}
