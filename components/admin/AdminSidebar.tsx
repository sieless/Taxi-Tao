"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Car, 
  ShieldCheck, 
  Briefcase,
  Building2, 
  CalendarCheck, 
  CreditCard, 
  MessageSquare, 
  Link2, 
  BarChart3, 
  History, 
  Bug, 
  Settings, 
  Database,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { hasAdminPermission } from "@/lib/admin-permission-helper";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  permission?: Parameters<typeof hasAdminPermission>[1];
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Overview", icon: <LayoutDashboard size={20} /> },
  { id: "users", label: "Users", icon: <Users size={20} />, permission: "manageUsers" },
  { id: "drivers", label: "Drivers", icon: <Car size={20} />, permission: "manageDrivers" },
  { id: "kyc", label: "KYC Review", icon: <ShieldCheck size={20} />, permission: "manageDrivers" },
  { id: "companies", label: "Corporate", icon: <Building2 size={20} /> },
  { id: "hire", label: "Car Hire", icon: <Briefcase size={20} />, permission: "managePayments" },
  { id: "bookings", label: "Bookings", icon: <CalendarCheck size={20} />, permission: "manageRides" },
  { id: "payments", label: "Payments", icon: <CreditCard size={20} />, permission: "managePayments" },
  { id: "issues", label: "Support", icon: <MessageSquare size={20} />, permission: "manageIssues" },
  { id: "share-links", label: "Links", icon: <Link2 size={20} />, permission: "manageRides" },
  { id: "analytics", label: "Analytics", icon: <BarChart3 size={20} />, permission: "viewAnalytics" },
  { id: "audit", label: "Audit Logs", icon: <History size={20} />, permission: "viewAnalytics" },
  { id: "crashes", label: "Crash Reports", icon: <Bug size={20} /> },
  { id: "settings", label: "Settings", icon: <Settings size={20} />, adminOnly: true },
  { id: "db-diagnostics", label: "Diagnostics", icon: <Database size={20} />, adminOnly: true },
];

export default function AdminSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";
  const { userProfile, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const canSee = (item: NavItem) => {
    if (!userProfile) return false;
    if (userProfile.role === "admin") return true;
    if (item.adminOnly) return false;
    if (!item.permission) return true;
    return hasAdminPermission(userProfile, item.permission);
  };

  const handleNav = (id: string) => {
    router.push(`/admin/dashboard?tab=${id}`);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button 
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 bg-white rounded-lg shadow-md border border-slate-200 text-slate-600"
        >
          {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`bg-slate-900 text-slate-300 z-40 transition-all duration-300 ease-in-out border-r border-slate-800 flex-shrink-0
          ${isMobileOpen ? "fixed inset-y-0 left-0 w-64 translate-x-0" : "fixed inset-y-0 left-0 -translate-x-full lg:relative lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen"}
          ${isCollapsed ? "lg:w-20" : "lg:w-64"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-6 flex items-center justify-between">
            <div className={`flex items-center gap-3 transition-opacity duration-300 ${isCollapsed ? "lg:opacity-0" : "opacity-100"}`}>
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold">T</div>
              <span className="font-bold text-white tracking-tight">TaxiTao Admin</span>
            </div>
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 transition-colors"
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
            {NAV_ITEMS.filter(canSee).map((item) => (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                  ${activeTab === item.id 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20" 
                    : "hover:bg-slate-800 hover:text-white"
                  }
                `}
              >
                <div className={`flex-shrink-0 transition-transform duration-300 ${activeTab === item.id ? "scale-110" : "group-hover:scale-110"}`}>
                  {item.icon}
                </div>
                {!isCollapsed && (
                  <span className="truncate whitespace-nowrap">{item.label}</span>
                )}
                {isCollapsed && (
                  <div className="absolute left-16 hidden group-hover:block px-2 py-1 bg-slate-800 text-white text-xs rounded shadow-xl whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </button>
            ))}
          </nav>

          {/* Footer / Logout */}
          <div className="p-4 border-t border-slate-800">
            <button
              onClick={() => logout()}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-900/20 hover:text-red-400 transition-all group"
            >
              <LogOut size={20} className="flex-shrink-0 group-hover:scale-110 transition-transform" />
              {!isCollapsed && <span>Sign Out</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
