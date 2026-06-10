"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  FileText,
  Clock,
  CheckCircle,
  CreditCard,
  Loader2,
} from "lucide-react";

/**
 * Rentals Page - Tab Navigation
 *
 * Provides navigation between:
 * - Pending: Hire requests awaiting approval
 * - Active: Currently active rentals
 * - Payments: Payment management
 */
export default function RentalsPage() {
  const { userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading) {
      // Redirect to pending tab by default
      if (pathname === "/vendor/rentals") {
        router.replace("/vendor/rentals/pending");
      }
    }
  }, [mounted, authLoading, pathname, router]);

  if (!mounted || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const tabs = [
    {
      id: "pending",
      href: "/vendor/rentals/pending",
      label: "Pending",
      icon: Clock,
      color: "amber",
    },
    {
      id: "active",
      href: "/vendor/rentals/active",
      label: "Active",
      icon: FileText,
      color: "green",
    },
    {
      id: "payments",
      href: "/vendor/rentals/payments",
      label: "Payments",
      icon: CreditCard,
      color: "blue",
    },
  ];

  const currentTab = pathname.split("/").pop() || "pending";

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            Rental Operations
          </span>
        </div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none uppercase">
          Rentals Management
        </h1>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => router.push(tab.href)}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
              currentTab === tab.id
                ? `bg-white text-${tab.color}-600 shadow-sm`
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {currentTab === "pending" && (
          <div className="text-center py-12">
            <p className="text-gray-500 font-medium">
              Loading pending rentals...
            </p>
          </div>
        )}
        {currentTab === "active" && (
          <div className="text-center py-12">
            <p className="text-gray-500 font-medium">
              Loading active rentals...
            </p>
          </div>
        )}
        {currentTab === "payments" && (
          <div className="text-center py-12">
            <p className="text-gray-500 font-medium">Loading payments...</p>
          </div>
        )}
      </div>
    </div>
  );
}
