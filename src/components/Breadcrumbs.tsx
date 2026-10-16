import Link from "next/link";

export type Crumb = { label: string; href?: string };

// Simple breadcrumb trail. The last item is the current page (no link).
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" style={{ marginBottom: "1rem" }}>
      <ol
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: ".4rem",
          listStyle: "none",
          padding: 0,
          margin: 0,
          fontSize: ".78rem",
          color: "var(--mut)",
        }}
      >
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} style={{ display: "inline-flex", alignItems: "center", gap: ".4rem", minWidth: 0 }}>
              {c.href && !last ? (
                <Link href={c.href} style={{ color: "var(--mut)", textDecoration: "none" }} className="crumb-link">
                  {c.label}
                </Link>
              ) : (
                <span style={{ color: last ? "var(--txt)" : "var(--mut)", fontWeight: last ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 240 }} aria-current={last ? "page" : undefined}>
                  {c.label}
                </span>
              )}
              {!last && <i className="fas fa-chevron-right" style={{ fontSize: ".6rem", opacity: 0.6 }} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// schema.org BreadcrumbList for the items that have a URL.
export function breadcrumbLd(items: Crumb[], base: (path: string) => string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: base(c.href) } : {}),
    })),
  };
}
