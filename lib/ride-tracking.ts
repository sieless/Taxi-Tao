// lib/ride-tracking.ts - Ride status + location tracking utilities

import { 
  doc, 
  updateDoc, 
  Timestamp, 
  getDoc 
} from 'firebase/firestore';

import { db } from './firebase';

import { logError } from "@/lib/logger";
import { 
  getCurrentPosition, 
  watchPosition,
  calculateDistance
} from './services/location-service';

// Global tracking references
let locationWatchId: number | null = null;
let locationUpdateInterval: NodeJS.Timeout | null = null;

// Ride statuses
export type RideStatus = 
  'confirmed' | 
  'en_route' | 
  'arrived' | 
  'in_progress' | 
  'completed' |
  'cancelled';

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
      cancelled: 'cancelledAt',
    };

    updateData[statusTimestamps[newStatus]] = timestamp;

    // Stop tracking on completion
    if (newStatus === 'completed') {
      stopLocationTracking();
    }

    await updateDoc(bookingRef, updateData);

  } catch (error) {
    logError("ride-tracking", error);
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

    if (typeof window !== 'undefined' && !navigator.geolocation) {
      const noGeoErr = new Error('Geolocation is not supported by this browser or environment.');
      logError("ride-tracking", noGeoErr);
      if (onError) onError(noGeoErr);
      return;
    }

    // Initial location update
    const initialLocation = await getCurrentPosition();
    await updateDriverLocation(bookingId, initialLocation);

    if (destinationCoords) {
      await checkAndAutoComplete(bookingId, initialLocation, destinationCoords);
    }

    let lastErrCode: number | string | null = null;

    // Start 30-second interval tracking
    locationUpdateInterval = setInterval(async () => {
      try {
        const currentLocation = await getCurrentPosition();
        await updateDriverLocation(bookingId, currentLocation);

        if (destinationCoords) {
          await checkAndAutoComplete(bookingId, currentLocation, destinationCoords);
        }
        lastErrCode = null; // Clear error on success
      } catch (e) {
        const err = e as any;
        const errCode = err?.code || err?.message;
        
        // Only notify if it's a NEW error to avoid spamming the UI
        if (errCode !== lastErrCode) {
          const errMsg = err?.message || err?.toString?.() || 'Unknown location error';
          logError("ride-tracking", new Error("[RideTracking] Interval update failed"), {
            message: errMsg,
            code: err?.code,
            originalError: e
          });
          if (onError) onError(e instanceof Error ? e : new Error(errMsg));
          lastErrCode = errCode;
        }
      }
    }, 30_000);

  } catch (e) {
    const err = e as any;
    let errMsg = err?.message || '';
    const errCode = err?.code;

    // Aggressively sanitize the error message
    if (!errMsg || 
        errMsg === '[object GeolocationPositionError]' || 
        errMsg.includes('GeolocationPositionError')) {
      if (errCode === 1) errMsg = 'Location permission denied.';
      else if (errCode === 2) errMsg = 'Position unavailable (GPS/Signal lost).';
      else if (errCode === 3) errMsg = 'Location request timed out.';
      else errMsg = 'Unknown location error';
    }
    
    logError("ride-tracking", new Error("[RideTracking] Failed to start tracking"), {
      message: errMsg,
      code: errCode,
      name: err?.name,
      originalError: e
    });
    
    if (onError) {
      // GeolocationPositionError properties are not enumerable.
      // We pass a plain object to ensure UpcomingBookings can read it.
      onError({
        message: errMsg,
        code: errCode,
        name: err?.name || 'GeolocationError'
      } as any);
    }
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
    navigator.geolocation.clearWatch(locationWatchId);
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
    logError("ride-tracking", error);
    throw error;
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

    if (process.env.NODE_ENV === "development") {
      console.log(
        `Driver is near destination (${(distanceKm * 1000).toFixed(0)}m). Checking auto-complete...`
      );
    }

    const bookingRef = doc(db, 'bookingRequests', bookingId);
    const snap = await getDoc(bookingRef);

    if (!snap.exists()) return;

    const data = snap.data();

    if (data?.rideStatus === 'in_progress') {
      await updateRideStatus(bookingId, 'completed');
      if (process.env.NODE_ENV === "development") {
        console.log('Ride auto-completed.');
      }
    }

  } catch (error) {
    logError("ride-tracking", error);
  }
}
