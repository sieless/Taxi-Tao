"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Driver } from "@/lib/types";
import { Star, Car, MapPin, Briefcase, Loader2 } from "lucide-react";
import Link from "next/link";

export default function AvailableDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real-time listener for available drivers
    const q = query(
      collection(db, "drivers"),
      where("status", "==", "available"),
      where("subscriptionStatus", "==", "active")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const availableDrivers: Driver[] = [];
      snapshot.forEach((doc) => {
        availableDrivers.push({ id: doc.id, ...doc.data() } as Driver);
      });
      
      // Sort by rating (highest first)
      availableDrivers.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
      
      setDrivers(availableDrivers.slice(0, 6)); // Show max 6 drivers
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="py-20 bg-gradient-to-br from-gray-50 to-green-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-green-100 px-4 py-2 rounded-full mb-4">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-700 font-semibold">Loading Available Drivers...</span>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          </div>
        </div>
      </div>
    );
  }

  if (drivers.length === 0) {
    return null; // Don't show section if no drivers available
  }

  return (
    <div className="py-20 bg-gradient-to-br from-gray-50 to-green-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-green-100 px-4 py-2 rounded-full mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-700 font-semibold">Live Updates</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Available Drivers
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Book instantly with one of our {drivers.length} online drivers ready to serve you
          </p>
        </div>

        {/* Driver Cards Grid - 4 columns for narrower cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-[1400px] mx-auto">
          {drivers.map((driver) => (
            <div
              key={driver.id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-visible group relative"
              style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
            >
              {/* Profile Picture - Fully Visible at Top Left */}
              <div className="absolute -top-6 left-4 z-20">
                <div className="relative w-24 h-24 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-white">
                  {driver.profilePhotoUrl ? (
                    <img
                      src={driver.profilePhotoUrl}
                      alt={driver.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        {driver.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                {/* Online status indicator on profile */}
                <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
              </div>

              {/* Car Photo Header - Compact */}
              <div className="relative h-32 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden rounded-t-2xl mt-6">
                {driver.vehicle?.carPhotoUrl ? (
                  <img
                    src={driver.vehicle.carPhotoUrl}
                    alt={`${driver.vehicle.make} ${driver.vehicle.model}`}
                    className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-400 to-green-600">
                    <Car className="w-16 h-16 text-white/50" />
                  </div>
                )}
                
                {/* Online Badge - Top Right */}
                <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                  ONLINE
                </div>

                {/* Registration Number Badge - Bottom Right */}
                {driver.vehicle?.plate && (
                  <div className="absolute bottom-2 right-2 bg-white/95 backdrop-blur-sm text-gray-800 px-2 py-1 rounded text-xs font-bold shadow-md border border-gray-200">
                    🚗 {driver.vehicle.plate}
                  </div>
                )}
              </div>

              {/* Driver Details - Maximized Space, No Extra Padding */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-1">
                  {driver.name}
                </h3>

                {/* Rating - Compact */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < Math.round(driver.averageRating || 0)
                            ? "text-yellow-500 fill-yellow-500"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-gray-700">
                    {driver.averageRating ? driver.averageRating.toFixed(1) : "New"}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({driver.totalRides || 0})
                  </span>
                </div>

                {/* Vehicle Info - Compact */}
                {driver.vehicle && (
                  <div className="flex items-center gap-2 text-xs text-gray-700 mb-2 bg-gray-50 px-2 py-1.5 rounded">
                    <Car className="w-3.5 h-3.5 text-green-600" />
                    <span className="font-semibold">
                      {driver.vehicle.make} {driver.vehicle.model}
                    </span>
                    <span className="ml-auto text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full capitalize font-medium">
                      {driver.vehicle.type}
                    </span>
                  </div>
                )}

                {/* Experience & Location - Compact */}
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                    <span>{driver.experienceYears || 0} Yrs Exp</span>
                  </div>
                  {driver.businessLocation && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span>{driver.businessLocation}</span>
                    </div>
                  )}
                </div>

                {/* Book Now Button - Compact */}
                <Link
                  href="/#book-taxi"
                  className="block w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold py-2.5 rounded-lg text-center transition-all shadow-md hover:shadow-lg text-sm"
                >
                  Book Now
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* View All Drivers Link */}
        <div className="text-center mt-12">
          <Link
            href="/drivers"
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold"
          >
            View All Drivers
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
