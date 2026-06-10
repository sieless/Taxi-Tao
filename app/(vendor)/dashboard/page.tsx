"use client";

import { useAuth } from "@/lib/auth-context";
import { 
  Car, 
  Calendar, 
  Wallet, 
  TrendingUp, 
  AlertCircle,
  ChevronRight,
  ArrowUpRight,
  Clock,
  ShieldCheck,
  Users,
  Activity,
  CreditCard,
  BarChart3,
  PieChart,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

export default function VendorDashboard() {
  const { userProfile } = useAuth();
  
  // RBAC Logic
  const isOwner = userProfile?.role === 'car_hire';
  const isAssistant = userProfile?.role === 'assistant';
  
  // Specific Permissions
  const canViewFinance = isOwner || (isAssistant && userProfile?.permissions?.viewAnalytics);
  const canManageFleet = isOwner || (isAssistant && userProfile?.permissions?.manageDrivers);
  const canManageStaff = isOwner;

  return (
    <div className="space-y-12 pb-20">
      {/* Premium Welcome Header */}
      <div className="relative overflow-hidden bg-gray-900 rounded-[3rem] p-10 md:p-14 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
        <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-primary-500/10 to-transparent pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-500/10 border border-primary-500/20 rounded-full backdrop-blur-md">
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-primary-500 uppercase tracking-[0.2em]">
                {userProfile?.role === 'car_hire' ? 'Operations Principal (CEO)' : 'Fleet Operations Staff'}
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white leading-[1.1] tracking-tight">
              Welcome back, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-primary-500 to-teal-400">
                {userProfile?.name}
              </span>
            </h1>
            <p className="text-gray-400 font-medium text-lg max-w-xl leading-relaxed">
              Your fleet heartbeat is synchronized. No critical alerts pending.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-5">
            {canManageStaff && (
              <Link 
                href="/vendor/staff"
                className="flex items-center gap-4 bg-white/5 border border-white/10 text-white px-10 py-5 rounded-[2rem] font-black hover:bg-white/10 transition-all duration-300 backdrop-blur-xl group"
              >
                Staff Registry 
                <Users className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
            <Link 
              href="/vendor/fleet"
              className="flex items-center gap-4 bg-primary-500 text-gray-900 px-10 py-5 rounded-[2rem] font-black hover:bg-primary-400 transition-all duration-300 shadow-[0_10px_30px_rgba(34,197,94,0.3)] group"
            >
              Launch Control 
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Metrics & Activity */}
        <div className="lg:col-span-2 space-y-12">
          {/* Top Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                <Car className="w-24 h-24 text-gray-900" />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Active Fleet Assets</p>
              <div className="space-y-1">
                <p className="text-5xl font-black text-gray-900">0</p>
                <p className="text-xs text-primary-600 font-black uppercase tracking-tighter flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" /> 0% Capacity
                </p>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                <Calendar className="w-24 h-24 text-gray-900" />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Pending Approvals</p>
              <div className="space-y-1">
                <p className="text-5xl font-black text-gray-900">0</p>
                <p className="text-xs text-amber-500 font-black uppercase tracking-tighter">Queue Healthy</p>
              </div>
            </div>
          </div>

          {/* Revenue Breakdown (Mockup Specific) */}
          {canViewFinance && (
            <div className="bg-gray-50 rounded-[3rem] p-10 border border-gray-100 space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    <PieChart className="w-6 h-6 text-primary-600" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">Revenue Performance</h2>
                </div>
                <Link href="/vendor/finance" className="text-xs font-black text-gray-400 hover:text-gray-900 uppercase tracking-widest flex items-center gap-2 transition">
                  Full Ledger <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: "Gross Revenue", value: "KSH 0", color: "text-gray-900" },
                  { label: "Held Deposits", value: "KSH 0", color: "text-blue-600" },
                  { label: "Net Earnings", value: "KSH 0", color: "text-primary-600" },
                ].map((item, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{item.label}</p>
                    <p className={`text-xl font-black ${item.color}`}>{item.value}</p>
                  </div>
                ))}
              </div>
              
              <div className="h-4 bg-white rounded-full overflow-hidden flex shadow-inner">
                <div className="h-full bg-primary-500 w-0 transition-all duration-1000" />
                <div className="h-full bg-blue-500 w-0 transition-all duration-1000" />
                <div className="h-full bg-amber-500 w-0 transition-all duration-1000" />
              </div>
            </div>
          )}

          {/* Activity Ledger */}
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-black text-gray-900">Recent Engagement</h2>
            </div>
            
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-20 text-center">
              <Clock className="w-12 h-12 text-gray-100 mx-auto mb-4" />
              <p className="text-lg font-black text-gray-900 uppercase tracking-tight">System Silence</p>
              <p className="text-sm text-gray-400 font-medium max-w-xs mx-auto mt-1">
                No active hire requests found in the current synchronization cycle.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Health & Notifications */}
        <div className="space-y-12">
          {/* Operational Health */}
          <section className="space-y-6">
            <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
              <div className="w-2 h-2 bg-primary-500 rounded-full" /> System Integrity
            </h2>
            <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/10 rounded-full blur-[60px]" />
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-primary-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-black">Handshake Protocol: SECURE</p>
                  <p className="text-[10px] text-gray-400 leading-relaxed font-bold">
                    All customer KYC documents are encrypted using AES-256. Access is limited to authorized personnel.
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-8 border-t border-white/5">
                {[
                  { label: "Firestore Pipeline", status: "Healthy" },
                  { label: "Cloudinary Gateway", status: "Active" },
                  { label: "Invoicing Engine", status: "Ready" },
                ].map((stat, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-gray-500">{stat.label}</span>
                    <span className="text-primary-500">{stat.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Quick Stats Summary */}
          <section className="bg-white rounded-[2.5rem] border border-gray-100 p-8 space-y-8">
            <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Market Pulse</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-black text-gray-600">Avg. Utilization</span>
                </div>
                <span className="text-sm font-black text-gray-900">0%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-50 text-primary-600 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-black text-gray-600">Client Retention</span>
                </div>
                <span className="text-sm font-black text-gray-900">0%</span>
              </div>
            </div>
            
            <button className="w-full py-5 bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl border border-dashed border-gray-200">
              Generate PDF Report
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

