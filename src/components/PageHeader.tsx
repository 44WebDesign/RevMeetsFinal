export function PageHeader({
  label,
  title,
  sub,
  right,
}: {
  label: string;
  title: string;
  sub?: string;
  right?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem",
        marginBottom: "2rem",
      }}
    >
      <div>
        <div className="sec-label">{label}</div>
        <div className="sec-title">{title}</div>
        {sub && <div className="sec-sub" style={{ marginTop: ".5rem" }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}
