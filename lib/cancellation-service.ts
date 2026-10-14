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

  return { ...(snap.data() as BookingRequest), id: snap.id };
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
 * In-flight debounce set to prevent rapid double-clicks
 * --------------------------------------------------- */
const pendingCancellations = new Set<string>();

/* -----------------------------------------------------
 * Customer Cancels Booking
 * --------------------------------------------------- */
export async function cancelBooking(
  bookingId: string,
  reason: string
): Promise<void> {
  if (pendingCancellations.has(bookingId)) {
    return; // Already being processed
  }
  pendingCancellations.add(bookingId);

  try {
    const booking = await getBookingOrFail(bookingId);

    // Idempotency: if already cancelled or annulled, do not rewrite terminal state
    if (booking.status === "cancelled" || booking.status === "annulled") {
      return;
    }

    // Update status
    await updateBookingStatus(bookingId, {
      status: "cancelled",
      cancellationReason: reason,
      cancelledAt: serverTimestamp(),
    });

    // Notify driver (supporting both acceptedDriverId and acceptedBy)
    const assignedDriverId = booking.acceptedDriverId || booking.acceptedBy;
    if (assignedDriverId) {
      await createDriverNotification({
        driverId: assignedDriverId,
        type: "booking_cancelled",
        title: "Booking Cancelled",
        message: `The booking from ${booking.pickupLocation} has been cancelled by the customer. Reason: ${reason}`,
        bookingId,
      });
    }
  } finally {
    pendingCancellations.delete(bookingId);
  }
}

/* -----------------------------------------------------
 * Driver Cancels Booking
 * --------------------------------------------------- */
export async function cancelBookingByDriver(
  bookingId: string,
  driverId: string,
  reason: string
): Promise<void> {
  if (pendingCancellations.has(bookingId)) {
    return;
  }
  pendingCancellations.add(bookingId);

  try {
    const booking = await getBookingOrFail(bookingId);

    // Idempotency: if ride is already cancelled, completed or annulled
    if (booking.status === "cancelled" || booking.status === "completed" || booking.status === "annulled") {
      return;
    }

    const assignedDriverId = booking.acceptedDriverId || booking.acceptedBy;
    if (assignedDriverId !== driverId) {
      throw new Error("You are not the assigned driver for this booking.");
    }

    // Reset to searching state for other drivers
    await updateBookingStatus(bookingId, {
      status: "searching",
      acceptedBy: null,
      acceptedDriverId: null,
      acceptedAt: null,
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
  } finally {
    pendingCancellations.delete(bookingId);
  }
}
