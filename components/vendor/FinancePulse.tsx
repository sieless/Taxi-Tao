"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Clock, 
  ShieldCheck,
  Search,
  Filter,
  Download,
  Loader2,
  Calendar,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  limit 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { HireRequest } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";


import { logError } from "@/lib/logger";export default function FinancePulse() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<HireRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingRevenue: 0,
    heldDeposits: 0,
    completedCount: 0
  });

  useEffect(() => {
    if (!user?.uid) return;

    // Listen for hire requests belonging to this company
    const q = query(
      collection(db, "hireRequests"),
      where("companyId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as HireRequest));
      
      setRequests(requestData);

      // Aggregate Stats
      const newStats = requestData.reduce((acc, req) => {
        if (req.status === "completed") {
          acc.totalRevenue += req.totalAmount;
          acc.completedCount += 1;
        } else if (req.status === "approved" || req.status === "active") {
          acc.pendingRevenue += req.totalAmount;
          if (req.status === "active") {
            acc.heldDeposits += (req.depositAmount || 0);
          }
        }
        return acc;
      }, { totalRevenue: 0, pendingRevenue: 0, heldDeposits: 0, completedCount: 0 });

      setStats(newStats);
      setLoading(false);
    }, (error) => {
      logError("FinancePulse", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
        <p className="text-gray-500 font-bold mt-4">Calculating your financial pulse...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-500">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-20 h-20" />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Realized Revenue</p>
          <div className="flex items-baseline gap-2 mt-4">
            <p className="text-3xl font-black text-gray-900">KSH {stats.totalRevenue.toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-1.5 text-primary-600 text-[10px] font-black mt-4 bg-primary-50 w-fit px-2 py-1 rounded-full">
            <TrendingUp className="w-3 h-3" /> {stats.completedCount} COMPLETED DEALS
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-500">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending Contracts</p>
          <div className="flex items-baseline gap-2 mt-4">
            <p className="text-3xl font-black text-amber-600">KSH {stats.pendingRevenue.toLocaleString()}</p>
          </div>
          <p className="text-[10px] font-bold text-gray-400 mt-4 uppercase italic">Projected receivables</p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-500">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Security Deposits (Held)</p>
          <div className="flex items-baseline gap-2 mt-4">
            <p className="text-3xl font-black text-blue-600">KSH {stats.heldDeposits.toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-1.5 text-blue-600 text-[10px] font-black mt-4 bg-blue-50 w-fit px-2 py-1 rounded-full uppercase tracking-widest">
            <ShieldCheck className="w-3 h-3" /> Restricted Funds
          </div>
        </div>

        <div className="bg-gray-900 p-8 rounded-[2rem] shadow-2xl shadow-gray-900/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent pointer-events-none" />
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Available for Payout</p>
          <div className="flex items-baseline gap-2 mt-4">
            <p className="text-3xl font-black text-white">KSH {stats.totalRevenue.toLocaleString()}</p>
          </div>
          <button className="mt-6 w-full py-4 bg-white text-gray-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-500 hover:text-white transition-all duration-300">
            Initiate Withdrawal
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-10 py-8 border-b flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Ledger History</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Real-time sync enabled</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-4 top-3.5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search tx id or customer..." 
                className="pl-12 pr-6 py-3 bg-gray-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary-500 outline-none w-64 transition-all"
              />
            </div>
            <button className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition text-gray-600">
              <Filter className="w-5 h-5" />
            </button>
            <button className="p-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition">
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <th className="px-10 py-5">Transaction Reference</th>
                <th className="px-10 py-5">Initiated</th>
                <th className="px-10 py-5">Contract Details</th>
                <th className="px-10 py-5">Settlement</th>
                <th className="px-10 py-5 text-right">Net Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-10 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                      <Clock className="w-12 h-12" />
                      <p className="text-sm font-black uppercase tracking-widest">No transactions found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="group hover:bg-gray-50/50 transition-colors duration-300">
                    <td className="px-10 py-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-gray-900 tracking-wider">#{req.id.slice(-8).toUpperCase()}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">INV-{req.id.slice(0, 4)}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs font-bold text-gray-600">
                          {req.createdAt ? new Date(req.createdAt.toDate()).toLocaleDateString() : "Pending"}
                        </span>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-gray-800">{req.customerName}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{req.days} Day Hire</span>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className={`flex items-center gap-2 w-fit px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${
                        req.status === "completed" 
                          ? "bg-primary-50 text-primary-600 border-primary-100" 
                          : req.status === "cancelled" || req.status === "rejected"
                          ? "bg-red-50 text-red-600 border-red-100"
                          : "bg-amber-50 text-amber-600 border-amber-100"
                      }`}>
                        {req.status === "completed" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {req.status}
                      </div>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-900">KSH {req.totalAmount.toLocaleString()}</span>
{req.depositAmount !== undefined && req.depositAmount > 0 && (
                           <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">+ KSH {req.depositAmount.toLocaleString()} DP</span>
                         )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
