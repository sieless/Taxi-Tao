// lib/maps.ts - Google Maps utility functions for live tracking

import { Loader } from '@googlemaps/js-api-loader';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const google: any;

let loader: Loader | null = null;

// Initialize Google Maps API Loader
function getLoader() {
  if (!loader) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    if (!apiKey) {
      throw new Error('Google Maps API key not configured');
    }
    loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places', 'geometry']
    });
  }
  return loader;
}

/**
 * Calculate distance between two coordinates in kilometers
 * Uses Haversine formula (no API call - FREE)
 */
export function calculateDistance(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(destination.lat - origin.lat);
  const dLon = toRad(destination.lng - origin.lng);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(origin.lat)) *
    Math.cos(toRad(destination.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate ETA using Google Distance Matrix API
 * Only call this 3 times per trip to minimize costs
 */
export async function calculateETA(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<{ minutes: number; distance: string } | null> {
  try {
    const loader = getLoader();
    await loader.load();
    
    const service = new google.maps.DistanceMatrixService();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await new Promise<any>((resolve, reject) => {
      service.getDistanceMatrix(
        {
          origins: [{ lat: origin.lat, lng: origin.lng }],
          destinations: [{ lat: destination.lat, lng: destination.lng }],
          travelMode: google.maps.TravelMode.DRIVING,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (response: any, status: any) => {
          if (status === 'OK') {
            resolve(response);
          } else {
            reject(new Error(`Distance Matrix API error: ${status}`));
          }
        }
      );
    });
    
    const result = response.rows[0].elements[0];
    
    if (result.status === 'OK') {
      return {
        minutes: Math.ceil(result.duration.value / 60),
        distance: result.distance.text
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error calculating ETA:', error);
    return null;
  }
}

/**
 * Get current device location using browser Geolocation API (FREE)
 * Now includes a fallback to low accuracy if high accuracy fails.
 */
export function getCurrentLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    // --- MOCK LOCATION FOR DEVELOPMENT ---
    if (typeof window !== 'undefined' && localStorage.getItem('use_mock_location') === 'true') {
      console.log('[Maps] Using MOCK location (Nairobi CBD)');
      // Default to Nairobi CBD or a set coordinate
      resolve({ lat: -1.286389, lng: 36.817223 });
      return;
    }
    // --------------------------------------

    if (typeof window === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    const success = (position: GeolocationPosition) => {
      resolve({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
    };

    const error = (err: GeolocationPositionError) => {
      const code = err.code;
      const message = err.message || (
        code === 1 ? 'Permission denied' :
        code === 2 ? 'Position unavailable' :
        code === 3 ? 'Timeout' : 'Unknown error'
      );

      // If high accuracy failed, try one more time with low accuracy
      if (options.enableHighAccuracy) {
        console.warn(`[Maps] High accuracy failed (Code: ${code}, Msg: ${message}). Retrying with low accuracy...`);
        options.enableHighAccuracy = false;
        options.timeout = 15000; // Give it more time
        navigator.geolocation.getCurrentPosition(success, (err2) => {
          const code2 = err2.code;
          const message2 = err2.message || (
            code2 === 1 ? 'Permission denied' :
            code2 === 2 ? 'Position unavailable' :
            code2 === 3 ? 'Timeout' : 'Unknown error'
          );
          console.error(`[Maps] Geolocation failed completely (Code: ${code2}, Msg: ${message2})`);
          reject(err2);
        }, options);
      } else {
        reject(err);
      }
    };

    navigator.geolocation.getCurrentPosition(success, error, options);
  });
}

/**
 * Watch device location and call callback with updates (FREE)
 * Returns a watchId that can be used to stop watching
 */
export function watchLocation(
  callback: (location: { lat: number; lng: number }) => void
): number {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported by this browser');
  }
  
  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      callback({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
    },
    (error) => {
      console.error('Error watching location:', error);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
  
  return watchId;
}

/**
 * Stop watching location
 */
export function stopWatchingLocation(watchId: number): void {
  navigator.geolocation.clearWatch(watchId);
}

/**
 * Format distance for display
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}
