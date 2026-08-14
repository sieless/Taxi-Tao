"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { isAdminOrAssistant, hasAdminPermission } from "@/lib/admin-permission-helper";
import { ModalProvider } from "@/lib/admin-modal-context";
import { useAdminSession } from "@/lib/use-admin-session";
import Logo from "@/components/Logo";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import {
  LogOut,
  AlertTriangle,
  Clock,
} from "lucide-react";

// Nav items are now managed in AdminSidebar.tsx

// ── Session warning overlay ───────────────────────────────────────────────────
function SessionWarning({
  countdown,
  onStayLoggedIn,
  onLogout,
}: {
  countdown: number;
  onStayLoggedIn: () => void;
  onLogout: () => void;
}) {
  const progress = Math.min((countdown / 60) * 100, 100);
  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
        <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Clock className="text-amber-500" size={28} />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Session Expiring</h2>
        <p className="text-gray-600 text-sm mb-4">
          You will be automatically logged out in{" "}
          <strong className="text-amber-600">{countdown}s</strong> due to inactivity.
        </p>
        {/* Countdown bar */}
        <div className="h-1.5 bg-gray-100 rounded-full mb-5 overflow-hidden">
          <div
            className="h-full bg-amber-400 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={onLogout}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition"
          >
            Log Out Now
          </button>
          <button
            onClick={onStayLoggedIn}
            className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition shadow-lg shadow-indigo-200"
          >
            Stay Logged In
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────
function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, userProfile, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sessionWarning, setSessionWarning] = useState(false);
  const [sessionCountdown, setSessionCountdown] = useState(60);

  // Auth guard
  useEffect(() => {
    if (!loading && (!user || !isAdminOrAssistant(userProfile))) {
      try {
        router.replace("/login");
      } catch {
        if (typeof window !== "undefined") {
          window.location.replace("/login");
        }
      }
    }
  }, [loading, user, userProfile, router]);

  const handleLogout = useCallback(async () => {
    setSessionWarning(false);
    await logout();
    try {
      router.push("/");
    } catch {
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  }, [logout, router]);

  // Session idle timeout — warns at 19 min, logs out at 20 min
  const { reset: resetSession } = useAdminSession({
    idleMinutes: 20,
    warningMinutes: 1,
    onIdle: handleLogout,
    onWarning: (secondsLeft) => {
      setSessionWarning(true);
      setSessionCountdown(secondsLeft);
    },
    onActivityResume: () => setSessionWarning(false),
  });

  const handleStayLoggedIn = () => {
    setSessionWarning(false);
    resetSession();
  };

  if (loading || !user || !isAdminOrAssistant(userProfile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm font-medium tracking-wide">Securing connection…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <AdminHeader />
        
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 lg:p-8 scrollbar-hide">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Session warning overlay */}
      {sessionWarning && (
        <SessionWarning
          countdown={sessionCountdown}
          onStayLoggedIn={handleStayLoggedIn}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

// ── Root export wraps with ModalProvider ──────────────────────────────────────
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModalProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </ModalProvider>
  );
}
