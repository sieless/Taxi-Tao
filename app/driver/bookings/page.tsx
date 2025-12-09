"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { Calendar, MapPin, Clock, User, Phone } from "lucide-react";
import { BookingRequest } from "@/lib/types";

export default function DriverBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  useEffect(() => {
    if (!user) return;
    loadBookings();
  }, [user]);

  const loadBookings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Query bookings where acceptedBy is the current driver
      const q = query(
        collection(db, "bookingRequests"),
        where("acceptedBy", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      const bookingsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BookingRequest[];
      
      setBookings(bookingsList);
    } catch (error) {
      console.error("Error loading driver bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (filter === "all") return true;
    if (filter === "active") return !b.rideStatus || ['confirmed', 'en_route', 'arrived', 'in_progress'].includes(b.rideStatus);
    if (filter === "completed") return b.rideStatus === 'completed' || b.rideStatus === 'cancelled';
    return true;
  });

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case "completed": return "bg-blue-100 text-blue-800";
      case "cancelled": return "bg-red-100 text-red-800";
      case "in_progress": return "bg-green-100 text-green-800";
      case "confirmed": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:px-6 md:py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
          <p className="text-gray-600">History of your assigned rides</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex gap-2">
            {(["all", "active", "completed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium transition capitalize ${
                  filter === f
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No bookings found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition"
              >
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(booking.rideStatus || booking.status)}`}>
                        {booking.rideStatus?.replace(/_/g, " ") || booking.status}
                      </span>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(booking.createdAt)}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          <div className="w-2 h-2 rounded-full bg-green-500 mb-1"></div>
                          <div className="w-0.5 h-6 bg-gray-200 mx-auto"></div>
                          <div className="w-2 h-2 rounded-full bg-red-500 mt-1"></div>
                        </div>
                        <div className="flex-1 space-y-4">
                          <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Pickup</p>
                            <p className="font-medium text-gray-900">{booking.pickupLocation}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Destination</p>
                            <p className="font-medium text-gray-900">{booking.destination}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-auto border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{booking.customerName || "Customer"}</span>
                    </div>
                    {booking.customerPhone && (
                      <a 
                        href={`tel:${booking.customerPhone}`}
                        className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
                      >
                        <Phone className="w-4 h-4" />
                        {booking.customerPhone}
                      </a>
                    )}
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">Fare</p>
                      <p className="text-xl font-bold text-green-600">
                        {booking.fare
                          ? `KES ${booking.fare?.toLocaleString()}`
                          : 'TBD'}
                      </p>
                    </div>
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
