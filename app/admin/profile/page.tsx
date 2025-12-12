"use client";

import Link from "next/link";
import { Shield, Mail, Phone, Activity, Users, Settings } from "lucide-react";

export default function AdminProfilePage() {
  const summary = [
    { label: "Total Drivers", value: "—", icon: Users },
    { label: "Pending Approvals", value: "—", icon: Shield },
    { label: "Issues Resolved (30d)", value: "—", icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-gray-500 font-semibold">
              Admin
            </p>
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            <p className="text-gray-600 mt-1">
              Update your contact details and review your recent activity.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/settings"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
            <Link
              href="/admin/panel"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 transition"
            >
              Back to Panel
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {summary.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3"
              >
                <div className="p-3 rounded-lg bg-green-50 text-green-700">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{item.label}</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {item.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Contact</h2>
            <p className="text-gray-600 text-sm">
              Keep this information current so the team can reach you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                defaultValue="Administrator"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Role</label>
              <input
                type="text"
                defaultValue="Admin"
                disabled
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-600"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  defaultValue="admin@example.com"
                  className="flex-1 outline-none"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Phone</label>
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <input
                  type="tel"
                  defaultValue="+254 700 000000"
                  className="flex-1 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition">
              Save changes
            </button>
            <button className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition">
              Reset
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent activity</h2>
            <Link href="/admin/panel" className="text-sm text-green-600 font-medium">
              View in panel
            </Link>
          </div>
          <ul className="space-y-3 text-sm text-gray-700">
            <li>• Approved pending driver subscriptions.</li>
            <li>• Reviewed client issues and dispatched follow-up.</li>
            <li>• Broadcasted ride availability to drivers.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Shield, Mail, Phone, User, Activity } from "lucide-react";

export default function AdminProfilePage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  const name = userProfile?.name || user?.email?.split("@")[0] || "Admin";
  const email = user?.email || "Not set";
  const phone = userProfile?.phone || "Not set";

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Admin Profile</p>
            <h1 className="text-3xl font-bold text-gray-900">{name}</h1>
          </div>
          <div className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-semibold">Admin</span>
          </div>
        </header>

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5 text-gray-500" />
            Account details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
              <p className="text-xs uppercase text-gray-500 font-semibold">Name</p>
              <p className="font-medium">{name}</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-100 flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs uppercase text-gray-500 font-semibold">Email</p>
                <p className="font-medium break-all">{email}</p>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-100 flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs uppercase text-gray-500 font-semibold">Phone</p>
                <p className="font-medium">{phone}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-500" />
            Recent admin activity
          </h2>
          <ul className="space-y-3 text-sm text-gray-700">
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Reviewed driver approvals and subscription status
            </li>
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Checked booking dispatch queue for escalations
            </li>
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
              Verified recent user signups and roles
            </li>
          </ul>
          <p className="text-xs text-gray-500">
            Add richer audit data here later (filters, time ranges, and export).
          </p>
        </section>
      </div>
    </div>
  );
}

