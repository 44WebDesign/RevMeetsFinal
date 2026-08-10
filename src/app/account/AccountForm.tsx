"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { initials } from "@/lib/utils";

const COLORS = ["#FF5F1F", "#E040FB", "#00BCD4", "#4CAF50", "#FFD700", "#2196F3", "#F44336", "#9C27B0"];

export function AccountForm({
  initial,
}: {
  initial: {
    name: string;
    bio: string;
    avatarColor: string;
    hasPassword: boolean;
    carMake: string;
    carModel: string;
    carYear: number | null;
    id: string;
  };
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [bio, setBio] = useState(initial.bio);
  const [avatarColor, setAvatarColor] = useState(initial.avatarColor);
  const [carMake, setCarMake] = useState(initial.carMake);
  const [carModel, setCarModel] = useState(initial.carModel);
  const [carYear, setCarYear] = useState(initial.carYear ? String(initial.carYear) : "");
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileErr, setProfileErr] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [savingPw, setSavingPw] = useState(false);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    setProfileErr(null);
    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        bio: bio || null,
        avatarColor,
        carMake: carMake || null,
        carModel: carModel || null,
        carYear: carYear ? Number(carYear) : null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setProfileMsg("Profile saved.");
      router.refresh();
    } else {
      setProfileErr(data.details ? Object.values(data.details).flat().join(", ") : data.error ?? "Could not save");
    }
    setSavingProfile(false);
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setSavingPw(true);
    setPwMsg(null);
    setPwErr(null);
    const res = await fetch("/api/account/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPassword || undefined, newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setPwMsg("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
    } else {
      setPwErr(data.details ? Object.values(data.details).flat().join(", ") : data.error ?? "Could not update password");
    }
    setSavingPw(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Profile */}
      <form onSubmit={saveProfile} className="card-surface" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <h2 className="hd" style={{ fontSize: "1.4rem" }}>Profile</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ width: 56, height: 56, borderRadius: "50%", background: avatarColor, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1.1rem", flexShrink: 0 }}>
            {initials(name) || "?"}
          </span>
          <div>
            <label className="field-label">Avatar colour</label>
            <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
              {COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setAvatarColor(c)}
                  aria-label={`Colour ${c}`}
                  style={{ width: 26, height: 26, borderRadius: "50%", background: c, border: avatarColor === c ? "2px solid #fff" : "2px solid transparent", cursor: "pointer" }}
                />
              ))}
            </div>
          </div>
        </div>
        <div>
          <label className="field-label">Display name</label>
          <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="field-label">Bio (optional)</label>
          <textarea className="field-textarea" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell the community a bit about you and your car…" />
        </div>

        {/* Garage */}
        <div style={{ borderTop: "1px solid var(--bdr)", paddingTop: "1.25rem" }}>
          <h3 className="hd" style={{ fontSize: "1.1rem", marginBottom: ".25rem" }}>
            <i className="fas fa-car-side" style={{ color: "var(--or)", marginRight: 6 }} /> Your Garage
          </h3>
          <p style={{ fontSize: ".8rem", color: "var(--mut)", marginBottom: ".9rem" }}>
            Shown on your public profile, along with your build photos.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 90px", gap: ".6rem" }}>
            <div>
              <label className="field-label">Make</label>
              <input className="field-input" value={carMake} onChange={(e) => setCarMake(e.target.value)} placeholder="e.g. Nissan" />
            </div>
            <div>
              <label className="field-label">Model</label>
              <input className="field-input" value={carModel} onChange={(e) => setCarModel(e.target.value)} placeholder="e.g. Skyline GT-R" />
            </div>
            <div>
              <label className="field-label">Year</label>
              <input className="field-input" value={carYear} onChange={(e) => setCarYear(e.target.value.replace(/[^\d]/g, ""))} placeholder="1999" inputMode="numeric" maxLength={4} />
            </div>
          </div>
          <p style={{ fontSize: ".8rem", marginTop: ".75rem" }}>
            <Link href={`/members/${initial.id}`} style={{ color: "var(--or)", textDecoration: "none" }}>
              <i className="fas fa-arrow-up-right-from-square" /> View your public profile
            </Link>
          </p>
        </div>

        {profileErr && <Msg color="#ff6b5e">{profileErr}</Msg>}
        {profileMsg && <Msg color="#7fd884"><i className="fas fa-check" /> {profileMsg}</Msg>}
        <button type="submit" className="btn-or-lg" disabled={savingProfile} style={{ alignSelf: "flex-start" }}>
          {savingProfile ? "Saving…" : "Save Profile"}
        </button>
      </form>

      {/* Password */}
      <form onSubmit={savePassword} className="card-surface" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <h2 className="hd" style={{ fontSize: "1.4rem" }}>
          {initial.hasPassword ? "Change Password" : "Set a Password"}
        </h2>
        {!initial.hasPassword && (
          <p style={{ fontSize: ".85rem", color: "var(--mut)" }}>
            You currently sign in with Google. Set a password to also log in with your email.
          </p>
        )}
        {initial.hasPassword && (
          <div>
            <label className="field-label">Current password</label>
            <input type="password" className="field-input" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          </div>
        )}
        <div>
          <label className="field-label">New password</label>
          <input type="password" className="field-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="At least 8 characters" />
        </div>
        {pwErr && <Msg color="#ff6b5e">{pwErr}</Msg>}
        {pwMsg && <Msg color="#7fd884"><i className="fas fa-check" /> {pwMsg}</Msg>}
        <button type="submit" className="btn-or-lg" disabled={savingPw} style={{ alignSelf: "flex-start" }}>
          {savingPw ? "Saving…" : initial.hasPassword ? "Update Password" : "Set Password"}
        </button>
      </form>
    </div>
  );
}

function Msg({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div style={{ background: `${color}1a`, border: `1px solid ${color}55`, color, padding: ".7rem 1rem", borderRadius: 6, fontSize: ".85rem" }}>
      {children}
    </div>
  );
}
