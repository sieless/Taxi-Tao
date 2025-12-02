// lib/cancellation-service.ts
import {
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { createDriverNotification } from "./driver-notification-service";
import { createNotification } from "./notification-service";
import { BookingRequest } from "./types";

/* -----------------------------------------------------
 * Helper: Fetch booking or throw
 * --------------------------------------------------- */
async function getBookingOrFail(
  bookingId: string
): Promise<BookingRequest & { id: string }> {
  const ref = doc(db, "bookingRequests", bookingId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    throw new Error("Booking not found");
  }

  return { id: snap.id, ...(snap.data() as BookingRequest) };
}

/* -----------------------------------------------------
 * Helper: Uniform update
 * --------------------------------------------------- */
async function updateBookingStatus(
  bookingId: string,
  updates: Record<string, unknown>
) {
  const ref = doc(db, "bookingRequests", bookingId);
  await updateDoc(ref, updates);
}

/* -----------------------------------------------------
 * Customer Cancels Booking
 * --------------------------------------------------- */
export async function cancelBooking(
  bookingId: string,
  reason: string
): Promise<void> {
  const booking = await getBookingOrFail(bookingId);

  // Update status
  await updateBookingStatus(bookingId, {
    status: "cancelled",
    cancellationReason: reason,
    cancelledAt: serverTimestamp(),
  });

  // Notify driver
  if (booking.acceptedBy) {
    await createDriverNotification({
      driverId: booking.acceptedBy,
      type: "booking_cancelled",
      title: "Booking Cancelled",
      message: `The booking from ${booking.pickupLocation} has been cancelled by the customer. Reason: ${reason}`,
      bookingId,
    });
  }

  console.log("Booking cancelled successfully.");
}

/* -----------------------------------------------------
 * Driver Cancels Booking
 * --------------------------------------------------- */
export async function cancelBookingByDriver(
  bookingId: string,
  driverId: string,
  reason: string
): Promise<void> {
  const booking = await getBookingOrFail(bookingId);

  if (booking.acceptedBy !== driverId) {
    throw new Error("You are not the assigned driver for this booking.");
  }

  // Reset to pending state
  await updateBookingStatus(bookingId, {
    status: "pending",
    acceptedBy: null,
    acceptedAt: null,
    rideStatus: null,
    // You can add a rejectedDrivers list here if needed later
  });

  // Notify customer
  if (booking.customerId) {
    await createNotification(
      booking.customerId,
      bookingId,
      "driver_cancelled" as any,
      `Driver cancelled: ${reason}. We are looking for another driver near you...`,
      { action: "view_booking" }
    );
  }

  console.log("Booking re-queued successfully after driver cancellation.");
}
