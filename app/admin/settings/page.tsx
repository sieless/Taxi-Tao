"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Bell, Globe, ShieldCheck, Mail, Phone, Info } from "lucide-react";

type Tab = "notifications" | "access" | "system";

export default function AdminSettingsPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("notifications");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  const SettingCard = ({
    title,
    description,
    children,
  }: {
    title: string;
    description: string;
    children: React.ReactNode;
  }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{description}</p>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex flex-col gap-2">
          <p className="text-sm text-gray-500">Admin Settings</p>
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">Control Center</h1>
          </div>
          <p className="text-gray-600 text-sm">
            Configure notifications, visibility, and support metadata for the
            admin experience.
          </p>
        </header>

        <div className="flex flex-wrap gap-2">
          {[
            { id: "notifications", label: "Notifications", icon: Bell },
            { id: "access", label: "Access Control", icon: ShieldCheck },
            { id: "system", label: "System Preferences", icon: Globe },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition border ${
                  activeTab === tab.id
                    ? "bg-purple-600 text-white border-purple-700"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "notifications" && (
          <div className="grid md:grid-cols-2 gap-4">
            <SettingCard
              title="Email alerts"
              description="Receive updates when new drivers join, payments are verified, or issues are escalated."
            >
              <label className="flex items-center gap-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-purple-600"
                  defaultChecked
                />
                Important account and billing updates
              </label>
              <label className="flex items-center gap-3 text-sm text-gray-700 mt-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-purple-600"
                  defaultChecked
                />
                Booking/dispatch escalations
              </label>
            </SettingCard>

            <SettingCard
              title="SMS alerts"
              description="Lightweight reminders for dispatch incidents and urgent platform notifications."
            >
              <label className="flex items-center gap-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-purple-600"
                  defaultChecked
                />
                Urgent platform issues
              </label>
              <label className="flex items-center gap-3 text-sm text-gray-700 mt-2">
                <input type="checkbox" className="h-4 w-4 text-purple-600" />
                Weekly summary digest
              </label>
            </SettingCard>
          </div>
        )}

        {activeTab === "access" && (
          <div className="grid md:grid-cols-2 gap-4">
            <SettingCard
              title="Roles overview"
              description="Read-only snapshot of the active admin and staff roles. Extend with granular permissions later."
            >
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700">
                    Admin
                  </span>
                  Full access to dashboards and driver/user management
                </li>
                <li className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                    Support
                  </span>
                  Read/resolve client issues, limited edits
                </li>
              </ul>
              <p className="text-xs text-gray-500 mt-3">
                Hook this section to your auth provider for live role
                enforcement.
              </p>
            </SettingCard>

            <SettingCard
              title="Audit & visibility"
              description="Track sensitive actions. This panel can later link to a dedicated audit log."
            >
              <div className="text-sm text-gray-700 space-y-2">
                <p>• Driver approvals and subscription changes</p>
                <p>• User role updates</p>
                <p>• Broadcast notifications and payment verifications</p>
              </div>
            </SettingCard>
          </div>
        )}

        {activeTab === "system" && (
          <div className="grid md:grid-cols-2 gap-4">
            <SettingCard
              title="Locale & timezone"
              description="Display preferences for admin UI."
            >
              <div className="space-y-2 text-sm text-gray-700">
                <label className="flex items-center gap-3">
                  <input type="radio" name="tz" defaultChecked /> Africa/Nairobi
                  (EAT)
                </label>
                <label className="flex items-center gap-3">
                  <input type="radio" name="tz" /> UTC
                </label>
              </div>
            </SettingCard>

            <SettingCard
              title="Support contacts"
              description="Surface who to reach for incidents and platform access."
            >
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <Mail className="w-4 h-4 text-gray-500" />
                <span>support@taxitao.com</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700 mt-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <span>+254 700 000 000</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-gray-500 mt-3">
                <Info className="w-4 h-4 text-gray-400 mt-0.5" />
                <span>
                  Replace these with live contacts or integrate with your
                  incident paging system.
                </span>
              </div>
            </SettingCard>
          </div>
        )}
      </div>
    </div>
  );
}
