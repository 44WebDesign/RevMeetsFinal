import Link from "next/link";

// Simple prev/next pager that preserves the current filter params.
export function Pagination({
  basePath,
  params,
  page,
  total,
  per,
}: {
  basePath: string;
  params: Record<string, string>;
  page: number;
  total: number;
  per: number;
}) {
  const pages = Math.max(1, Math.ceil(total / per));
  if (pages <= 1) return null;

  const link = (p: number) => {
    const sp = new URLSearchParams(params);
    if (p <= 1) sp.delete("page");
    else sp.set("page", String(p));
    const qs = sp.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  };

  return (
    <nav
      aria-label="Pagination"
      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", marginTop: "1.25rem" }}
    >
      {page > 1 ? (
        <Link href={link(page - 1)} className="btn-ghost" style={{ fontSize: ".82rem" }}>
          <i className="fas fa-chevron-left" /> Prev
        </Link>
      ) : (
        <span className="btn-ghost" style={{ fontSize: ".82rem", opacity: 0.4, pointerEvents: "none" }}>
          <i className="fas fa-chevron-left" /> Prev
        </span>
      )}
      <span style={{ fontSize: ".82rem", color: "var(--mut)" }}>
        Page {page} of {pages}
      </span>
      {page < pages ? (
        <Link href={link(page + 1)} className="btn-ghost" style={{ fontSize: ".82rem" }}>
          Next <i className="fas fa-chevron-right" />
        </Link>
      ) : (
        <span className="btn-ghost" style={{ fontSize: ".82rem", opacity: 0.4, pointerEvents: "none" }}>
          Next <i className="fas fa-chevron-right" />
        </span>
      )}
    </nav>
  );
}
