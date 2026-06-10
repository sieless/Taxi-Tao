"use client";

import { Settings, Building2, Bell, Shield, Wallet } from "lucide-react";

export default function VendorSettingsPage() {
  const settingsGroups = [
    { icon: Building2, title: "Company Profile", desc: "Update your business details and location." },
    { icon: Wallet, title: "Payout Settings", desc: "Manage your bank accounts and M-Pesa till numbers." },
    { icon: Bell, title: "Notifications", desc: "Configure how you receive booking alerts." },
    { icon: Shield, title: "Security", desc: "Update your password and 2FA settings." },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your company preferences and account security.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingsGroups.map((group, idx) => (
          <button key={idx} className="bg-white p-6 rounded-3xl border shadow-sm hover:shadow-md transition text-left group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-2xl group-hover:bg-primary-50 group-hover:text-primary-600 transition">
                <group.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">{group.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{group.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-red-50 border border-red-100 p-8 rounded-3xl">
        <h3 className="text-lg font-bold text-red-900">Danger Zone</h3>
        <p className="text-sm text-red-700 mt-1">Once you deactivate your company account, all active fleet listings will be hidden.</p>
        <button className="mt-6 px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition shadow-lg shadow-red-600/20">
          Deactivate Account
        </button>
      </div>
    </div>
  );
}
