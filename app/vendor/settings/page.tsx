"use client";

import { useState, useEffect } from "react";
import { 
  Building2, 
  Bell, 
  Shield, 
  Wallet, 
  ChevronRight, 
  Settings, 
  Eye, 
  UserCircle,
  Zap,
  AlertTriangle,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function VendorSettingsPage() {
  const { user, userProfile } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState('OWNER');

  useEffect(() => {
    setMounted(true);
    const savedRole = localStorage.getItem('userRole') || 'OWNER';
    setUserRole(savedRole);
  }, []);

  const handleRoleChange = (role: string) => {
    setUserRole(role);
    localStorage.setItem('userRole', role);
    window.location.reload();
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-6">
        <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 animate-pulse">
              <div className="h-10 w-10 bg-gray-200 rounded-lg mb-3 animate-pulse" />
              <div className="h-4 w-1/2 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-2/3 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const settingsGroups = [
    { 
      id: 'profile', 
      href: "/vendor/settings/profile", 
      icon: Building2, 
      title: "Company Identity", 
      desc: "Update your business details, logo and locations.",
      color: "bg-indigo-50 text-indigo-600"
    },
    { 
      id: 'company-rules', 
      href: "/vendor/settings/company-rules", 
      icon: Settings, 
      title: "Company Rules", 
      desc: "Configure financial rules, payment settings, and inspection requirements.",
      color: "bg-primary-50 text-primary-600"
    },
    { 
      id: 'payout', 
      href: "#", 
      icon: Wallet, 
      title: "Settlement Engine", 
      desc: "Manage bank accounts and M-Pesa business numbers.",
      color: "bg-amber-50 text-amber-600"
    },
    { 
      id: 'notifications', 
      href: "#", 
      icon: Bell, 
      title: "Alert Protocols", 
      desc: "Configure push notifications and booking alerts.",
      color: "bg-blue-50 text-blue-600"
    },
    { 
      id: 'security', 
      href: "#", 
      icon: Shield, 
      title: "Access Control", 
      desc: "Manage passwords, 2FA and login sessions.",
      color: "bg-primary-50 text-primary-600"
    },
  ];

  return (
    <div className="space-y-10 pb-20">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-gray-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">System Preferences</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none uppercase">Command Settings</h1>
          <p className="text-gray-500 font-medium text-sm">Configure your operational environment and security policies.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Navigation Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {settingsGroups.map((group) => (
              <Link 
                key={group.id} 
                href={group.href}
                className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
              >
                <div className="flex items-center gap-6">
                  <div className={`p-4 rounded-2xl transition-colors ${group.color} shadow-inner`}>
                    <group.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-gray-900 uppercase tracking-tight">{group.title}</h3>
                    <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">{group.desc}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-600 transition-colors" />
                </div>
              </Link>
            ))}
          </div>

          {/* Perspective Hub (Simulation) */}
          <div className="bg-gray-900 rounded-[3rem] p-10 text-white shadow-2xl shadow-indigo-900/20 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Eye className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">Perspective Hub</h3>
                  <p className="text-xs text-indigo-300 font-black uppercase tracking-widest mt-1">Simulate Team Roles</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { id: 'OWNER', label: 'Owner', desc: 'Full Control' },
                  { id: 'FLEET_MANAGER', label: 'Fleet', desc: 'Assets Only' },
                  { id: 'FINANCE_MANAGER', label: 'Finance', desc: 'Ledger Only' },
                  { id: 'DISPATCH_MANAGER', label: 'Dispatch', desc: 'Operations' },
                ].map((role) => (
                  <button
                    key={role.id}
                    onClick={() => handleRoleChange(role.id)}
                    className={`p-5 rounded-2xl border-2 text-left transition-all ${
                      userRole === role.id 
                        ? 'bg-indigo-600 border-indigo-400 shadow-xl' 
                        : 'bg-gray-800 border-gray-700 hover:border-gray-500'
                    }`}
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-1">{role.label}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{role.desc}</p>
                  </button>
                ))}
              </div>

              <div className="mt-8 p-5 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-xs text-gray-400 leading-relaxed italic">
                  Note: Role simulation is for UI verification only. This does not change your actual backend permissions.
                </p>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          </div>
        </div>

        {/* Danger Zone Sidebar */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-600/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Danger Zone</h2>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-red-100 shadow-sm space-y-6">
            <div className="p-5 bg-red-50 border border-red-100 rounded-2xl">
              <p className="text-sm font-black text-red-900 uppercase tracking-tight">Account Termination</p>
              <p className="text-xs text-red-700 mt-2 font-medium leading-relaxed opacity-80">
                Deactivating your account will hide all active fleet assets and terminate current recruitment links. This action is reversible by contacting support.
              </p>
            </div>
            
            <div className="space-y-3">
              <button className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-red-700 transition shadow-xl shadow-red-200">
                Deactivate Company
              </button>
              <button className="w-full py-4 bg-white border border-gray-100 text-gray-400 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-gray-50 transition">
                Export System Logs
              </button>
            </div>
          </div>

          {/* Quick Support */}
          <div className="p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 relative overflow-hidden group">
            <Zap className="absolute top-4 right-4 w-12 h-12 text-indigo-200 opacity-20 group-hover:rotate-12 transition-transform duration-500" />
            <h3 className="text-sm font-black text-indigo-900 uppercase tracking-tight">Need Assistance?</h3>
            <p className="text-xs text-indigo-700 mt-2 font-medium leading-relaxed mb-6">
              Connect with our partner success team for technical integration support.
            </p>
            <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
