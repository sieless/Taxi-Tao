"use client";

import { useAuth } from "@/lib/auth-context";
import { 
  Wallet, 
  TrendingUp, 
  ArrowUpRight, 
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Filter,
  Download,
  CreditCard,
  Zap,
  ShieldCheck
} from "lucide-react";
import { useEffect, useState } from "react";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { HireRequest } from "@/lib/types";


import { logError } from "@/lib/logger";export default function VendorFinancePage() {
  const { user, userProfile } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<HireRequest[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingPayouts: 0,
    availableBalance: 0,
    securityDeposits: 0,
    mtdRevenue: 0
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !userProfile) return;
    const companyId = userProfile.companyId;
    if (!companyId) return;

    setLoading(true);

    let unsubscribe: (() => void) | null = null;
    const q = query(
      collection(db, "hireRequests"),
      where("companyId", "==", companyId),
      orderBy("createdAt", "desc")
    );

    unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as HireRequest));
      
      setTransactions(requestsData);

      const calculated = requestsData.reduce((acc, req) => {
        if (req.status === "completed" || req.status === "active") {
          acc.totalRevenue += req.totalAmount || 0;
          
          if (req.paymentStatus === "paid") {
            acc.availableBalance += req.totalAmount || 0;
          } else {
            acc.pendingPayouts += req.totalAmount || 0;
          }

          if ((req as any).securityDeposit) {
            acc.securityDeposits += (req as any).securityDeposit;
          } else if (req.depositAmount) {
            acc.securityDeposits += req.depositAmount;
          }
        }

        // Calculate Month-to-Date (MTD) Revenue for completed rentals
        if (req.status === "completed" && req.completedAt) {
          const completedDate = req.completedAt.toDate ? req.completedAt.toDate() : new Date(req.completedAt.seconds * 1000);
          const now = new Date();
          if (completedDate.getFullYear() === now.getFullYear() && completedDate.getMonth() === now.getMonth()) {
            acc.mtdRevenue += req.totalAmount || 0;
          }
        }

        return acc;
      }, { totalRevenue: 0, pendingPayouts: 0, availableBalance: 0, securityDeposits: 0, mtdRevenue: 0 });

      setStats(calculated);
      setLoading(false);
    }, (error) => {
      logError("page", error);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, userProfile, mounted]);

  if (!mounted || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Syncing Ledger & Settlements...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-gray-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Treasury Console</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none uppercase">Financial Engine</h1>
          <p className="text-gray-500 font-medium text-sm">Managing your company's revenue and settlement pipeline.</p>
        </div>
        
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition shadow-xl shadow-gray-200">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      {/* Main Scorecard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gross Revenue */}
          <div className="bg-gray-900 p-10 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-900/20 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-10">
                <div className="p-4 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl text-indigo-300">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-black text-primary-400 bg-primary-500/10 px-2.5 py-1 rounded-full border border-primary-500/20">
                  <ArrowUpRight className="w-3 h-3" /> GROSS
                </div>
              </div>
              <p className="text-sm font-black text-indigo-300 uppercase tracking-widest mb-2">Total Accumulated Revenue</p>
              <p className="text-5xl font-black tracking-tight leading-none">
                KSH <span className="text-white">{(stats.totalRevenue/1000).toFixed(1)}k</span>
              </p>
            </div>
            <div className="absolute bottom-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <Wallet className="w-40 h-40" />
            </div>
          </div>

          {/* Pending Payouts */}
          <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-10">
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-600">
                  <Clock className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest px-2.5 py-1 bg-amber-50 rounded-full border border-amber-100">
                  IN TRANSIT
                </span>
              </div>
              <p className="text-sm font-black text-gray-400 uppercase tracking-widest mb-2">Pending Settlements</p>
              <p className="text-4xl font-black text-gray-900 tracking-tight leading-none">
                KSH {stats.pendingPayouts.toLocaleString()}
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Awaiting M-PESA Verification</p>
            </div>
          </div>
        </div>

        {/* Security Deposits / Side Card */}
        <div className="bg-indigo-600 p-10 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-600/30 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight mb-2">Escrow Assets</h3>
            <p className="text-indigo-100 text-xs font-medium leading-relaxed opacity-80 mb-8">
              Current security deposits held for active hire contracts.
            </p>
            <p className="text-3xl font-black tracking-tight">KSH {stats.securityDeposits.toLocaleString()}</p>
          </div>
          <div className="space-y-4">
            <div className="h-2 bg-indigo-500/30 rounded-full overflow-hidden">
              <div className="h-full w-3/4 bg-white rounded-full"></div>
            </div>
            <button className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition shadow-lg">
              Manage Deposits
            </button>
          </div>
        </div>
      </div>

      {/* Settlement Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Transaction Ledger */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <CreditCard className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Hire Operations</h2>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-indigo-600 transition shadow-sm">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>
          <button className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition shadow-xl shadow-indigo-200">
            Request Payout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-indigo-600 mb-6">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">MTD Revenue</span>
                </div>
                <p className="text-4xl font-black text-gray-900 tracking-tighter">KSH {stats.mtdRevenue.toLocaleString()}</p>
                <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest mt-2">+12.5% from last month</p>
              </div>
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 text-indigo-600 mb-6">
                <Clock className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Pending Payout</span>
              </div>
              <p className="text-4xl font-black text-gray-900 tracking-tighter">KSH {stats.pendingPayouts.toLocaleString()}</p>
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mt-2">Next settlement: Friday</p>
            </div>

            <div className="bg-gray-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-900/20">
              <div className="flex items-center gap-2 text-indigo-400 mb-6">
                <Wallet className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Security Deposits</span>
              </div>
              <p className="text-4xl font-black tracking-tighter">KSH {stats.securityDeposits.toLocaleString()}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Held in Escrow</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-900 shadow-inner">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Recent Revenue Events</h2>
              </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-50">
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Transaction</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Asset</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Amount</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="group hover:bg-indigo-50/30 transition-colors">
                      <td className="px-8 py-6">
                        <p className="font-black text-gray-900 tracking-tight uppercase text-[10px]">{tx.id.substring(0, 8)}...</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Vehicle Hire</p>
                      </td>
                      <td className="px-8 py-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        ID: {tx.vehicleId.substring(0, 8)}...
                      </td>
                      <td className="px-8 py-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        {tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleDateString() : "Pending"}
                      </td>
                      <td className="px-8 py-6 text-right font-black text-gray-900 text-xs">KSH {tx.totalAmount?.toLocaleString() || 0}</td>
                      <td className="px-8 py-6">
                        <div className="flex justify-center">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                            tx.status === 'completed' ? 'bg-primary-50 text-primary-600 border-primary-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
                            {tx.status}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Payout Information */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Zap className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Settlements</h2>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
            <div className="flex items-start gap-4 p-5 bg-primary-50 border border-primary-100 rounded-[2rem]">
              <ShieldCheck className="w-6 h-6 text-primary-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-black text-primary-900 uppercase tracking-tight">Auto-Payout: Active</p>
                <p className="text-xs text-primary-700 mt-1 font-medium leading-relaxed opacity-80">
                  Verified earnings are automatically settled to your bank within 24 hours.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Available Balance</p>
                  <p className="text-2xl font-black text-gray-900 tracking-tight">KSH {stats.availableBalance.toLocaleString()}</p>
                </div>
                <button className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition shadow-inner">
                  <CreditCard className="w-6 h-6" />
                </button>
              </div>

              <div className="pt-2">
                <button className="w-full py-5 bg-gray-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition shadow-2xl shadow-gray-200">
                  Request Instant Payout
                </button>
                <p className="text-[9px] text-center text-gray-400 font-bold uppercase tracking-widest mt-4">
                  Powered by M-PESA Business API
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
