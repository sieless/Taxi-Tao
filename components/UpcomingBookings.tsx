"use client";

import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BookingRequest } from '@/lib/types';
import { Calendar, MapPin, Clock, Phone, ChevronLeft, ChevronRight } from 'lucide-react';

interface UpcomingBookingsProps {
  driverId: string;
}

export default function UpcomingBookings({ driverId }: UpcomingBookingsProps) {
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchUpcomingBookings();
  }, [driverId]);

  async function fetchUpcomingBookings() {
    try {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      const q = query(
        collection(db, 'bookingRequests'),
        where('acceptedBy', '==', driverId),
        where('status', '==', 'accepted'),
        where('pickupDate', '>=', todayStr),
        orderBy('pickupDate', 'asc'),
        orderBy('pickupTime', 'asc'),
        limit(5) // Get up to 5 upcoming bookings
      );

      const snapshot = await getDocs(q);
      
      const bookingsList: BookingRequest[] = [];
      snapshot.forEach((doc) => {
        bookingsList.push({ id: doc.id, ...doc.data() } as BookingRequest);
      });
      
      setBookings(bookingsList);
    } catch (error) {
      console.error('Error fetching upcoming bookings:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : bookings.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < bookings.length - 1 ? prev + 1 : 0));
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Upcoming Bookings</h3>
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-6 bg-gray-200 rounded w-24"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Upcoming Bookings</h3>
        <div className="text-center py-6">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No upcoming bookings</p>
        </div>
      </div>
    );
  }

  const currentBooking = bookings[currentIndex];
  const getPriorityClass = (index: number) => {
    if (index === 0) return 'border-red-300 bg-red-50'; // Most urgent
    if (index === 1) return 'border-orange-300 bg-orange-50';
    return 'border-green-300 bg-green-50';
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">Upcoming Bookings</h3>
        {bookings.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {currentIndex + 1} of {bookings.length}
            </span>
            <button
              onClick={handlePrevious}
              className="p-1 hover:bg-gray-100 rounded transition"
              aria-label="Previous booking"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={handleNext}
              className="p-1 hover:bg-gray-100 rounded transition"
              aria-label="Next booking"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        )}
      </div>
      
      <div className={`border-2 ${getPriorityClass(currentIndex)} rounded-lg p-4 transition-all`}>
        {/* Priority Badge */}
        {currentIndex === 0 && (
          <div className="mb-2">
            <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              NEXT RIDE
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-5 h-5 text-gray-700" />
          <span className="font-bold text-gray-800">{formatDate(currentBooking.pickupDate)}</span>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-gray-600 mt-0.5" />
            <span className="text-gray-700 font-semibold">{currentBooking.pickupTime}</span>
          </div>
          
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-gray-600 mt-0.5" />
            <div>
              <p className="text-gray-700 font-medium">{currentBooking.pickupLocation}</p>
              <p className="text-gray-500 text-xs">→ {currentBooking.destination}</p>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-300 mt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">
                  <span className="font-semibold">Customer:</span> {currentBooking.customerName}
                </p>
                <p className="text-gray-600 text-xs">{currentBooking.customerPhone}</p>
              </div>
              <button
                onClick={() => handleCall(currentBooking.customerPhone)}
                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition flex items-center gap-1"
                title="Call customer"
              >
                <Phone className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dots indicator for multiple bookings */}
      {bookings.length > 1 && (
        <div className="flex justify-center gap-1 mt-3">
          {bookings.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition ${
                idx === currentIndex ? 'bg-green-600 w-4' : 'bg-gray-300'
              }`}
              aria-label={`Go to booking ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
