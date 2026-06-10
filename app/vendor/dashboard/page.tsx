"use client";

import { useAuth } from "@/lib/auth-context";
import { 
  Car, 
  Wallet, 
  TrendingUp, 
  AlertCircle,
  ChevronRight,
  ArrowUpRight,
  Clock,
  Loader2,
  Calendar,
  Users,
  ShieldCheck,
  Zap,
  ArrowRight,
  Bell,
  ExternalLink,
  FileText,
  Wrench,
  Settings,
  MessageSquare
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Vehicle, HireRequest } from "@/lib/types";


import { logError } from "@/lib/logger";export default function VendorDashboard() {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState('OWNER');
  
  // Real-time states
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [recentHires, setRecentHires] = useState<HireRequest[]>([]);
  const [mtdRevenue, setMtdRevenue] = useState(0);
  const [systemAlerts, setSystemAlerts] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    const savedRole = localStorage.getItem('userRole') || 'OWNER';
    setUserRole(savedRole);
  }, []);

  useEffect(() => {
    if (!mounted || !userProfile) return;
    const companyId = userProfile.companyId;
    if (!companyId) return;

    setLoading(true);

    // 1. Real-time Fleet Listener
    const fleetQuery = query(collection(db, "vehicles"), where("companyId", "==", companyId));
    const unsubFleet = onSnapshot(fleetQuery, (snapshot) => {
      const fleetData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
      setVehicles(fleetData);
    }, (error) => {
      logError("page", error);
    });

    // 2. Real-time Recent Hires Listener
    const hiresQuery = query(
      collection(db, "hireRequests"), 
      where("companyId", "==", companyId),
      orderBy("createdAt", "desc"),
      limit(5)
    );
    const unsubHires = onSnapshot(hiresQuery, (snapshot) => {
      const hiresData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HireRequest));
      setRecentHires(hiresData);
      setLoading(false);
    }, (error) => {
      logError("page", error);
      setLoading(false);
    });

    // 3. MTD Revenue Listener
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const revQuery = query(
      collection(db, "hireRequests"),
      where("companyId", "==", companyId),
      where("status", "==", "completed"),
      where("completedAt", ">=", firstDay)
    );
    const unsubRev = onSnapshot(revQuery, (snapshot) => {
      const total = snapshot.docs.reduce((sum, doc) => sum + (doc.data().totalAmount || 0), 0);
      setMtdRevenue(total);
    }, (error) => {
      logError("page", error);
    });

    // 4. System Alerts Listener
    const alertsQuery = query(
      collection(db, "companyAlerts"),
      where("companyId", "==", companyId),
      where("read", "==", false)
    );
    const unsubAlerts = onSnapshot(alertsQuery, (snapshot) => {
      const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSystemAlerts(alerts);
    }, (error) => {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching alerts:", error);
      }
    });

    return () => {
      unsubFleet();
      unsubHires();
      unsubRev();
      unsubAlerts();
    };
  }, [user, userProfile, mounted]);

  if (!mounted || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-500 font-bold tracking-tight">Syncing Operational Intelligence...</p>
      </div>
    );
  }

  // Calculated Metrics
  const activeFleet = vehicles.filter(v => v.status === 'active' || v.status === 'in_use').length;
  const inUseCount = vehicles.filter(v => v.status === 'in_use').length;
  const pendingHires = recentHires.filter(r => r.status === 'pending').length;
  const utilization = vehicles.length > 0 ? Math.round((inUseCount / vehicles.length) * 100) : 0;

  // Role Simulation Logic
  const canSeeFinance = userRole === 'OWNER' || userRole === 'FINANCE_MANAGER';
  const isDispatch = userRole === 'DISPATCH_MANAGER';

  return (
    <div className="space-y-10">
      {/* Premium Welcome Header */}
      <div className="relative overflow-hidden bg-gray-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-900/20">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-300">
                Live Console
              </span>
              <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse"></span>
            </div>
            <h1 className="text-4xl font-black tracking-tight leading-none">
              Welcome, <span className="text-indigo-400">{userProfile?.name?.split(' ')[0] || "Partner"}</span>
            </h1>
            <p className="text-gray-400 font-medium text-sm max-w-md">
              Your fleet is currently at <span className="text-white font-bold">{utilization}% utilization</span>. 
              {pendingHires > 0 ? ` You have ${pendingHires} requests awaiting approval.` : " All systems are running smoothly."}
            </p>
          </div>
          
          <div className="flex gap-3">
            <Link 
              href="/vendor/fleet"
              className="px-6 py-4 bg-white text-gray-900 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-gray-100 transition shadow-lg"
            >
              <Car className="w-4 h-4" /> Manage Fleet
            </Link>
            <button className="p-4 bg-gray-800 text-white rounded-2xl hover:bg-gray-700 transition border border-gray-700">
              <Zap className="w-5 h-5 text-indigo-400" />
            </button>
          </div>
        </div>
        
        {/* Abstract background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-600/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2"></div>
      </div>

      {/* Modern Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            label: "Active Fleet", 
            value: activeFleet, 
            sub: `${vehicles.length} Total Assets`, 
            icon: Car, 
            color: "text-blue-600", 
            bg: "bg-blue-50",
            visible: true
          },
          { 
            label: "Live Load", 
            value: `${utilization}%`, 
            sub: "Current Utilization", 
            icon: TrendingUp, 
            color: "text-primary-600", 
            bg: "bg-primary-50",
            visible: true
          },
          { 
            label: "New Requests", 
            value: pendingHires, 
            sub: "Needs Attention", 
            icon: Calendar, 
            color: "text-amber-600", 
            bg: "bg-amber-50",
            visible: true
          },
          { 
            label: "MTD Revenue", 
            value: canSeeFinance ? `KSH ${(mtdRevenue/1000).toFixed(1)}k` : "••••••", 
            sub: "Total Recognized", 
            icon: Wallet, 
            color: "text-primary-600", 
            bg: "bg-primary-50",
            visible: true
          },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex justify-between items-start mb-6">
              <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} shadow-inner`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-black text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full">
                <ArrowUpRight className="w-3 h-3" /> REAL-TIME
              </div>
            </div>
            <p className="text-4xl font-black text-gray-900 tracking-tight">{stat.value}</p>
            <div className="mt-2 flex flex-col">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{stat.label}</span>
              <span className="text-[10px] text-gray-400 font-bold mt-0.5">{stat.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* System Alerts */}
      {systemAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-[2rem] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="font-black text-red-900">System Alerts ({systemAlerts.length})</h3>
          </div>
          <div className="space-y-3">
            {systemAlerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className="bg-white rounded-xl p-4 border border-red-100 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-gray-900">{alert.title || "System Notification"}</p>
                  <p className="text-xs text-gray-500 mt-1">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Fleet", href: "/vendor/fleet", icon: Car, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Rentals", href: "/vendor/rentals/active", icon: Clock, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Staff", href: "/vendor/staff", icon: Users, color: "text-primary-600", bg: "bg-primary-50" },
          { label: "Reports", href: "/vendor/reports", icon: FileText, color: "text-primary-600", bg: "bg-primary-50" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-3 group"
          >
            <div className={`w-10 h-10 ${link.bg} ${link.color} rounded-xl flex items-center justify-center`}>
              <link.icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-gray-900">{link.label}</p>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition" />
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Activity Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                <Clock className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Recent Operations</h2>
            </div>
            <Link href="/vendor/bookings" className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline flex items-center gap-1">
              Full Ledger <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            {recentHires.length === 0 ? (
              <div className="p-20 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-10 h-10 text-gray-200" />
                </div>
                <p className="text-gray-500 font-black uppercase tracking-widest text-xs">Awaiting Activity</p>
                <p className="text-sm text-gray-400 mt-2 font-medium">When customers book your cars, they will appear here in real-time.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentHires.map((req) => (
                  <div key={req.id} className="p-8 hover:bg-gray-50 transition-colors flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center text-gray-900 font-black text-sm shadow-inner relative">
                        {req.customerName?.substring(0, 2).toUpperCase()}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-lg shadow-sm flex items-center justify-center">
                          <Users className="w-3 h-3 text-indigo-600" />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="font-black text-gray-900 text-lg tracking-tight">{req.customerName}</p>
                          <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full border shadow-sm ${
                            req.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            req.status === 'active' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                            req.status === 'approved' ? 'bg-primary-50 text-primary-700 border-primary-100' :
                            'bg-gray-50 text-gray-700 border-gray-100'
                          }`}>
                            {req.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 font-medium">
                          {(req as any).pickupLocation || req.deliveryAddress || 'N/A'} • {new Date(req.createdAt?.toDate?.() || req.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-8">
                      {!isDispatch && (
                        <div className="text-right hidden sm:block">
                          <p className="font-black text-gray-900 text-lg leading-none">KSH {req.totalAmount.toLocaleString()}</p>
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Settlement</p>
                        </div>
                      )}
                      <Link 
                        href={`/vendor/bookings?id=${req.id}`}
                        className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-gray-900 group-hover:text-white group-hover:border-gray-900 transition-all shadow-sm"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Fleet Health / Compliance */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-600/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Compliance</h2>
          </div>
          
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-start gap-4 p-5 bg-indigo-50 border border-indigo-100 rounded-[2rem]">
              <AlertCircle className="w-6 h-6 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-black text-indigo-900 uppercase tracking-tight">Status: Verified</p>
                <p className="text-xs text-indigo-700 mt-1 font-medium leading-relaxed opacity-80">
                  Your business documents are current. You have full access to the Marketplace.
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-gray-400 uppercase tracking-widest">Fleet Integrity</span>
                <span className="font-black text-primary-600 uppercase">98% Secure</span>
              </div>
              <div className="h-3 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                <div className="h-full w-[98%] bg-gradient-to-r from-indigo-500 to-primary-500 rounded-full"></div>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <button className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition shadow-xl shadow-gray-200">
                View Reports
              </button>
              <button className="w-full py-4 bg-white border border-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-gray-50 transition">
                Compliance Docs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

