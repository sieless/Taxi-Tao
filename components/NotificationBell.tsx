"use client";

import { useEffect, useState } from "react";
import { Bell, Phone, Trash2, MapPin } from "lucide-react";
import {
  Timestamp,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  getDriverNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "@/lib/notifications";
import { Notification } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";

interface NotificationBellProps {
  driverId: string;
  onNotificationClick?: (
    notification: Notification | DriverNotification
  ) => void;
}

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

export default function NotificationBell({
  driverId,
  onNotificationClick,
}: NotificationBellProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [driverNotifications, setDriverNotifications] = useState<
    DriverNotification[]
  >([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Real-time listener for driverNotifications collection
  useEffect(() => {
    if (!driverId) {
      setLoading(false);
      return;
    }

    // Don't fetch if email is not verified
    if (!user?.emailVerified) {
      setLoading(false);
      return;
    }

    // Listen to driverNotifications collection
    const q1 = query(
      collection(db, "driverNotifications"),
      where("driverId", "==", driverId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe1 = onSnapshot(
      q1,
      (snapshot) => {
        const notifs: DriverNotification[] = [];
        snapshot.forEach((doc) => {
          notifs.push({ id: doc.id, ...doc.data() } as DriverNotification);
        });
        setDriverNotifications(notifs);
        updateUnreadCount();
        setLoading(false);
        console.log(
          `[NotificationBell] Loaded ${notifs.length} driver notifications for driverId: ${driverId}`
        );
      },
      (error) => {
        console.error("Error fetching driver notifications:", error);
        setLoading(false);
      }
    );

    // Also fetch from notifications collection (for payment/admin notifications)
    fetchNotifications();

    return () => {
      unsubscribe1();
    };
  }, [driverId, user?.emailVerified]);

  async function fetchNotifications() {
    if (!driverId) return;
    
    // Don't fetch if email is not verified
    if (!user?.emailVerified) return;

    try {
      const [notifs, count] = await Promise.all([
        getDriverNotifications(driverId),
        getUnreadCount(driverId),
      ]);
      setNotifications(notifs);
      updateUnreadCount();
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }

  function updateUnreadCount() {
    const driverUnread = driverNotifications.filter((n) => !n.read).length;
    const notifUnread = notifications.filter((n) => !n.read).length;
    setUnreadCount(driverUnread + notifUnread);
  }

  // Update unread count when either collection changes
  useEffect(() => {
    updateUnreadCount();
  }, [driverNotifications, notifications]);

  async function handleMarkAsRead(
    notificationId: string,
    isDriverNotification: boolean = false
  ) {
    try {
      if (isDriverNotification) {
        const notifRef = doc(db, "driverNotifications", notificationId);
        await updateDoc(notifRef, { read: true });
      } else {
        await markAsRead(notificationId);
        fetchNotifications();
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      // Mark all driverNotifications as read
      const batch = driverNotifications
        .filter((n) => !n.read)
        .map((n) => {
          const notifRef = doc(db, "driverNotifications", n.id);
          return updateDoc(notifRef, { read: true });
        });
      await Promise.all(batch);

      // Mark all notifications as read
      await markAllAsRead(driverId);
      fetchNotifications();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }

  function handleNotificationClick(
    notification: Notification | DriverNotification,
    isDriverNotification: boolean = false
  ) {
    handleMarkAsRead(notification.id, isDriverNotification);

    // Call parent's onNotificationClick if provided (for opening customer details)
    if (onNotificationClick) {
      onNotificationClick(notification);
      setIsOpen(false);
      return;
    }

    // Default behavior: navigate to booking or negotiations
    if ("bookingId" in notification && notification.bookingId) {
      setIsOpen(false);
      // Navigate to dashboard with booking hash
      window.location.href = `/driver/dashboard#booking-${notification.bookingId}`;
    } else if (isDriverNotification && notification.type === "new_booking") {
      setIsOpen(false);
      // Navigate to negotiations section
      window.location.href = `/driver/dashboard#negotiations`;
    }
  }

  function getNotificationIcon(type: Notification["type"]) {
    switch (type) {
      case "payment_verified":
        return "✅";
      case "payment_rejected":
        return "❌";
      case "subscription_expiring":
        return "⚠️";
      case "admin_message":
        return "💬";
      default:
        return "📢";
    }
  }

  function getNotificationColor(type: Notification["type"]) {
    switch (type) {
      case "payment_verified":
        return "bg-green-50 border-green-200";
      case "payment_rejected":
        return "bg-red-50 border-red-200";
      case "subscription_expiring":
        return "bg-yellow-50 border-yellow-200";
      case "admin_message":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  }

  async function handleDelete(
    notificationId: string,
    isDriverNotification: boolean = false
  ) {
    if (!confirm("Are you sure you want to delete this notification?")) return;

    try {
      if (isDriverNotification) {
        await deleteDoc(doc(db, "driverNotifications", notificationId));
        setDriverNotifications((prev) =>
          prev.filter((n) => n.id !== notificationId)
        );
      } else {
        await deleteNotification(notificationId);
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        if (unreadCount > 0) fetchNotifications();
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  }

  function handleCall(e: React.MouseEvent, phone: string) {
    e.stopPropagation();
    window.location.href = `tel:${phone}`;
  }

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition"
      >
        <Bell className="w-6 h-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Notification Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-20 max-h-[500px] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  Loading notifications...
                </div>
              ) : driverNotifications.length === 0 &&
                notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No notifications yet
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {/* Driver Notifications (from driverNotifications collection) */}
                  {driverNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition cursor-pointer ${
                        !notification.read ? "bg-blue-50" : ""
                      }`}
                      onClick={() => {
                        handleNotificationClick(notification, true);
                      }}
                    >
                      <div className="flex gap-3">
                        <div className="text-2xl flex-shrink-0">
                          {notification.type === "new_booking" ? "🚖" : "📢"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-semibold text-gray-800 text-sm">
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-2">
                              {!notification.read && (
                                <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(notification.id, true);
                                }}
                                className="text-gray-400 hover:text-red-500 transition p-1"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                            {notification.message}
                          </p>

                          {/* Booking Details */}
                          {notification.type === "new_booking" &&
                            notification.pickupLocation && (
                              <div className="mt-2 p-2 bg-gray-50 rounded text-xs space-y-1">
                                <div className="flex items-center gap-1 text-gray-700">
                                  <MapPin className="w-3 h-3" />
                                  <span>
                                    {notification.pickupLocation} →{" "}
                                    {notification.destination}
                                  </span>
                                </div>
                                {notification.pickupDate && (
                                  <div className="text-gray-600">
                                    {notification.pickupDate} at{" "}
                                    {notification.pickupTime}
                                  </div>
                                )}
                              </div>
                            )}

                          {/* Action Button for New Bookings */}
                          {notification.type === "new_booking" &&
                            notification.bookingId && (
                              <div className="mt-3 flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Always call handleNotificationClick which will use onNotificationClick if provided
                                    handleNotificationClick(notification, true);
                                  }}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-md text-xs font-bold hover:bg-green-200 transition"
                                >
                                  <MapPin className="w-3 h-3" />
                                  View Customer Details
                                </button>
                              </div>
                            )}

                          <p className="text-xs text-gray-400 mt-2">
                            {(notification.createdAt?.toDate
                              ? notification.createdAt.toDate()
                              : new Date(notification.createdAt)
                            ).toLocaleString() || "Just now"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Regular Notifications (from notifications collection) */}
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition cursor-pointer ${
                        !notification.read ? "bg-blue-50" : ""
                      }`}
                      onClick={() =>
                        handleNotificationClick(notification, false)
                      }
                    >
                      <div className="flex gap-3">
                        <div className="text-2xl flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-semibold text-gray-800 text-sm">
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-2">
                              {!notification.read && (
                                <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(notification.id, false);
                                }}
                                className="text-gray-400 hover:text-red-500 transition p-1"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                            {notification.message}
                          </p>

                          {/* Action Buttons */}
                          {notification.metadata?.customerPhone && (
                            <div className="mt-3 flex gap-2">
                              <button
                                onClick={(e) =>
                                  handleCall(
                                    e,
                                    notification.metadata!.customerPhone!
                                  )
                                }
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-md text-xs font-bold hover:bg-green-200 transition"
                              >
                                <Phone className="w-3 h-3" />
                                Call Customer
                              </button>
                            </div>
                          )}

                          {notification.metadata?.rejectionReason && (
                            <div
                              className={`mt-2 p-2 rounded border ${getNotificationColor(
                                notification.type
                              )}`}
                            >
                              <p className="text-xs font-medium text-gray-700">
                                Reason: {notification.metadata.rejectionReason}
                              </p>
                            </div>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            {(notification.createdAt instanceof Timestamp
                              ? notification.createdAt.toDate()
                              : new Date(notification.createdAt)
                            ).toLocaleString() || "Just now"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
