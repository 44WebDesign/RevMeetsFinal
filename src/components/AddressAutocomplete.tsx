"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

type Suggestion = {
  id: string;
  main: string;
  secondary: string;
  prediction: google.maps.places.PlacePrediction;
};

function round(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

// A text input backed by the Google **Places API (New)** autocomplete, used on
// every location field. It renders its own dark suggestion dropdown (rather than
// the classic widget) so it works with projects that only enabled "Places API
// (New)". Results are UK-restricted.
//
// Cost control: a single `AutocompleteSessionToken` is reused across the
// keystroke queries and the closing `fetchFields` lookup, so each address entry
// is billed as ONE session, not per keystroke; a fresh token is minted after
// each selection.
//
// With no NEXT_PUBLIC_GOOGLE_MAPS_API_KEY the component is just a plain text
// input, so every form still works unconfigured.
export function AddressAutocomplete({ value, onChange, onSelect, placeholder, mode = "city", required, id }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const readyRef = useRef(false);
  const tokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const skipNextFetch = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!GOOGLE_KEY) return;
    let cancelled = false;
    new Loader({ apiKey: GOOGLE_KEY, version: "weekly" })
      .importLibrary("places")
      .then(() => {
        if (!cancelled) readyRef.current = true;
      })
      .catch((err) => console.error("[address-autocomplete] places load failed:", err));
    return () => {
      cancelled = true;
    };
  }, []);

  const runSearch = useCallback(
    async (input: string) => {
      if (!readyRef.current || input.trim().length < 2) {
        setSuggestions([]);
        setOpen(false);
        return;
      }
      try {
        if (!tokenRef.current) tokenRef.current = new google.maps.places.AutocompleteSessionToken();
        const request: google.maps.places.AutocompleteRequest = {
          input,
          sessionToken: tokenRef.current,
          includedRegionCodes: ["gb"],
          ...(mode === "city" ? { includedPrimaryTypes: ["locality", "postal_town", "administrative_area_level_3"] } : {}),
        };
        const { suggestions: res } = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
        const mapped: Suggestion[] = res
          .map((s) => s.placePrediction)
          .filter((p): p is google.maps.places.PlacePrediction => !!p)
          .map((p) => ({
            id: p.placeId,
            main: p.mainText?.text ?? p.text.text,
            secondary: p.secondaryText?.text ?? "",
            prediction: p,
          }));
        setSuggestions(mapped);
        setOpen(mapped.length > 0);
        setHighlight(-1);
      } catch (err) {
        console.error("[address-autocomplete] fetch failed:", err);
        setSuggestions([]);
        setOpen(false);
      }
    },
    [mode],
  );

  useEffect(() => {
    if (!GOOGLE_KEY) return;
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(value), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, runSearch]);

  const choose = useCallback(async (s: Suggestion) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setOpen(false);
    setSuggestions([]);
    skipNextFetch.current = true;
    try {
      const place = s.prediction.toPlace();
      await place.fetchFields({ fields: ["location", "formattedAddress", "addressComponents", "displayName"] });
      tokenRef.current = null; // session closed — mint a fresh token next time
      const comps = place.addressComponents ?? [];
      const get = (t: string) => comps.find((c) => c.types.includes(t))?.longText ?? "";
      const city = get("postal_town") || get("locality") || get("administrative_area_level_3");
      const region = get("administrative_area_level_2") || get("administrative_area_level_1");
      const postcode = get("postal_code");
      const loc = place.location;
      const label = place.formattedAddress || place.displayName || s.main;
      onSelectRef.current({
        label,
        city: city || place.displayName || s.main,
        region,
        postcode,
        lat: loc ? round(loc.lat()) : null,
        lng: loc ? round(loc.lng()) : null,
      });
    } catch (err) {
      console.error("[address-autocomplete] details failed:", err);
      onSelectRef.current({ label: s.main, city: s.main, region: "", postcode: "", lat: null, lng: null });
    }
  }, []);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) {
      if (e.key === "Enter") e.preventDefault();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const s = suggestions[highlight] ?? suggestions[0];
      if (s) choose(s);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <input
        id={id}
        className="field-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
      />
      {open && suggestions.length > 0 && (
        <ul
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 2px)",
            left: 0,
            right: 0,
            zIndex: 2000,
            margin: 0,
            padding: 0,
            listStyle: "none",
            background: "#161616",
            border: "1px solid var(--bdr2)",
            borderRadius: 8,
            boxShadow: "0 12px 30px rgba(0,0,0,.55)",
            overflow: "hidden",
          }}
        >
          {suggestions.map((s, i) => (
            <li
              key={s.id}
              role="option"
              aria-selected={i === highlight}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(s);
              }}
              onMouseEnter={() => setHighlight(i)}
              style={{
                padding: ".5rem .7rem",
                cursor: "pointer",
                borderTop: i ? "1px solid var(--bdr)" : "none",
                background: i === highlight ? "rgba(255,95,31,.1)" : "transparent",
              }}
            >
              <div style={{ color: "#f5f5f5", fontSize: ".9rem" }}>{s.main}</div>
              {s.secondary && <div style={{ color: "var(--mut)", fontSize: ".75rem" }}>{s.secondary}</div>}
            </li>
          ))}
          <li style={{ padding: ".3rem .7rem", fontSize: ".62rem", color: "var(--mut2)", textAlign: "right", borderTop: "1px solid var(--bdr)" }}>
            powered by Google
          </li>
        </ul>
      )}
    </div>
  );
}
