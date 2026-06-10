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
  ShieldCheck,
  ChevronRight,
  ClipboardList,
  TrendingUp
} from "lucide-react";
import { useState, useEffect } from "react";
import Logo from "@/components/Logo";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const { userProfile, logout } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const navItems = [
    { href: "/vendor/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/vendor/fleet", label: "Fleet Management", icon: Car },
    { href: "/vendor/bookings", label: "Booking Hub", icon: Calendar },
    { href: "/vendor/rentals/pending", label: "Rentals", icon: ClipboardList },
    { href: "/vendor/staff", label: "Staff & Teams", icon: Users },
    { href: "/vendor/drivers", label: "Company Drivers", icon: Award },
    { href: "/vendor/documents", label: "Document Library", icon: FileText },
    { href: "/vendor/finance", label: "Financial Ledger", icon: Wallet },
    { href: "/vendor/performance", label: "Fleet Analytics", icon: TrendingUp },
    { href: "/vendor/notifications", label: "Notifications", icon: Bell },
    { href: "/vendor/settings", label: "Settings", icon: Settings },
  ];

  useEffect(() => {
    // Get logo from localStorage (stored during profile refresh)
    if (typeof window !== "undefined") {
      try {
        const companyProfile = localStorage.getItem("companyProfile");
        if (companyProfile) {
          const parsed = JSON.parse(companyProfile);
          if (parsed.logoUrl) {
            setCompanyLogo(parsed.logoUrl);
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  // Subscribe to unread alerts count
  useEffect(() => {
    if (!userProfile?.companyId) return;

    const q = query(
      collection(db, "partnerAlerts"),
      where("companyId", "==", userProfile.companyId),
      where("read", "==", false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [userProfile?.companyId]);

  return (
    <CarHireGuard>
      <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-72 bg-gray-900 text-white shrink-0 shadow-2xl z-20">
          {/* Brand */}
          <div className="p-8 border-b border-gray-800/50 bg-gray-900/50 backdrop-blur-xl sticky top-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
                <Car className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white font-black text-sm leading-tight tracking-tight">TaxiTao</p>
                <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mt-0.5">Vendor Portal</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-6 space-y-2 mt-4 scrollbar-hide">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 relative overflow-hidden ${
                    isActive 
                      ? "bg-indigo-600 text-white shadow-xl shadow-indigo-900/50" 
                      : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                  }`}
                >
                  <item.icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                  <span className="font-bold text-sm tracking-tight">{item.label}</span>
                  {isActive && <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/30" />}
                </Link>
              );
            })}
          </nav>

          {/* User Footer */}
          <div className="p-6 border-t border-gray-800/50 bg-gray-900/80">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-800/50 mb-4 border border-gray-700/50">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs shrink-0 overflow-hidden border-2 border-white/10 shadow-inner">
                {companyLogo ? (
                  <img src={companyLogo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  userProfile?.name?.substring(0, 2).toUpperCase() || "TT"
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-white truncate">{userProfile?.name || "Company Name"}</p>
                <p className="text-[10px] font-bold text-primary-400 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5" /> {userProfile?.companyStatus || "Verified"}
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => logout()}
              className="flex items-center gap-3 w-full px-4 py-3.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-all duration-300 font-black text-xs uppercase tracking-widest group"
            >
              <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Logout Account</span>
            </button>
          </div>
        </aside>

        {/* Main Workspace */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {/* Top Bar */}
          <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-8 shrink-0 z-10 sticky top-0">
            {/* Left: Branding for Mobile + Breadcrumbs */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2.5 hover:bg-gray-100 rounded-2xl transition-all"
              >
                <Menu className="w-6 h-6 text-gray-900" />
              </button>
              
              <div className="hidden lg:flex flex-col">
                <h2 className="text-lg font-black text-gray-900 leading-none">
                  {navItems.find(i => i.href === pathname)?.label || "Vendor Portal"}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Main Dashboard</span>
                  <ChevronRight className="w-2.5 h-2.5 text-gray-300" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Company Overview</span>
                </div>
              </div>
            </div>

            {/* Right: Actions & Role Simulator */}
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">View Perspective:</span>
                <RoleSelector />
              </div>

              <div className="h-8 w-px bg-gray-100 hidden md:block"></div>

              <button 
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  if (!isNotificationsOpen) {
                    window.location.href = "/vendor/notifications";
                  }
                }}
                className={`relative p-3 rounded-2xl transition-all duration-300 group ${
                  isNotificationsOpen ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-black text-white border-2 border-white shadow-sm">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
            </div>
          </header>

          {/* Global Application Status */}
          {userProfile?.companyStatus === "pending" && (
            <div className="mx-8 mt-6">
              <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                  <LayoutDashboard className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-900 uppercase tracking-tight">Onboarding in Progress</h3>
                  <p className="text-xs text-amber-700 mt-0.5 font-medium opacity-80">
                    Your business is currently being verified. You can start adding vehicles, but they will stay in <span className="font-black underline">Draft</span> mode until approval.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actual View Content */}
          <main className="flex-1 overflow-y-auto p-8 lg:p-10 scroll-smooth">
            <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              {children}
            </div>
          </main>
        </div>

        {/* Mobile Navigation Sidebar */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsMobileMenuOpen(false)}></div>
            <aside className="absolute inset-y-0 left-0 w-[85%] max-w-xs bg-gray-900 text-white flex flex-col shadow-2xl animate-in slide-in-from-left duration-400">
              <div className="p-8 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
                    <Car className="w-5 h-5" />
                  </div>
                  <span className="font-black tracking-tight">TaxiTao</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-gray-800 rounded-xl transition">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <nav className="flex-1 p-6 space-y-3 overflow-y-auto">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${
                      pathname === item.href 
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/50" 
                        : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                    }`}
                  >
                    <item.icon className="w-6 h-6" />
                    <span className="font-bold text-lg tracking-tight">{item.label}</span>
                  </Link>
                ))}
              </nav>

              <div className="p-6 border-t border-gray-800">
                <button 
                  onClick={() => logout()}
                  className="flex items-center gap-4 w-full px-5 py-4 text-red-400 hover:bg-red-500/10 rounded-2xl transition-all font-black"
                >
                  <LogOut className="w-6 h-6" />
                  <span className="text-lg">Logout Account</span>
                </button>
              </div>
            </aside>
          </div>
        )}
      </div>
    </CarHireGuard>
  );
}

/**
 * RoleSelector Simulation
 * We keep this to allow Owners to test different UI perspectives (Finance view vs Dispatch view)
 */
function RoleSelector() {
  const [current, setCurrent] = useState('OWNER');
  const [mounted, setMounted] = useState(false);

  const roles = ['OWNER', 'FLEET_MANAGER', 'DISPATCH_MANAGER', 'FINANCE_MANAGER'];
  const roleColors: Record<string, string> = {
    OWNER: 'bg-primary-100 text-primary-800 border-primary-300',
    FLEET_MANAGER: 'bg-primary-100 text-primary-800 border-primary-200',
    DISPATCH_MANAGER: 'bg-blue-100 text-blue-800 border-blue-200',
    FINANCE_MANAGER: 'bg-amber-100 text-amber-800 border-amber-200',
  };

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('userRole') || 'OWNER';
    setCurrent(saved);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    localStorage.setItem('userRole', val);
    setCurrent(val);
    window.location.reload(); // Reload to apply role simulation globally
  };

  if (!mounted) return <div className="w-32 h-8 bg-gray-100 animate-pulse rounded-full" />;

  return (
    <select
      value={current}
      onChange={handleChange}
      className={`text-[10px] font-black px-4 py-2 rounded-full border transition-all cursor-pointer focus:outline-none shadow-sm hover:scale-105 active:scale-95 ${roleColors[current] ?? roleColors['OWNER']}`}
    >
      {roles.map((r) => (
        <option key={r} value={r}>
          {r.replace(/_/g, ' ')}
        </option>
      ))}
    </select>
  );
}
