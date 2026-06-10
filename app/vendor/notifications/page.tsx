"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Calendar,
  CreditCard,
  Mail,
  Info,
  Loader2,
  CheckCheck,
  Clock,
} from "lucide-react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PartnerAlert } from "@/lib/types";


import { logError } from "@/lib/logger";/**
 * Notifications Page
 *
 * Full notification inbox for car hire partners with:
 * - Real-time alert feed from partnerAlerts collection
 * - Category filtering
 * - Severity indicators
 * - Mark read functionality
 */
export default function NotificationsPage() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [alerts, setAlerts] = useState<PartnerAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !userProfile?.companyId) return;

    const q = query(
      collection(db, "partnerAlerts"),
      where("companyId", "==", userProfile.companyId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as PartnerAlert)
        );
        setAlerts(data);
        setLoading(false);
      },
      (error) => {
        logError("page", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [mounted, userProfile?.companyId]);

  const markAsRead = async (alertId: string) => {
    try {
      await updateDoc(doc(db, "partnerAlerts", alertId), {
        read: true,
        readAt: serverTimestamp(),
      });
    } catch (error) {
      logError("page", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      alerts
        .filter((a) => !a.read)
        .forEach((alert) => {
          batch.update(doc(db, "partnerAlerts", alert.id), {
            read: true,
            readAt: serverTimestamp(),
          });
        });
      await batch.commit();
    } catch (error) {
      logError("page", error);
    }
  };

  const handleAlertClick = (alert: PartnerAlert) => {
    markAsRead(alert.id);
    if (alert.actionRoute) {
      router.push(alert.actionRoute);
    }
  };

  const getCategoryIcon = (category: PartnerAlert["category"]) => {
    switch (category) {
      case "new_booking":
        return Calendar;
      case "return_overdue":
        return AlertTriangle;
      case "service_due":
        return AlertTriangle;
      case "subscription":
        return CreditCard;
      case "admin_message":
        return Mail;
      default:
        return Bell;
    }
  };

  const getSeverityColor = (severity: PartnerAlert["severity"]) => {
    switch (severity) {
      case "critical":
        return "red";
      case "warning":
        return "amber";
      default:
        return "blue";
    }
  };

  const categoryFilters = [
    { id: "all", label: "All" },
    { id: "new_booking", label: "Bookings" },
    { id: "return_overdue", label: "Overdue" },
    { id: "service_due", label: "Service" },
    { id: "subscription", label: "Subscription" },
    { id: "admin_message", label: "Messages" },
    { id: "general", label: "General" },
  ];

  const filteredAlerts = alerts.filter(
    (alert) =>
      categoryFilter === "all" || alert.category === categoryFilter
  );

  const unreadCount = alerts.filter((a) => !a.read).length;

  const formatDate = (date: any) => {
    if (!date) return "";
    if (date.toDate) return date.toDate().toLocaleString();
    if (date.seconds) return new Date(date.seconds * 1000).toLocaleString();
    return new Date(date).toLocaleString();
  };

  if (!mounted || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        <p className="mt-4 text-gray-500 font-medium">Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-gray-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Alert Center
            </span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none uppercase">
            Notifications
          </h1>
          <p className="text-gray-500 font-medium text-sm">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "All caught up!"}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition shadow-xl"
          >
            <CheckCheck className="w-4 h-4" /> Mark All Read
          </button>
        )}
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categoryFilters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setCategoryFilter(filter.id)}
            className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition ${
              categoryFilter === filter.id
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-100 rounded-[2rem] p-16 text-center">
          <Bell className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-black text-gray-900 mb-2">
            No Notifications
          </h3>
          <p className="text-gray-500 font-medium">
            {categoryFilter === "all"
              ? "You're all caught up! No alerts at the moment."
              : "No notifications in this category."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const CategoryIcon = getCategoryIcon(alert.category);
            const severityColor = getSeverityColor(alert.severity);

            return (
              <div
                key={alert.id}
                onClick={() => handleAlertClick(alert)}
                className={`bg-white p-6 rounded-[2rem] border shadow-sm hover:shadow-md transition cursor-pointer ${
                  !alert.read
                    ? `border-${severityColor}-200 bg-${severityColor}-50/30`
                    : "border-gray-100"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      !alert.read
                        ? `bg-${severityColor}-100 text-${severityColor}-600`
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    <CategoryIcon className="w-6 h-6" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4
                        className={`font-black ${
                          !alert.read ? "text-gray-900" : "text-gray-600"
                        }`}
                      >
                        {alert.title}
                      </h4>
                      {!alert.read && (
                        <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 font-medium line-clamp-2">
                      {alert.message}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatDate(alert.createdAt)}
                      </span>
                      {alert.actionLabel && (
                        <span className="text-[10px] text-indigo-600 font-black uppercase">
                          {alert.actionLabel} →
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${
                      alert.severity === "critical"
                        ? "bg-red-100 text-red-700"
                        : alert.severity === "warning"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {alert.severity}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
