// lib/location-mapping.ts

/**
 * Mapping of smaller towns (Spokes) to their nearest Major Hubs.
 * This allows the system to suggest drivers going to a major town
 * when a user requests a ride to a nearby smaller town.
 */
export const LOCATION_HUBS: Record<string, string> = {
  // Machakos County
  'masii': 'Machakos Town',
  'wamunyu': 'Machakos Town',
  'kathiani': 'Machakos Town',
  'mitaboni': 'Machakos Town',
  'kangundo': 'Machakos Town',
  'tala': 'Machakos Town',
  'mlolongo': 'Machakos Town',
  'athi river': 'Machakos Town',
  'syokimau': 'Machakos Town',

  // Makueni County
  'wote': 'Makueni',
  'kibwezi': 'Makueni',
  'mtito andei': 'Makueni',
  'emali': 'Makueni',
  'sultan hamud': 'Makueni',

  // Kitui County
  'kitui town': 'Kitui',
  'mwingi': 'Kitui',
  'mutomo': 'Kitui',
  'kwa vonza': 'Kitui',

  // Kiambu County
  'thika': 'Kiambu',
  'ruiru': 'Kiambu',
  'juja': 'Kiambu',
  'kikuyu': 'Kiambu',
  'limuru': 'Kiambu',
  'kiambu town': 'Kiambu',

  // Kajiado County
  'ngong': 'Kajiado',
  'kitengela': 'Kajiado',
  'ongata rongai': 'Kajiado',
  'kiserian': 'Kajiado',
  'namanga': 'Kajiado',

  // Mombasa & Coast
  'mombasa cbd': 'Mombasa',
  'nyali': 'Mombasa',
  'bamburi': 'Mombasa',
  'mtwapa': 'Mombasa',
  'diani': 'Mombasa',
  'ukunda': 'Mombasa',
  'malindi': 'Mombasa',
  'kilifi town': 'Mombasa',

  // Nairobi Environs
  'westlands': 'Nairobi',
  'karen': 'Nairobi',
  'kilimani': 'Nairobi',
  'kasarani': 'Nairobi',
  'embakasi': 'Nairobi',
  'langata': 'Nairobi',
  'nairobi cbd': 'Nairobi',
};

/**
 * Get the major hub for a given location.
 * Returns the hub name if found, otherwise returns null.
 */
export function getNearbyHub(location: string): string | null {
  const normalizedLoc = location.toLowerCase().trim();
  return LOCATION_HUBS[normalizedLoc] || null;
}
