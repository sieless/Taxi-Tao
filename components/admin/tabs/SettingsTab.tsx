"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  Bell, 
  Globe, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Info, 
  Save, 
  CheckCircle, 
  User, 
  Settings,
  Lock,
  Cloud,
  ChevronRight,
  RefreshCw,
  Clock
} from "lucide-react";
import { useModal } from "@/lib/admin-modal-context";


import { logError } from "@/lib/logger";type Tab = "profile" | "notifications" | "access" | "system";

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

export default function SettingsTab() {
  const { user, userProfile } = useAuth();
  const modal = useModal();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
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
      logError("SettingsTab", err);
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
      modal.showAlert("Settings saved successfully", "success");
    } catch (err: any) {
      modal.showAlert(`Failed to save: ${err.message}`, "error");
    } finally {
      setSaving(false);
    }
  }

  const Toggle = ({ checked, onChange, label, desc }: { checked: boolean; onChange: () => void; label: string; desc?: string }) => (
    <div className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0 group">
      <div>
        <p className="text-sm font-bold text-slate-800">{label}</p>
        {desc && <p className="text-[11px] text-slate-400 mt-0.5">{desc}</p>}
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? "bg-indigo-600" : "bg-slate-200"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Settings Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100 shadow-inner">
            <Settings size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Control Center</h2>
            <p className="text-sm text-slate-400 font-medium">Global platform configuration & personal preferences</p>
          </div>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving}
          className={`px-8 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg flex items-center gap-2
            ${saved ? "bg-primary-600 text-white shadow-primary-100" : "bg-slate-900 text-white shadow-slate-200 hover:bg-slate-800"}
            disabled:opacity-50
          `}
        >
          {saving ? <RefreshCw size={18} className="animate-spin" /> : saved ? <CheckCircle size={18} /> : <Save size={18} />}
          {saving ? "Saving..." : saved ? "Changes Saved" : "Save Settings"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="space-y-1">
          {[
            { id: "profile", label: "Admin Profile", icon: User },
            { id: "notifications", label: "Notifications", icon: Bell },
            { id: "access", label: "Roles & Access", icon: Lock },
            { id: "system", label: "System Config", icon: Cloud },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as Tab)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all
                ${activeTab === t.id 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                  : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"}
              `}
            >
              <t.icon size={18} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          {activeTab === "profile" && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-100 bg-slate-50/30">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center text-slate-200 border-4 border-white shadow-xl relative overflow-hidden">
                     {userProfile?.profilePhotoUrl ? <img src={userProfile.profilePhotoUrl} className="w-full h-full object-cover" /> : <User size={48} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{userProfile?.name || "Administrator"}</h3>
                    <p className="text-sm text-slate-400 mt-1">{user?.email}</p>
                    <span className="inline-block mt-3 px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full uppercase tracking-widest border border-indigo-100">
                      {userProfile?.role || "Admin"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Account Created</p>
                    <p className="text-sm font-bold text-slate-700">{user?.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : "—"}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Last Login</p>
                    <p className="text-sm font-bold text-slate-700">{user?.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString() : "—"}</p>
                  </div>
                </div>
                <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl flex gap-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 flex-shrink-0"><Info size={20} /></div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-800">Security Warning</h4>
                    <p className="text-xs text-amber-700 leading-relaxed mt-1">Your account has full administrative access. Ensure you use a strong password and sign out when using public or shared computers.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Mail size={18} className="text-indigo-600" /> Email Notifications
                </h3>
                <div className="space-y-1">
                  <Toggle 
                    checked={settings.notifications.emailOnNewDriver} 
                    onChange={() => setSettings(p => ({ ...p, notifications: { ...p.notifications, emailOnNewDriver: !p.notifications.emailOnNewDriver } }))}
                    label="New Driver Registrations"
                    desc="Receive an email whenever a new driver signs up for verification."
                  />
                  <Toggle 
                    checked={settings.notifications.emailOnPaymentVerified} 
                    onChange={() => setSettings(p => ({ ...p, notifications: { ...p.notifications, emailOnPaymentVerified: !p.notifications.emailOnPaymentVerified } }))}
                    label="Payment Verifications"
                    desc="Daily summary of driver subscription payments processed."
                  />
                  <Toggle 
                    checked={settings.notifications.emailOnIssueEscalated} 
                    onChange={() => setSettings(p => ({ ...p, notifications: { ...p.notifications, emailOnIssueEscalated: !p.notifications.emailOnIssueEscalated } }))}
                    label="Urgent Support Tickets"
                    desc="Instant alerts when a customer or driver escalates a high-severity issue."
                  />
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Phone size={18} className="text-primary-600" /> SMS & Mobile Alerts
                </h3>
                <div className="space-y-1">
                  <Toggle 
                    checked={settings.notifications.smsOnUrgentIssue} 
                    onChange={() => setSettings(p => ({ ...p, notifications: { ...p.notifications, smsOnUrgentIssue: !p.notifications.smsOnUrgentIssue } }))}
                    label="System Critical Incidents"
                    desc="Receive SMS alerts for platform-wide outages or security breaches."
                  />
                  <Toggle 
                    checked={settings.notifications.smsWeeklyDigest} 
                    onChange={() => setSettings(p => ({ ...p, notifications: { ...p.notifications, smsWeeklyDigest: !p.notifications.smsWeeklyDigest } }))}
                    label="Weekly Performance Digest"
                    desc="A high-level summary of rides, revenue, and active fleet count."
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "access" && (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Lock size={18} className="text-indigo-600" /> Permissions Hierarchy
              </h3>
              <div className="space-y-4">
                {[
                  { role: "Super Admin", desc: "Full recursive access to all collections and system settings.", color: "bg-slate-900 text-white" },
                  { role: "Assistant", desc: "Read-only access to stats, with managed write permissions for KYC and bookings.", color: "bg-indigo-100 text-indigo-700" },
                  { role: "Vendor Admin", desc: "Can manage their specific corporate fleet only.", color: "bg-blue-100 text-blue-700" },
                ].map((role, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${role.color}`}>{role.role}</div>
                    <p className="text-xs text-slate-500 leading-relaxed">{role.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Security Audit Trail</h4>
                    <p className="text-xs text-slate-400 mt-0.5">All administrative actions are cryptographically logged.</p>
                  </div>
                  <ChevronRight size={20} className="text-slate-300" />
                </div>
              </div>
            </div>
          )}

          {activeTab === "system" && (
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Globe size={18} className="text-indigo-600" /> Regional Preferences
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">System Timezone</p>
                    <div className="grid grid-cols-2 gap-3">
                      {["Africa/Nairobi", "UTC"].map((tz) => (
                        <button
                          key={tz}
                          onClick={() => setSettings(p => ({ ...p, system: { ...p.system, timezone: tz as any } }))}
                          className={`p-4 rounded-2xl border font-bold text-sm transition-all
                            ${settings.system.timezone === tz ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"}
                          `}
                        >
                          {tz}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-primary-600" /> Support Channels
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Support Email</p>
                    <input 
                      type="email"
                      value={settings.system.contactEmail}
                      onChange={(e) => setSettings(p => ({ ...p, system: { ...p.system, contactEmail: e.target.value } }))}
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Support Phone</p>
                    <input 
                      type="tel"
                      value={settings.system.contactPhone}
                      onChange={(e) => setSettings(p => ({ ...p, system: { ...p.system, contactPhone: e.target.value } }))}
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
