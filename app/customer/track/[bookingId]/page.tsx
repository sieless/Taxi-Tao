"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BookingRequest } from '@/lib/types';
import { ArrowLeft, MapPin, Calendar, Clock, User, Phone, Loader2 } from 'lucide-react';
import LiveDriverMap from '@/components/LiveDriverMap';

export default function TrackRidePage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;
  
  const [booking, setBooking] = useState<BookingRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) {
      setError('No booking ID provided');
      setLoading(false);
      return;
    }

    const bookingRef = doc(db, 'bookingRequests', bookingId);
    
    // Real-time listener using onSnapshot
    const unsubscribe = onSnapshot(
      bookingRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setError('Booking not found');
          setLoading(false);
          return;
        }
        
        const bookingData = { id: snapshot.id, ...snapshot.data() } as BookingRequest;
        setBooking(bookingData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching booking:', err);
        setError('Failed to load booking details');
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading ride details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Booking Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'Unable to load booking details'}</p>
          <button
            onClick={() => router.push('/customer/bookings')}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition"
          >
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/customer/bookings')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Track Your Ride</h1>
              <p className="text-sm text-gray-500">Booking ID: {bookingId.slice(0, 8)}...</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Ride Details</h2>
          
          <div className="space-y-4">
            {/* Pickup Location */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">PICKUP</p>
                <p className="font-semibold text-gray-900">{booking.pickupLocation}</p>
              </div>
            </div>

            {/* Destination */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">DESTINATION</p>
                <p className="font-semibold text-gray-900">{booking.destination}</p>
              </div>
            </div>

            {/* Date & Time */}
            <div className="flex gap-6 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700">{booking.pickupDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700">{booking.pickupTime}</span>
              </div>
            </div>

            {/* Customer Info */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">{booking.customerName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700">{booking.customerPhone}</span>
              </div>
            </div>

            {/* Status Badge */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 font-medium mb-2">BOOKING STATUS</p>
              <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 capitalize">
                {booking.status}
              </span>
            </div>
          </div>
        </div>

        {/* Live Map - Real-time driver tracking */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden" style={{ height: '500px' }}>
          <LiveDriverMap
            driverPosition={booking.driverLocation ? {
              lat: booking.driverLocation.lat,
              lng: booking.driverLocation.lng
            } : null}
            pickupPosition={{ lat: -1.286389, lng: 36.817223 }}
            eta={booking.driverLocation ? 15 : undefined}
          />
        </div>
      </div>
    </div>
  );
}
