"use client";

import { MapPin } from "lucide-react";

export default function FindDriversButton() {
  const handleFindDrivers = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          alert(`Finding drivers within 5km of your location...\n\nNote: This feature will show drivers near:\nLatitude: ${position.coords.latitude.toFixed(4)}\nLongitude: ${position.coords.longitude.toFixed(4)}\n\nComing soon: Real-time driver locations!`);
        },
        (error) => {
          alert("Please enable location services to find drivers near you.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  return (
    <button
      onClick={handleFindDrivers}
      className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full transition flex items-center gap-2 shadow-lg"
    >
      <MapPin className="w-5 h-5" />
      Find Drivers Near Me (5km)
    </button>
  );
}
