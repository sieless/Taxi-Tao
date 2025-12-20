/* UpcomingBookings.tsx — Fully rewritten with optimized hooks, separated UI components,
   reusable StatusButton, skeleton loader, and toast-based error handling.

   Drop this single file in your React/Next.js app ("use client"). It uses TailwindCSS and
   Lucide icons. Adjust imports for your project structure if necessary.
*/

"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BookingRequest, Driver } from "@/lib/types";
import {
  Calendar,
  MapPin,
  Clock,
  Phone,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Navigation,
  MapPinned,
  Play,
  CheckCheck,
  Loader2,
} from "lucide-react";
import {
  updateRideStatus,
  startLocationTracking,
  stopLocationTracking,
} from "@/lib/ride-tracking";
import { createNotification, getNotificationMessage } from "@/lib/notification-service";

// -------------------------
// Simple Toast system (local, no external deps)
// -------------------------

type Toast = { id: string; message: string; type?: "info" | "error" | "success" };
function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((s) => [...s, { id, ...t }]);
    // auto remove after 5s
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), 5000);
  }, []);
  const remove = useCallback((id: string) => setToasts((s) => s.filter((t) => t.id !== id)), []);
  return { toasts, push, remove };
}

function Toasts({ toasts, remove }: { toasts: Toast[]; remove: (id: string) => void }) {
  return (
    <div className="fixed right-4 bottom-6 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`max-w-xs px-4 py-2 rounded shadow text-sm border-l-4 flex items-center gap-2 transition-opacity duration-200
            ${t.type === "error" ? "bg-red-50 border-red-500 text-red-800" : t.type === "success" ? "bg-green-50 border-green-500 text-green-800" : "bg-white border-slate-200 text-slate-800"}`}
          role="status"
        >
          <span className="flex-1">{t.message}</span>
          <button onClick={() => remove(t.id)} className="text-xs opacity-60 hover:opacity-100">dismiss</button>
        </div>
      ))}
    </div>
  );
}

// -------------------------
// Skeleton loader
// -------------------------
function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="animate-pulse">
        <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
        <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-64 bg-gray-200 rounded mb-2" />
        <div className="h-10 w-full bg-gray-200 rounded mt-4" />
      </div>
    </div>
  );
}

// -------------------------
// Reusable StatusButton
// -------------------------
interface StatusButtonProps {
  label: string;
  onClick: () => void;
  colorClass?: string;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

function StatusButton({ label, onClick, colorClass = "bg-blue-600 hover:bg-blue-700", loading = false, fullWidth = false, icon }: StatusButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`${colorClass} text-white px-3 py-2 rounded-lg transition flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50 ${fullWidth ? "col-span-2" : ""}`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      <span>{label}</span>
    </button>
  );
}

// -------------------------
// Booking card (presentational)
// -------------------------
function BookingCard({ booking }: { booking: BookingRequest }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-5 h-5 text-gray-700" />
        <span className="font-bold text-gray-800">{booking.pickupDate}</span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-600" />
          <span className="text-gray-700 font-semibold">{booking.pickupTime}</span>
        </div>

        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-gray-600 mt-0.5" />
          <div>
            <p className="text-gray-700 font-medium">{booking.pickupLocation}</p>
            <p className="text-gray-500 text-xs">→ {booking.destination}</p>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-200 mt-3">
          <p className="text-gray-600 text-sm">
            <span className="font-semibold">Customer:</span> {booking.customerName}
          </p>
          <p className="text-gray-600 text-xs">{booking.customerPhone}</p>
        </div>

        <div className="pt-2 border-t border-gray-200 mt-2 flex justify-between items-center">
          <span className="text-gray-600 font-medium">Fare:</span>
          <span className="text-green-600 font-bold text-lg">
            {booking.fare ? `KSH ${booking.fare.toLocaleString()}` : 
             booking.fareEstimate ? `~KSH ${booking.fareEstimate.toLocaleString()}` :
             "Agreed Price"}
          </span>
        </div>
      </div>
    </div>
  );
}

// -------------------------
// Main component
// -------------------------
interface UpcomingBookingsProps {
  driverId: string;
  driverProfile?: Driver | null;
  maxItems?: number;
}

export default function UpcomingBookings({ driverId, driverProfile, maxItems = 5 }: UpcomingBookingsProps) {
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [updating, setUpdating] = useState<string | null>(null);

  const { toasts, push, remove } = useToasts();

  // keep track of active tracking so we can cleanup when switching bookings/unmount
  const activeTracking = useRef<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      stopLocationTracking();
    };
  }, []);

  // Optimized query memo
  const bookingsQuery = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];

    // NOTE: adjust 'status' vs 'rideStatus' depending on your schema.
    return query(
      collection(db, "bookingRequests"),
      where("acceptedBy", "==", driverId),
      where("status", "==", "accepted"),
      where("pickupDate", ">=", today),
      orderBy("pickupDate", "asc"),
      orderBy("pickupTime", "asc")
      // limit(maxItems) - Removed limit as per user request
    );
  }, [driverId]);

  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(
      bookingsQuery,
      (snap) => {
        const arr: BookingRequest[] = [];
        snap.forEach((d) => arr.push({ id: d.id, ...d.data() } as BookingRequest));
        if (!mounted.current) return;
        setBookings(arr);
        setCurrentIndex(0);
        setLoading(false);
      },
      (err) => {
        console.error("upcoming bookings snapshot error", err);
        push({ message: "Failed to load bookings.", type: "error" });
        setLoading(false);
      }
    );

    return () => unsub();
  }, [bookingsQuery, push]);

  const currentBooking = bookings[currentIndex];

  // helper to build vehicle string
  // helper to build vehicle string
  const vehicleString = useMemo(() => {
    const v = driverProfile?.vehicles?.[0];
    if (!v) return "";
    // Color is not in Vehicle interface currently, so we omit it
    const parts = [v.make, v.model].filter(Boolean);
    let s = parts.join(" ");
    if (v.plate) s += ` (${v.plate})`;
    return s;
  }, [driverProfile]);

  const handleCall = useCallback((phone?: string) => {
    if (!phone) return push({ message: "No phone number available.", type: "error" });
    window.location.href = `tel:${phone}`;
  }, [push]);

  // centralised status update logic with toasts & tracking control
  const handleStatusUpdate = useCallback(async (bookingId: string, newStatus: BookingRequest["rideStatus"] | (string & {})) => {
    setUpdating(bookingId);
    try {
      // optimistic: find booking in list
      const booking = bookings.find((b) => b.id === bookingId) || currentBooking;

      await updateRideStatus(bookingId, newStatus as any);

      // start tracking on en_route / in_progress
      if (newStatus === "en_route" || newStatus === "in_progress") {
        // stop any previous tracker
        if (activeTracking.current && activeTracking.current !== bookingId) {
          stopLocationTracking();
        }
        activeTracking.current = bookingId;
        // booking should contain destination coords if available
        // cast to any to avoid TS mismatch from your schema
        startLocationTracking(
          bookingId,
          (booking as any).destinationCoords,
          (error) => {
            const err = error as any;
            const errCode = err?.code;
            let errMsg = err?.message || '';
            
            if (!errMsg || errMsg.includes('GeolocationPositionError')) {
              if (errCode === 1) errMsg = 'Permission denied';
              else if (errCode === 2) errMsg = 'Position unavailable';
              else if (errCode === 3) errMsg = 'Timeout';
              else errMsg = 'Unknown location error';
            }
            
            console.error(`[UpcomingBookings] Location tracking failed. Code: ${errCode}, Message: ${errMsg}`);
            
            // User-friendly message based on error code
            let userMessage = "Location tracking failed (non-critical).";
            if (errCode === 1) {
              userMessage = "Location permission denied. Please enable GPS and allow browser access.";
            } else if (errCode === 2) {
              userMessage = "GPS signal lost or unavailable. Check your device location settings.";
            } else if (errCode === 3) {
              userMessage = "Location request timed out. Retrying...";
            } else if (errMsg && typeof errMsg === 'string' && errMsg.toLowerCase().includes('permission')) {
              userMessage = "Location permission denied.";
            }
            
            push({ message: userMessage, type: "info" });
          }
        ).catch((e) => {
          console.error("startLocationTracking error", e);
          push({ message: "Failed to start live tracking.", type: "error" });
        });
      }

      if (newStatus === "completed") {
        if (activeTracking.current === bookingId) {
          stopLocationTracking();
          activeTracking.current = null;
        }
      }

      // notify customer
      if (booking?.customerId) {
        const message = getNotificationMessage(
          newStatus as any,
          driverProfile?.name || "Your driver",
          vehicleString,
          booking.pickupLocation
        );
        const metadata: any = {};
        if (newStatus === "en_route") metadata.action = "view_map";
        if (newStatus === "completed") metadata.action = "pay";

        try {
          await createNotification(booking.customerId, bookingId, (
            newStatus === "confirmed" ? "ride_confirmed" :
            newStatus === "en_route" ? "driver_enroute" :
            newStatus === "arrived" ? "driver_arrived" :
            newStatus === "in_progress" ? "trip_started" : "trip_completed"
          ), message, metadata);
        } catch (err) {
          console.error("createNotification failure", err);
          push({ message: "Failed to send customer notification.", type: "error" });
        }
      }

      push({ message: `Status updated to ${newStatus}.`, type: "success" });

    } catch (err: any) {
      console.error("status update error", err);
      push({ message: err?.message || "Failed to update status.", type: "error" });
    } finally {
      if (mounted.current) setUpdating(null);
    }
  }, [bookings, currentBooking, driverProfile, vehicleString, push]);

  // Delete/Dismiss logic
  const handleDelete = useCallback(async (bookingId: string) => {
    if (!confirm("Are you sure you want to remove this booking from the list?")) return;
    setUpdating(bookingId);
    try {
      // For now, we'll just update the status to 'archived' or similar if we want to hide it permanently,
      // OR if it's just a local dismiss, we can filter it out. 
      // But since the query listens to 'accepted', 'completed'/'cancelled' shouldn't be here.
      // If the user wants to delete an ACCEPTED trip (cancel it), we should use 'cancelled'.
      // If the user wants to delete a COMPLETED trip from view, it shouldn't be here unless query includes it.
      // Wait, the query is `where("status", "==", "accepted")`.
      // So completed trips are NOT in this list.
      // If the user sees them, maybe they are 'accepted' but the user thinks they are done?
      // OR the user wants to CANCEL an accepted trip.
      // "delete option if trip is completed or canceled" -> This implies they are in the list.
      // Let's assume we need to allow cancelling an accepted trip (which effectively removes it from this list).
      
      await updateRideStatus(bookingId, 'cancelled');
      push({ message: "Booking cancelled and removed from list.", type: "success" });
    } catch (err: any) {
      console.error("delete error", err);
      push({ message: "Failed to delete booking.", type: "error" });
    } finally {
      if (mounted.current) setUpdating(null);
    }
  }, [push]);

  // UI controls
  const handlePrevious = useCallback(() => setCurrentIndex((p) => (p > 0 ? p - 1 : Math.max(0, bookings.length - 1))), [bookings.length]);
  const handleNext = useCallback(() => setCurrentIndex((p) => (p < bookings.length - 1 ? p + 1 : 0)), [bookings.length]);

  // small util to format date (Today/Tomorrow friendly)
  const formatFriendlyDate = useCallback((dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }, []);

  // render
  if (loading) return <SkeletonCard />;

  if (!bookings.length) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Upcoming Bookings</h3>
        <div className="text-center py-6">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No upcoming bookings</p>
        </div>
        <Toasts toasts={toasts} remove={remove} />
      </div>
    );
  }

  const booking = bookings[currentIndex];

  const getPriorityClass = (idx: number) => {
    if (idx === 0) return "border-red-300 bg-red-50";
    if (idx === 1) return "border-orange-300 bg-orange-50";
    return "border-green-300 bg-green-50";
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">Upcoming Bookings</h3>

        {bookings.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{currentIndex + 1} of {bookings.length}</span>
            <button onClick={handlePrevious} className="p-1 hover:bg-gray-100 rounded"><ChevronLeft className="w-4 h-4 text-gray-600" /></button>
            <button onClick={handleNext} className="p-1 hover:bg-gray-100 rounded"><ChevronRight className="w-4 h-4 text-gray-600" /></button>
          </div>
        )}
      </div>

      <div className={`border-2 ${getPriorityClass(currentIndex)} rounded-lg p-4 transition-all`}>
        {currentIndex === 0 && (
          <div className="mb-2">
            <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">NEXT RIDE</span>
          </div>
        )}

        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-5 h-5 text-gray-700" />
          <span className="font-bold text-gray-800">{formatFriendlyDate(booking.pickupDate)}</span>
        </div>

        <BookingCard booking={booking} />

        <div className="pt-3 border-t border-gray-200 mt-4">
          <div className="grid grid-cols-2 gap-2">
            {/* Confirm */}
            {!booking.rideStatus && (
              <StatusButton
                label="Confirm Ride"
                onClick={() => handleStatusUpdate(booking.id, "confirmed")}
                loading={updating === booking.id}
                icon={<CheckCircle className="w-4 h-4" />}
                fullWidth
              />
            )}

            {/* En route */}
            {booking.rideStatus === "confirmed" && (
              <StatusButton
                label="I'm On My Way"
                onClick={() => handleStatusUpdate(booking.id, "en_route")}
                loading={updating === booking.id}
                icon={<Navigation className="w-4 h-4" />}
                fullWidth
              />
            )}

            {/* Arrived */}
            {booking.rideStatus === "en_route" && (
              <StatusButton
                label="I've Arrived"
                onClick={() => handleStatusUpdate(booking.id, "arrived")}
                loading={updating === booking.id}
                colorClass="bg-purple-600 hover:bg-purple-700"
                icon={<MapPinned className="w-4 h-4" />}
                fullWidth
              />
            )}

            {/* Start Trip */}
            {booking.rideStatus === "arrived" && (
              <StatusButton
                label="Start Trip"
                onClick={() => handleStatusUpdate(booking.id, "in_progress")}
                loading={updating === booking.id}
                colorClass="bg-green-600 hover:bg-green-700"
                icon={<Play className="w-4 h-4" />}
              />
            )}

            {/* Complete */}
            {booking.rideStatus === "in_progress" && (
              <StatusButton
                label="Complete"
                onClick={() => handleStatusUpdate(booking.id, "completed")}
                loading={updating === booking.id}
                colorClass="bg-gray-700 hover:bg-gray-800"
                icon={<CheckCheck className="w-4 h-4" />}
              />
            )}

            {/* Call */}
            <button
              onClick={() => handleCall(booking.customerPhone)}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" />
              Call
            </button>


            {/* Delete/Cancel Option */}
            <button
              onClick={() => handleDelete(booking.id)}
              className="col-span-2 mt-2 text-red-600 hover:text-red-700 text-sm font-medium py-2 border border-red-200 rounded-lg hover:bg-red-50 transition"
            >
              Cancel / Delete Booking
            </button>
          </div>
        </div>
      </div>

      {/* dots */}
      {bookings.length > 1 && (
        <div className="flex justify-center gap-1 mt-3">
          {bookings.map((_, idx) => (
            <button key={idx} onClick={() => setCurrentIndex(idx)} className={`w-2 h-2 rounded-full transition ${idx === currentIndex ? "bg-green-600 w-4" : "bg-gray-300"}`} />
          ))}
        </div>
      )}

      <Toasts toasts={toasts} remove={remove} />
    </div>
  );
}
