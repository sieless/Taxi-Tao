"use client";

import { Clock, MapPin, Phone, Loader2, CheckCircle, Navigation, MapPinned, Play, CheckCheck } from 'lucide-react';

interface BookingCardProps {
  booking: any; // Replace with proper BookingRequest type
  onStatusUpdate: (bookingId: string, status: string) => Promise<void>;
  updatingStatus?: string | null;
  onCall: (phone: string) => void;
}

export default function BookingCard({ booking, onStatusUpdate, updatingStatus, onCall }: BookingCardProps) {
  const isUpdating = updatingStatus === booking.id;

  return (
    <div className="border rounded-lg p-4 mb-4 bg-white shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-4 h-4 text-gray-600" />
        <span className="font-semibold text-gray-700">{booking.pickupTime}</span>
      </div>
      <div className="flex items-start gap-2 mb-2">
        <MapPin className="w-4 h-4 text-gray-600 mt-0.5" />
        <div>
          <p className="text-gray-700 font-medium">{booking.pickupLocation}</p>
          <p className="text-gray-500 text-xs">→ {booking.destination}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-2">
        {/* Ride status buttons */}
        {!booking.rideStatus && (
          <button
            onClick={() => onStatusUpdate(booking.id, 'confirmed')}
            disabled={isUpdating}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-1 disabled:opacity-50"
          >
            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Confirm Ride
          </button>
        )}
        {booking.rideStatus === 'confirmed' && (
          <button
            onClick={() => onStatusUpdate(booking.id, 'en_route')}
            disabled={isUpdating}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-1 disabled:opacity-50"
          >
            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            I'm On My Way
          </button>
        )}
        {booking.rideStatus === 'en_route' && (
          <button
            onClick={() => onStatusUpdate(booking.id, 'arrived')}
            disabled={isUpdating}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-1 disabled:opacity-50"
          >
            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPinned className="w-4 h-4" />}
            I've Arrived
          </button>
        )}
        {booking.rideStatus === 'arrived' && (
          <button
            onClick={() => onStatusUpdate(booking.id, 'in_progress')}
            disabled={isUpdating}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-1 disabled:opacity-50"
          >
            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Start Trip
          </button>
        )}
        {booking.rideStatus === 'in_progress' && (
          <button
            onClick={() => onStatusUpdate(booking.id, 'completed')}
            disabled={isUpdating}
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-1 disabled:opacity-50"
          >
            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
            Complete
          </button>
        )}

        {/* Call button */}
        <button
          onClick={() => onCall(booking.customerPhone)}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-1"
        >
          <Phone className="w-4 h-4" />
          Call
        </button>
      </div>
    </div>
  );
}
