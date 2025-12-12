"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Bell,
  Shield,
  CreditCard,
  Phone,
  User,
  Trash2,
  Save,
} from "lucide-react";

type Tab = "profile" | "notifications" | "payments";

// ----------------------------------------------------
// MAIN PAGE COMPONENT
// ----------------------------------------------------

export default function CustomerSettingsPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  // Load user data
  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || "",
        phone: userProfile.phone || user?.phoneNumber || "",
      });
    }
  }, [userProfile, user]);

  const onChange = (key: "name" | "phone", value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* HEADER */}
        <header className="space-y-2">
          <p className="text-sm text-gray-500">Customer Settings</p>
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Account & Preferences
            </h1>
          </div>
          <p className="text-sm text-gray-600">
            Update your contact details, notifications, and payment preferences.
          </p>
        </header>

        {/* TABS */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: "profile", label: "Profile", icon: User },
            { id: "notifications", label: "Notifications", icon: Bell },
            { id: "payments", label: "Payments", icon: CreditCard },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition border ${
                  activeTab === tab.id
                    ? "bg-green-600 text-white border-green-700"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB CONTENTS */}
        {activeTab === "profile" && (
          <ProfileTab formData={formData} onChange={onChange} />
        )}
        {activeTab === "notifications" && <NotificationsTab />}
        {activeTab === "payments" && <PaymentsTab />}

        {/* DANGER ZONE */}
        <DangerZone />
      </div>
    </div>
  );
}

// ----------------------------------------------------
// PROFILE TAB
// ----------------------------------------------------

function ProfileTab({
  formData,
  onChange,
}: {
  formData: { name: string; phone: string };
  onChange: (key: "name" | "phone", value: string) => void;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Full name
          </label>
          <input
            value={formData.name}
            onChange={(e) => onChange("name", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
            placeholder="Your name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Phone
          </label>
          <input
            value={formData.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
            placeholder="+254..."
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold shadow-sm">
          <Save className="w-4 h-4" />
          Save changes
        </button>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// NOTIFICATIONS TAB
// ----------------------------------------------------

function NotificationsTab() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
      <p className="text-sm text-gray-600">
        Choose how you want to be alerted about rides, payments, and driver
        updates.
      </p>

      <div className="space-y-3 text-sm text-gray-700">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="h-4 w-4 text-green-600"
            defaultChecked
          />
          Ride status updates
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="h-4 w-4 text-green-600"
            defaultChecked
          />
          Payment receipts
        </label>

        <label className="flex items-center gap-3">
          <input type="checkbox" className="h-4 w-4 text-green-600" />
          Promotions & offers
        </label>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// PAYMENTS TAB
// ----------------------------------------------------

function PaymentsTab() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
      <p className="text-sm text-gray-600">Payment preferences</p>

      <div className="space-y-3 text-sm text-gray-700">
        <label className="flex items-center gap-3">
          <input type="radio" name="paymethod" defaultChecked />
          MPesa (preferred)
        </label>

        <label className="flex items-center gap-3">
          <input type="radio" name="paymethod" />
          Card on file (coming soon)
        </label>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// DANGER ZONE
// ----------------------------------------------------

function DangerZone() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-3">
      <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
        <Trash2 className="w-4 h-4 text-red-500" />
        Account actions
      </h3>

      <p className="text-sm text-gray-600">
        Need to leave? You can request account deletion.
      </p>

      <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-50">
        Request account deletion
      </button>
    </div>
  );
}
