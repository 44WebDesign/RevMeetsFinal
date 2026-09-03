"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ProfileCompletion as Completion } from "@/lib/profileCompletion";

const DISMISS_KEY = "revmeet_profile_nudge_dismissed";

// Endowed-progress nudge: shows how complete the member's profile is, the next
// action to take, and a checklist. Hidden once complete or dismissed.
export function ProfileCompletion({ completion }: { completion: Completion }) {
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      /* storage blocked — just show it */
    }
  }, []);

  if (completion.percent >= 100 || dismissed) return null;

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="card-surface" style={{ padding: "1.25rem 1.5rem", marginBottom: "2rem", position: "relative" }}>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        style={{ position: "absolute", top: ".75rem", right: ".9rem", background: "none", border: "none", color: "var(--mut)", cursor: "pointer", fontSize: ".9rem" }}
      >
        <i className="fas fa-xmark" />
      </button>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h3 className="hd" style={{ fontSize: "1.25rem", marginBottom: ".15rem" }}>
            <i className="fas fa-circle-user" style={{ color: "var(--or)", marginRight: 8 }} />
            Complete your profile
          </h3>
          <p style={{ fontSize: ".85rem", color: "var(--mut)" }}>
            You&apos;re <strong style={{ color: "var(--txt)" }}>{completion.percent}%</strong> there — {completion.total - completion.done} quick step{completion.total - completion.done === 1 ? "" : "s"} to go.
          </p>
        </div>
        {completion.nextStep && (
          <Link href={completion.nextStep.href!} className="btn-or">
            {completion.nextStep.label} <i className="fas fa-arrow-right" style={{ fontSize: ".7rem" }} />
          </Link>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ height: 8, borderRadius: 4, background: "var(--bdr)", overflow: "hidden", margin: "1rem 0 .5rem" }}>
        <div style={{ height: "100%", width: `${completion.percent}%`, background: "var(--or)", borderRadius: 4, transition: "width .4s" }} />
      </div>

      <button
        onClick={() => setOpen((o) => !o)}
        style={{ background: "none", border: "none", color: "var(--mut)", cursor: "pointer", fontSize: ".78rem", padding: 0 }}
      >
        {open ? "Hide" : "Show"} checklist <i className={`fas fa-chevron-${open ? "up" : "down"}`} style={{ fontSize: ".65rem" }} />
      </button>

      {open && (
        <ul style={{ listStyle: "none", padding: 0, margin: ".75rem 0 0", display: "flex", flexDirection: "column", gap: ".5rem" }}>
          {completion.steps.map((s) => (
            <li key={s.key} style={{ display: "flex", alignItems: "center", gap: ".6rem", fontSize: ".85rem" }}>
              <i
                className={`fas ${s.done ? "fa-circle-check" : "fa-circle"}`}
                style={{ color: s.done ? "#4CAF50" : "var(--bdr2)", fontSize: s.done ? ".9rem" : ".85rem" }}
              />
              {s.done || !s.href ? (
                <span style={{ color: s.done ? "var(--mut)" : "var(--txt)", textDecoration: s.done ? "line-through" : "none" }}>{s.label}</span>
              ) : (
                <Link href={s.href} style={{ color: "var(--txt)", textDecoration: "none" }}>
                  {s.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
