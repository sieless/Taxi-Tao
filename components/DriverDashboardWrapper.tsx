// components/DriverDashboardWrapper.tsx
"use client";

import { useState } from 'react';
import DriverProfileCard from './DriverProfileCard';
import UpcomingBookings from './UpcomingBookings';
import DriverNotifications from './DriverNotifications';
import { useAuth } from '@/lib/auth-context';
import { Bell } from 'lucide-react';

export default function DriverDashboardWrapper() {
  const { user, userProfile, driverProfile } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  if (!user) return <p className="p-4">Loading user...</p>;

  return (
    <div className="space-y-6 p-6">
      {/* Header with notifications */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Driver Dashboard</h1>
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 bg-green-600 hover:bg-green-700 rounded-full transition"
            aria-label="Driver Notifications"
          >
            <Bell className="w-5 h-5 text-white" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <DriverNotifications
            isOpen={notificationsOpen}
            onClose={() => setNotificationsOpen(false)}
            onUnreadCountChange={setUnreadCount}
          />
        </div>
      </div>

      {/* Driver profile */}
      {driverProfile && (
        <DriverProfileCard
          driver={{
            name: driverProfile.name || userProfile?.name || user.displayName || 'Driver',
            phone: driverProfile.phone || user.phoneNumber || '',
            profilePhotoUrl: driverProfile.profilePhotoUrl || user.photoURL || undefined,
            vehicle: {
              make: driverProfile.vehicle?.make || '',
              model: driverProfile.vehicle?.model || '',
              plate: driverProfile.vehicle?.plate || '',
              color: driverProfile.vehicle?.color,
              year: driverProfile.vehicle?.year,
            },
          }}
        />
      )}

      {/* Upcoming Bookings */}
      {driverProfile?.id && (
        <UpcomingBookings 
          driverId={driverProfile.id} 
          driverProfile={driverProfile}
        />
      )}
    </div>
  );
}
