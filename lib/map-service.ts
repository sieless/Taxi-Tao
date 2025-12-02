// lib/map-service.ts
/**
 * Map service utilities for displaying maps and routes
 * This is a foundation - you can integrate Google Maps, Mapbox, or Leaflet
 */

export interface MapConfig {
  center: { lat: number; lng: number };
  zoom: number;
  apiKey?: string;
}

export interface MarkerConfig {
  position: { lat: number; lng: number };
  title: string;
  icon?: string;
  color?: string;
}

/**
 * Geocode an address to coordinates (placeholder - implement with actual API)
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  // TODO: Implement with Google Geocoding API or similar
  // For now, return null
  console.warn('Geocoding not implemented. Address:', address);
  return null;
}

/**
 * Get directions between two points (placeholder)
 */
export async function getDirections(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<any> {
  // TODO: Implement with Google Directions API or similar
  console.warn('Directions API not implemented');
  return null;
}

/**
 * Format distance for display
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

/**
 * Format ETA for display
 */
export function formatETA(minutes: number): string {
  if (minutes < 1) {
    return 'Arriving now';
  }
  if (minutes === 1) {
    return '1 min';
  }
  if (minutes < 60) {
    return `${minutes} mins`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}

/**
 * Get default map configuration
 */
export function getDefaultMapConfig(center?: { lat: number; lng: number }): MapConfig {
  return {
    center: center || { lat: -1.286389, lng: 36.817223 }, // Nairobi, Kenya
    zoom: 13,
  };
}

/**
 * Create marker configurations for pickup and destination
 */
export function createRouteMarkers(
  pickup: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  driverLocation?: { lat: number; lng: number }
): MarkerConfig[] {
  const markers: MarkerConfig[] = [
    {
      position: pickup,
      title: 'Pickup Location',
      color: 'green',
    },
    {
      position: destination,
      title: 'Destination',
      color: 'red',
    },
  ];

  if (driverLocation) {
    markers.push({
      position: driverLocation,
      title: 'Driver',
      color: 'blue',
      icon: 'car',
    });
  }

  return markers;
}

/**
 * Calculate map bounds to fit all markers
 */
export function calculateBounds(markers: MarkerConfig[]): {
  north: number;
  south: number;
  east: number;
  west: number;
} {
  if (markers.length === 0) {
    return { north: 0, south: 0, east: 0, west: 0 };
  }

  let north = markers[0].position.lat;
  let south = markers[0].position.lat;
  let east = markers[0].position.lng;
  let west = markers[0].position.lng;

  markers.forEach((marker) => {
    north = Math.max(north, marker.position.lat);
    south = Math.min(south, marker.position.lat);
    east = Math.max(east, marker.position.lng);
    west = Math.min(west, marker.position.lng);
  });

  // Add padding
  const latPadding = (north - south) * 0.1 || 0.01;
  const lngPadding = (east - west) * 0.1 || 0.01;

  return {
    north: north + latPadding,
    south: south - latPadding,
    east: east + lngPadding,
    west: west - lngPadding,
  };
}
