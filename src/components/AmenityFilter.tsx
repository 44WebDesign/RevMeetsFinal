"use client";

import { AMENITIES } from "@/lib/amenities";

// Compact amenity filter chips (multi-select, AND semantics) used in the
// events filter bar, map explorer sidebar and venues directory.
export function AmenityFilter({
  value,
  onChange,
}: {
  value: string[];
  onChange: (keys: string[]) => void;
}) {
  function toggle(key: string) {
    onChange(value.includes(key) ? value.filter((k) => k !== key) : [...value, key]);
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: ".4rem" }}>
      {AMENITIES.map((a) => {
        const active = value.includes(a.key);
        return (
          <button
            type="button"
            key={a.key}
            onClick={() => toggle(a.key)}
            aria-pressed={active}
            className="tag"
            style={{
              borderColor: active ? "var(--or)" : "var(--bdr2)",
              color: active ? "#fff" : "var(--mut)",
              background: active ? "rgba(255,95,31,.15)" : "transparent",
            }}
          >
            <i
              className={`fas ${a.icon}`}
              style={{ marginRight: 5, color: active ? "var(--or)" : "inherit" }}
            />
            {a.label}
          </button>
        );
      })}
    </div>
  );
}
