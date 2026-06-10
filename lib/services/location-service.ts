// lib/services/location-service.ts

import { doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

export interface Coords {
  lat: number;
  lng: number;
}

/**
 * HAIVERSINE FORMULA (FREE)
 * Calculate distance between two coordinates in kilometers
 */
export function calculateDistance(origin: Coords, destination: Coords): number {
  const R = 6371; // Earth's radius in km
  const toRad = (deg: number) => deg * (Math.PI / 180);
  
  const dLat = toRad(destination.lat - origin.lat);
  const dLon = toRad(destination.lng - origin.lng);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(origin.lat)) *
    Math.cos(toRad(destination.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Round to 1 decimal
}

/**
 * FIRESTORE UPDATE
 * Standardized driver location update in the booking request
 */
export async function updateDriverLocationInBooking(
  bookingId: string, 
  coords: Coords,
  accuracy?: number
): Promise<void> {
  try {
    const bookingRef = doc(db, 'bookingRequests', bookingId);
    await updateDoc(bookingRef, {
      driverLocation: {
        lat: coords.lat,
        lng: coords.lng,
        accuracy: accuracy || null,
        lastUpdated: serverTimestamp(),
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error('Firestore location update failed for booking:', error);
    }
    throw error;
  }
}

/**
 * BROWSER GEOLOCATION
 * Wrapper for getting current position
 */
export function getCurrentPosition(): Promise<Coords & { accuracy?: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy
      }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

/**
 * BROWSER WATCH
 * Wrapper for watching position
 */
export function watchPosition(
  onUpdate: (coords: Coords & { accuracy?: number }) => void,
  onError?: (error: GeolocationPositionError) => void
): number {
  return navigator.geolocation.watchPosition(
    (pos) => onUpdate({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy
    }),
    (err) => onError?.(err),
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
  );
}


