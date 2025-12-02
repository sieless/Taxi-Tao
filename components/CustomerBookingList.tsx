"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BookingRequest } from "@/lib/types";
import CustomerBookingCard from "./CustomerBookingCard";

interface CustomerBookingListProps {
  userId: string;
}

export default function CustomerBookingList({ userId }: CustomerBookingListProps) {
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "bookingRequests"),
      where("customerId", "==", userId),
      orderBy("pickupDate", "asc"),
      orderBy("pickupTime", "asc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: BookingRequest[] = [];
        snapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() } as BookingRequest);
        });
        setBookings(data);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching customer bookings:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        <div className="h-48 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center text-gray-500 py-6">
        <p>No upcoming rides</p>
      </div>
    );
  }

  const handleCallDriver = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <CustomerBookingCard
          key={booking.id}
          booking={booking}
          onCallDriver={handleCallDriver}
        />
      ))}
    </div>
  );
}
