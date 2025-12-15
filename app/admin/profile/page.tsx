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
              <p className="text-xs uppercase text-gray-500 font-semibold">
                Name
              </p>
              <p className="font-medium">{name}</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-100 flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs uppercase text-gray-500 font-semibold">
                  Email
                </p>
                <p className="font-medium break-all">{email}</p>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-100 flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs uppercase text-gray-500 font-semibold">
                  Phone
                </p>
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
