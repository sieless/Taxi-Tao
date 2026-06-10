"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Bell, Globe, ShieldCheck, Mail, Phone, Info, Save, CheckCircle } from "lucide-react";
import { useModal } from "@/lib/admin-modal-context";


import { logError } from "@/lib/logger";type Tab = "notifications" | "access" | "system";

interface AdminSettingsData {
  notifications: {
    emailOnNewDriver: boolean;
    emailOnPaymentVerified: boolean;
    emailOnIssueEscalated: boolean;
    smsOnUrgentIssue: boolean;
    smsWeeklyDigest: boolean;
  };
  system: {
    timezone: "Africa/Nairobi" | "UTC";
    contactEmail: string;
    contactPhone: string;
  };
}

const DEFAULT_SETTINGS: AdminSettingsData = {
  notifications: {
    emailOnNewDriver: true,
    emailOnPaymentVerified: true,
    emailOnIssueEscalated: true,
    smsOnUrgentIssue: true,
    smsWeeklyDigest: false,
  },
  system: {
    timezone: "Africa/Nairobi",
    contactEmail: "support@taxitao.co.ke",
    contactPhone: "+254 700 000 000",
  },
};

export default function AdminSettingsPage() {
  const { user, userProfile } = useAuth();
  const modal = useModal();
  const [activeTab, setActiveTab] = useState<Tab>("notifications");
  const [settings, setSettings] = useState<AdminSettingsData>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadSettings();
  }, [user]);

  async function loadSettings() {
    try {
      const ref = doc(db, "adminSettings", user!.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setSettings({ ...DEFAULT_SETTINGS, ...snap.data() as AdminSettingsData });
      }
    } catch (err) {
      logError("page", err);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    if (!user) return;
    setSaving(true);
    try {
      const ref = doc(db, "adminSettings", user.uid);
      await setDoc(ref, { ...settings, updatedAt: serverTimestamp() }, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      await modal.showAlert(`Failed to save: ${err?.message}`, "error");
    } finally {
      setSaving(false);
    }
  }

  function toggleNotification(key: keyof AdminSettingsData["notifications"]) {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: !prev.notifications[key] },
    }));
  }

  function setSystemField(key: keyof AdminSettingsData["system"], value: string) {
    setSettings((prev) => ({
      ...prev,
      system: { ...prev.system, [key]: value },
    }));
  }

  const SettingCard = ({
    title,
    description,
    children,
  }: { title: string; description: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{description}</p>
      {children}
    </div>
  );

  const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) => (
    <label className="flex items-center gap-3 text-sm text-gray-700 py-1 cursor-pointer">
      <button
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${
          checked ? "bg-primary-600" : "bg-gray-200"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
      {label}
    </label>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="text-primary-600" size={24} /> Control Center
          </h1>
          <p className="text-gray-500 text-sm mt-1">Configure your admin portal preferences</p>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition ${
            saved
              ? "bg-primary-600 text-white"
              : "bg-primary-600 hover:bg-primary-700 text-white"
          } disabled:opacity-50`}
        >
          {saved ? <CheckCircle size={16} /> : <Save size={16} />}
          {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: "notifications" as Tab, label: "Notifications", icon: Bell },
          { id: "access" as Tab, label: "Roles & Access", icon: ShieldCheck },
          { id: "system" as Tab, label: "System", icon: Globe },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition border ${
                activeTab === tab.id
                  ? "bg-primary-600 text-white border-primary-700"
                  : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Notifications tab */}
      {activeTab === "notifications" && (
        <div className="grid md:grid-cols-2 gap-4">
          <SettingCard title="Email Alerts" description="Receive email updates for key platform events.">
            <Toggle checked={settings.notifications.emailOnNewDriver} onChange={() => toggleNotification("emailOnNewDriver")} label="New driver joined" />
            <Toggle checked={settings.notifications.emailOnPaymentVerified} onChange={() => toggleNotification("emailOnPaymentVerified")} label="Payment verified" />
            <Toggle checked={settings.notifications.emailOnIssueEscalated} onChange={() => toggleNotification("emailOnIssueEscalated")} label="Issue escalated" />
          </SettingCard>
          <SettingCard title="SMS Alerts" description="Lightweight reminders for urgent incidents.">
            <Toggle checked={settings.notifications.smsOnUrgentIssue} onChange={() => toggleNotification("smsOnUrgentIssue")} label="Urgent platform issues" />
            <Toggle checked={settings.notifications.smsWeeklyDigest} onChange={() => toggleNotification("smsWeeklyDigest")} label="Weekly summary digest" />
          </SettingCard>
        </div>
      )}

      {/* Access tab */}
      {activeTab === "access" && (
        <div className="grid md:grid-cols-2 gap-4">
          <SettingCard title="Roles Overview" description="Active roles and their permissions on the platform.">
            <ul className="text-sm text-gray-700 space-y-2">
              {[
                { role: "admin", desc: "Full access to all dashboards and actions", color: "bg-primary-100 text-primary-700" },
                { role: "assistant", desc: "Limited access based on explicit permission flags", color: "bg-indigo-100 text-indigo-700" },
                { role: "driver", desc: "Driver app only — no admin access", color: "bg-primary-100 text-primary-700" },
                { role: "customer", desc: "Booking app only — no admin access", color: "bg-blue-100 text-blue-700" },
              ].map((r) => (
                <li key={r.role} className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${r.color}`}>{r.role}</span>
                  <span className="text-gray-600 text-xs">{r.desc}</span>
                </li>
              ))}
            </ul>
          </SettingCard>
          <SettingCard title="Audit Trail" description="All admin actions are logged to adminAuditEvents.">
            <div className="text-sm text-gray-600 space-y-1.5">
              {["Driver approvals and subscription changes", "User role updates", "Payment verifications and rejections", "Broadcast notifications"].map((item) => (
                <p key={item} className="flex items-start gap-2">
                  <CheckCircle size={14} className="text-primary-500 mt-0.5 flex-shrink-0" />
                  {item}
                </p>
              ))}
            </div>
          </SettingCard>
        </div>
      )}

      {/* System tab */}
      {activeTab === "system" && (
        <div className="grid md:grid-cols-2 gap-4">
          <SettingCard title="Timezone" description="Display preference for dates and times in the admin UI.">
            <div className="space-y-2 text-sm text-gray-700">
              {["Africa/Nairobi", "UTC"].map((tz) => (
                <label key={tz} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="tz"
                    checked={settings.system.timezone === tz}
                    onChange={() => setSystemField("timezone", tz as any)}
                    className="text-primary-600"
                  />
                  {tz === "Africa/Nairobi" ? "Africa/Nairobi (EAT, UTC+3)" : "UTC"}
                </label>
              ))}
            </div>
          </SettingCard>
          <SettingCard title="Support Contacts" description="Escalation contacts shown to drivers and customers.">
            <div className="space-y-3">
              <label className="block">
                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Mail size={12} /> Support email</p>
                <input
                  type="email"
                  value={settings.system.contactEmail}
                  onChange={(e) => setSystemField("contactEmail", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </label>
              <label className="block">
                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Phone size={12} /> Support phone</p>
                <input
                  type="tel"
                  value={settings.system.contactPhone}
                  onChange={(e) => setSystemField("contactPhone", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </label>
            </div>
          </SettingCard>
        </div>
      )}
    </div>
  );
}
