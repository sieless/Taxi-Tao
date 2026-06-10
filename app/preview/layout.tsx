'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Car,
  FileText,
  Users,
  Award,
  Wallet,
  Settings,
  ChevronRight,
  Eye,
} from 'lucide-react';

const previewNavItems = [
  { href: '/preview/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/preview/vehicles', label: 'Fleet Management', icon: Car },
  { href: '/preview/staff', label: 'Staff Management', icon: Users },
  { href: '/preview/drivers', label: 'Company Drivers', icon: Award },
  { href: '/preview/documents', label: 'Documents', icon: FileText },
  { href: '/preview/finance', label: 'Finance Ledger', icon: Wallet },
  { href: '/preview/settings', label: 'Settings', icon: Settings },
];

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar — mirrors real vendor sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-gray-900 text-white shrink-0">
        {/* Brand */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">TaxiTao CarHire</p>
              <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mt-1">
                🧪 Preview Mode
              </p>
            </div>
          </div>
        </div>

        {/* Preview badge */}
        <div className="mx-4 mt-4 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <p className="text-amber-400 text-[10px] font-black uppercase tracking-wider">
            ⚡ Sandbox — No Auth Required
          </p>
          <p className="text-amber-300/70 text-[10px] mt-0.5">
            Prototype pages only. Dummy data.
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2 mt-2">
          {previewNavItems.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer divider to real portal */}
        <div className="p-4 border-t border-gray-800 space-y-2">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold px-2">
            Real Portal
          </p>
          {[
            { href: '/vendor/dashboard', label: 'Vendor Dashboard', icon: LayoutDashboard },
            { href: '/vendor/fleet', label: 'Fleet (Live)', icon: Car },
            { href: '/vendor/finance', label: 'Finance (Live)', icon: Wallet },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:text-gray-300 hover:bg-gray-800 rounded-xl transition-all text-sm"
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
              <ChevronRight className="w-3 h-3 ml-auto opacity-50" />
            </Link>
          ))}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-white border-b flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-bold text-amber-700">
              🧪 Preview Sandbox
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-500 font-medium">
              Testing new UI components against the Vendor Dashboard design
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-medium hidden sm:block">
              Role:
            </span>
            <RoleSelector />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

// Inline role switcher in header — sets localStorage for pages to pick up
function RoleSelector() {
  const [current, setCurrent] = useState('OWNER');
  const [mounted, setMounted] = useState(false);

  const roles = ['OWNER', 'FLEET_MANAGER', 'DISPATCH_MANAGER', 'FINANCE_MANAGER'];
  const roleColors: Record<string, string> = {
    OWNER: 'bg-primary-100 text-primary-800 border-primary-300',
    FLEET_MANAGER: 'bg-primary-100 text-primary-800 border-primary-300',
    DISPATCH_MANAGER: 'bg-blue-100 text-blue-800 border-blue-300',
    FINANCE_MANAGER: 'bg-amber-100 text-amber-800 border-amber-300',
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
    window.location.reload();
  };

  if (!mounted) {
    return (
      <div className="w-32 h-8 bg-gray-100 animate-pulse rounded-full" />
    );
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      className={`text-xs font-bold px-3 py-1.5 rounded-full border cursor-pointer focus:outline-none ${roleColors[current] ?? roleColors['OWNER']}`}
    >
      {roles.map((r) => (
        <option key={r} value={r}>
          {r.replace(/_/g, ' ')}
        </option>
      ))}
    </select>
  );
}
