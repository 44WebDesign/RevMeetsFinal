// Lightweight, dependency-free SVG charts for the organiser analytics page.
// Pure server components (no client JS): they render static SVG that scales to
// its container. Dark-theme aware via CSS variables.

type Point = { label: string; value: number };

// Area + line chart for a time series (e.g. registrations per week).
export function AreaChart({
  data,
  accent = "var(--or)",
  height = 180,
  valueSuffix = "",
}: {
  data: Point[];
  accent?: string;
  height?: number;
  valueSuffix?: string;
}) {
  const W = 640;
  const H = height;
  const padX = 8;
  const padTop = 18;
  const padBottom = 26;
  const innerW = W - padX * 2;
  const innerH = H - padTop - padBottom;
  const max = Math.max(1, ...data.map((d) => d.value));
  const n = data.length;

  const x = (i: number) => (n <= 1 ? padX + innerW / 2 : padX + (i / (n - 1)) * innerW);
  const y = (v: number) => padTop + innerH - (v / max) * innerH;

  const linePts = data.map((d, i) => `${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
  const areaPts = `${padX},${padTop + innerH} ${linePts} ${padX + innerW},${padTop + innerH}`;
  const total = data.reduce((s, d) => s + d.value, 0);

  // Show at most ~6 x-axis labels so they don't collide.
  const step = Math.max(1, Math.ceil(n / 6));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height="auto"
      role="img"
      aria-label={`Time series chart, ${total} total`}
      style={{ display: "block" }}
    >
      {/* horizontal gridlines */}
      {[0, 0.5, 1].map((f) => (
        <line
          key={f}
          x1={padX}
          x2={padX + innerW}
          y1={padTop + innerH * f}
          y2={padTop + innerH * f}
          stroke="var(--bdr)"
          strokeWidth={1}
        />
      ))}
      <polygon points={areaPts} fill={accent} opacity={0.14} />
      <polyline points={linePts} fill="none" stroke={accent} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <g key={i}>
          {d.value > 0 && <circle cx={x(i)} cy={y(d.value)} r={2.5} fill={accent} />}
          {i % step === 0 && (
            <text x={x(i)} y={H - 8} fill="var(--mut)" fontSize={11} textAnchor="middle">
              {d.label}
            </text>
          )}
        </g>
      ))}
      <text x={padX} y={12} fill="var(--mut)" fontSize={11}>
        {max}
        {valueSuffix}
      </text>
    </svg>
  );
}

// Horizontal bar list (e.g. top events by registrations).
export function BarList({
  items,
  accent = "var(--or)",
  emptyText = "No data yet.",
}: {
  items: { label: string; value: number; href?: string }[];
  accent?: string;
  emptyText?: string;
}) {
  if (items.length === 0) {
    return <p style={{ color: "var(--mut)", fontSize: ".85rem" }}>{emptyText}</p>;
  }
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: ".7rem" }}>
      {items.map((it, i) => (
        <div key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".82rem", marginBottom: ".25rem", gap: ".5rem" }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.label}</span>
            <strong style={{ color: accent, flexShrink: 0 }}>{it.value}</strong>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: "var(--bdr)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(it.value / max) * 100}%`, background: accent, borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
