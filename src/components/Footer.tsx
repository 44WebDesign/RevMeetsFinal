import Link from "next/link";

export function Footer() {
  return (
    <footer
      style={{
        background: "var(--card)",
        borderTop: "1px solid var(--bdr)",
        padding: "3rem 1.5rem 1.5rem",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr 1fr",
          gap: "3rem",
          marginBottom: "3rem",
        }}
        className="ft-grid"
      >
        <div>
          <Link href="/" className="logo" style={{ fontSize: "1.5rem" }}>
            REV<span>MEET</span>
          </Link>
          <p
            style={{
              fontSize: ".85rem",
              color: "var(--mut)",
              marginTop: ".75rem",
              lineHeight: 1.7,
              maxWidth: 280,
            }}
          >
            The UK&apos;s platform for discovering and organising car events.
            Built by enthusiasts, for enthusiasts.
          </p>
          <div style={{ display: "flex", gap: ".75rem", marginTop: "1.25rem" }}>
            {["instagram", "tiktok", "facebook-f", "x-twitter", "youtube"].map(
              (s) => (
                <span
                  key={s}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 6,
                    background: "var(--bg)",
                    border: "1px solid var(--bdr2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--mut)",
                    fontSize: ".85rem",
                  }}
                >
                  <i className={`fab fa-${s}`} />
                </span>
              ),
            )}
          </div>
        </div>

        <FooterCol
          title="Discover"
          links={[
            ["Browse Events", "/events"],
            ["Interactive Map", "/map"],
            ["Car Shows", "/events?type=CAR_SHOW"],
            ["Track Days", "/events?type=TRACK_DAY"],
            ["Night Cruises", "/events?type=NIGHT_CRUISE"],
          ]}
        />
        <FooterCol
          title="Community"
          links={[
            ["Browse Clubs", "/clubs"],
            ["Browse Venues", "/venues"],
            ["Host an Event", "/register"],
            ["List a Venue", "/register"],
          ]}
        />
        <FooterCol
          title="Account"
          links={[
            ["Sign Up", "/register"],
            ["Log In", "/login"],
            ["Dashboard", "/dashboard"],
          ]}
        />
      </div>

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          paddingTop: "1.5rem",
          borderTop: "1px solid var(--bdr)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: ".78rem",
          color: "var(--mut)",
          flexWrap: "wrap",
          gap: ".5rem",
        }}
      >
        <span>© {new Date().getFullYear()} RevMeet. All rights reserved.</span>
        <span>
          Made with <span style={{ color: "var(--or)" }}>❤</span> for car
          enthusiasts
        </span>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: [string, string][];
}) {
  return (
    <div>
      <h4
        style={{
          fontSize: ".7rem",
          fontWeight: 700,
          letterSpacing: ".1em",
          textTransform: "uppercase",
          color: "#fff",
          marginBottom: "1rem",
        }}
      >
        {title}
      </h4>
      <ul
        style={{
          listStyle: "none",
          display: "flex",
          flexDirection: "column",
          gap: ".6rem",
          padding: 0,
          margin: 0,
        }}
      >
        {links.map(([label, href]) => (
          <li key={label}>
            <Link
              href={href}
              style={{
                color: "var(--mut)",
                textDecoration: "none",
                fontSize: ".85rem",
              }}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
