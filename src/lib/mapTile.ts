import type { MapPoint } from "@/components/MapView";

// Shared "mini list-tile" popup markup, used by both the Leaflet and Google
// Maps map implementations. Self-contained (its own dark background + radius)
// so it looks right inside either a Leaflet popup or a Google InfoWindow.

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function hexToRgba(hex: string, alpha: number): string {
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export function mapTileHtml(p: MapPoint): string {
  const label = p.kind === "venue" ? "Venue" : p.type.replace(/_/g, " ");
  const icon = p.kind === "venue" ? "fa-warehouse" : "fa-calendar-alt";
  const cover = p.imageUrl
    ? `background-image:linear-gradient(rgba(0,0,0,.15),rgba(0,0,0,.35)),url('${encodeURI(p.imageUrl)}');background-size:cover;background-position:center`
    : `background:radial-gradient(circle at 30% 25%, ${hexToRgba(p.color, 0.32)}, transparent 62%), linear-gradient(135deg,#171717,#0c0c0c)`;

  return `
    <div style="width:224px;font-family:Inter,sans-serif;background:#131313;border-radius:10px;overflow:hidden">
      <div style="height:104px;position:relative;${cover}">
        <span style="position:absolute;top:8px;left:8px;background:${p.color};color:#fff;font-size:.58rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:2px 9px;border-radius:100px">${escapeHtml(label)}</span>
        ${p.imageUrl ? "" : `<i class="fas ${icon}" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:1.6rem;color:${p.color};opacity:.3"></i>`}
      </div>
      <div style="padding:.7rem .8rem">
        <div style="font-weight:700;font-size:.9rem;line-height:1.25;color:#f5f5f5;margin-bottom:.2rem">${escapeHtml(p.title)}</div>
        ${p.subtitle ? `<div style="font-size:.75rem;color:#9a9a9a;margin-bottom:.65rem"><i class="fas ${icon}" style="margin-right:4px"></i>${escapeHtml(p.subtitle)}</div>` : `<div style="height:.4rem"></div>`}
        <a href="${p.href}" style="display:block;text-align:center;background:${hexToRgba(p.color, 0.14)};border:1px solid ${hexToRgba(p.color, 0.5)};color:${p.color};padding:.45rem;border-radius:6px;font-size:.76rem;font-weight:700;text-decoration:none">
          View ${p.kind === "venue" ? "venue" : "event"} &rarr;
        </a>
      </div>
    </div>`;
}
