import { AreaChart, BarList } from "./Charts";

// Illustrative product visuals for the How It Works page — faux-UI "screenshots"
// built from real components + CSS so they stay crisp, responsive and on-brand
// (and never go stale like a captured image). Swap in real screenshots later if
// you prefer.

export function BrowserFrame({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div className="card-surface" style={{ overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,.5)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: ".5rem", padding: ".6rem .85rem", borderBottom: "1px solid var(--bdr)", background: "var(--bg2)" }}>
        <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#ff5f56" }} />
        <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#ffbd2e" }} />
        <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#27c93f" }} />
        <span style={{ flex: 1, marginLeft: ".5rem", background: "var(--bg)", border: "1px solid var(--bdr)", borderRadius: 100, fontSize: ".72rem", color: "var(--mut)", padding: ".2rem .8rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          <i className="fas fa-lock" style={{ fontSize: ".6rem", marginRight: 6 }} /> {url}
        </span>
      </div>
      <div style={{ padding: "1.25rem" }}>{children}</div>
    </div>
  );
}

function Tile({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div style={{ flex: 1, minWidth: 100, background: "var(--bg)", border: "1px solid var(--bdr)", borderRadius: 8, padding: ".8rem" }}>
      <div style={{ color: "var(--or)", fontSize: ".85rem", marginBottom: ".3rem" }}><i className={`fas ${icon}`} /></div>
      <div className="hd" style={{ fontSize: "1.5rem", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: ".7rem", color: "var(--mut)" }}>{label}</div>
    </div>
  );
}

// Organiser analytics dashboard.
export function DashboardMock() {
  const weeks = ["4 Aug", "11 Aug", "18 Aug", "25 Aug", "1 Sep", "8 Sep", "15 Sep", "22 Sep"];
  const series = [8, 14, 11, 22, 19, 34, 28, 41].map((v, i) => ({ label: weeks[i], value: v }));
  const top = [
    { label: "Midlands Tuner Festival", value: 128 },
    { label: "Sunday Cars & Coffee", value: 96 },
    { label: "Night Cruise — Leeds", value: 74 },
    { label: "JDM Meet", value: 51 },
  ];
  return (
    <div>
      <div style={{ display: "flex", gap: ".6rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <Tile label="Events" value="12" icon="fa-calendar" />
        <Tile label="Registrations" value="480" icon="fa-users" />
        <Tile label="Saves" value="213" icon="fa-bookmark" />
        <Tile label="Avg rating" value="4.6★" icon="fa-star" />
      </div>
      <div style={{ background: "var(--bg)", border: "1px solid var(--bdr)", borderRadius: 8, padding: "1rem", marginBottom: ".8rem" }}>
        <div style={{ fontSize: ".8rem", color: "var(--mut)", marginBottom: ".5rem" }}>Registrations over time</div>
        <AreaChart data={series} height={150} />
      </div>
      <div style={{ background: "var(--bg)", border: "1px solid var(--bdr)", borderRadius: 8, padding: "1rem" }}>
        <div style={{ fontSize: ".8rem", color: "var(--mut)", marginBottom: ".6rem" }}>Top events</div>
        <BarList items={top} />
      </div>
    </div>
  );
}

// Admin / moderation console.
export function AdminMock() {
  const nav = [
    { label: "Overview", icon: "fa-gauge-high", active: false },
    { label: "Reports", icon: "fa-flag", active: true },
    { label: "Events", icon: "fa-calendar", active: false },
    { label: "Listings", icon: "fa-circle-check", active: false },
    { label: "Users", icon: "fa-users", active: false },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "1rem" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: ".3rem" }}>
        {nav.map((n) => (
          <div key={n.label} style={{ display: "flex", alignItems: "center", gap: ".5rem", padding: ".45rem .6rem", borderRadius: 6, fontSize: ".78rem", fontWeight: 600, border: "1px solid var(--bdr)", background: n.active ? "rgba(255,95,31,.12)" : "transparent", color: n.active ? "#fff" : "var(--mut)" }}>
            <i className={`fas ${n.icon}`} style={{ width: 14, color: "var(--or)" }} /> {n.label}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
        <div style={{ background: "var(--bg)", border: "1px solid var(--bdr)", borderRadius: 8, padding: ".8rem 1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: ".4rem", flexWrap: "wrap", marginBottom: ".3rem" }}>
            <span className="pill" style={{ background: "rgba(255,107,94,.15)", color: "#ff6b5e" }}>Open</span>
            <span className="pill" style={{ background: "var(--bdr2)", color: "var(--mut)" }}>Review</span>
            <strong style={{ fontSize: ".82rem" }}>Offensive or inappropriate</strong>
          </div>
          <div style={{ fontSize: ".74rem", color: "var(--mut)" }}>Reported by a member · Resolve / Dismiss / Delete</div>
        </div>
        <div style={{ background: "var(--bg)", border: "1px solid var(--bdr)", borderRadius: 8, padding: ".8rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: ".5rem", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: ".85rem" }}>
              Harewood Speed Hillclimb <span className="pill" style={{ background: "rgba(74,163,255,.15)", color: "#4aa3ff", border: "1px solid rgba(74,163,255,.4)" }}><i className="fas fa-circle-check" /> Verified</span>
            </div>
            <div style={{ fontSize: ".74rem", color: "var(--mut)" }}>Venue · Leeds</div>
          </div>
          <span className="btn-ghost" style={{ fontSize: ".76rem", padding: ".3rem .6rem", color: "#4aa3ff", borderColor: "rgba(74,163,255,.4)" }}>Verified</span>
        </div>
      </div>
    </div>
  );
}

// Audience-growth illustration: a club broadcasting to its followers.
export function GrowthMock() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: ".7rem" }}>
      <div style={{ background: "var(--bg)", border: "1px solid var(--bdr)", borderRadius: 8, padding: ".9rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: ".5rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: ".6rem" }}>
          <span style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--or)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><i className="fas fa-users-gear" /></span>
          <div>
            <div style={{ fontWeight: 700, fontSize: ".88rem" }}>East London AutoClub</div>
            <div style={{ fontSize: ".74rem", color: "var(--mut)" }}><i className="fas fa-heart" style={{ color: "var(--or)" }} /> 340 followers</div>
          </div>
        </div>
        <span className="pill" style={{ background: "rgba(255,215,0,.15)", color: "#FFD700", border: "1px solid rgba(255,215,0,.4)" }}><i className="fas fa-star" /> Featured</span>
      </div>
      <div style={{ background: "var(--bg)", border: "1px solid var(--bdr)", borderRadius: 8, padding: ".8rem 1rem", fontSize: ".82rem" }}>
        <div style={{ color: "#7fd884", marginBottom: ".2rem" }}><i className="fas fa-paper-plane" /> New event published</div>
        <div style={{ color: "var(--mut)" }}>Alert sent to <strong style={{ color: "var(--txt)" }}>340 followers</strong> — in-app + email — and to nearby members in the weekly digest.</div>
      </div>
    </div>
  );
}
