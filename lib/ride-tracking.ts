// lib/ride-tracking.ts - Ride status + location tracking utilities

import { 
  doc, 
  updateDoc, 
  Timestamp, 
  getDoc 
} from 'firebase/firestore';

import { db } from './firebase';
import { 
  getCurrentLocation, 
  watchLocation, 
  stopWatchingLocation, 
  calculateETA, 
  calculateDistance 
} from './maps';

// Global tracking references
let locationWatchId: number | null = null;
let locationUpdateInterval: NodeJS.Timeout | null = null;

// Ride statuses
export type RideStatus = 
  'confirmed' | 
  'en_route' | 
  'arrived' | 
  'in_progress' | 
  'completed';

/**
 * Update ride status in Firestore
 */
export async function updateRideStatus(
  bookingId: string,
  newStatus: RideStatus
): Promise<void> {
  try {
    const bookingRef = doc(db, 'bookingRequests', bookingId);

    const updateData: Record<string, unknown> = {
      rideStatus: newStatus,
    };

    const timestamp = Timestamp.now();

    // Timestamp mapping
    const statusTimestamps: Record<RideStatus, string> = {
      confirmed: 'confirmedAt',
      en_route: 'enRouteAt',
      arrived: 'arrivedAt',
      in_progress: 'startedAt',
      completed: 'completedAt',
    };

    updateData[statusTimestamps[newStatus]] = timestamp;

    // Stop tracking on completion
    if (newStatus === 'completed') {
      stopLocationTracking();
    }

    await updateDoc(bookingRef, updateData);

  } catch (error) {
    console.error('Error updating ride status:', error);
    throw error;
  }
}



/**
 * Start tracking driver location + optionally auto-complete when near destination
 */
export async function startLocationTracking(
  bookingId: string,
  destinationCoords?: { lat: number; lng: number },
  onError?: (error: Error) => void
): Promise<void> {
  try {
    // Stop existing tracking session
    stopLocationTracking();

    // Initial location update
    const initialLocation = await getCurrentLocation();
    await updateDriverLocation(bookingId, initialLocation);

    if (destinationCoords) {
      await checkAndAutoComplete(bookingId, initialLocation, destinationCoords);
    }

    // Start 30-second interval tracking
    locationUpdateInterval = setInterval(async () => {
      try {
        const currentLocation = await getCurrentLocation();
        await updateDriverLocation(bookingId, currentLocation);

        if (destinationCoords) {
          await checkAndAutoComplete(bookingId, currentLocation, destinationCoords);
        }
      } catch (e) {
        const err = e as any;
        const errMsg = err?.message || err?.toString?.() || 'Unknown location error';
        console.error('Error updating location:', errMsg, err?.code ? `(code: ${err.code})` : '');
        onError?.(err);
      }
    }, 30_000);

  } catch (e) {
    const err = e as any;
    // GeolocationPositionError has code & message properties
    const errorDetails = {
      message: err?.message || 'Unknown error',
      code: err?.code,
      name: err?.name,
    };
    console.error('Error starting location tracking:', errorDetails);
    onError?.(err);

    // Do NOT throw—tracking isn't critical to continue ride flow
  }
}



/**
 * Stop all background location tracking
 */
export function stopLocationTracking(): void {
  if (locationUpdateInterval) {
    clearInterval(locationUpdateInterval);
    locationUpdateInterval = null;
  }

  if (locationWatchId !== null) {
    stopWatchingLocation(locationWatchId);
    locationWatchId = null;
  }
}



/**
 * Firestore driver location update
 */
async function updateDriverLocation(
  bookingId: string,
  location: { lat: number; lng: number }
): Promise<void> {
  try {
    const bookingRef = doc(db, 'bookingRequests', bookingId);

    await updateDoc(bookingRef, {
      driverLocation: {
        lat: location.lat,
        lng: location.lng,
        lastUpdated: Timestamp.now(),
      },
    });

  } catch (error) {
    console.error('Error updating driver location:', error);
    throw error;
  }
}



/**
 * Calculates ETA – should be called max 3 times per trip (cost control)
 */
export async function calculateAndUpdateETA(
  bookingId: string,
  driverLocation: { lat: number; lng: number },
  destinationAddress: string
): Promise<void> {
  try {
    // TODO: geocode destination → { lat, lng }
    // Placeholder — waiting for your geocoding implementation
    const destinationCoords = driverLocation;

    const eta = await calculateETA(driverLocation, destinationCoords);

    if (!eta) return;

    const bookingRef = doc(db, 'bookingRequests', bookingId);

    await updateDoc(bookingRef, {
      eta: {
        minutes: eta.minutes,
        distance: eta.distance,
        lastCalculated: Timestamp.now(),
      },
    });

  } catch (error) {
    console.error('Error calculating ETA:', error);
    // Don't throw — ETA not mission-critical
  }
}



/**
 * Auto-completes ride if within 100m of destination
 */
async function checkAndAutoComplete(
  bookingId: string,
  driverLocation: { lat: number; lng: number },
  destinationLocation: { lat: number; lng: number }
): Promise<void> {
  try {
    const distanceKm = calculateDistance(driverLocation, destinationLocation);

    // 0.1 km = 100 meters
    if (distanceKm >= 0.1) return;

    console.log(
      `Driver is near destination (${(distanceKm * 1000).toFixed(0)}m). Checking auto-complete...`
    );

    const bookingRef = doc(db, 'bookingRequests', bookingId);
    const snap = await getDoc(bookingRef);

    if (!snap.exists()) return;

    const data = snap.data();

    if (data?.rideStatus === 'in_progress') {
      await updateRideStatus(bookingId, 'completed');
      console.log('Ride auto-completed.');
    }

  } catch (error) {
    console.error('Auto-complete check error:', error);
  }
}
