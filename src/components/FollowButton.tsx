"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function FollowButton({
  kind,
  id,
  initialFollowing,
  initialFollowers,
  loggedIn,
}: {
  kind: "club" | "venue";
  id: string;
  initialFollowing: boolean;
  initialFollowers: number;
  loggedIn: boolean;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [followers, setFollowers] = useState(initialFollowers);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!loggedIn) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setBusy(true);
    const res = await fetch("/api/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, id }),
    });
    if (res.ok) {
      const data = await res.json();
      setFollowing(data.following);
      setFollowers(data.followers);
    }
    setBusy(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={following ? "btn-ghost" : "btn-or"}
      style={{ display: "inline-flex", alignItems: "center", gap: ".4rem" }}
    >
      <i className={following ? "fas fa-heart" : "far fa-heart"} />
      {following ? "Following" : "Follow"}
      <span style={{ opacity: 0.7 }}>· {followers}</span>
    </button>
  );
}
