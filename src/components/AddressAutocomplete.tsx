"use client";

import { useEffect, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";

const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export type PlaceResult = {
  label: string; // formatted address (address mode) or town name (city mode)
  city: string;
  region: string;
  postcode: string;
  lat: number | null;
  lng: number | null;
};

type Props = {
  value: string;
  onChange: (text: string) => void;
  onSelect: (r: PlaceResult) => void;
  placeholder?: string;
  /** "city" → town/city suggestions; "address" → full street addresses. */
  mode?: "city" | "address";
  required?: boolean;
  id?: string;
};

function round(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

// A single text input that upgrades into a Google Places autocomplete when
// NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set, and otherwise stays a plain text
// field (so every location input still works with no key configured).
//
// Cost control: the classic `Autocomplete` widget manages a session token
// internally, so the keystrokes-while-typing + the final place lookup are
// billed as ONE session rather than per keystroke. Results are restricted to
// the UK (country: "gb").
export function AddressAutocomplete({ value, onChange, onSelect, placeholder, mode = "city", required, id }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!GOOGLE_KEY || !inputRef.current) return;
    let cancelled = false;
    let ac: google.maps.places.Autocomplete | null = null;
    let listener: google.maps.MapsEventListener | null = null;

    const loader = new Loader({ apiKey: GOOGLE_KEY, version: "weekly" });
    loader
      .importLibrary("places")
      .then(() => {
        if (cancelled || !inputRef.current) return;
        ac = new google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: "gb" },
          fields: ["address_components", "geometry", "formatted_address", "name"],
          types: mode === "city" ? ["(cities)"] : ["geocode"],
        });
        listener = ac.addListener("place_changed", () => {
          if (!ac) return;
          const place = ac.getPlace();
          const comps = place.address_components ?? [];
          const get = (type: string) => comps.find((c) => c.types.includes(type))?.long_name ?? "";
          const city = get("postal_town") || get("locality") || get("administrative_area_level_3");
          const region = get("administrative_area_level_2") || get("administrative_area_level_1");
          const postcode = get("postal_code");
          const loc = place.geometry?.location;
          const label = place.formatted_address || place.name || inputRef.current?.value || "";
          onSelectRef.current({
            label,
            city: city || label,
            region,
            postcode,
            lat: loc ? round(loc.lat()) : null,
            lng: loc ? round(loc.lng()) : null,
          });
        });
      })
      .catch((err) => console.error("[address-autocomplete] failed to load:", err));

    return () => {
      cancelled = true;
      if (listener) listener.remove();
      if (ac) google.maps.event.clearInstanceListeners(ac);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  return (
    <input
      ref={inputRef}
      id={id}
      className="field-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      // Stop Enter (used to pick a suggestion) from submitting the whole form.
      onKeyDown={(e) => {
        if (e.key === "Enter") e.preventDefault();
      }}
      placeholder={placeholder}
      required={required}
      autoComplete="off"
    />
  );
}
