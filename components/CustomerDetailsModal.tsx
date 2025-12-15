"use client";

import { useEffect, useState } from "react";
import {
  X,
  Phone,
  MapPin,
  Calendar,
  Clock,
  User,
  MessageCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BookingRequest } from "@/lib/types";
import { acceptBooking } from "@/lib/booking-service";
import { Loader2 } from "lucide-react";

interface CustomerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  driverId: string;
  onBookingAccepted?: () => void;
}

export default function CustomerDetailsModal({
  isOpen,
  onClose,
  bookingId,
  driverId,
  onBookingAccepted,
}: CustomerDetailsModalProps) {
  const [booking, setBooking] = useState<BookingRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (isOpen && bookingId) {
      loadBookingDetails();
    }
  }, [isOpen, bookingId]);

  async function loadBookingDetails() {
    try {
      setLoading(true);
      const bookingRef = doc(db, "bookingRequests", bookingId);
      const bookingSnap = await getDoc(bookingRef);

      if (bookingSnap.exists()) {
        setBooking({
          id: bookingSnap.id,
          ...bookingSnap.data(),
        } as BookingRequest);
      } else {
        alert("Booking not found");
        onClose();
      }
    } catch (error) {
      console.error("Error loading booking:", error);
      alert("Failed to load booking details");
    } finally {
      setLoading(false);
    }
  }

  async function handleAcceptBooking() {
    if (!booking || !driverId) return;

    setAccepting(true);
    try {
      const result = await acceptBooking(bookingId, driverId);

      if (result.success) {
        alert("✅ Booking accepted! Contact the customer immediately.");
        if (onBookingAccepted) {
          onBookingAccepted();
        }
        onClose();
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error("Error accepting booking:", error);
      alert("Failed to accept booking. Please try again.");
    } finally {
      setAccepting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-800">
            Customer & Booking Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          ) : !booking ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Booking not found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Customer Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Customer Information
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Name</p>
                    <p className="font-semibold text-gray-900">
                      {booking.customerName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Phone</p>
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${booking.customerPhone}`}
                        className="font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-2"
                      >
                        <Phone className="w-4 h-4" />
                        {booking.customerPhone}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-600" />
                  Ride Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Pickup Location
                    </p>
                    <p className="font-semibold text-gray-900">
                      {booking.pickupLocation}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Destination</p>
                    <p className="font-semibold text-gray-900">
                      {booking.destination}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                    <div>
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Date
                      </p>
                      <p className="font-semibold text-gray-900">
                        {booking.pickupDate}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Time
                      </p>
                      <p className="font-semibold text-gray-900">
                        {booking.pickupTime}
                      </p>
                    </div>
                  </div>
                  {booking.fareEstimate && (
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">
                        Estimated Price
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        KSH {booking.fareEstimate.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {booking.notes && (
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Notes</p>
                      <p className="text-sm text-gray-700">{booking.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    booking.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : booking.status === "accepted"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {booking.status.toUpperCase()}
                </span>
              </div>

              {/* Actions */}
              {booking.status === "pending" && (
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleAcceptBooking}
                    disabled={accepting}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {accepting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Accepting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Accept Booking
                      </>
                    )}
                  </button>
                  <a
                    href={`tel:${booking.customerPhone}`}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"
                  >
                    <Phone className="w-5 h-5" />
                    Call Customer
                  </a>
                  <a
                    href={`https://wa.me/${booking.customerPhone.replace(
                      /\D/g,
                      ""
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-3 px-6 rounded-lg transition"
                  >
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp
                  </a>
                </div>
              )}

              {booking.status === "accepted" &&
                booking.acceptedBy === driverId && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-800 font-semibold flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        You have accepted this booking
                      </p>
                      <p className="text-xs text-green-700 mt-2">
                        Contact the customer to confirm pickup details and
                        negotiate final price if needed.
                      </p>
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
