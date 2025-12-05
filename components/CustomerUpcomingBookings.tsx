"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { Calendar, MapPin, Clock, Phone, Bell } from "lucide-react";
import CustomerNotifications from "./CustomerNotifications";
import TripCompletedModal from "./TripCompletedModal";
import CancelBookingModal from "./CancelBookingModal";
import ModifyBookingModal from "./ModifyBookingModal";
import FareNegotiationModal from "./FareNegotiationModal";
import ShareTripButton from "./ShareTripButton";
import EmergencyButton from "./EmergencyButton";
import ReportIssueModal from "./ReportIssueModal";
import { submitRating } from "@/lib/rating-service";

import { BookingRequest } from "@/lib/types";

export default function CustomerUpcomingBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [completedBooking, setCompletedBooking] = useState<BookingRequest | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<BookingRequest | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [bookingToModify, setBookingToModify] = useState<BookingRequest | null>(null);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [negotiationId, setNegotiationId] = useState<string | null>(null);

  const [showNegotiationModal, setShowNegotiationModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [bookingToReport, setBookingToReport] = useState<BookingRequest | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "bookingRequests"),
      where("customerId", "==", user.uid),
      orderBy("pickupDate", "asc"),
      orderBy("pickupTime", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: BookingRequest[] = [];
        snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() } as BookingRequest));
        
        // Check for newly completed bookings
        list.forEach((booking) => {
          if (booking.rideStatus === 'completed' && !completedBooking) {
            setCompletedBooking(booking);
            setShowCompletionModal(true);
          }
        });
        
        setBookings(list);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching bookings:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleCallDriver = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleSubmitRating = async (rating: number, review: string) => {
    if (!completedBooking) return;
    
    try {
      await submitRating(completedBooking.id, rating, review);
      console.log('Rating submitted successfully');
    } catch (error) {
      console.error('Failed to submit rating:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-32"></div>
        <div className="h-48 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!bookings.length) {
    return (
      <div className="text-center text-gray-500 py-6">
        <p>No upcoming bookings</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-800">Upcoming Rides</h3>
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <Bell className="w-4 h-4" />
            Notifications
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <CustomerNotifications
            isOpen={notificationsOpen}
            onClose={() => setNotificationsOpen(false)}
            onUnreadCountChange={(count) => setUnreadCount(count)}
            onNotificationClick={(notification) => {
              if (notification.metadata?.action === 'negotiate' && notification.metadata.negotiationId) {
                setNegotiationId(notification.metadata.negotiationId);
                setShowNegotiationModal(true);
                setNotificationsOpen(false);
              }
            }}
          />
        </div>
      </div>

      {bookings.map((b) => (
        <div key={b.id} className="border-2 border-gray-200 p-4 rounded-lg bg-white shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-green-600" />
            <span className="font-bold text-gray-800">{formatDate(b.pickupDate)}</span>
          </div>

          <div className="flex items-center gap-2 mb-2 text-gray-700">
            <Clock className="w-4 h-4" />
            <span className="font-semibold">{b.pickupTime}</span>
          </div>

          <div className="flex items-start gap-2 mb-3 text-gray-700">
            <MapPin className="w-4 h-4 mt-0.5" />
            <div>
              <p className="font-medium">{b.pickupLocation}</p>
              <p className="text-sm text-gray-500">→ {b.destination}</p>
            </div>
          </div>

          {b.driverName && (
            <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
              <div className="text-sm">
                <p className="font-semibold text-gray-800">Driver: {b.driverName}</p>
                <p className="text-gray-600">{b.driverPhone}</p>
              </div>
              {b.driverPhone && (
                <button
                  onClick={() => handleCallDriver(b.driverPhone!)}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-xs flex items-center gap-1"
                >
                  <Phone className="w-4 h-4" /> Call
                </button>
              )}
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
            <span className="text-sm font-bold text-gray-700">
              Status:{" "}
              <span className={`
                ${b.rideStatus === 'completed' ? 'text-blue-600' : ''}
                ${b.rideStatus === 'cancelled' ? 'text-red-600' : ''}
                ${!b.rideStatus || b.rideStatus === 'confirmed' ? 'text-green-600' : ''}
              `}>
                {b.rideStatus ? b.rideStatus.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "Pending"}
              </span>
            </span>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {/* Share Button - Always visible for active rides */}
              {(!b.rideStatus || ['confirmed', 'en_route', 'arrived', 'in_progress'].includes(b.rideStatus)) && (
                <ShareTripButton 
                  bookingId={b.id} 
                  driverName={b.driverName} 
                  vehicleDetails={b.driverName ? 'Vehicle' : undefined} // Can pass actual vehicle if available
                />
              )}

              {/* Modify Button - Only for pending */}
              {(!b.rideStatus || b.rideStatus === 'pending') && (
                <button
                  onClick={() => {
                    setBookingToModify(b);
                    setShowModifyModal(true);
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline"
                >
                  Modify
                </button>
              )}

              {/* Cancel Button - Only for active bookings */}
              {(!b.rideStatus || ['confirmed', 'assigned', 'pending'].includes(b.rideStatus)) && (
                <button
                  onClick={() => {
                    setBookingToCancel(b);
                    setShowCancelModal(true);
                  }}
                  className="text-red-600 hover:text-red-700 text-sm font-medium hover:underline"
                >
                  Cancel Ride
                </button>
              )}

              {/* Report Issue - For active/completed rides */}
              {b.rideStatus && ['in_progress', 'completed'].includes(b.rideStatus) && (
                <button
                  onClick={() => {
                    setBookingToReport(b);
                    setShowReportModal(true);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-sm font-medium hover:underline"
                >
                  Report Issue
                </button>
              )}
            </div>
          </div>

          {/* Emergency SOS Button - Only show for active rides (in_progress) */}
          {b.rideStatus === 'in_progress' && (
            <EmergencyButton 
              bookingId={b.id} 
              driverName={b.driverName} 
              vehicleDetails={b.driverName ? 'Vehicle' : undefined}
            />
          )}
        </div>
      ))}

      {/* Trip Completed Modal */}
      {completedBooking && (
        <TripCompletedModal
          isOpen={showCompletionModal}
          onClose={() => {
            setShowCompletionModal(false);
            setCompletedBooking(null);
          }}
          bookingId={completedBooking.id}
          driverName={completedBooking.driverName || 'Your driver'}
          fare={completedBooking.fare || 0}
          onSubmitRating={handleSubmitRating}
        />
      )}

      {/* Cancel Booking Modal */}
      {bookingToCancel && (
        <CancelBookingModal
          isOpen={showCancelModal}
          onClose={() => {
            setShowCancelModal(false);
            setBookingToCancel(null);
          }}
          bookingId={bookingToCancel.id}
          onSuccess={() => {
            // Refresh logic is handled by onSnapshot automatically
            console.log('Booking cancelled');
          }}
        />
      )}

      {/* Modify Booking Modal */}
      {bookingToModify && showModifyModal && (
        <ModifyBookingModal
          booking={bookingToModify}
          onClose={() => {
            setShowModifyModal(false);
            setBookingToModify(null);
          }}
        />
      )}

      {/* Fare Negotiation Modal */}
      {negotiationId && showNegotiationModal && (
        <FareNegotiationModal
          negotiationId={negotiationId}
          userType="customer"
          onClose={() => {
            setShowNegotiationModal(false);
            setNegotiationId(null);
          }}
        />
      )}

      {/* Report Issue Modal */}
      {bookingToReport && (
        <ReportIssueModal
          isOpen={showReportModal}
          onClose={() => {
            setShowReportModal(false);
            setBookingToReport(null);
          }}
          bookingId={bookingToReport.id}
          driverId={undefined} // Can pass if available in booking object
        />
      )}
    </div>
  );
}
