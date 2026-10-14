// lib/locations.ts

/**
 * Standard operational locations used throughout the app.
 * STRICT SERVICE AREAS: Kericho, Machakos, Kitui, Kajiado, Nairobi, Makueni.
 */
export const KENYA_LOCATIONS = [
  'Nairobi',
  'Machakos',
  'Kericho',
  'Kitui',
  'Kajiado',
  'Makueni',
  'Athi River',
  'Mlolongo',
  'Syokimau',
  'Kitengela',
  'Ngong',
  'Ongata Rongai',
  'Kiserian',
  'Kapkatet',
  'Litein',
  'Kipkelion',
  'Londiani',
  'Masii',
  'Kangundo',
  'Tala',
  'Kathiani',
  'Mwingi',
  'Wote',
  'Makindu',
  'Kibwezi',
  'Mtito Andei',
  'Emali',
  'Sultan Hamud',
  'Westlands',
  'Kilimani',
  'Karen',
].sort();

/**
 * Normalizes a location string for consistent storage and comparison
 * - Trims whitespace
 * - Capitalizes first letter of each word
 * - Handles hyphenated names
 */
export function normalizeLocation(location: string): string {
  if (!location) return '';
  
  return location
    .trim()
    .split(/[\s-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Validates if a location string is reasonable
 * - Not empty
 * - Not too short (min 2 chars)
 * - Not too long (max 50 chars)
 * - Contains only letters, spaces, hyphens, apostrophes
 */
export function isValidLocation(location: string): boolean {
  if (!location || location.trim().length < 2) return false;
  if (location.length > 50) return false;
  
  // Allow letters, spaces, hyphens, and apostrophes only
  const validPattern = /^[a-zA-Z\s'-]+$/;
  return validPattern.test(location);
}

/**
 * Checks if a location is in the predefined list (case-insensitive)
 */
export function isKnownLocation(location: string): boolean {
  const normalized = normalizeLocation(location);
  return KENYA_LOCATIONS.some(loc => 
    loc.toLowerCase() === normalized.toLowerCase()
  );
}
