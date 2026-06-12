/**
 * Driver Service
 *
 * Client-side service for driver-related operations.
 * Adapted from mobile app for Next.js web application.
 */
import {
  collection,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/firestore-constants";
import { Driver } from "@/lib/types";

/**
 * Fetch independent drivers who have vehicles listed for hire.
 * Returns drivers with at least one active rental vehicle.
 */
export async function getPeerHostsForHire(limitCount: number = 10): Promise<{
  id: string;
  name: string;
  img: string;
  businessLocation?: string;
  vehicleCount: number;
}[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.DRIVERS),
      where("isVisibleToPublic", "==", true),
      where("status", "==", "active"),
      limit(50)
    );

    const snapshot = await getDocs(q);
    const drivers = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as Driver))
      .filter((driver: Driver) =>
        driver.vehicles &&
        driver.vehicles.some(
          (v: any) =>
            v.isRental === true &&
            v.status === "active" &&
            v.isVisibleToPublic === true
        )
      )
      .slice(0, limitCount)
      .map((driver) => {
        const rentalVehicles = driver.vehicles?.filter(
          (v: any) =>
            v.isRental === true &&
            v.status === "active" &&
            v.isVisibleToPublic === true
        ) || [];

        return {
          id: driver.id,
          name: driver.name || "Verified Host",
          img:
            driver.profilePhotoUrl ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              driver.name || "H"
            )}&background=3b82f6&color=fff&size=200&bold=true&rounded=true`,
          businessLocation: driver.businessLocation || driver.currentLocation,
          vehicleCount: rentalVehicles.length,
        };
      });

    return drivers;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching peer hosts:", error);
    }
    return [];
  }
}

/**
 * Get a single driver by ID for hire context.
 */
export async function getDriverForHire(
  driverId: string
): Promise<{
  id: string;
  name: string;
  img: string;
  businessLocation?: string;
  rating: number;
  totalRides: number;
  vehicles: any[];
} | null> {
  try {
    // For web, we can't easily access driver subcollection
    // Fetch from the denormalized vehicle data instead
    const q = query(
      collection(db, COLLECTIONS.VEHICLES),
      where("driverId", "==", driverId),
      where("status", "==", "active"),
      where("isRental", "==", true),
      where("isVisibleToPublic", "==", true)
    );

    const snapshot = await getDocs(q);
    const vehicles = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (vehicles.length === 0) return null;

    // Get driver info from first vehicle's denormalized fields
    const firstVehicle = vehicles[0];

    return {
      id: driverId,
      name: firstVehicle.driverName || "Verified Host",
      img:
        firstVehicle.driverProfilePhoto ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          firstVehicle.driverName || "H"
        )}&background=3b82f6&color=fff&size=200&bold=true&rounded=true`,
      businessLocation: firstVehicle.driverLocation,
      rating: firstVehicle.driverRating || 5.0,
      totalRides: firstVehicle.driverTotalRides || 0,
      vehicles,
    };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching driver for hire:", error);
    }
    return null;
  }
}