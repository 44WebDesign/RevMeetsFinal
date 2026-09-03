// Small trust badge for admin-verified clubs/venues.
export function VerifiedBadge({ size = ".7rem", withLabel = false }: { size?: string; withLabel?: boolean }) {
  return (
    <span
      title="Verified by RevMeet"
      aria-label="Verified"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: ".3rem",
        color: "#4aa3ff",
        fontSize: size,
        fontWeight: 700,
      }}
    >
      <i className="fas fa-circle-check" />
      {withLabel && <span>Verified</span>}
    </span>
  );
}
