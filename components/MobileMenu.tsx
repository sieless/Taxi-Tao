// MobileMenu.tsx
import {
  User,
  LogOut,
  History,
  Settings,
  X,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Driver } from "@/lib/types";
import { useRouter } from "next/navigation";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  driver: Driver;
  onLogout: () => void;
  onToggleStatus: () => void;
  onEditProfile: () => void;
}

export default function MobileMenu({
  isOpen,
  onClose,
  driver,
  onLogout,
  onToggleStatus,
  onEditProfile,
}: MobileMenuProps) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] transition-opacity duration-300"
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer Panel */}
      <div
        className="
          fixed top-0 right-0 bottom-0
          w-[85vw] max-w-80
          bg-white shadow-2xl z-[80] flex flex-col
          animate-in slide-in-from-right duration-300
          overflow-y-auto
        "
        role="dialog"
        aria-modal="true"
      >
        {/* Header / Profile Section */}
        <div className="p-6 bg-gray-50 border-b border-gray-100">
          <div className="flex justify-between items-start mb-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center border-2 border-green-500 overflow-hidden shadow-sm">
              {driver.profilePhotoUrl ? (
                <img
                  src={driver.profilePhotoUrl}
                  alt={driver.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-green-700" />
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900">{driver.name}</h2>
            <p className="text-sm text-gray-500 mt-1">{driver.phone}</p>
            <div className="flex items-center gap-2 mt-3">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  driver.status === "available"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {driver.status === "available" ? "Online" : "Offline"}
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500 capitalize">
                {driver.vehicles?.[0]?.make} {driver.vehicles?.[0]?.model}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <button
            onClick={() => {
              onClose();
              router.push("/driver/history");
            }}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <History className="w-5 h-5 text-blue-600" />
              </div>
              <span className="font-medium text-gray-700">Ride History</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button
            onClick={() => {
              onClose();
              router.push("/driver/settings");
            }}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                <Settings className="w-5 h-5 text-purple-600" />
              </div>
              <span className="font-medium text-gray-700">Settings</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button
            onClick={() => {
              onClose();
              onEditProfile();
            }}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                <User className="w-5 h-5 text-orange-600" />
              </div>
              <span className="font-medium text-gray-700">Edit Profile</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 space-y-4">
          {/* Status Toggle */}
          <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
            <span className="font-medium text-gray-700">Go Online</span>
            <button
              onClick={onToggleStatus}
              className={`transition-colors ${
                driver.status === "available" ? "text-green-600" : "text-gray-400"
              }`}
              aria-pressed={driver.status === "available"}
            >
              {driver.status === "available" ? (
                <ToggleRight className="w-10 h-10" />
              ) : (
                <ToggleLeft className="w-10 h-10" />
              )}
            </button>
          </div>

          {/* Logout */}
          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full flex items-center justify-center gap-2 p-3 text-red-600 font-medium hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
}
