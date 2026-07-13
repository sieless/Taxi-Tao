"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Bell, 
  Search, 
  User, 
  ChevronDown,
  Globe,
  HelpCircle,
  LogOut,
  Settings,
  Shield,
  X,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";


import { logError } from "@/lib/logger";const TAB_LABELS: Record<string, string> = {
  dashboard: "Overview",
  users: "User Management",
  drivers: "Driver Management",
  kyc: "KYC Verification",
  companies: "Corporate Fleets",
  hire: "Car Hire Control",
  bookings: "Booking Requests",
  payments: "Payment Verifications",
  issues: "Support Issues",
  "share-links": "Share Links",
  analytics: "Analytics Dashboard",
  audit: "Audit Logs",
  crashes: "Crash Reports",
  crashlytics: "Firebase Crashlytics",
  settings: "Admin Settings",
  "db-diagnostics": "Database Diagnostics",
};

export default function AdminHeader() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") || "dashboard";
  const { userProfile, logout } = useAuth();
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [isSearching, setIsSearching] = useState(false);
  
  // Sync searchQuery with URL on change (Debounced)
  useEffect(() => {
    if (searchQuery !== (searchParams.get("search") || "")) {
      setIsSearching(true);
    }
    
    const timer = setTimeout(() => {
      const current = searchParams.get("search") || "";
      if (searchQuery === current) {
        setIsSearching(false);
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      if (searchQuery) {
        params.set("search", searchQuery);
      } else {
        params.delete("search");
      }
      router.replace(`?${params.toString()}`, { scroll: false });
      setIsSearching(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (err) {
      logError("AdminHeader", err);
    }
  };

  return (
    <header className="sticky top-0 z-50 flex h-20 w-full items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-xl lg:px-10 transition-all">
      {/* Title / Breadcrumb */}
      <div className="flex items-center gap-5">
        <div className="flex flex-col">
          <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
            {TAB_LABELS[activeTab] || "Admin Portal"}
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            TaxiTao Management v2.0
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 lg:gap-6">
        {/* Search Toolbar (Desktop) */}
        <div className="relative hidden lg:block">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-400">
            {isSearching ? <RefreshCw size={16} className="animate-spin text-indigo-500" /> : <Search size={16} />}
          </div>
          <input 
            type="text" 
            placeholder="Search documents, drivers, or transactions..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 w-64 xl:w-96 rounded-2xl border border-slate-200 bg-slate-50/50 pl-11 pr-10 text-sm font-medium focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="p-1 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X size={14} className="text-slate-400" />
              </button>
            )}
            {!searchQuery && (
              <div className="px-1.5 py-0.5 rounded-md bg-slate-200/50 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                ESC
              </div>
            )}
          </div>
        </div>

        {/* System Icons */}
        <div className="flex items-center gap-2 p-1 bg-slate-100/50 rounded-2xl border border-slate-200/50">
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2.5 rounded-xl transition-all relative group
                ${showNotifications ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900 hover:bg-white/50"}
              `}
            >
              <Bell size={20} className={showNotifications ? "" : "group-hover:animate-[wiggle_1s_ease-in-out_infinite]"} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-bold text-slate-900 text-sm">System Alerts</h3>
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-black uppercase">2 New</span>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <div className="p-4 hover:bg-slate-50 transition-colors border-b border-slate-100 cursor-pointer">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                        <Shield size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">New KYC Submission</p>
                        <p className="text-[10px] text-slate-500 mt-1">Driver John Doe has uploaded documents for verification.</p>
                        <p className="text-[10px] text-indigo-500 font-bold mt-2">2 minutes ago</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 hover:bg-slate-50 transition-colors border-b border-slate-100 cursor-pointer">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Payment Verified</p>
                        <p className="text-[10px] text-slate-500 mt-1">Hire Service payment for Toyota Crown has been cleared.</p>
                        <p className="text-[10px] text-indigo-500 font-bold mt-2">15 minutes ago</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-3 text-center border-t border-slate-100">
                  <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors">Clear All Notifications</button>
                </div>
              </div>
            )}
          </div>

          <button className="hidden sm:flex p-2.5 text-slate-500 hover:text-slate-900 hover:bg-white/50 rounded-xl transition-all">
            <Globe size={20} />
          </button>
          <button className="hidden sm:flex p-2.5 text-slate-500 hover:text-slate-900 hover:bg-white/50 rounded-xl transition-all">
            <HelpCircle size={20} />
          </button>
        </div>

        <div className="h-10 w-px bg-slate-200 mx-1 hidden md:block" />

        {/* User Profile */}
        <div className="relative" ref={userMenuRef}>
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`flex items-center gap-3 p-1.5 pr-3 rounded-2xl transition-all
              ${showUserMenu ? "bg-slate-100 ring-4 ring-slate-100" : "hover:bg-slate-50"}
            `}
          >
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-black shadow-lg shadow-indigo-200">
              {userProfile?.name?.charAt(0) || <User size={18} />}
            </div>
            <div className="flex flex-col items-start hidden sm:flex">
              <span className="text-xs font-black text-slate-900 leading-none">{userProfile?.name?.split(' ')[0] || "Admin"}</span>
              <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-tighter mt-1">{userProfile?.role || "Administrator"}</span>
            </div>
            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${showUserMenu ? "rotate-180" : ""}`} />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-3 w-56 bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Account</p>
                <p className="text-xs font-bold text-slate-900 truncate">{userProfile?.email || "admin@taxitao.com"}</p>
              </div>
              <div className="p-2">
                <button className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors text-xs font-bold">
                  <User size={16} />
                  My Profile
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors text-xs font-bold">
                  <Settings size={16} />
                  Preferences
                </button>
              </div>
              <div className="p-2 border-t border-slate-100">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-xs font-black uppercase tracking-wider"
                >
                  <LogOut size={16} />
                  Log Out System
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(8deg); }
          75% { transform: rotate(-8deg); }
        }
      `}</style>
    </header>
  );
}
