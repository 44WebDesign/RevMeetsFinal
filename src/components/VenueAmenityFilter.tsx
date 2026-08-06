"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AmenityFilter } from "./AmenityFilter";
import { parseAmenityParam } from "@/lib/amenities";

// Amenity filter for the venues directory — instant apply via URL params so
// the server-rendered list refreshes with each toggle.
export function VenueAmenityFilter() {
  const router = useRouter();
  const sp = useSearchParams();
  const selected = parseAmenityParam(sp.get("amenities"));

  function update(keys: string[]) {
    const params = new URLSearchParams(sp.toString());
    if (keys.length) params.set("amenities", keys.join(","));
    else params.delete("amenities");
    router.push(`/venues?${params.toString()}`);
  }

  return (
    <div style={{ marginBottom: "2rem" }}>
      <label className="field-label" style={{ marginBottom: ".5rem" }}>
        Filter by amenities{selected.length > 0 && (
          <span style={{ color: "var(--or)" }}> · {selected.length} selected</span>
        )}
      </label>
      <AmenityFilter value={selected} onChange={update} />
    </div>
  );
}
