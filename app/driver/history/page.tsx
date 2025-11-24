"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getDriverRideHistory } from "@/lib/booking-service";
import { BookingRequest } from "@/lib/types";
import { Calendar, MapPin, DollarSign, Star, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

export default function RideHistoryPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [rides, setRides] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRides: 0,
    totalEarnings: 0,
    averageRating: 0,
  });

  useEffect(() => {
    if (authLoading) return;

    if (!user || !userProfile || userProfile.role !== "driver") {
      router.push("/driver/login");
      return;
    }

    loadRideHistory();
  }, [user, userProfile, authLoading, router]);

  const loadRideHistory = async () => {
    if (!userProfile?.driverId) return;

    try {
      setLoading(true);
      const history = await getDriverRideHistory(userProfile.driverId);
      setRides(history);

      // Calculate statistics
      const totalEarnings = history.reduce((sum, ride) => sum + (ride.fare || 0), 0);
      const ratedRides = history.filter((ride) => ride.rating);
      const avgRating =
        ratedRides.length > 0
          ? ratedRides.reduce((sum, ride) => sum + (ride.rating || 0), 0) / ratedRides.length
          : 0;

      setStats({
        totalRides: history.length,
        totalEarnings,
        averageRating: Math.round(avgRating * 10) / 10,
      });
    } catch (error) {
      console.error("Error loading ride history:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ride history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Ride History</h1>
          <p className="text-gray-600">View all your completed rides and earnings</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Rides</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalRides}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
                <p className="text-3xl font-bold text-gray-800">
                  KSH {stats.totalEarnings.toLocaleString()}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Average Rating</p>
                <p className="text-3xl font-bold text-gray-800">
                  {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "N/A"}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Ride List */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Completed Rides</h2>
          </div>

          {rides.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-2">No completed rides yet</p>
              <p className="text-gray-500 text-sm">Your ride history will appear here once you complete rides</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {rides.map((ride) => (
                <div key={ride.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="bg-green-100 p-2 rounded-lg mt-1">
                          <MapPin className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-500 mb-1">From</p>
                          <p className="font-semibold text-gray-800">{ride.pickupLocation}</p>
                          <p className="text-sm text-gray-500 mt-2 mb-1">To</p>
                          <p className="font-semibold text-gray-800">{ride.destination}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(ride.completedAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTime(ride.completedAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{ride.customerName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:items-end gap-2">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Fare</p>
                        <p className="text-2xl font-bold text-green-600">
                          KSH {ride.fare?.toLocaleString() || "N/A"}
                        </p>
                      </div>

                      {ride.rating && (
                        <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="font-semibold text-yellow-700">{ride.rating}/5</span>
                        </div>
                      )}

                      {ride.review && (
                        <div className="mt-2 max-w-xs">
                          <p className="text-xs text-gray-500 mb-1">Review:</p>
                          <p className="text-sm text-gray-700 italic">"{ride.review}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back to Dashboard Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push("/driver/dashboard")}
            className="text-green-600 hover:text-green-700 font-semibold"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
