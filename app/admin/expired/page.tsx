"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Driver } from "@/lib/types";
import { 
  LogOut, 
  AlertTriangle, 
  Send, 
  Copy, 
  MessageCircle, 
  ArrowLeft, 
  Zap, 
  CheckCircle, 
  X, 
  Clock, 
  Car, 
  Calendar 
} from "lucide-react";
import { sendWhatsAppMessage, generateReminderMessage } from "@/lib/notifications";
import {
  sendBulkExpiredReminders,
  sendExpiredSubscriptionReminder,
  manuallyActivateSubscription,
} from "@/lib/admin-service";
import { useModal } from "@/lib/admin-modal-context";
import { hasAdminPermission } from "@/lib/admin-permission-helper";
import { logError } from "@/lib/logger";

export default function ExpiredSubscriptionsPage() {
  const { user, userProfile, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const modal = useModal();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  // Activation Modal State
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [serviceType, setServiceType] = useState<"taxi" | "hire">("taxi");
  const [planOption, setPlanOption] = useState<"daily" | "weekly" | "monthly" | "custom">("monthly");
  const [customDays, setCustomDays] = useState<number>(60);

  const canManage = hasAdminPermission(userProfile, "manageDrivers");

  useEffect(() => {
    if (!authLoading) {
      if (!user || !canManage) {
        router.push("/admin/dashboard");
      }
    }
  }, [user, userProfile, authLoading, canManage, router]);

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
        const aDue = a.nextPaymentDue ? (a.nextPaymentDue instanceof Date ? a.nextPaymentDue : (a.nextPaymentDue as any).toDate()) : new Date();
        const bDue = b.nextPaymentDue ? (b.nextPaymentDue instanceof Date ? b.nextPaymentDue : (b.nextPaymentDue as any).toDate()) : new Date();
        return aDue.getTime() - bDue.getTime();
      });

      setDrivers(sorted);
    } catch (error) {
      logError("ExpiredPage", error);
    } finally {
      setLoading(false);
    }
  }

  function getDaysOverdue(nextPaymentDue: any): number {
    if (!nextPaymentDue) return 0;
    const dueDate = nextPaymentDue instanceof Date ? nextPaymentDue : (nextPaymentDue as any).toDate();
    const today = new Date();
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  // Handle direct activation (offers, excess payments, 1-click)
  async function handleActivateSubmit() {
    if (!selectedDriver) return;
    
    let durationDays: number | undefined = undefined;
    let plan: "daily" | "weekly" | "monthly" = "monthly";

    if (planOption === "daily") {
      plan = "daily";
      durationDays = 1;
    } else if (planOption === "weekly") {
      plan = "weekly";
      durationDays = 7;
    } else if (planOption === "monthly") {
      plan = "monthly";
      durationDays = 30;
    } else if (planOption === "custom") {
      plan = "monthly";
      durationDays = Math.max(1, customDays);
    }

    setActing(selectedDriver.id);
    try {
      const res = await manuallyActivateSubscription(
        selectedDriver.id,
        user?.uid || "admin",
        serviceType,
        plan,
        durationDays
      );

      modal.showAlert(res.message, "success", "Subscription Activated");

      // Remove activated driver from local expired list
      setDrivers(prev => prev.filter(d => d.id !== selectedDriver.id));
      setSelectedDriver(null);
    } catch (err: any) {
      modal.showAlert(`Activation failed: ${err.message}`, "error");
    } finally {
      setActing(null);
    }
  }

  function sendIndividualReminder(driver: Driver) {
    const phone = driver.whatsapp || driver.phone;
    if (!phone) {
      modal.showAlert(`No phone number found for ${driver.name}`, "error");
      return;
    }
    const daysOverdue = getDaysOverdue(driver.nextPaymentDue);
    const message = generateReminderMessage(driver.name, daysOverdue);
    sendWhatsAppMessage(phone, message);
  }

  async function sendInAppNotification(driver: Driver) {
    try {
      const daysOverdue = getDaysOverdue(driver.nextPaymentDue);
      await sendExpiredSubscriptionReminder(driver.id, daysOverdue);
      await modal.showAlert(`Notification sent to ${driver.name}`, "success", "Sent");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await modal.showAlert(`Failed to send notification: ${errorMessage}`, "error");
    }
  }

  function copyAllPhoneNumbers() {
    const phoneNumbers = drivers.map(d => d.whatsapp || d.phone).join('\n');
    navigator.clipboard.writeText(phoneNumbers);
    modal.showAlert(`Copied ${drivers.length} phone numbers to clipboard!`, "success", "Copied");
  }

  function sendMassWhatsAppReminders() {
    if (drivers.length === 0) {
      modal.showAlert("No expired drivers to notify.", "warning");
      return;
    }
    copyAllPhoneNumbers();
    modal.showAlert(`Phone numbers copied to clipboard.\n\nPaste them into a WhatsApp broadcast list to notify all drivers at once.`, "info", "Bulk Actions");
  }

  async function sendMassInAppNotifications() {
    if (drivers.length === 0) {
      modal.showAlert("No expired drivers to notify.", "warning");
      return;
    }

    const ok = await modal.showConfirm(`Send in-app notifications to ALL ${drivers.length} expired drivers?`, "Bulk Notification", "Send All");
    if (!ok) return;

    try {
      const result = await sendBulkExpiredReminders();
      await modal.showAlert(`Sent notifications to ${result.sent} drivers successfully!`, "success", "Success");
      fetchExpiredDrivers();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await modal.showAlert(`Failed to send notifications: ${errorMessage}`, "error");
    }
  }

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading expired subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/admin/dashboard?tab=drivers")}
              className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 p-2 rounded-xl hover:bg-slate-100 transition-colors"
              title="Back to Driver Management"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-bold text-sm hidden sm:inline">Drivers</span>
            </button>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Expired Subscriptions Dashboard</h1>
              <p className="text-xs text-slate-500 font-medium">{drivers.length} driver{drivers.length !== 1 ? 's' : ''} currently overdue</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-slate-500 hover:text-rose-600 px-3 py-2 rounded-xl hover:bg-rose-50 transition-colors text-xs font-bold"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Mass Actions Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Mass Notification & Outreach</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={sendMassInAppNotifications}
              disabled={drivers.length === 0}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-xs"
            >
              <Send className="w-4 h-4" />
              Send In-App Notifications ({drivers.length})
            </button>
            
            <button
              onClick={sendMassWhatsAppReminders}
              disabled={drivers.length === 0}
              className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-xl transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-xs"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp Reminders ({drivers.length})
            </button>

            <button
              onClick={copyAllPhoneNumbers}
              disabled={drivers.length === 0}
              className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-4 rounded-xl transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-xs"
            >
              <Copy className="w-4 h-4" />
              Copy Phone List
            </button>
          </div>
        </div>

        {/* Drivers Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Driver Details</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Days Overdue</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Last Payment</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {drivers.map((driver) => {
                  const daysOverdue = getDaysOverdue(driver.nextPaymentDue);
                  const lastPayment = driver.lastPaymentDate ? (driver.lastPaymentDate instanceof Date ? driver.lastPaymentDate : (driver.lastPaymentDate as any).toDate()) : null;
                  const isActing = acting === driver.id;

                  return (
                    <tr key={driver.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center font-bold text-slate-600">
                            {driver.profilePhotoUrl ? <img src={driver.profilePhotoUrl} alt="" className="w-full h-full object-cover" /> : driver.name?.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">{driver.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{driver.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-medium text-slate-700">{driver.phone}</div>
                        <div className="text-[11px] text-slate-400">{driver.email || "No email"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 inline-flex text-[10px] font-black uppercase rounded-lg border ${
                          daysOverdue > 30 ? 'bg-rose-100 text-rose-700 border-rose-200' :
                          daysOverdue > 14 ? 'bg-amber-100 text-amber-700 border-amber-200' :
                          'bg-yellow-100 text-yellow-800 border-yellow-200'
                        }`}>
                          {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500">
                        {lastPayment ? lastPayment.toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* DIRECT 1-CLICK ACTIVATION BUTTON */}
                          <button
                            onClick={() => setSelectedDriver(driver)}
                            disabled={isActing}
                            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition hover:scale-105 active:scale-95 disabled:opacity-50"
                            title="Grant access / activate subscription"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            Activate / Grant Access
                          </button>

                          <button
                            onClick={() => sendInAppNotification(driver)}
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition"
                            title="Send in-app notification"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => sendIndividualReminder(driver)}
                            className="p-2 bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-xl transition"
                            title="Send WhatsApp reminder"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
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
            <div className="text-center py-16">
              <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-bold">No expired subscriptions found!</p>
              <p className="text-xs text-slate-400 mt-1">All registered drivers currently have active subscriptions.</p>
            </div>
          )}
        </div>
      </div>

      {/* ACTIVATION MODAL (Offers, Promos, Excess Payments) */}
      {selectedDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedDriver(null)} />
          
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-6 animate-in zoom-in-95 duration-200 z-10">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Activate Subscription</h3>
                <p className="text-xs text-slate-500 mt-0.5">Granting access for <strong className="text-slate-900">{selectedDriver.name}</strong></p>
              </div>
              <button onClick={() => setSelectedDriver(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-5">
              {/* Service Type Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Service Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setServiceType("taxi")}
                    className={`flex items-center justify-center gap-2 p-3 rounded-2xl border font-bold text-xs transition ${
                      serviceType === "taxi"
                        ? "bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Car size={16} /> Taxi Ride-Hailing
                  </button>
                  <button
                    type="button"
                    onClick={() => setServiceType("hire")}
                    className={`flex items-center justify-center gap-2 p-3 rounded-2xl border font-bold text-xs transition ${
                      serviceType === "hire"
                        ? "bg-purple-50 border-purple-600 text-purple-700 shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Zap size={16} /> Car Hire Service
                  </button>
                </div>
              </div>

              {/* Duration / Plan Option */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Select Offer / Duration</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPlanOption("daily")}
                    className={`p-3 rounded-2xl border text-left transition ${
                      planOption === "daily"
                        ? "bg-indigo-50 border-indigo-600 text-indigo-700"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <p className="text-xs font-black">1-Day Pass (Offer)</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">24 hours instant promo access</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPlanOption("weekly")}
                    className={`p-3 rounded-2xl border text-left transition ${
                      planOption === "weekly"
                        ? "bg-indigo-50 border-indigo-600 text-indigo-700"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <p className="text-xs font-black">7-Day Pass (Weekly)</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">7 days full access</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPlanOption("monthly")}
                    className={`p-3 rounded-2xl border text-left transition ${
                      planOption === "monthly"
                        ? "bg-indigo-50 border-indigo-600 text-indigo-700"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <p className="text-xs font-black">30-Day Pass (Monthly)</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Standard 30 days subscription</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPlanOption("custom")}
                    className={`p-3 rounded-2xl border text-left transition ${
                      planOption === "custom"
                        ? "bg-indigo-50 border-indigo-600 text-indigo-700"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <p className="text-xs font-black">Custom / Multi-Month</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">For excess payments (e.g. 60+ days)</p>
                  </button>
                </div>
              </div>

              {/* Custom Days Input */}
              {planOption === "custom" && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-600">Custom Duration (in Days)</label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={customDays}
                    onChange={(e) => setCustomDays(parseInt(e.target.value) || 30)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
                    placeholder="Enter days (e.g., 60 for 2 months)"
                  />
                  <p className="text-[10px] text-slate-400">Sets next due date to {customDays} days from right now.</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedDriver(null)}
                className="flex-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold py-3 rounded-2xl text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleActivateSubmit}
                disabled={acting === selectedDriver.id}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl text-xs transition shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
              >
                {acting === selectedDriver.id ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Zap size={14} /> Confirm & Activate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
