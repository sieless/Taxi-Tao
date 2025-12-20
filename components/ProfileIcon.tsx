// ProfileIcon.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User as UserIcon,
  LogOut,
  UserCircle,
  LayoutDashboard,
  Calendar,
  Bell,
  Settings,
  HelpCircle,
  MapPin,
  Wallet,
  Users,
  Banana
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const ROLE_MAP = {
  admin: { label: "Admin", badge: "bg-purple-100 text-purple-800" },
  driver: { label: "Driver", badge: "bg-green-100 text-green-800" },
  customer: { label: "Customer", badge: "bg-blue-100 text-blue-800" },
  default: { label: "User", badge: "bg-gray-100 text-gray-800" },
} as const;

export default function ProfileIcon() {
  const { user, userProfile, driverProfile, logout, loading, error } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("pointerdown", handleClickOutside);
      return () => document.removeEventListener("pointerdown", handleClickOutside);
    }
  }, [isOpen]);

  // Close with Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    }
  }, [isOpen]);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  const navigate = (path: string) => {
    setIsOpen(false);
    router.push(path);
  };

  // safe initials
  const getInitials = () => {
    const displayName = userProfile?.name ?? driverProfile?.name ?? user?.displayName ?? user?.email ?? "";
    const parts = displayName.split(" ").filter(Boolean);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return ((parts[0][0] ?? "") + (parts[1][0] ?? "")).toUpperCase();
  };

  const role = userProfile?.role ?? "default";
  const roleMeta = (ROLE_MAP as any)[role] ?? ROLE_MAP.default;
  const displayName = userProfile?.name ?? driverProfile?.name ?? user?.email?.split("@")[0] ?? "User";

  if (!user) return null;

  // Navigation items based on role
  const getNavigationItems = () => {
    const common = [
      { icon: UserCircle, label: "Profile", path: role === "admin" ? "/admin/profile" : role === "driver" ? "/driver/profile" : "/customer/profile" },
      { icon: Settings, label: "Settings", path: role === "admin" ? "/admin/settings" : role === "driver" ? "/driver/settings" : "/customer/settings" },
      { icon: HelpCircle, label: "Help", path: "/help" },
    ];

    if (role === "admin") {
      return [
        { icon: LayoutDashboard, label: "Panel", path: "/admin/panel" },
        { icon: Users, label: "Drivers", path: "/admin/drivers" },
        { icon: UserCircle, label: "Users", path: "/admin/users" },
        ...common,
      ];
    } else if (role === "driver") {
      return [
        { icon: LayoutDashboard, label: "Dashboard", path: "/driver/dashboard" },
        { icon: Banana, label: "Marketing Poster", path: "/driver/marketing-poster" },
        { icon: Calendar, label: "Bookings", path: "/driver/bookings" },
        { icon: MapPin, label: "Route Pricing", path: "/driver/pricing" },
        { icon: Bell, label: "Notifications", path: "/driver/notifications" },
        ...common,
      ];
    } else {
      return [
        { icon: LayoutDashboard, label: "Dashboard", path: "/customer/dashboard" },
        { icon: Calendar, label: "Bookings", path: "/customer/bookings" },
        { icon: Bell, label: "Notifications", path: "/customer/notifications" },
        ...common,
      ];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100 transition"
        title="Profile"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white font-bold shadow-md overflow-hidden">
          {user.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            getInitials()
          )}
        </div>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-[90vw] sm:w-72 max-w-72 bg-white rounded-xl shadow-2xl border border-gray-200 z-[9999] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
          role="menu"
          aria-label="Profile menu"
        >
          {/* Header Section */}
          <div className="bg-gradient-to-br from-green-500 to-green-700 p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-xl overflow-hidden ring-2 ring-white/30">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  getInitials()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-lg truncate">{loading ? "Loading..." : displayName}</p>
                <p className="text-sm text-green-50 truncate">{user.email}</p>
                <span className={`inline-block mt-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full ${roleMeta.badge}`}>
                  {loading ? "Loading..." : roleMeta.label}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Section */}
          <div className="py-2">
            <div className="px-3 py-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Quick Actions</p>
            </div>

            {navigationItems.map((item, index) => (
              <button
                key={index}
                onClick={() => navigate(item.path)}
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition text-left group"
                role="menuitem"
              >
                <div className="w-9 h-9 rounded-lg bg-gray-100 group-hover:bg-green-50 flex items-center justify-center transition">
                  <item.icon className="w-4 h-4 text-gray-600 group-hover:text-green-600 transition" />
                </div>
                <span className="font-medium text-gray-700 group-hover:text-gray-900 text-sm">
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          {/* Logout Section */}
          <div className="border-t border-gray-200 p-2">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-red-50 transition text-left text-red-600 rounded-lg group"
              role="menuitem"
            >
              <div className="w-9 h-9 rounded-lg bg-red-50 group-hover:bg-red-100 flex items-center justify-center transition">
                <LogOut className="w-4 h-4" />
              </div>
              <span className="font-medium text-sm">Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
