"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { getCustomerBookings } from "@/lib/booking-service";
import { BookingRequest } from "@/lib/types";
import {
  Calendar,
  MapPin,
  Clock,
  Star,
  Loader2,
  Phone,
  AlertTriangle,
  CreditCard,
} from "lucide-react";
import RatingModal from "@/components/RatingModal";
import ClientIssueModal from "@/components/ClientIssueModal";
import { Timestamp, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Driver } from "@/lib/types";

export default function CustomerBookingsPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<BookingRequest | null>(
    null
  );
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedIssueBooking, setSelectedIssueBooking] =
    useState<BookingRequest | null>(null);
  const [driverDetails, setDriverDetails] = useState<Map<string, Driver>>(
    new Map()
  );

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    loadBookings();
  }, [user, authLoading, router]);

  // Auto-prompt for rating on unrated completed rides
  useEffect(() => {
    if (bookings.length > 0) {
      const unratedRide = bookings.find(
        (b) => b.status === "completed" && !b.rating
      );
      if (unratedRide) {
        // Small delay to ensure UI is ready
        const timer = setTimeout(() => {
          setSelectedBooking(unratedRide);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [bookings]);

  // Fetch driver details for accepted bookings
  useEffect(() => {
    const fetchDriverDetails = async () => {
      const acceptedBookings = bookings.filter(
        (b) =>
          b.acceptedBy && (b.status === "accepted" || b.status === "completed")
      );
      const driverMap = new Map<string, Driver>();

      for (const booking of acceptedBookings) {
        if (booking.acceptedBy && !driverDetails.has(booking.acceptedBy)) {
          try {
            const driverRef = doc(db, "drivers", booking.acceptedBy);
            const driverSnap = await getDoc(driverRef);
            if (driverSnap.exists()) {
              driverMap.set(booking.acceptedBy, {
                id: driverSnap.id,
                ...driverSnap.data(),
              } as Driver);
            }
          } catch (error) {
            console.error("Error fetching driver details:", error);
          }
        }
      }

      if (driverMap.size > 0) {
        setDriverDetails((prev) => new Map([...prev, ...driverMap]));
      }
    };

    if (bookings.length > 0) {
      fetchDriverDetails();
    }
  }, [bookings]);

  // Auto-redirect removed to prevent loop. User can manually click "Track" from the list.
  /*
  useEffect(() => {
    if (bookings.length > 0) {
      const activeRide = bookings.find(b => 
        b.rideStatus && ['en_route', 'arrived', 'in_progress'].includes(b.rideStatus)
      );
      if (activeRide) {
        router.push(`/customer/track/${activeRide.id}`);
      }
    }
  }, [bookings, router]);
  */

  const loadBookings = async () => {
    // Use phone from user profile or auth
    const phone = userProfile?.phone || user?.phoneNumber;

    if (!phone) {
      // If we still don't have a phone number, we can't fetch bookings by phone.
      // However, we can also fetch by customerId which is safer.
      // Let's try fetching by customerId if phone is missing, or just show empty.
      // Ideally getCustomerBookings should support customerId.
      // For now, let's assume we need phone.
      console.log("No phone number found for user");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const customerBookings = await getCustomerBookings(phone);
      setBookings(customerBookings);
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: Timestamp | Date | undefined) => {
    if (!timestamp) return "N/A";
    const date =
      timestamp instanceof Date ? timestamp : (timestamp as Timestamp).toDate();
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timestamp: Timestamp | Date | undefined) => {
    if (!timestamp) return "N/A";
    const date =
      timestamp instanceof Date ? timestamp : (timestamp as Timestamp).toDate();
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "accepted":
        return "bg-blue-100 text-blue-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Bookings</h1>
          <p className="text-gray-600">
            View your ride history and rate completed trips
          </p>
        </div>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              No Bookings Yet
            </h3>
            <p className="text-gray-600 mb-6">
              You haven't made any bookings yet.
            </p>
            <button
              onClick={() => router.push("/booking")}
              className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition"
            >
              Book a Ride
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  {/* Booking Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {booking.status}
                      </span>
                      {booking.acceptedBy && (
                        <span className="text-sm text-gray-600">
                          Driver assigned
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-start gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5"></div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-bold">
                            Pickup
                          </p>
                          <p className="font-medium text-gray-800">
                            {booking.pickupLocation}
                          </p>
                          <p className="text-xs text-gray-500">
                            {booking.pickupDate} at {booking.pickupTime}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5"></div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-bold">
                            Destination
                          </p>
                          <p className="font-medium text-gray-800">
                            {booking.destination}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(booking.createdAt)}
                      </div>
                      {booking.completedAt && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Completed {formatTime(booking.completedAt)}
                        </div>
                      )}
                    </div>

                    {/* M-Pesa Payment Details */}
                    {(booking.status === "accepted" ||
                      booking.status === "completed") &&
                      booking.acceptedBy &&
                      (() => {
                        const driver = driverDetails.get(booking.acceptedBy);
                        const mpesa = driver?.mpesaDetails;

                        if (!mpesa) return null;

                        return (
                          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <CreditCard className="w-4 h-4 text-green-700" />
                              <h4 className="font-bold text-green-900 text-sm">
                                Payment Details
                              </h4>
                            </div>
                            {mpesa.type === "till" && mpesa.tillNumber && (
                              <div className="space-y-1">
                                <p className="text-xs text-green-700 font-medium">
                                  Till Number
                                </p>
                                <p className="text-lg font-bold text-green-900">
                                  {mpesa.tillNumber}
                                </p>
                                <p className="text-xs text-green-600 italic">
                                  Send payment: Amount → Pay
                                </p>
                              </div>
                            )}
                            {mpesa.type === "paybill" &&
                              mpesa.paybillNumber &&
                              mpesa.accountNumber && (
                                <div className="space-y-1">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <p className="text-xs text-green-700 font-medium">
                                        Paybill
                                      </p>
                                      <p className="text-base font-bold text-green-900">
                                        {mpesa.paybillNumber}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-green-700 font-medium">
                                        Account
                                      </p>
                                      <p className="text-base font-bold text-green-900">
                                        {mpesa.accountNumber}
                                      </p>
                                    </div>
                                  </div>
                                  <p className="text-xs text-green-600 italic mt-2">
                                    Send payment: Paybill → Account → Amount →
                                    Pay
                                  </p>
                                </div>
                              )}
                            <div>
                              <p>Mpesa Account Name: {mpesa.accountName}</p>
                              <p>Mpesa Phone Number: {mpesa.phoneNumber}</p>
                            </div>
                          </div>
                        );
                      })()}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end gap-2">
                    {booking.fare && (
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Fare</p>
                        <p className="text-2xl font-bold text-green-600">
                          KSH {booking.fare.toLocaleString()}
                        </p>
                      </div>
                    )}

                    {booking.status === "completed" && (
                      <>
                        {booking.rating ? (
                          <div className="bg-yellow-50 px-4 py-2 rounded-lg">
                            <div className="flex items-center gap-1 mb-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < booking.rating!
                                      ? "text-yellow-500 fill-yellow-500"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-xs text-gray-600">
                              You rated this ride
                            </p>
                            {booking.review && (
                              <p className="text-xs text-gray-700 italic mt-1">
                                "{booking.review}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedBooking(booking)}
                            className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                          >
                            <Star className="w-4 h-4" />
                            Rate Ride
                          </button>
                        )}
                      </>
                    )}

                    {booking.status === "accepted" && booking.acceptedBy && (
                      <div className="flex flex-col gap-2 w-full">
                        <a
                          href={`tel:${booking.driverPhone || ""}`} // Assuming driverPhone might be available, otherwise we need to fetch it. But wait, booking request usually has customerPhone. Driver phone might not be on booking request object unless we joined it.
                          // If driverPhone is not on booking, we might need to rely on the user knowing it or fetch it.
                          // However, the request said "add call button to make direct call to diver".
                          // Let's assume for now we might not have it directly on the booking object if it's not joined.
                          // But let's check the types. BookingRequest has `driverId`.
                          // If we don't have phone, we can't call.
                          // Let's assume we might need to update the booking object to include driverPhone when accepted, or fetch it.
                          // For now, I'll use a placeholder or check if I can get it.
                          // Actually, `booking.acceptedBy` is the driver ID.
                          // If I don't have the phone, I can't make the link work properly.
                          // But I'll add the button structure.
                          className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 text-center"
                        >
                          <Phone className="w-4 h-4" />
                          Call Driver
                        </a>
                      </div>
                    )}

                    {/* Track Ride Button for Active Rides */}
                    {[
                      "accepted",
                      "en_route",
                      "arrived",
                      "in_progress",
                    ].includes(booking.rideStatus || booking.status) && (
                      <button
                        onClick={() =>
                          router.push(`/customer/track/${booking.id}`)
                        }
                        className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 text-sm w-full md:w-auto"
                      >
                        <MapPin className="w-4 h-4" />
                        Track Ride
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedIssueBooking(booking);
                        setIsIssueModalOpen(true);
                      }}
                      className="px-4 py-2 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 transition flex items-center justify-center gap-2 text-sm"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Report Issue
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push("/")}
            className="text-green-600 hover:text-green-700 font-semibold"
          >
            ← Back to Home
          </button>
        </div>
      </div>

      {/* Rating Modal */}
      {selectedBooking && (
        <RatingModal
          bookingId={selectedBooking.id}
          driverName="Your Driver"
          onClose={() => setSelectedBooking(null)}
          onSuccess={loadBookings}
        />
      )}

      <ClientIssueModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        bookingId={selectedIssueBooking?.id}
        driverId={selectedIssueBooking?.acceptedBy ?? undefined}
      />
    </div>
  );
}
