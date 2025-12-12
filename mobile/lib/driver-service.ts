import { doc, updateDoc, serverTimestamp, GeoPoint } from "firebase/firestore";
import { db } from "./firebase";

export const DriverService = {
  updateStatus: async (
    driverId: string, 
    status: 'available' | 'offline' | 'busy', 
    location?: { lat: number; lng: number; address?: string }
  ) => {
    try {
      const driverRef = doc(db, "drivers", driverId);
      const updateData: any = {
        status,
        lastActive: serverTimestamp(),
      };

      if (location) {
        updateData.currentLocation = location.address || "Unknown Location";
        // If your backend uses GeoPoint for location queries:
        // updateData.location = new GeoPoint(location.lat, location.lng);
        // But based on the audit, it seems to use string matching for 'currentLocation' (which is fragile, but we stick to existing pattern for now)
        // We will add lat/lng fields for future proofing
        updateData.lat = location.lat;
        updateData.lng = location.lng;
      }

      await updateDoc(driverRef, updateData);
    } catch (error) {
      console.error("Error updating driver status:", error);
      throw error;
    }
  },

  updateLocation: async (driverId: string, lat: number, lng: number, address?: string) => {
    try {
      const driverRef = doc(db, "drivers", driverId);
      await updateDoc(driverRef, {
        lat,
        lng,
        currentLocation: address, // Keep legacy string field updated
        lastLocationUpdate: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating driver location:", error);
    }
  }
};
