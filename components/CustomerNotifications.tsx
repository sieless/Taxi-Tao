"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, writeBatch, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { Bell, X, CheckCheck, Navigation, MapPinned, Play } from "lucide-react";

interface Notification {
  id: string;
  type: "ride_confirmed" | "driver_enroute" | "driver_arrived" | "trip_started" | "trip_completed";
  message: string;
  bookingId: string;
  read: boolean;
  createdAt: Timestamp;
  metadata?: any;
}

interface CustomerNotificationsProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
  onNotificationClick?: (notification: Notification) => void;
}

export default function CustomerNotifications({ isOpen, onClose, onUnreadCountChange, onNotificationClick }: CustomerNotificationsProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Notification[] = [];
        snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() } as Notification));
        setNotifications(list);

        if (onUnreadCountChange) {
          const unreadCount = list.filter(n => !n.read).length;
          onUnreadCountChange(unreadCount);
        }

        setLoading(false);
      },
      (err) => {
        console.error("Error fetching notifications:", err);
        setError("Failed to load notifications");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, onUnreadCountChange]);

  const markAsRead = async (notificationId: string) => {
    try {
      const ref = doc(db, "notifications", notificationId);
      await updateDoc(ref, { read: true });
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (!unread.length) return;

    const batch = writeBatch(db);
    unread.forEach(n => batch.update(doc(db, "notifications", n.id), { read: true }));
    await batch.commit();
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "ride_confirmed": return <CheckCheck className="w-5 h-5 text-blue-500" />;
      case "driver_enroute": return <Navigation className="w-5 h-5 text-blue-500" />;
      case "driver_arrived": return <MapPinned className="w-5 h-5 text-purple-500" />;
      case "trip_started": return <Play className="w-5 h-5 text-green-500" />;
      case "trip_completed": return <CheckCheck className="w-5 h-5 text-gray-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatTime = (ts: Timestamp | null) => {
    if (!ts) return "";
    const date = ts.toDate();
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border z-50 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 p-4 text-white flex justify-between items-center">
          <h3 className="font-bold text-lg flex items-center gap-2"><Bell className="w-5 h-5"/> Notifications</h3>
          <button onClick={onClose} aria-label="Close" className="p-1 hover:bg-white/20 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        {notifications.some(n => !n.read) && (
          <button onClick={markAllAsRead} className="text-xs text-white/90 hover:text-white underline p-2">
            Mark all as read
          </button>
        )}

        {/* Notifications */}
        <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
          {error && <div className="p-4 text-red-500 text-center">{error}</div>}
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={`p-4 hover:bg-gray-50 cursor-pointer flex gap-3 ${!n.read ? "bg-blue-50" : ""}`}
                onClick={() => {
                  markAsRead(n.id);
                  if (onNotificationClick) onNotificationClick(n);
                }}
              >
                <div className="flex-shrink-0 mt-1">{getIcon(n.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.read ? "font-semibold" : ""}`}>{n.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatTime(n.createdAt)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
