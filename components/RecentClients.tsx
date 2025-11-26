"use client";

import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BookingRequest } from '@/lib/types';
import { User } from 'lucide-react';

interface RecentClientsProps {
  driverId: string;
}

export default function RecentClients({ driverId }: RecentClientsProps) {
  const [clients, setClients] = useState<{ name: string; phone: string; daysAgo: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentClients();
  }, [driverId]);

  async function fetchRecentClients() {
    try {
      const q = query(
        collection(db, 'bookingRequests'),
        where('acceptedBy', '==', driverId),
        where('status', '==', 'completed'),
        orderBy('completedAt', 'desc'),
        limit(5)
      );

      const snapshot = await getDocs(q);
      const clientsList: { name: string; phone: string; daysAgo: string }[] = [];

      snapshot.forEach((doc) => {
        const booking = doc.data() as BookingRequest;
        const completedAt = booking.completedAt instanceof Timestamp ? booking.completedAt.toDate() : booking.completedAt ? new Date(booking.completedAt) : undefined;
        const daysAgo = completedAt ? getDaysAgo(completedAt) : 'Recently';

        clientsList.push({
          name: booking.customerName,
          phone: booking.customerPhone,
          daysAgo
        });
      });

      setClients(clientsList);
    } catch (error) {
      console.error('Error fetching recent clients:', error);
    } finally {
      setLoading(false);
    }
  }

  function getDaysAgo(date: Date): string {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Clients</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Clients</h3>
        <div className="text-center py-8">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No completed rides yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Clients</h3>
      <div className="space-y-3">
        {clients.map((client, index) => (
          <div key={index} className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-700 font-bold text-sm">
                {client.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800 text-sm">{client.name}</p>
              <p className="text-xs text-gray-500">{client.daysAgo}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
