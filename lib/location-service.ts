// lib/location-service.ts
import { doc, updateDoc, serverTimestamp, GeoPoint } from 'firebase/firestore';
import { db } from './firebase';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

/**
 * Updates driver's current location in Firestore
 */
export async function updateDriverLocation(
  bookingId: string,
  location: LocationData
): Promise<void> {
  try {
    const bookingRef = doc(db, 'bookingRequests', bookingId);
    
    await updateDoc(bookingRef, {
      'driverLocation.lat': location.latitude,
      'driverLocation.lng': location.longitude,
      'driverLocation.accuracy': location.accuracy || null,
      'driverLocation.lastUpdated': serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating driver location:', error);
    throw error;
  }
}

/**
 * Starts watching driver's location and updates Firestore
 * Returns the watchId to stop tracking later
 */
export function startLocationTracking(
  bookingId: string,
  onError?: (error: GeolocationPositionError) => void
): number | null {
  if (!navigator.geolocation) {
    console.error('Geolocation not supported');
    return null;
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const location: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };

      updateDriverLocation(bookingId, location).catch((error) => {
        console.error('Failed to update location:', error);
      });
    },
    (error) => {
      console.error('Geolocation error:', error);
      if (onError) onError(error);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000, // Cache position for max 5 seconds
    }
  );

  return watchId;
}

/**
 * Stops location tracking
 */
export function stopLocationTracking(watchId: number): void {
  if (navigator.geolocation && watchId) {
    navigator.geolocation.clearWatch(watchId);
  }
}

/**
 * Gets current position once (for initial positioning)
 */
export function getCurrentPosition(): Promise<LocationData> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

/**
 * Calculate estimated time of arrival in minutes
 * Assumes average speed of 40 km/h
 */
export function calculateETA(distanceKm: number, averageSpeedKmh: number = 40): number {
  const hours = distanceKm / averageSpeedKmh;
  const minutes = Math.round(hours * 60);
  return minutes;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
