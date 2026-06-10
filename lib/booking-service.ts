// booking-service.ts

import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  Timestamp, 
  runTransaction, 
  doc, 
  getDoc 
} from "firebase/firestore";
import { db, functions } from "@/lib/firebase";
import { httpsCallable } from "firebase/functions";
import { BookingRequest, BookingStatus, Driver } from "@/lib/types";
import { createNotification } from "@/lib/notification-service";
import { createDriverNotification, notifyDriversOfNewBooking } from "@/lib/driver-notification-service";
import { RideLifecycle } from "./services/ride-lifecycle";


import { logError } from "@/lib/logger";const COLLECTION_NAME = "bookingRequests";

/**
 * Creates a new booking request and notifies matching drivers.
 */
export async function createBookingRequest(data: {
  customerId?: string;
  customerName: string;
  customerPhone: string;
  pickupLocation: string;
  pickupLat: number;
  pickupLng: number;
  pickupRegion: string;
  destination: string;
  destinationLat: number;
  destinationLng: number;
  pickupDate: string;
  pickupTime: string;
  estimatedPrice?: number;
  notes?: string;
  vehicleType?: string;
  preferredDriverId?: string;
}): Promise<string> {
  try {
    const createRideFn = httpsCallable(functions, "createRide");
    
    // Ensure coordinates are valid numbers before sending
    if (isNaN(data.pickupLat) || isNaN(data.pickupLng) || isNaN(data.destinationLat) || isNaN(data.destinationLng)) {
      throw new Error("Invalid coordinates provided for booking");
    }
    
    const payload = {
      requestId: crypto.randomUUID(),
      pickup: {
        address: data.pickupLocation,
        lat: data.pickupLat,
        lng: data.pickupLng,
      },
      dropoff: {
        address: data.destination,
        lat: data.destinationLat,
        lng: data.destinationLng,
      },
      fareEstimate: data.estimatedPrice || 0,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      options: {
        pickupDate: data.pickupDate,
        pickupTime: data.pickupTime,
        targetDriverId: data.preferredDriverId || undefined,
      }
    };

    const response = await createRideFn(payload);
    const result = response.data as any;
    
    if (!result.success || !result.bookingId) {
      throw new Error(result.message || "Failed to create ride via Cloud Function");
    }

    return result.bookingId;
  } catch (error) {
    logError("booking", error);
    throw error;
  }
}

/**
 * Driver attempts to accept a booking.
 */
export async function acceptBooking(
  bookingId: string,
  driverId: string
): Promise<{ success: boolean; message: string }> {
  try {
    await RideLifecycle.accept(bookingId, driverId);
    return { success: true, message: "Ride accepted!" };
  } catch (error: any) {
    logError("booking", error);
    return { success: false, message: error.message || "Failed to accept ride" };
  }
}

/**
 * Fetch all available bookings near a driver.
 */
export async function getAvailableBookings(
  driverRegion: string
): Promise<BookingRequest[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("status", "in", ["searching", "offered", "price_pending"]),
      where("pickupRegion", "==", driverRegion)
    );

    const querySnapshot = await getDocs(q);
    const now = Date.now();

    const results = querySnapshot.docs
      .map((d) => ({ id: d.id, ...d.data() } as BookingRequest))
      .filter((b) => b.expiresAt.toMillis() > now);

    return results;
  } catch (error) {
    logError("booking", error);
    return [];
  }
}

/**
 * Mark a ride as completed & increment driver's ride count.
 */
export async function completeRide(
  bookingId: string,
  driverId: string,
  fare: number
) {
  try {
    await RideLifecycle.complete(bookingId, fare);
    return { success: true, message: "Ride completed!" };
  } catch (error: any) {
    logError("booking", error);
    return { success: false, message: error.message || "Failed to complete ride" };
  }
}

/**
 * Customer rating flow.
 */
export async function rateRide(bookingId: string, rating: number, review?: string) {
  try {
    if (rating < 1 || rating > 5) {
      return { success: false, message: "Rating must be 1–5" };
    }

    return await runTransaction(db, async (transaction) => {
      const ref = doc(db, COLLECTION_NAME, bookingId);
      
      // Perform initial read for booking
      const snap = await transaction.get(ref);
      if (!snap.exists()) return { success: false, message: "Booking not found" };

      const booking = snap.data() as BookingRequest;

      if (booking.status !== "completed") {
        return { success: false, message: "Only completed rides can be rated" };
      }

      if (booking.rating) {
        return { success: false, message: "This ride is already rated" };
      }

      const driverId = booking.acceptedBy;
      if (!driverId) {
        return { success: false, message: "No driver assigned" };
      }

      // Perform read for driver BEFORE any updates
      const driverRef = doc(db, "drivers", driverId);
      const driverSnap = await transaction.get(driverRef);

      // Now perform all updates
      transaction.update(ref, { rating, review: review || null });

      if (driverSnap.exists()) {
        const d = driverSnap.data();
        const total = d.totalRatings || 0;
        const avg = d.averageRating || 0;

        const newTotal = total + 1;
        const newAvg = ((avg * total) + rating) / newTotal;
        const value = Math.round(newAvg * 10) / 10;

        transaction.update(driverRef, {
          totalRatings: newTotal,
          averageRating: value,
          rating: value,
        });
      }

      return { success: true, message: "Rating submitted!" };
    });
  } catch (error) {
    logError("booking", error);
    throw error;
  }
}

/**
 * Driver ride history.
 */
export async function getDriverRideHistory(driverId: string) {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("acceptedBy", "==", driverId),
      where("status", "==", "completed")
    );

    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as BookingRequest));
  } catch (error) {
    logError("booking", error);
    return [];
  }
}

/**
 * Customer ride history.
 */
export async function getCustomerBookings(customerPhone: string) {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("customerPhone", "==", customerPhone)
    );

    const snap = await getDocs(q);

    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as BookingRequest));

    return list.sort((a, b) => {
      const aT = a.createdAt?.toMillis?.() || 0;
      const bT = b.createdAt?.toMillis?.() || 0;
      return bT - aT;
    });
  } catch (error) {
    logError("booking", error);
    return [];
  }
}
