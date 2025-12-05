"use client";

import { BookingRequest } from "@/lib/types";
import { Calendar, MapPin, Clock, Phone } from "lucide-react";

interface CustomerBookingCardProps {
  booking: BookingRequest;
  onCallDriver?: (phone: string) => void;
}

export default function CustomerBookingCard({
  booking,
  onCallDriver,
}: CustomerBookingCardProps) {
  const handleCall = () => {
    if (onCallDriver && booking.driverPhone) {
      onCallDriver(booking.driverPhone);
    }
  };

  const getStatusLabel = () => {
    switch (booking.rideStatus) {
      case "confirmed":
        return "Confirmed";
      case "en_route":
        return "Driver En Route";
      case "arrived":
        return "Driver Arrived";
      case "in_progress":
        return "Trip Started";
      case "completed":
        return "Completed";
      default:
        return "Pending";
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm space-y-3">
      {/* Date & Status */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-gray-700">
          <Calendar className="w-5 h-5" />
          <span className="font-semibold">{booking.pickupDate}</span>
        </div>
        <span className="text-xs font-bold px-2 py-1 rounded bg-green-100 text-green-700">
          {getStatusLabel()}
        </span>
      </div>

      {/* Pickup & Destination */}
      <div className="space-y-1 text-gray-700 text-sm">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 mt-0.5" />
          <span>{booking.pickupTime}</span>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 mt-0.5" />
          <div>
            <p className="font-medium">{booking.pickupLocation}</p>
            <p className="text-xs text-gray-500">→ {booking.destination}</p>
          </div>
        </div>
      </div>

      {/* Driver Info */}
      {booking.driverName && (
        <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-gray-700 text-sm">
          <div>
            <p className="font-semibold">{booking.driverName}</p>
          </div>
        </div>
      )}
    </div>
  );
}
