"use client";

import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Notification } from '@/lib/types';
import { Bell, TrendingUp, AlertCircle, CheckCircle, MessageSquare } from 'lucide-react';

interface NotificationsFeedProps {
  driverId: string;
}

export default function NotificationsFeed({ driverId }: NotificationsFeedProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [driverId]);

  async function fetchNotifications() {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('recipientId', '==', driverId),
        orderBy('createdAt', 'desc'),
        limit(5)
      );

      const snapshot = await getDocs(q);
      const notifs: Notification[] = [];

      snapshot.forEach((doc) => {
        notifs.push({ id: doc.id, ...doc.data() } as Notification);
      });

      setNotifications(notifs);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }

  function getIcon(type: string) {
    switch (type) {
      case 'ride_request':
        return <Bell className="w-4 h-4 text-blue-600" />;
      case 'high_demand_zone':
        return <TrendingUp className="w-4 h-4 text-orange-600" />;
      case 'payment_verified':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'compliance_alert':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-600" />;
    }
  }

  function getTimeAgo(timestamp: any): string {
    if (!timestamp) return 'Recently';
    
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Notifications</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Notifications</h3>
        <div className="text-center py-6">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No notifications</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">Notifications</h3>
        {notifications.length > 3 && (
          <span className="text-xs text-gray-500">{notifications.length} total</span>
        )}
      </div>
      
      {/* Show max 3 notifications, rest in scrollable area */}
      <div className="space-y-3">
        {notifications.slice(0, 3).map((notif) => (
          <div
            key={notif.id}
            className={`flex gap-3 p-3 rounded-lg transition hover:bg-gray-50 ${
              !notif.read ? 'bg-blue-50 border border-blue-100' : ''
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(notif.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {notif.title}
              </p>
              <p className="text-xs text-gray-600 line-clamp-2">
                {notif.message}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {getTimeAgo(notif.createdAt)}
              </p>
            </div>
            {!notif.read && (
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Scrollable area for remaining notifications */}
      {notifications.length > 3 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Older notifications</p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {notifications.slice(3).map((notif) => (
              <div
                key={notif.id}
                className="flex gap-2 p-2 rounded-lg transition hover:bg-gray-50 text-xs"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">
                    {notif.title}
                  </p>
                  <p className="text-gray-500 mt-0.5">
                    {getTimeAgo(notif.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
