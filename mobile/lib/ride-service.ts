import {
  collection,
  addDoc,
  doc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  orderBy,
  Timestamp,
  runTransaction,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { BookingRequest } from "./types";
import { getCurrentTimestampMillis } from "./time-utils";

export const RideService = {
  // Customer: Request a ride
  requestRide: async (
    customerId: string, 
    customerName: string, 
    customerPhone: string,
    pickup: { address: string; lat: number; lng: number },
    dropoff: { address: string; lat: number; lng: number },
    fareEstimate: number,
    options?: { pickupDate?: string; pickupTime?: string; ttlMinutes?: number }
  ) => {
    try {
      const ttlMinutes = options?.ttlMinutes ?? 30;
      const expiresAt = Timestamp.fromMillis(getCurrentTimestampMillis() + ttlMinutes * 60 * 1000);
      const now = new Date();
      const fallbackDate = options?.pickupDate ?? now.toISOString().slice(0, 10); // YYYY-MM-DD
      const fallbackTime = options?.pickupTime ?? now.toISOString().slice(11, 16); // HH:MM

      const docRef = await addDoc(collection(db, "bookingRequests"), {
        customerId,
        customerName,
        customerPhone,
        pickupLocation: pickup.address,
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        destination: dropoff.address,
        destinationLat: dropoff.lat,
        destinationLng: dropoff.lng,
        fareEstimate,
        status: "pending",
        pickupDate: fallbackDate,
        pickupTime: fallbackTime,
        expiresAt,
        createdAt: serverTimestamp(),
        notifiedDrivers: [],
      });
      return docRef.id;
    } catch (error) {
      console.error("Error requesting ride:", error);
      throw error;
    }
  },

  // Driver: Listen for available rides
  listenForAvailableRides: (
    driver: { driverId: string; currentLocation?: string | null; subscriptionStatus?: string | null; status?: string | null },
    callback: (rides: BookingRequest[]) => void,
    onError?: (err: any) => void
  ) => {
    // Only subscribe when driver is eligible (online/available, active subscription, has location)
    if (driver?.status !== "available" || driver?.subscriptionStatus !== "active" || !driver?.currentLocation) {
      callback([]);
      return () => {};
    }

    const q = query(
      collection(db, "bookingRequests"),
      where("status", "in", ["pending", "accepted", "arrived", "in_progress"]),
      // We remove the location filter to ensure we see our own active ride even if we move
      // But for pending rides we still want to filter. 
      // This query is getting complex for client-side filtering, but for now:
      orderBy("createdAt", "desc")
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const now = getCurrentTimestampMillis();
        const allRides = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as BookingRequest));
        
        // Client-side filtering for complex logic
        const myActiveRide = allRides.find(r => 
            ['accepted', 'arrived', 'in_progress'].includes(r.status) && 
            r.acceptedBy === driver.driverId
        );

        if (myActiveRide) {
             callback([myActiveRide]); // Pass it as the single item, or handle separately
        } else {
             // Filter for pending rides in my location
             const pending = allRides.filter(r => 
                r.status === 'pending' && 
                r.pickupLocation === driver.currentLocation &&
                (r.expiresAt?.toMillis ? r.expiresAt.toMillis() > now : true)
             );
             callback(pending);
        }
      },
      (err) => {
        console.error("Ride subscription error:", err);
        onError?.(err);
        callback([]);
      }
    );
  },

  // Customer: Listen for updates on their specific ride
  listenToRideStatus: (rideId: string, callback: (ride: BookingRequest) => void) => {
    return onSnapshot(doc(db, "bookingRequests", rideId), (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as BookingRequest);
      }
    });
  },

  // Driver: Accept a ride
  acceptRide: async (rideId: string, driverId: string, driverName: string, driverPhone: string) => {
    try {
      const rideRef = doc(db, "bookingRequests", rideId);
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(rideRef);
        if (!snap.exists()) throw new Error("Ride not found");

        const data = snap.data() as BookingRequest;
        const isExpired = data.expiresAt?.toMillis ? data.expiresAt.toMillis() <= getCurrentTimestampMillis() : false;
        if (isExpired) throw new Error("Ride expired");
        if (data.status !== "pending") throw new Error("Ride already taken");

        transaction.update(rideRef, {
          status: "accepted",
          acceptedBy: driverId,
          driverName,
          driverPhone,
          acceptedAt: serverTimestamp(),
        });
      });
    } catch (error) {
      console.error("Error accepting ride:", error);
      throw error;
    }
  },

  // Driver: Update ride status (arrived, in_progress, completed)
  updateRideStatus: async (rideId: string, status: 'arrived' | 'in_progress' | 'completed') => {
    try {
      const rideRef = doc(db, "bookingRequests", rideId);
      const updateData: any = {
        status,
      };

      if (status === 'arrived') {
        updateData.arrivedAt = serverTimestamp();
      } else if (status === 'in_progress') {
        updateData.startedAt = serverTimestamp();
      } else if (status === 'completed') {
        updateData.completedAt = serverTimestamp();
        // In Phase 3, we will calculate the actual fare here. 
        // For now, we assume the estimate is the final fare or it was already set.
      }

      await updateDoc(rideRef, updateData);
    } catch (error) {
      console.error(`Error updating ride status to ${status}:`, error);
      throw error;
    }
  }
};
