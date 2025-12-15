"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { X, Bell, CheckCircle, MapPin, Calendar, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

interface DriverNotification {
  id: string;
  type: "new_booking" | "booking_cancelled" | "fare_accepted" | "system";
  title: string;
  message: string;
  bookingId?: string;
  read: boolean;
  createdAt: any;
  pickupLocation?: string;
  destination?: string;
  pickupDate?: string;
  pickupTime?: string;
}

interface DriverNotificationsProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange: (count: number) => void;
  driverId?: string; // Add driverId prop
  onNotificationClick?: (notification: DriverNotification) => void; // Add click handler prop
}

export default function DriverNotifications({
  isOpen,
  onClose,
  onUnreadCountChange,
  driverId,
  onNotificationClick,
}: DriverNotificationsProps) {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<DriverNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // Use driverId prop, or fallback to userProfile.driverId, or user.uid
  const actualDriverId = driverId || userProfile?.driverId || user?.uid || "";

  useEffect(() => {
    if (!actualDriverId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "driverNotifications"),
      where("driverId", "==", actualDriverId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifs: DriverNotification[] = [];
        snapshot.forEach((doc) => {
          notifs.push({ id: doc.id, ...doc.data() } as DriverNotification);
        });

        setNotifications(notifs);
        const unreadCount = notifs.filter((n) => !n.read).length;
        onUnreadCountChange(unreadCount);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching driver notifications:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [actualDriverId, onUnreadCountChange]);

  const markAsRead = async (notificationId: string) => {
    try {
      const notifRef = doc(db, "driverNotifications", notificationId);
      await writeBatch(db).update(notifRef, { read: true }).commit();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      notifications
        .filter((n) => !n.read)
        .forEach((notification) => {
          const notifRef = doc(db, "driverNotifications", notification.id);
          batch.update(notifRef, { read: true });
        });
      await batch.commit();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleNotificationClick = (notification: DriverNotification) => {
    markAsRead(notification.id);

    // If parent component provided click handler, use it (for opening customer details modal)
    if (onNotificationClick) {
      onNotificationClick(notification);
      onClose();
      return;
    }

    // Default behavior: navigate to booking or negotiations
    if (notification.bookingId) {
      onClose();
      // Navigate to dashboard and scroll to booking
      router.push(`/driver/dashboard#booking-${notification.bookingId}`);
      // Also try to open negotiation if it exists
      // The DriverNegotiations component will handle displaying negotiations
      setTimeout(() => {
        const element = document.getElementById(
          `booking-${notification.bookingId}`
        );
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    } else if (
      notification.type === "fare_accepted" ||
      notification.type === "new_booking"
    ) {
      // For notifications without bookingId, navigate to negotiations section
      onClose();
      router.push("/driver/dashboard#negotiations");
      setTimeout(() => {
        const element = document.getElementById("negotiations");
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_booking":
        return <MapPin className="w-5 h-5 text-green-600" />;
      case "booking_cancelled":
        return <X className="w-5 h-5 text-red-600" />;
      case "fare_accepted":
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex justify-end">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close notifications"
      />
      <div className="relative bg-white w-full sm:max-w-md h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-green-600 text-white">
          <h2 className="text-lg font-bold">Driver Notifications</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-green-700 rounded-lg transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions */}
        {notifications.some((n) => !n.read) && (
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <button
              onClick={markAllAsRead}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Mark all as read
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition ${
                    !notification.read ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-green-600 rounded-full ml-2"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>

                      {/* Booking Details for new bookings */}
                      {notification.type === "new_booking" &&
                        notification.pickupLocation && (
                          <div className="mt-2 p-2 bg-white rounded border border-gray-200 text-xs space-y-1">
                            <div className="flex items-center gap-1 text-gray-700">
                              <MapPin className="w-3 h-3" />
                              <span>{notification.pickupLocation}</span>
                            </div>
                            {notification.destination && (
                              <div className="flex items-center gap-1 text-gray-600">
                                <span className="ml-4">
                                  → {notification.destination}
                                </span>
                              </div>
                            )}
                            {notification.pickupDate && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <Calendar className="w-3 h-3" />
                                <span>{notification.pickupDate}</span>
                                {notification.pickupTime && (
                                  <>
                                    <Clock className="w-3 h-3 ml-1" />
                                    <span>{notification.pickupTime}</span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                      <p className="text-xs text-gray-400 mt-2">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
