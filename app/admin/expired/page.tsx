"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Driver } from "@/lib/types";
import { LogOut, AlertTriangle, Send, Copy, MessageCircle } from "lucide-react";
import { sendWhatsAppMessage, generateReminderMessage, createNotification } from "@/lib/notifications";

export default function ExpiredSubscriptionsPage() {
  const { user, userProfile, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDrivers, setSelectedDrivers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && (!user || userProfile?.role !== 'admin')) {
      router.push("/");
    }
  }, [user, userProfile, authLoading, router]);

  useEffect(() => {
    fetchExpiredDrivers();
  }, []);

  async function fetchExpiredDrivers() {
    try {
      const q = query(
        collection(db, "drivers"),
        where("subscriptionStatus", "==", "expired")
      );

      const querySnapshot = await getDocs(q);
      const driversData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Driver[];

      // Sort by days overdue (most overdue first)
      const sorted = driversData.sort((a, b) => {
        const aDue = a.nextPaymentDue?.toDate?.() || new Date(a.nextPaymentDue);
        const bDue = b.nextPaymentDue?.toDate?.() || new Date(b.nextPaymentDue);
        return aDue.getTime() - bDue.getTime();
      });

      setDrivers(sorted);
    } catch (error) {
      console.error("Error fetching expired drivers:", error);
    } finally {
      setLoading(false);
    }
  }

  function getDaysOverdue(nextPaymentDue: any): number {
    const dueDate = nextPaymentDue?.toDate?.() || new Date(nextPaymentDue);
    const today = new Date();
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  function sendIndividualReminder(driver: Driver) {
    const daysOverdue = getDaysOverdue(driver.nextPaymentDue);
    const message = generateReminderMessage(driver.name, daysOverdue);
    sendWhatsAppMessage(driver.whatsapp || driver.phone, message);
  }

  async function sendInAppNotification(driver: Driver) {
    try {
      const daysOverdue = getDaysOverdue(driver.nextPaymentDue);
      const message = `Your subscription expired ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} ago.\\n\\nPlease pay 1,000 KSH to Till 7323090 to reactivate your account.\\n\\nContact: +254 708 674 665`;
      
      await createNotification(
        driver.id,
        driver.email,
        driver.phone,
        driver.name,
        'subscription_expiring',
        '⚠️ Subscription Expired',
        message,
        user?.uid || 'admin'
      );

      alert(`✅ Notification sent to ${driver.name}`);
      fetchExpiredDrivers();
    } catch (error: any) {
      alert(`❌ Failed to send notification: ${error.message}`);
    }
  }

  function copyAllPhoneNumbers() {
    const phoneNumbers = drivers.map(d => d.whatsapp || d.phone).join('\\n');
    navigator.clipboard.writeText(phoneNumbers);
    alert(`✅ Copied ${drivers.length} phone numbers to clipboard!\\n\\nYou can now paste them into WhatsApp broadcast list.`);
  }

  function sendMassWhatsAppReminders() {
    if (drivers.length === 0) {
      alert("No expired drivers to notify.");
      return;
    }

    const confirmed = confirm(
      `Send WhatsApp reminders to ${drivers.length} drivers?\\n\\nThis will open WhatsApp for each driver one by one.`
    );

    if (!confirmed) return;

    drivers.forEach((driver, index) => {
      setTimeout(() => {
        sendIndividualReminder(driver);
      }, index * 1000); // 1 second delay between each
    });

    alert(`Opening WhatsApp for ${drivers.length} drivers...\\n\\nPlease send each message manually.`);
  }

  async function sendMassInAppNotifications() {
    if (drivers.length === 0) {
      alert("No expired drivers to notify.");
      return;
    }

    const confirmed = confirm(
      `Send in-app notifications to ${drivers.length} drivers?\\n\\nThey will see these in their dashboard.`
    );

    if (!confirmed) return;

    try {
      const promises = drivers.map(driver => {
        const daysOverdue = getDaysOverdue(driver.nextPaymentDue);
        const message = `Your subscription expired ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} ago.\\n\\nPlease pay 1,000 KSH to Till 7323090 to reactivate your account.\\n\\nContact: +254 708 674 665`;
        
        return createNotification(
          driver.id,
          driver.email,
          driver.phone,
          driver.name,
          'subscription_expiring',
          '⚠️ Subscription Expired',
          message,
          user?.uid || 'admin'
        );
      });

      await Promise.all(promises);
      alert(`✅ Sent ${drivers.length} notifications successfully!`);
      fetchExpiredDrivers();
    } catch (error: any) {
      alert(`❌ Failed to send notifications: ${error.message}`);
    }
  }

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading expired subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Expired Subscriptions</h1>
            <p className="text-sm text-gray-600 mt-1">{drivers.length} driver{drivers.length !== 1 ? 's' : ''} with expired subscriptions</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/admin/panel")}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Back to Admin Panel
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Mass Actions */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Mass Notification Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={sendMassInAppNotifications}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition"
              disabled={drivers.length === 0}
            >
              <Send className="w-5 h-5" />
              Send In-App Notifications ({drivers.length})
            </button>
            
            <button
              onClick={sendMassWhatsAppReminders}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition"
              disabled={drivers.length === 0}
            >
              <MessageCircle className="w-5 h-5" />
              Send WhatsApp Reminders ({drivers.length})
            </button>

            <button
              onClick={copyAllPhoneNumbers}
              className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition"
              disabled={drivers.length === 0}
            >
              <Copy className="w-5 h-5" />
              Copy All Phone Numbers
            </button>
          </div>

          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> In-app notifications appear in driver dashboards. WhatsApp reminders open WhatsApp with pre-filled messages (you must send manually). Copy numbers to create a WhatsApp broadcast list.
            </p>
          </div>
        </div>

        {/* Drivers Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Overdue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {drivers.map((driver) => {
                  const daysOverdue = getDaysOverdue(driver.nextPaymentDue);
                  const lastPayment = driver.lastPaymentDate?.toDate?.() || null;
                  
                  return (
                    <tr key={driver.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                          <div className="text-sm text-gray-500">{driver.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{driver.phone}</div>
                        <div className="text-sm text-gray-500">WhatsApp: {driver.whatsapp || driver.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          daysOverdue > 30 ? 'bg-red-100 text-red-800' :
                          daysOverdue > 14 ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {daysOverdue} day{daysOverdue !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lastPayment ? lastPayment.toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => sendInAppNotification(driver)}
                            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition"
                            title="Send in-app notification"
                          >
                            <Send className="w-4 h-4" />
                            Notify
                          </button>
                          <button
                            onClick={() => sendIndividualReminder(driver)}
                            className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition"
                            title="Send WhatsApp reminder"
                          >
                            <MessageCircle className="w-4 h-4" />
                            WhatsApp
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {drivers.length === 0 && (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No expired subscriptions! 🎉</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
