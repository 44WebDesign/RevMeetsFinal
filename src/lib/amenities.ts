// Amenity catalog. Stored on venues and events as a comma-separated string of
// the keys below. Legacy free-text values (from before the catalog existed)
// are matched by label where possible and otherwise shown as-is with a
// generic icon, so old data keeps displaying until it's next saved.

export type Amenity = {
  key: string;
  label: string;
  icon: string; // Font Awesome class
};

export const AMENITIES: Amenity[] = [
  { key: "PARKING", label: "Parking", icon: "fa-square-parking" },
  { key: "EV_CHARGING", label: "EV Charging", icon: "fa-charging-station" },
  { key: "FOOD", label: "Hot Food", icon: "fa-burger" },
  { key: "COFFEE", label: "Coffee & Soft Drinks", icon: "fa-mug-saucer" },
  { key: "DRINKS", label: "Alcoholic Drinks", icon: "fa-beer-mug-empty" },
  { key: "TOILETS", label: "Toilets", icon: "fa-restroom" },
  { key: "ACCESSIBLE", label: "Wheelchair Accessible", icon: "fa-wheelchair" },
  { key: "KIDS_AREA", label: "Kids Area", icon: "fa-children" },
  { key: "PET_FRIENDLY", label: "Pet Friendly", icon: "fa-paw" },
  { key: "SMOKING", label: "Smoking Area", icon: "fa-smoking" },
  { key: "INDOOR", label: "Indoor Space", icon: "fa-warehouse" },
  { key: "FLOODLIGHTS", label: "Floodlights", icon: "fa-lightbulb" },
  { key: "WIFI", label: "Wi-Fi", icon: "fa-wifi" },
  { key: "CAMPING", label: "Camping", icon: "fa-campground" },
  { key: "SHOWERS", label: "Showers", icon: "fa-shower" },
  { key: "FIRST_AID", label: "First Aid", icon: "fa-kit-medical" },
  { key: "SECURITY", label: "Security", icon: "fa-shield-halved" },
  { key: "TRADE_STANDS", label: "Trade Stands", icon: "fa-store" },
  { key: "LIVE_MUSIC", label: "Live Music / DJ", icon: "fa-music" },
  { key: "TRACK_ACCESS", label: "Track Access", icon: "fa-flag-checkered" },
  { key: "PADDOCK", label: "Paddock / Pits", icon: "fa-car-side" },
  { key: "DYNO", label: "Dyno", icon: "fa-gauge-high" },
];

const BY_KEY = new Map(AMENITIES.map((a) => [a.key, a]));
const BY_LABEL = new Map(AMENITIES.map((a) => [a.label.toLowerCase(), a]));

export type ResolvedAmenity = Amenity & { known: boolean };

// "PARKING,FOOD" (or legacy "Parking, Catering") → display list.
export function parseAmenities(stored: string | null | undefined): ResolvedAmenity[] {
  if (!stored) return [];
  const out: ResolvedAmenity[] = [];
  const seen = new Set<string>();
  for (const raw of stored.split(",")) {
    const token = raw.trim();
    if (!token) continue;
    const match = BY_KEY.get(token.toUpperCase()) ?? BY_LABEL.get(token.toLowerCase());
    const item: ResolvedAmenity = match
      ? { ...match, known: true }
      : { key: token, label: token, icon: "fa-circle-check", known: false };
    if (!seen.has(item.key)) {
      seen.add(item.key);
      out.push(item);
    }
  }
  return out;
}

// Same input → canonical key array (unknown legacy tokens dropped).
export function amenityKeys(stored: string | null | undefined): string[] {
  return parseAmenities(stored)
    .filter((a) => a.known)
    .map((a) => a.key);
}

// Key array → stored string.
export function serializeAmenities(keys: string[]): string {
  return keys.filter((k) => BY_KEY.has(k)).join(",");
}

// Human-readable labels (for structured data etc.).
export function amenityLabels(stored: string | null | undefined): string[] {
  return parseAmenities(stored).map((a) => a.label);
}
