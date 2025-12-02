// lib/hooks/useUpcomingBookings.ts
"use client";

import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { BookingRequest } from '../types';
import { updateRideStatus, startLocationTracking, stopLocationTracking } from '../ride-tracking';
import { createNotification, getNotificationMessage } from '../notification-service';

export function useUpcomingBookings(driverId: string) {
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date().toISOString().split('T')[0];
    const q = query(
      collection(db, 'bookingRequests'),
      where('acceptedBy', '==', driverId),
      where('status', '==', 'accepted'),
      where('pickupDate', '>=', now),
      orderBy('pickupDate', 'asc'),
      orderBy('pickupTime', 'asc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: BookingRequest[] = [];
        snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() } as BookingRequest));
        setBookings(list);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching bookings:', error);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
      stopLocationTracking();
    };
  }, [driverId]);

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    setUpdatingStatus(bookingId);
    try {
      await updateRideStatus(bookingId, newStatus as any);

      const booking = bookings.find((b) => b.id === bookingId);
      if (booking?.customerPhone) {
        await createNotification(
          booking.customerPhone,
          bookingId,
          newStatus === 'confirmed' ? 'ride_confirmed' :
          newStatus === 'en_route' ? 'driver_enroute' :
          newStatus === 'arrived' ? 'driver_arrived' :
          newStatus === 'in_progress' ? 'trip_started' : 'trip_completed',
          getNotificationMessage(newStatus)
        );
      }

      if (newStatus === 'en_route') startLocationTracking(bookingId);
      if (newStatus === 'completed') stopLocationTracking();
    } catch (error) {
      console.error('Failed to update ride status:', error);
      alert('Failed to update ride status. Try again.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  return { bookings, loading, updatingStatus, handleStatusUpdate };
}
