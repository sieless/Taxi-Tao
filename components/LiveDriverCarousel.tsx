"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Driver } from "@/lib/types";
import { Car, ChevronLeft, ChevronRight, Phone } from "lucide-react";

interface LiveDriverCarouselProps {
  vehicleType?: string;
}

export default function LiveDriverCarousel({ vehicleType }: LiveDriverCarouselProps) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
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
        const driverData = { id: doc.id, ...doc.data() } as Driver;
        // Only include drivers with car photos
        if (driverData.vehicles?.[0]?.images?.[0]) {
          // Filter by vehicle type if provided
          if (vehicleType && driverData.vehicles[0].type !== vehicleType) {
            return;
          }
          availableDrivers.push(driverData);
        }
      });

      availableDrivers.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
      setDrivers(availableDrivers);
      setLoading(false);
    }, (error) => {
      console.error("LiveDriverCarousel listener error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (drivers.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % drivers.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [drivers.length]);

  const nextDriver = () => {
    setCurrentIndex((prev) => (prev + 1) % drivers.length);
  };

  const prevDriver = () => {
    setCurrentIndex((prev) => (prev - 1 + drivers.length) % drivers.length);
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-8 h-96 flex items-center justify-center">
        <div className="text-center">
          <Car className="w-16 h-16 text-green-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">Loading live drivers...</p>
        </div>
      </div>
    );
  }

  if (drivers.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 h-96 flex items-center justify-center">
        <div className="text-center">
          <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">
            {vehicleType 
              ? `No ${vehicleType} drivers online right now`
              : "No drivers online right now"}
          </p>
          <p className="text-sm text-gray-500 mt-2">Please check back soon or try another service type</p>
        </div>
      </div>
    );
  }

  const currentDriver = drivers[currentIndex];

  return (
    <div className="relative">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            {drivers.length} {vehicleType ? `${vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1)} ` : ""}Drivers Online Now
          </h3>
          <p className="text-sm text-gray-600">Auto-rotating every 5 seconds</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={prevDriver}
            className="p-2 rounded-full bg-white shadow-md hover:shadow-lg hover:bg-gray-50 transition"
            aria-label="Previous driver"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={nextDriver}
            className="p-2 rounded-full bg-white shadow-md hover:shadow-lg hover:bg-gray-50 transition"
            aria-label="Next driver"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Carousel Container */}
      <div className="relative bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl overflow-hidden shadow-xl" style={{ height: '400px' }}>
        {/* Car Photo with Fade Animation */}
        {drivers.map((driver, index) => (
          <div
            key={driver.id}
            className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
            style={{
              opacity: index === currentIndex ? 1 : 0,
              pointerEvents: index === currentIndex ? 'auto' : 'none',
            }}
          >
            {driver.vehicles?.[0]?.images?.[0] && (
              <img
                src={driver.vehicles[0].images[0]}
                alt={`${driver.vehicles[0].make} ${driver.vehicles[0].model}`}
                className="w-full h-full object-cover"
              />
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>

            {/* Driver Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div className="flex items-end gap-4">
                {/* Profile Picture */}
                <div className="w-20 h-20 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white flex-shrink-0">
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

                {/* Driver Details */}
                <div className="flex-1">
                  <h4 className="text-2xl font-bold mb-1">{driver.name}</h4>
                  <p className="text-white/90 font-semibold mb-1">
                    {driver.vehicles?.[0]?.make} {driver.vehicles?.[0]?.model} • {driver.vehicles?.[0]?.plate}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="bg-green-500 px-3 py-1 rounded-full font-bold">
                      ONLINE
                    </span>
                    {driver.averageRating && (
                      <span>⭐ {driver.averageRating.toFixed(1)} ({driver.totalRides || 0} rides)</span>
                    )}
                    {driver.businessLocation && (
                      <span>📍 {driver.businessLocation}</span>
                    )}
                  </div>
                  
                  {/* Quick Call Button */}
                  <a
                    href={`tel:${driver.phone}`}
                    className="mt-3 inline-flex items-center gap-2 bg-white text-green-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-green-50 transition shadow-md"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Phone className="w-4 h-4" />
                    Call Now
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Progress Dots */}
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 flex gap-2">
          {drivers.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-white w-8'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to driver ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
