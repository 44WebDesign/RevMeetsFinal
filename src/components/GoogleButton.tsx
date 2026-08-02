const GOOGLE_ICON =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4Ij48cGF0aCBmaWxsPSIjRUE0MzM1IiBkPSJNMjQgOS41YzMuNTQgMCA2LjcxIDEuMjIgOS4yMSAzLjZsNi44NS02Ljg1QzM1LjkgMi4zOCAzMC40NyAwIDI0IDAgMTQuNjIgMCA2LjUxIDUuMzggMi41NiAxMy4yMmw3Ljk4IDYuMTlDMTIuNDMgMTMuNzIgMTcuNzQgOS41IDI0IDkuNXoiLz48cGF0aCBmaWxsPSIjNDI4NUY0IiBkPSJNNDYuOTggMjQuNTVjMC0xLjU3LS4xNS0zLjA5LS4zOC00LjU1SDI0djkuMDJoMTIuOTRjLS41OCAyLjk2LTIuMjYgNS40OC00Ljc4IDcuMThsNy43MyA2Yy00LjUxIDQuMTgtMTAuNDcgNi43LTE3LjczIDYuNy02LjI2IDAtMTEuNTctNC4yMi0xMy40Ni05LjkxbC03Ljk4IDYuMTlDNi41MSA0Mi42MiAxNC42MiA0OCAyNCA0OGM2LjQ3IDAgMTEuOS0yLjEzIDE1Ljg5LTUuODEgNC41Mi00LjE2IDcuMDktMTAuMyA3LjA5LTE3LjY0eiIvPjxwYXRoIGZpbGw9IiNGQkJDMDUiIGQ9Ik0xMC41MyAyOC41OWMtLjQ4LTEuNDUtLjc2LTIuOTktLjc2LTQuNTlzLjI3LTMuMTQuNzYtNC41OWwtNy45OC02LjE5QzAuOTIgMTYuNDYgMCAyMC4xMiAwIDI0YzAgMy44OC45MiA3LjU0IDIuNTYgMTAuNzhsNy45Ny02LjE5eiIvPjxwYXRoIGZpbGw9IiMzNEE4NTMiIGQ9Ik0yNCA0OGM2LjQ4IDAgMTEuOTMtMi4xMyAxNS44OS01LjgxbC03LjczLTZjLTIuMTUgMS40NS00LjkyIDIuMy04LjE2IDIuMy02LjI2IDAtMTEuNTctNC4yMi0xMy40Ni05LjkxbC03Ljk4IDYuMTlDNi41MSA0Mi42MiAxNC42MiA0OCAyNCA0OHoiLz48L3N2Zz4=";

// Renders "Continue with Google". Optional role/next flow into the OAuth start.
export function GoogleButton({
  role,
  next,
  label = "Continue with Google",
}: {
  role?: string;
  next?: string;
  label?: string;
}) {
  const params = new URLSearchParams();
  if (role) params.set("role", role);
  if (next) params.set("next", next);
  const href = `/api/auth/google${params.toString() ? `?${params.toString()}` : ""}`;

  return (
    <a
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: ".6rem",
        width: "100%",
        background: "#fff",
        color: "#1f1f1f",
        border: "1px solid var(--bdr2)",
        borderRadius: 6,
        padding: ".8rem 1rem",
        fontSize: ".9rem",
        fontWeight: 600,
        textDecoration: "none",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={GOOGLE_ICON} alt="" width={18} height={18} />
      {label}
    </a>
  );
}

// A labelled "or" divider used between Google and the email form.
export function OrDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: ".75rem", margin: "1.25rem 0" }}>
      <span style={{ flex: 1, height: 1, background: "var(--bdr2)" }} />
      <span style={{ fontSize: ".72rem", color: "var(--mut)", textTransform: "uppercase", letterSpacing: ".1em" }}>
        or
      </span>
      <span style={{ flex: 1, height: 1, background: "var(--bdr2)" }} />
    </div>
  );
}
