"use client";

import { AMENITIES } from "@/lib/amenities";

// Toggleable amenity chips used in the venue and event forms.
// `value` is the array of selected amenity keys.
export function AmenityPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (keys: string[]) => void;
}) {
  function toggle(key: string) {
    onChange(
      value.includes(key) ? value.filter((k) => k !== key) : [...value, key],
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
        gap: ".5rem",
      }}
    >
      {AMENITIES.map((a) => {
        const active = value.includes(a.key);
        return (
          <button
            type="button"
            key={a.key}
            onClick={() => toggle(a.key)}
            aria-pressed={active}
            style={{
              display: "flex",
              alignItems: "center",
              gap: ".55rem",
              padding: ".5rem .7rem",
              borderRadius: 6,
              cursor: "pointer",
              textAlign: "left",
              background: active ? "rgba(255,95,31,.1)" : "var(--bg)",
              border: `1px solid ${active ? "var(--or)" : "var(--bdr2)"}`,
              color: active ? "#fff" : "var(--mut)",
              transition: "all .15s",
              fontSize: ".8rem",
              fontWeight: 600,
            }}
          >
            <i
              className={`fas ${active ? "fa-circle-check" : a.icon}`}
              style={{ color: active ? "var(--or)" : "inherit", width: 16, textAlign: "center" }}
            />
            {a.label}
          </button>
        );
      })}
    </div>
  );
}
