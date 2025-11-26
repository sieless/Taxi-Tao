"use client";

import { useEffect, useState } from "react";
import { Bell, Phone, Trash2 } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import { getDriverNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification } from "@/lib/notifications";
import { Notification } from "@/lib/types";

interface NotificationBellProps {
  driverId: string;
}

export default function NotificationBell({ driverId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch if driverId is provided (user is logged in as driver)
    if (!driverId) {
      setLoading(false);
      return;
    }

    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [driverId]);

  async function fetchNotifications() {
    if (!driverId) return; // Don't fetch if no driverId

    try {
      const [notifs, count] = await Promise.all([
        getDriverNotifications(driverId),
        getUnreadCount(driverId)
      ]);
      setNotifications(notifs.slice(0, 10)); // Show last 10
      setUnreadCount(count);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsRead(notificationId: string) {
    try {
      await markAsRead(notificationId);
      fetchNotifications();
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await markAllAsRead(driverId);
      fetchNotifications();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }

  function getNotificationIcon(type: Notification['type']) {
    switch (type) {
      case 'payment_verified':
        return '✅';
      case 'payment_rejected':
        return '❌';
      case 'subscription_expiring':
        return '⚠️';
      case 'admin_message':
        return '💬';
      default:
        return '📢';
    }
  }

  function getNotificationColor(type: Notification['type']) {
    switch (type) {
      case 'payment_verified':
        return 'bg-green-50 border-green-200';
      case 'payment_rejected':
        return 'bg-red-50 border-red-200';
      case 'subscription_expiring':
        return 'bg-yellow-50 border-yellow-200';
      case 'admin_message':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  }

  async function handleDelete(e: React.MouseEvent, notificationId: string) {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this notification?')) return;
    
    try {
      await deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (unreadCount > 0) fetchNotifications(); // Refresh count if needed
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
            {unreadCount > 9 ? '9+' : unreadCount}
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
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No notifications yet
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition cursor-pointer ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => !notification.read && handleMarkAsRead(notification.id)}
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
                                onClick={(e) => handleDelete(e, notification.id)}
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
                                onClick={(e) => handleCall(e, notification.metadata!.customerPhone!)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-md text-xs font-bold hover:bg-green-200 transition"
                              >
                                <Phone className="w-3 h-3" />
                                Call Customer
                              </button>
                            </div>
                          )}

                          {notification.metadata?.rejectionReason && (
                            <div className={`mt-2 p-2 rounded border ${getNotificationColor(notification.type)}`}>
                              <p className="text-xs font-medium text-gray-700">
                                Reason: {notification.metadata.rejectionReason}
                              </p>
                            </div>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            {(notification.createdAt instanceof Timestamp ? notification.createdAt.toDate() : new Date(notification.createdAt)).toLocaleString() || 'Just now'}
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
