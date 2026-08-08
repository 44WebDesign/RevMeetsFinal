"use client";

import { useState } from "react";

export function ShareBar({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        /* user cancelled */
      }
    } else {
      copy();
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  const enc = encodeURIComponent(url);
  const encT = encodeURIComponent(title);
  const links: { label: string; icon: string; href: string; color: string }[] = [
    { label: "WhatsApp", icon: "fa-whatsapp", href: `https://wa.me/?text=${encT}%20${enc}`, color: "#25D366" },
    { label: "X", icon: "fa-x-twitter", href: `https://twitter.com/intent/tweet?text=${encT}&url=${enc}`, color: "#fff" },
    { label: "Facebook", icon: "fa-facebook-f", href: `https://www.facebook.com/sharer/sharer.php?u=${enc}`, color: "#1877F2" },
  ];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: ".4rem", flexWrap: "wrap" }}>
      <button onClick={nativeShare} className="btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: ".4rem" }}>
        <i className="fas fa-share-nodes" /> Share
      </button>
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${l.label}`}
          className="soc-share"
          style={{ width: 34, height: 34, borderRadius: 6, border: "1px solid var(--bdr2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--mut)", textDecoration: "none" }}
        >
          <i className={`fab ${l.icon}`} />
        </a>
      ))}
      <button onClick={copy} aria-label="Copy link" className="soc-share" style={{ width: 34, height: 34, borderRadius: 6, border: "1px solid var(--bdr2)", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: copied ? "#4CAF50" : "var(--mut)", cursor: "pointer" }}>
        <i className={`fas ${copied ? "fa-check" : "fa-link"}`} />
      </button>
    </div>
  );
}
