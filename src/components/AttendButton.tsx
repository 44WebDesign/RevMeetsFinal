"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AttendButton({
  eventId,
  initialRegistered,
  initialAttendees,
  loggedIn,
  full,
}: {
  eventId: string;
  initialRegistered: boolean;
  initialAttendees: number;
  loggedIn: boolean;
  full: boolean;
}) {
  const router = useRouter();
  const [registered, setRegistered] = useState(initialRegistered);
  const [attendees, setAttendees] = useState(initialAttendees);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    if (!loggedIn) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/events/${eventId}/register`, {
      method: registered ? "DELETE" : "POST",
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setRegistered(data.registered);
      setAttendees(data.attendees);
    } else {
      setError(data.error ?? "Could not update registration");
    }
    setBusy(false);
  }

  const disabled = busy || (!registered && full);

  return (
    <div>
      <button
        onClick={toggle}
        disabled={disabled}
        className="btn-or-lg"
        style={{ width: "100%", textAlign: "center" }}
      >
        {registered ? (
          <>
            <i className="fas fa-circle-check" /> You&apos;re Going — Cancel?
          </>
        ) : full ? (
          "Event Full"
        ) : (
          <>
            <i className="fas fa-ticket" /> Register to Attend
          </>
        )}
      </button>
      <p style={{ textAlign: "center", fontSize: ".8rem", color: "var(--mut)", marginTop: ".6rem" }}>
        <i className="fas fa-users" /> {attendees} going
      </p>
      {error && (
        <p style={{ textAlign: "center", fontSize: ".8rem", color: "#F44336", marginTop: ".25rem" }}>
          {error}
        </p>
      )}
    </div>
  );
}
