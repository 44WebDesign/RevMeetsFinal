// Injects a Schema.org JSON-LD block. Server-rendered into the page <head>/body
// so search engines (Google in particular) can read structured data for rich
// results — event listings, organisations and places.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Content is our own server-built object, not user-controlled HTML.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
