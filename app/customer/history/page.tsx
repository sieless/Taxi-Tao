"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { getCustomerBookings } from "@/lib/booking-service";
import { BookingRequest } from "@/lib/types";
import { Calendar, MapPin, Clock, Star, Loader2, User, Car } from "lucide-react";
import { Timestamp } from "firebase/firestore";

export default function DriverHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    loadHistory();
  }, [user, authLoading, router]);

  const loadHistory = async () => {
    const phone = user?.phoneNumber || "";
    
    if (!phone) {
      // If no phone, we can't fetch history easily without prompting
      // For now, assume user has phone linked or prompt
      const enteredPhone = prompt("Please confirm your phone number to view history:");
      if (!enteredPhone) {
        setLoading(false);
        return;
      }
      fetchData(enteredPhone);
      return;
    }

    fetchData(phone);
  };

  const fetchData = async (phone: string) => {
    setLoading(true);
    try {
      const allBookings = await getCustomerBookings(phone);
      // Filter for completed rides only
      const history = allBookings.filter(b => b.status === 'completed');
      setBookings(history);
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: Timestamp | Date | undefined) => {
    if (!timestamp) return "N/A";
    const date = timestamp instanceof Date ? timestamp : (timestamp as Timestamp).toDate();
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Driver History</h1>
            <p className="text-gray-600">Your past completed trips and drivers</p>
          </div>
          <button
            onClick={() => router.push("/customer/bookings")}
            className="text-green-600 hover:text-green-700 font-medium"
          >
            View All Bookings
          </button>
        </div>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">No History Yet</h3>
            <p className="text-gray-600">You haven't completed any rides yet.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  {/* Trip Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                      <Calendar className="w-4 h-4" />
                      {formatDate(booking.createdAt)}
                      <span className="mx-2">•</span>
                      <Clock className="w-4 h-4" />
                      {booking.completedAt ? formatDate(booking.completedAt) : 'Completed'}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-bold">From</p>
                          <p className="font-medium text-gray-800">{booking.pickupLocation}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-bold">To</p>
                          <p className="font-medium text-gray-800">{booking.destination}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Driver Details (if available) */}
                  <div className="md:w-1/3 bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Driver Details
                    </h4>
                    {booking.acceptedBy ? (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-900">Driver ID: {booking.acceptedBy}</p>
                        {/* Ideally we would fetch driver name here if not stored in booking */}
                        <div className="flex items-center gap-1 text-yellow-500">
                          {[...Array(booking.rating || 0)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-current" />
                          ))}
                        </div>
                        {booking.review && (
                          <p className="text-xs text-gray-600 italic">"{booking.review}"</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Driver info not available</p>
                    )}
                    
                    {booking.fare && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500">Total Fare</p>
                        <p className="text-lg font-bold text-green-600">KES {booking.fare.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
