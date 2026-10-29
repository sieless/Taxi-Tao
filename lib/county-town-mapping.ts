/**
 * County and Town Mapping Utilities for TaxiTao
 * Provides bidirectional resolution between Kenyan Counties and Towns/Locations.
 */

import { ALL_KENYA_COUNTIES, KENYA_COUNTIES } from "./kenya-locations";

export { ALL_KENYA_COUNTIES, KENYA_COUNTIES };

export const KNOWN_TOWN_TO_COUNTY_MAP: Record<string, string> = {
  // Machakos
  "machakos": "Machakos",
  "machakos town": "Machakos",
  "machakos-town": "Machakos",
  "machakos p": "Machakos",
  "athi river": "Machakos",
  "kyumvi": "Machakos",
  "kyumvi junction": "Machakos",
  "chumvi": "Machakos",
  "mlolongo": "Machakos",
  "syokimau": "Machakos",
  "tala": "Machakos",
  "kangundo": "Machakos",
  "katumani": "Machakos",
  "mutituni": "Machakos",
  "koma": "Machakos",
  "matuu": "Machakos",
  "mitaboni": "Machakos",
  "katoloni": "Machakos",
  "mumbuni": "Machakos",

  // Nairobi
  "nairobi": "Nairobi",
  "nairobi cbd": "Nairobi",
  "westlands": "Nairobi",
  "utawala": "Nairobi",
  "embakasi": "Nairobi",
  "eastleigh": "Nairobi",
  "karen": "Nairobi",
  "kasarani": "Nairobi",
  "roysambu": "Nairobi",
  "kilimani": "Nairobi",
  "langata": "Nairobi",
  "buruburu": "Nairobi",
  "donholm": "Nairobi",
  "pipeline": "Nairobi",
  "umoja": "Nairobi",

  // Kericho
  "kericho": "Kericho",
  "kericho town": "Kericho",
  "kericho-town": "Kericho",
  "litein": "Kericho",
  "kapsoit": "Kericho",
  "kipkelion": "Kericho",
  "londiani": "Kericho",

  // Kajiado
  "ngong": "Kajiado",
  "kitengela": "Kajiado",
  "ongata rongai": "Kajiado",
  "rongai": "Kajiado",
  "kiserian": "Kajiado",
  "kajiado": "Kajiado",
  "kajiado town": "Kajiado",
  "namanga": "Kajiado",

  // Kitui
  "kitui": "Kitui",
  "kitui town": "Kitui",
  "mwingi": "Kitui",
  "mutomo": "Kitui",

  // Kiambu
  "thika": "Kiambu",
  "kiambu": "Kiambu",
  "kikuyu": "Kiambu",
  "ruiru": "Kiambu",
  "limuru": "Kiambu",
  "ruaka": "Kiambu",
  "juja": "Kiambu",
  "githurai": "Kiambu",

  // Mombasa
  "mombasa": "Mombasa",
  "nyali": "Mombasa",
  "bamburi": "Mombasa",
  "changamwe": "Mombasa",
  "likoni": "Mombasa",
  "mvita": "Mombasa",

  // Nakuru
  "nakuru": "Nakuru",
  "nakuru town": "Nakuru",
  "naivasha": "Nakuru",
  "gilgil": "Nakuru",
  "molo": "Nakuru",

  // Uasin Gishu
  "eldoret": "Uasin Gishu",
  "eldoret town": "Uasin Gishu",

  // Kisumu
  "kisumu": "Kisumu",
  "kisumu town": "Kisumu",

  // Meru
  "meru": "Meru",
  "meru town": "Meru",
  "maua": "Meru",

  // Nyeri
  "nyeri": "Nyeri",
  "karatina": "Nyeri",
  "othaya": "Nyeri",
};

/**
 * Clean and standardize town names for UI display
 */
export function formatTownName(name?: string | null): string {
  if (!name) return "";
  const cleaned = name
    .trim()
    .replace(/-+/g, " ")
    .replace(/\s+/g, " ");

  // Title case words
  return cleaned
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Resolves the County of a driver based on explicit county or town/location heuristics
 */
export function resolveDriverCounty(driver: {
  county?: string | null;
  currentLocation?: string | null;
  businessLocation?: string | null;
}): string | null {
  if (driver.county && driver.county.trim()) {
    const rawCounty = driver.county.trim();
    const matched = ALL_KENYA_COUNTIES.find(
      (c) => c.toLowerCase() === rawCounty.toLowerCase()
    );
    if (matched) return matched;
    return formatTownName(rawCounty);
  }

  const loc = (driver.currentLocation || driver.businessLocation || "").toLowerCase().trim();
  if (!loc) return null;

  // Direct town lookup
  if (KNOWN_TOWN_TO_COUNTY_MAP[loc]) {
    return KNOWN_TOWN_TO_COUNTY_MAP[loc];
  }

  // Check if any known town substring matches
  for (const [town, county] of Object.entries(KNOWN_TOWN_TO_COUNTY_MAP)) {
    if (loc.includes(town)) {
      return county;
    }
  }

  // Check if any county name is part of the location string
  for (const county of ALL_KENYA_COUNTIES) {
    if (loc.includes(county.toLowerCase())) {
      return county;
    }
  }

  return null;
}

/**
 * Extracts and cleans the primary location/town of a driver
 */
export function resolveDriverLocation(driver: {
  currentLocation?: string | null;
  businessLocation?: string | null;
}): string | null {
  const loc = driver.currentLocation || driver.businessLocation || "";
  if (!loc.trim()) return null;
  return formatTownName(loc);
}
