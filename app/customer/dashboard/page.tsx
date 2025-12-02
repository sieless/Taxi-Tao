"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { MapPin, Calendar, Clock, PlusCircle } from "lucide-react";

interface Booking {
  id: string;
  pickupLocation: string;
  destination: string;
  pickupDate: string;
  pickupTime: string;
  status: string;
  rideStatus?: string;
}

export default function CustomerDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      // Load recent bookings
      const q = query(
        collection(db, "bookingRequests"),
        where("customerId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(5)
      );
      
      const snapshot = await getDocs(q);
      const bookings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Booking[];
      
      setRecentBookings(bookings);

      // Calculate stats
      const total = snapshot.size;
      const active = bookings.filter(b => !b.rideStatus || ['pending', 'confirmed', 'en_route', 'arrived', 'in_progress'].includes(b.rideStatus)).length;
      const completed = bookings.filter(b => b.rideStatus === 'completed').length;
      
      setStats({ total, active, completed });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Map Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-2xl p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">Welcome Back!</h1>
            <p className="text-green-50 mb-6">Ready for your next ride?</p>
            
            {/* Map Placeholder */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-12 text-center border-2 border-white/20">
              <MapPin className="w-16 h-16 mx-auto mb-4 text-white/80" />
              <p className="text-lg font-medium">Interactive Map</p>
              <p className="text-sm text-green-50 mt-2">Track your rides in real-time</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-sm text-gray-600 mb-1">Active Rides</p>
            <p className="text-3xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-sm text-gray-600 mb-1">Completed</p>
            <p className="text-3xl font-bold text-blue-600">{stats.completed}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => router.push("/customer/book")}
            className="bg-green-600 hover:bg-green-700 text-white rounded-xl p-8 text-left transition group"
          >
            <PlusCircle className="w-12 h-12 mb-4 group-hover:scale-110 transition" />
            <h3 className="text-2xl font-bold mb-2">Book a Ride</h3>
            <p className="text-green-50">Start a new booking now</p>
          </button>
          
          <button
            onClick={() => router.push("/customer/bookings")}
            className="bg-white hover:bg-gray-50 border-2 border-gray-200 rounded-xl p-8 text-left transition group"
          >
            <Calendar className="w-12 h-12 mb-4 text-green-600 group-hover:scale-110 transition" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">My Bookings</h3>
            <p className="text-gray-600">View booking history</p>
          </button>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Bookings</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            </div>
          ) : recentBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p>No bookings yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                  onClick={() => router.push("/customer/bookings")}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-green-600" />
                        <p className="font-medium text-gray-900">{booking.pickupLocation}</p>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-gray-600" />
                        <p className="text-sm text-gray-600">→ {booking.destination}</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {booking.pickupDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {booking.pickupTime}
                        </span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      booking.rideStatus === 'completed' ? 'bg-blue-100 text-blue-800' :
                      booking.rideStatus === 'in_progress' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {booking.rideStatus?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
