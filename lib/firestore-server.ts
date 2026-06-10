/**
 * Server-only Firestore queries — powered by the Firebase Admin SDK.
 *
 * ✅ No gRPC stream errors in Next.js Server Components / Route Handlers.
 * ✅ No browser-SDK "offline" fallbacks during Turbopack hot-reloads.
 * ✅ Credentials never shipped to the browser bundle.
 *
 * DO NOT import this in client components ("use client" files).
 */
import { adminDb } from "./firebase-admin";
import type { Driver, Vehicle } from "./types";


import { logError } from "@/lib/logger";// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Cast a Firestore Admin DocumentData to a typed shape, injecting the doc id. */
function toDoc<T>(
  snap: FirebaseFirestore.DocumentSnapshot
): T | null {
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as T;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch a single driver by ID.
 * Returns null when the document does not exist or on error.
 */
export async function getDriverServer(driverId: string): Promise<Driver | null> {
  try {
    const snap = await adminDb.collection("drivers").doc(driverId).get();
    return toDoc<Driver>(snap);
  } catch (err) {
    logError("firestore-server", err);
    return null;
  }
}

/**
 * Fetch vehicles belonging to a driver.
 *
 * Strategy (mirrors the client-side logic):
 *  1. Check drivers/{driverId}/vehicles sub-collection.
 *  2. Fall back to the `vehicles` array on the driver document.
 *  3. Fall back to the top-level `vehicles` collection filtered by driverId.
 */
export async function getDriverVehiclesServer(
  driverId: string
): Promise<Vehicle[]> {
  try {
    const subSnap = await adminDb
      .collection("drivers")
      .doc(driverId)
      .collection("vehicles")
      .get();

    if (!subSnap.empty) {
      return subSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Vehicle));
    }

    // Fallback 1: embedded array on the driver document
    const driverSnap = await adminDb.collection("drivers").doc(driverId).get();
    if (driverSnap.exists) {
      const data = driverSnap.data()!;
      if (Array.isArray(data.vehicles) && data.vehicles.length > 0) {
        return data.vehicles as Vehicle[];
      }
    }

    // Fallback 2: top-level vehicles collection
    const topSnap = await adminDb
      .collection("vehicles")
      .where("driverId", "==", driverId)
      .get();

    return topSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Vehicle));
  } catch (err) {
    logError("firestore-server", err);
    return [];
  }
}

/**
 * Fetch a driver and their vehicles in a single parallel call.
 * Returns null for the driver when not found.
 */
export async function getDriverWithVehiclesServer(driverId: string): Promise<{
  driver: Driver | null;
  vehicles: Vehicle[];
}> {
  const [driver, vehicles] = await Promise.all([
    getDriverServer(driverId),
    getDriverVehiclesServer(driverId),
  ]);
  return { driver, vehicles };
}

/**
 * Fetch all active, publicly visible drivers with their first vehicle.
 * Used by server-rendered listing pages.
 */
export async function getAllActiveDriversServer(): Promise<Driver[]> {
  try {
    const snap = await adminDb
      .collection("drivers")
      .where("active", "==", true)
      .where("isVisibleToPublic", "==", true)
      .where("subscriptionStatus", "==", "active")
      .get();

    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Driver));
  } catch (err) {
    logError("firestore-server", err);
    return [];
  }
}

export async function getAllDriversWithVehiclesServer(): Promise<
  { driver: Driver; vehicle: Vehicle | undefined }[]
> {
  const drivers = await getAllActiveDriversServer();

  // Fetch all vehicles in parallel — one Promise per driver
  const results = await Promise.all(
    drivers.map(async (driver) => {
      const vehicles = await getDriverVehiclesServer(driver.id);
      return { driver, vehicle: vehicles[0] };
    })
  );
  return results;
}
