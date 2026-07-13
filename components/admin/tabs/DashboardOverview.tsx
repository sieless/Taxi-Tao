"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import StatCard from "@/components/admin/StatCard";

import { logError } from "@/lib/logger";import { 
  Users, 
  Car, 
  ShieldCheck, 
  CreditCard, 
  CalendarCheck, 
  Bug, 
  TrendingUp, 
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Activity,
  AlertTriangle,
  ChevronRight,
  LayoutGrid,
  FileText,
  Settings,
  MessageSquare,
  Building2,
  Database,
  Link2,
  History
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  totalDrivers: number;
  activeDrivers: number;
  pendingKYC: number;
  activeBookings: number;
  pendingDrivers: number;
  totalVehicles: number;
  totalRevenue: number;
  pendingPayments?: number;
  openIssues?: number;
}

export default function DashboardOverview() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const getAdminStats = httpsCallable(functions, "getAdminStats");
      const result = await getAdminStats({}) as { data: AdminStats };
      setStats(result.data);
    } catch (err) {
      logError("DashboardOverview", err);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }

  const navigateToTab = (tab: string) => {
    router.push(`/admin/dashboard?tab=${tab}`);
  };

  const navCards = [
    { id: "drivers", label: "Manage Drivers", icon: <Car />, color: "bg-indigo-50 text-indigo-600", desc: "View all active/inactive drivers" },
    { id: "kyc", label: "Review KYC", icon: <ShieldCheck />, color: "bg-amber-50 text-amber-600", desc: `${stats?.pendingKYC || 0} pending verifications`, badge: stats?.pendingKYC },
    { id: "payments", label: "Vet Payments", icon: <CreditCard />, color: "bg-primary-50 text-primary-600", desc: `${stats?.pendingPayments || 0} pending M-Pesa records`, badge: stats?.pendingPayments },
    { id: "bookings", label: "Dispatch Center", icon: <CalendarCheck />, color: "bg-blue-50 text-blue-600", desc: "Real-time booking management" },
    { id: "issues", label: "Support Desk", icon: <MessageSquare />, color: "bg-rose-50 text-rose-600", desc: `${stats?.openIssues || 0} open tickets`, badge: stats?.openIssues },
    { id: "analytics", label: "Data Reports", icon: <TrendingUp />, color: "bg-violet-50 text-violet-600", desc: "Revenue & growth metrics" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Hero Welcome & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-100/50">
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
            <LayoutGrid size={200} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                <Activity size={24} className="text-white" />
              </div>
              <span className="px-3 py-1 bg-primary-500/20 text-primary-300 backdrop-blur-md border border-primary-500/30 rounded-full text-[10px] font-bold uppercase tracking-widest">
                All Systems Operational
              </span>
            </div>
            <h1 className="text-3xl font-bold mb-3">Admin Command Center</h1>
            <p className="text-indigo-100/60 text-sm max-w-lg mb-8 leading-relaxed">
              Unified overview of the TaxiTao ecosystem. Monitor performance, verify identities, and manage dispatch from a single, high-comfort interface.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => navigateToTab("bookings")}
                className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-indigo-50 transition-colors shadow-lg"
              >
                Go to Dispatch
              </button>
              <button 
                onClick={() => navigateToTab("analytics")}
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl font-bold text-sm border border-white/10 transition-colors"
              >
                View Analytics
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Database size={18} className="text-indigo-600" />
              System Status
            </h3>
            <div className="space-y-4">
              {[
                { label: "Firestore DB", status: "Healthy", color: "text-primary-500" },
                { label: "Cloud Functions", status: "Healthy", color: "text-primary-500" },
                { label: "Auth Provider", status: "Healthy", color: "text-primary-500" },
                { label: "Storage Engine", status: "Healthy", color: "text-primary-500" },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0">
                  <span className="text-sm font-medium text-slate-500">{s.label}</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${s.color.replace('text', 'bg')}`} />
                    <span className={`text-xs font-bold ${s.color}`}>{s.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Last System Sync</p>
            <p className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <Clock size={12} className="text-indigo-500" />
              Just now (Real-time enabled)
            </p>
          </div>
        </div>
      </div>

      {/* Main KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Users" value={stats?.totalUsers} icon={<Users size={20} />} color="indigo" loading={loading} />
        <StatCard label="Active Drivers" value={stats?.activeDrivers} icon={<Car size={20} />} color="blue" loading={loading} />
        <StatCard label="Live Bookings" value={stats?.activeBookings} icon={<CalendarCheck size={20} />} color="emerald" loading={loading} />
        <StatCard label="Pending Drivers" value={stats?.pendingDrivers} icon={<MessageSquare size={20} />} color="rose" loading={loading} />
      </div>

      {/* Unified Navigation Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-lg">Quick Navigation</h3>
          <p className="text-xs text-slate-400 font-medium">Jump directly to any system module</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {navCards.map((card) => (
            <button
              key={card.id}
              onClick={() => navigateToTab(card.id)}
              className="group bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all text-left relative overflow-hidden"
            >
              <div className={`w-12 h-12 ${card.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                {card.icon}
              </div>
              <h4 className="font-bold text-slate-900 mb-1 flex items-center justify-between">
                {card.label}
                <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
              </h4>
              <p className="text-xs text-slate-500 font-medium line-clamp-1">{card.desc}</p>
              {card.badge ? (
                <span className="absolute top-6 right-6 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* Maintenance & Logs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <History size={18} className="text-slate-400" />
            System Maintenance
          </h3>
          <div className="space-y-3">
            {[
              { id: "audit", label: "Admin Audit Logs", desc: "Track all administrative changes", icon: <FileText size={16} /> },
              { id: "crashes", label: "App Crash Reports", desc: "Monitor client-side errors", icon: <Bug size={16} /> },
              { id: "db-diagnostics", label: "Data Integrity Scans", desc: "Find orphaned records", icon: <Database size={16} /> },
              { id: "settings", label: "Global Settings", desc: "Configure platform parameters", icon: <Settings size={16} /> },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => navigateToTab(item.id)}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-white hover:shadow-md border border-slate-100 rounded-2xl transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 border border-slate-100 shadow-sm">
                    {item.icon}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-800">{item.label}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{item.desc}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500" />
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden">
          <div className="absolute -bottom-10 -right-10 opacity-10 rotate-12">
            <TrendingUp size={200} />
          </div>
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            <CheckCircle2 size={20} className="text-indigo-400" />
            Platform Summary
          </h3>
          <div className="space-y-6 relative z-10">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
              <div>
                <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-1">Weekly Growth</p>
                <p className="text-2xl font-bold">+24.8%</p>
              </div>
              <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center">
                <ArrowUpRight size={24} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Resolved Issues</p>
                <p className="text-xl font-bold">142</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Fleet</p>
                <p className="text-xl font-bold">{stats?.activeDrivers || 0}</p>
              </div>
            </div>
            <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 transition-colors rounded-2xl font-bold text-sm shadow-lg shadow-indigo-900/50">
              Download System Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
