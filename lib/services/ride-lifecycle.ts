// lib/services/ride-lifecycle.ts

import { 
  doc, 
  updateDoc, 
  Timestamp, 
  runTransaction, 
  getDoc 
} from "firebase/firestore";
import { db } from "../firebase";
import { logError } from "@/lib/logger";
import { BookingRequest, BookingStatus, Driver } from "../types";
import { createNotification, getNotificationMessage } from "../notification-service";
import { 
  calculateDistance, 
  Coords 
} from "./location-service";

const COLLECTION_NAME = "bookingRequests";

export class RideLifecycle {
  /**
   * Helper to update booking status with timestamp and notification
   */
  private static async transition(
    bookingId: string, 
    newStatus: BookingStatus, 
    metadata: Record<string, any> = {}
  ) {
    const bookingRef = doc(db, COLLECTION_NAME, bookingId);
    const bookingSnap = await getDoc(bookingRef);
    
    if (!bookingSnap.exists()) throw new Error("Booking not found");
    const booking = bookingSnap.id ? { id: bookingSnap.id, ...bookingSnap.data() } as BookingRequest : null;
    if (!booking) throw new Error("Invalid booking data");

    const updateData: Record<string, any> = {
      status: newStatus,
      ...metadata
    };

    // Auto-timestamp mapping
    const timestampField = this.getTimestampField(newStatus);
    if (timestampField) {
      updateData[timestampField] = Timestamp.now();
    }

    await updateDoc(bookingRef, updateData);

    // Notify Customer
    if (booking.customerId) {
      await this.notifyCustomer(booking, newStatus);
    }
  }

  private static getTimestampField(status: BookingStatus): string | null {
    switch (status) {
      case "accepted": return "acceptedAt";
      case "confirmed": return "confirmedAt";
      case "en_route": return "enRouteAt";
      case "arrived": return "arrivedAt";
      case "in_progress": return "startedAt";
      case "completed": return "completedAt";
      case "cancelled": return "cancelledAt";
      default: return null;
    }
  }

  private static async notifyCustomer(booking: BookingRequest, status: BookingStatus) {
    // Get driver details for the message
    let driverName = "Your driver";
    if (booking.acceptedBy) {
      const driverSnap = await getDoc(doc(db, "drivers", booking.acceptedBy));
      if (driverSnap.exists()) {
        driverName = (driverSnap.data() as Driver).name;
      }
    }

    const message = getNotificationMessage(status, driverName, "", booking.pickupLocation);
    const typeMap: Record<string, any> = {
      accepted: "ride_confirmed",
      confirmed: "ride_confirmed",
      en_route: "driver_enroute",
      arrived: "driver_arrived",
      in_progress: "trip_started",
      completed: "trip_completed",
      cancelled: "driver_cancelled"
    };

    const type = typeMap[status] || "system_broadcast";
    
    await createNotification(
      booking.customerId!, 
      booking.id, 
      type, 
      message, 
      { status, action: status === "en_route" ? "view_map" : "view_booking" }
    );
  }

  /**
   * Driver accepts the ride
   */
  static async accept(bookingId: string, driverId: string) {
    return runTransaction(db, async (transaction) => {
      const ref = doc(db, COLLECTION_NAME, bookingId);
      const snap = await transaction.get(ref);
      if (!snap.exists()) throw new Error("Booking not found");
      
      const booking = snap.data() as BookingRequest;
      const preAcceptance: BookingStatus[] = ["searching", "offered", "price_pending"];
      
      if (!preAcceptance.includes(booking.status)) {
        throw new Error("Ride is no longer available");
      }

      transaction.update(ref, {
        status: "accepted",
        acceptedBy: driverId,
        acceptedAt: Timestamp.now()
      });
      
      return { success: true };
    }).then(() => this.notifyCustomer({ id: bookingId, acceptedBy: driverId } as any, "accepted"));
  }

  /**
   * Universal confirmation (used by negotiation and direct accept)
   */
  static async confirm(bookingId: string) {
    await this.transition(bookingId, "confirmed");
  }

  /**
   * Journey updates
   */
  static async startEnRoute(bookingId: string) {
    await this.transition(bookingId, "en_route");
    // Initial ETA update
    this.updateETA(bookingId).catch((e) => logError("ride-lifecycle", e));
  }

  static async markArrived(bookingId: string) {
    await this.transition(bookingId, "arrived");
  }

  static async startTrip(bookingId: string) {
    await this.transition(bookingId, "in_progress");
  }

  /**
   * ETA Logic — uses stored destinationCoords or falls back to distance-based estimate
   */
  static async updateETA(bookingId: string) {
    const bookingRef = doc(db, COLLECTION_NAME, bookingId);
    const snap = await getDoc(bookingRef);
    if (!snap.exists()) return;
    const booking = snap.data() as BookingRequest;

    if (!booking.driverLocation || !booking.destination) return;

    const destCoords = (booking as any).destinationCoords;
    if (!destCoords) return;

    const distKm = calculateDistance(
      { lat: booking.driverLocation.lat, lng: booking.driverLocation.lng },
      destCoords
    );

    const estimatedMinutes = Math.round((distKm / 40) * 60);

    await updateDoc(bookingRef, {
      eta: {
        minutes: estimatedMinutes,
        distance: `${distKm.toFixed(1)} km`,
        lastCalculated: Timestamp.now()
      }
    });
  }

  /**
   * Auto-completion check
   */
  static async checkAndAutoComplete(bookingId: string, driverCoords: Coords, destCoords: Coords) {
    const dist = calculateDistance(driverCoords, destCoords);
    if (dist <= 0.1) { // 100 meters
      const bookingRef = doc(db, COLLECTION_NAME, bookingId);
      const snap = await getDoc(bookingRef);
      if (snap.exists() && snap.data().status === "in_progress") {
        await this.complete(bookingId, snap.data().fare || snap.data().fareEstimate || 0);
      }
    }
  }

  /**
   * Completion
   */
  static async complete(bookingId: string, fare: number) {
    return runTransaction(db, async (transaction) => {
      const ref = doc(db, COLLECTION_NAME, bookingId);
      const snap = await transaction.get(ref);
      if (!snap.exists()) throw new Error("Booking not found");
      
      const booking = snap.data() as BookingRequest;
      if (!booking.acceptedBy) throw new Error("No driver assigned");

      const driverRef = doc(db, "drivers", booking.acceptedBy);
      const driverSnap = await transaction.get(driverRef);

      transaction.update(ref, {
        status: "completed",
        completedAt: Timestamp.now(),
        fare
      });

      if (driverSnap.exists()) {
        const total = driverSnap.data().totalRides || 0;
        transaction.update(driverRef, { totalRides: total + 1 });
      }
    }).then(() => this.transition(bookingId, "completed", { fare }));
  }
}
