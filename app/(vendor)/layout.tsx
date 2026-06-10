"use client";

import { useAuth } from "@/lib/auth-context";
import CarHireGuard from "@/components/guards/car-hire-guard";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Car, 
  Calendar, 
  Wallet, 
  Settings, 
  LogOut,
  Bell,
  Menu,
  X,
  Users,
  Award,
  FileText,
  ClipboardList
} from "lucide-react";
import { useState } from "react";
import Logo from "@/components/Logo";

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const { userProfile, logout } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/vendor/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/vendor/fleet", label: "Fleet Management", icon: Car },
    { href: "/vendor/bookings", label: "Bookings", icon: Calendar },
    { href: "/vendor/rentals/pending", label: "Rentals", icon: ClipboardList },
    { href: "/vendor/finance", label: "Financial Ledger", icon: Wallet },
    { 
      href: "/vendor/staff", 
      label: "Staff & Teams", 
      icon: Users,
      visible: userProfile?.role === 'car_hire' || userProfile?.role === 'car_hire_staff'
    },
    { href: "/vendor/drivers", label: "Company Drivers", icon: Award },
    { href: "/vendor/documents", label: "Document Library", icon: FileText },
    { href: "/vendor/notifications", label: "Notifications", icon: Bell },
    { href: "/vendor/settings", label: "Settings", icon: Settings },
  ];

  return (
    <CarHireGuard>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex flex-col w-72 bg-gray-900 text-white">
          <div className="p-6 border-b border-gray-800">
            <Logo variant="full" size="md" layout="horizontal" clickable={true} />
          </div>
          
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {navItems.filter(item => item.visible !== false).map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive 
                      ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20" 
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-800">
            <button 
              onClick={() => logout()}
              className="flex items-center gap-3 w-full px-4 py-3 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <header className="h-16 bg-white border-b flex items-center justify-between px-4 lg:px-8 shrink-0 z-10">
            <div className="flex items-center gap-4 lg:hidden">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <Menu className="w-6 h-6 text-gray-600" />
              </button>
              <Logo variant="icon-only" size="sm" />
            </div>

            <div className="flex-1 flex justify-end items-center gap-4">
              <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              
              <div className="h-8 w-px bg-gray-200 mx-2"></div>
              
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-gray-800">{userProfile?.name || "Vendor"}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                    {userProfile?.companyStatus || "Active"}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold shadow-sm">
                  {userProfile?.name?.substring(0, 2).toUpperCase() || "V"}
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Wrapper */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
              onClick={() => setIsMobileMenuOpen(false)}
            ></div>
            <aside className="absolute inset-y-0 left-0 w-[80%] max-w-xs bg-gray-900 text-white flex flex-col shadow-2xl animate-in slide-in-from-left duration-300">
              <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                <Logo variant="full" size="sm" />
                <button onClick={() => setIsMobileMenuOpen(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {navItems.filter(item => item.visible !== false).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-4 rounded-xl transition-all ${
                      pathname === item.href 
                        ? "bg-primary-600 text-white" 
                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium text-lg">{item.label}</span>
                  </Link>
                ))}
              </nav>

              <div className="p-4 border-t border-gray-800">
                <button 
                  onClick={() => logout()}
                  className="flex items-center gap-3 w-full px-4 py-4 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                >
                  <LogOut className="w-6 h-6" />
                  <span className="font-medium text-lg">Logout</span>
                </button>
              </div>
            </aside>
          </div>
        )}
      </div>
    </CarHireGuard>
  );
}
