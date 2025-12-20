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
import { db } from "@/lib/firebase";
import { BookingRequest, Driver } from "@/lib/types";
import { createNotification } from "@/lib/notification-service";
import { createDriverNotification, notifyDriversOfNewBooking } from "@/lib/driver-notification-service";

const COLLECTION_NAME = "bookingRequests";

/**
 * Creates a new booking request and notifies matching drivers.
 */
export async function createBookingRequest(data: {
  customerId?: string;
  customerName: string;
  customerPhone: string;
  pickupLocation: string;
  destination: string;
  pickupDate: string;
  pickupTime: string;
  estimatedPrice?: number;
  notes?: string;
  vehicleType?: string;
  preferredDriverId?: string;
}): Promise<string> {
  try {
    const bookingData = {
      customerId: data.customerId || null,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      pickupLocation: data.pickupLocation,
      destination: data.destination,
      pickupDate: data.pickupDate,
      pickupTime: data.pickupTime,
      estimatedPrice: data.estimatedPrice ?? 0,
      notes: data.notes || null,
      vehicleType: data.vehicleType || null,
      preferredDriverId: data.preferredDriverId || null,
      status: data.preferredDriverId ? "assigned" : "pending",
      acceptedBy: data.preferredDriverId ?? null,
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromMillis(Date.now() + 30 * 60 * 1000),
      notifiedDrivers: [],
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), bookingData);
    const bookingId = docRef.id;

    /** Notify customer */
    if (data.customerId) {
      try {
        await createNotification(
          data.customerId,
          bookingId,
          "booking_created",
          "Booking received! We are looking for a driver near you.",
          { action: "view_booking" }
        );
      } catch (error) {
        console.error("Customer notification error:", error);
      }
    }

    /** Preferred driver flow */
    if (data.preferredDriverId) {
      try {
        const driverDoc = await getDoc(doc(db, "drivers", data.preferredDriverId));

        if (driverDoc.exists()) {
          const driver = { id: driverDoc.id, ...driverDoc.data() } as Driver;

          await createDriverNotification({
            driverId: driver.id,
            type: "new_booking",
            title: "🎯 Direct Booking Request!",
            message: `Pickup: ${data.pickupLocation}\nDropoff: ${data.destination}`,
            bookingId,
            pickupLocation: data.pickupLocation,
            destination: data.destination,
            pickupDate: data.pickupDate,
            pickupTime: data.pickupTime,
          });
        }
      } catch (error) {
        console.error("Preferred driver notification error:", error);
      }

      return bookingId;
    }

    /** Open request — notify drivers in area */
    try {
      const driversRef = collection(db, "drivers");
      const q = query(
        driversRef,
        where("status", "==", "available"),
        where("subscriptionStatus", "==", "active"),
        where("currentLocation", "==", data.pickupLocation) // NOTE: consider replacing with geolocation
      );

      const querySnapshot = await getDocs(q);
      const matchingDrivers: Driver[] = querySnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Driver[];

      const driverIds = matchingDrivers.map((d) => d.id);

      if (driverIds.length > 0) {
        await notifyDriversOfNewBooking(
          driverIds,
          bookingId,
          data.pickupLocation,
          data.destination,
          data.pickupDate,
          data.pickupTime
        );
      }
    } catch (error) {
      console.error("Driver notification error:", error);
    }

    return bookingId;
  } catch (error) {
    console.error("Error creating booking request:", error);
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
    const result = await runTransaction(db, async (transaction) => {
      const bookingRef = doc(db, COLLECTION_NAME, bookingId);
      const bookingDoc = await transaction.get(bookingRef);

      if (!bookingDoc.exists()) {
        return { success: false, message: "Booking not found." };
      }

      const booking = bookingDoc.data() as BookingRequest;

      if (booking.status !== "pending") {
        return { success: false, message: "This ride has already been taken." };
      }

      if (booking.expiresAt.toMillis() < Timestamp.now().toMillis()) {
        return { success: false, message: "This request has expired." };
      }

      transaction.update(bookingRef, {
        status: "accepted",
        acceptedBy: driverId,
        acceptedAt: Timestamp.now(),
      });

      return { success: true, message: "Ride accepted!", bookingData: booking };
    });

    if (result.success && result.bookingData) {
      /** Notify customer */
      try {
        const driverDoc = await getDoc(doc(db, "drivers", driverId));
        const driverName = driverDoc.exists()
          ? (driverDoc.data() as Driver).name
          : "Your driver";

        const booking = result.bookingData;
        const customerId = booking.customerId;

        if (customerId) {
          await createNotification(
            customerId,
            bookingId,
            "ride_confirmed",
            `${driverName} has accepted your ride.`,
            {
              driverId,
              driverName,
              bookingId,
              action: "view_booking",
            }
          );
        }
      } catch (err) {
        console.error("Customer acceptance notification error:", err);
      }
    }

    return { success: result.success, message: result.message };
  } catch (error) {
    console.error("Error accepting booking:", error);
    throw error;
  }
}

/**
 * Fetch all available bookings near a driver.
 */
export async function getAvailableBookings(
  driverLocation: string
): Promise<BookingRequest[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("status", "==", "pending"),
      where("pickupLocation", "==", driverLocation)
    );

    const querySnapshot = await getDocs(q);
    const now = Date.now();

    const results = querySnapshot.docs
      .map((d) => ({ id: d.id, ...d.data() } as BookingRequest))
      .filter((b) => b.expiresAt.toMillis() > now);

    return results;
  } catch (error) {
    console.error("Error fetching available bookings:", error);
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
    return await runTransaction(db, async (transaction) => {
      const ref = doc(db, COLLECTION_NAME, bookingId);
      const driverRef = doc(db, "drivers", driverId);

      // Perform all reads first
      const snap = await transaction.get(ref);
      const driverSnap = await transaction.get(driverRef);

      if (!snap.exists()) {
        return { success: false, message: "Booking not found." };
      }

      const booking = snap.data() as BookingRequest;

      if (booking.status !== "accepted") {
        return { success: false, message: "Only accepted rides can be completed." };
      }

      if (booking.acceptedBy !== driverId) {
        return { success: false, message: "Unauthorized completion." };
      }

      // Perform all writes after reads
      transaction.update(ref, {
        status: "completed",
        completedAt: Timestamp.now(),
        fare,
      });

      if (driverSnap.exists()) {
        const currentTotal = driverSnap.data().totalRides || 0;
        transaction.update(driverRef, { totalRides: currentTotal + 1 });
      }

      return { success: true, message: "Ride completed!" };
    });
  } catch (error) {
    console.error("Error completing ride:", error);
    throw error;
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
    console.error("Error rating ride:", error);
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
    console.error("History fetch error:", error);
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
    console.error("Customer booking history error:", error);
    return [];
  }
}
