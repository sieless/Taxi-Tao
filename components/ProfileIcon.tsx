"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, LogOut, Settings, UserCircle, Home } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function ProfileIcon() {
  const { user, userProfile, logout, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    router.push("/");
  };

  const navigateToDashboard = () => {
    setIsOpen(false);
    if (userProfile?.role === "admin") {
      router.push("/admin/panel");
    } else if (userProfile?.role === "driver") {
      router.push("/driver/dashboard");
    } else {
      router.push("/");
    }
  };

  if (!user) {
    return null;
  }

  // Get initials for avatar
  const getInitials = () => {
    if (userProfile?.role === "driver" && userProfile.driverId) {
      return user.email?.substring(0, 2).toUpperCase() || "DR";
    }
    return user.email?.substring(0, 2).toUpperCase() || "U";
  };

  const getRoleLabel = () => {
    if (loading) return "Loading...";
    if (!userProfile) return "Customer"; // Fallback if profile missing
    switch (userProfile.role) {
      case "admin":
        return "Administrator";
      case "driver":
        return "Driver";
      case "customer":
        return "Customer";
      default:
        return "User";
    }
  };

  const getRoleBadgeColor = () => {
    if (loading) return "bg-gray-100 text-gray-800";
    if (!userProfile) return "bg-blue-100 text-blue-800"; // Fallback color
    switch (userProfile.role) {
      case "admin":
        return "bg-purple-100 text-purple-800";
      case "driver":
        return "bg-green-100 text-green-800";
      case "customer":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100 transition"
        title="Profile"
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white font-bold shadow-md overflow-hidden">
          {user.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            getInitials()
          )}
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-br from-green-500 to-green-700 p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  getInitials()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{user.email}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${getRoleBadgeColor()} bg-white/90`}>
                  {getRoleLabel()}
                </span>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {/* View Dashboard/Profile */}
            <button
              onClick={navigateToDashboard}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition text-left"
            >
              <UserCircle className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-800">
                  {loading ? "Loading..." :
                   !userProfile ? "My Profile" :
                   userProfile.role === "admin" ? "Admin Panel" : 
                   userProfile.role === "driver" ? "Driver Dashboard" : 
                   "My Profile"}
                </p>
                <p className="text-xs text-gray-500">
                  {loading ? "Please wait..." :
                   !userProfile ? "View your account details" :
                   userProfile.role === "admin" ? "Manage drivers and subscriptions" :
                   userProfile.role === "driver" ? "View subscription and bookings" :
                   "View your account details"}
                </p>
              </div>
            </button>

            {/* Home Link for Drivers */}
            {userProfile?.role === "driver" && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push("/");
                }}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition text-left"
              >
                <Home className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-800">Home Page</p>
                  <p className="text-xs text-gray-500">View site as customer</p>
                </div>
              </button>
            )}

            {/* Divider */}
            <div className="border-t border-gray-200 my-2"></div>

            {/* Profile Details */}
            <div className="px-4 py-2">
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Account Details</p>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm text-gray-800 truncate">{user.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">User ID</p>
                  <p className="text-sm text-gray-800 font-mono text-xs truncate">{user.uid}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Account Type</p>
                  <p className="text-sm text-gray-800 capitalize">
                    {loading ? "Loading..." : (userProfile?.role || "Customer")}
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-2"></div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-50 transition text-left text-red-600"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
