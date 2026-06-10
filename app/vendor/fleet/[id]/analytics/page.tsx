"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft, Loader2, TrendingUp, Clock, Calendar,
  Activity, Zap, ShieldCheck, AlertTriangle, ArrowUpRight
} from "lucide-react";
import { doc, onSnapshot, collection, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Vehicle, HireRequest } from "@/lib/types";

const parseDate = (field: any): Date => {
  if (!field) return new Date();
  if (typeof field?.toDate === "function") return field.toDate();
  const d = new Date(field);
  return isNaN(d.getTime()) ? new Date() : d;
};

export default function VehicleAnalyticsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [history, setHistory] = useState<HireRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!id || !mounted) return;

    let unsubVehicle: (() => void) | undefined;
    let unsubHistory: (() => void) | undefined;

    const vehicleUnsub = onSnapshot(doc(db, "vehicles", id as string), (snap) => {
      if (snap.exists()) {
        const vData = { id: snap.id, ...snap.data() } as Vehicle;
        setVehicle(vData);

        unsubHistory?.();
        if (vData.companyId) {
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
          const hQuery = query(
            collection(db, "hireRequests"),
            where("companyId", "==", vData.companyId),
            where("vehicleId", "==", id),
            where("status", "==", "completed"),
            orderBy("completedAt", "desc")
          );
          unsubHistory = onSnapshot(hQuery, (hSnap) => {
            setHistory(hSnap.docs.map(d => ({ id: d.id, ...d.data() } as HireRequest)));
            setLoading(false);
          }, () => setLoading(false));
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }, () => setLoading(false));

    return () => {
      vehicleUnsub();
      unsubHistory?.();
    };
  }, [id, mounted]);

  const analytics = useMemo(() => {
    if (!history.length) {
      return {
        totalRevenue: vehicle?.performance?.totalRevenue || 0,
        totalTrips: vehicle?.performance?.totalTrips || 0,
        avgTicket: 0,
        utilization: 0,
        monthlyRevenue: [] as { month: string; amount: number }[],
        maxRevenue: 0,
        growthPct: 0,
        roiGrade: "D",
        healthLabel: "No Data",
        healthColor: "#9ca3af",
        rentalsUntilService: vehicle?.performance?.rentalsUntilService ?? 0,
      };
    }

    const totalRevenue = vehicle?.performance?.totalRevenue || 0;
    const totalTrips = vehicle?.performance?.totalTrips || 0;
    const avgTicket = totalTrips > 0 ? totalRevenue / totalTrips : 0;

    const now = new Date();
    const totalHireDays = history.reduce((sum, h) => {
      const start = parseDate(h.startDate);
      const end = parseDate(h.endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return sum + (days > 0 ? days : h.days || 1);
    }, 0);
    const firstHireDate = parseDate(history[history.length - 1]?.completedAt);
    const daysSinceFirst = Math.max(1, Math.ceil((now.getTime() - firstHireDate.getTime()) / (1000 * 60 * 60 * 24)));
    const utilization = Math.min(100, Math.round((totalHireDays / daysSinceFirst) * 100));

    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const monthlyMap: Record<string, number> = {};
    history.forEach((h) => {
      const d = parseDate(h.completedAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      monthlyMap[key] = (monthlyMap[key] || 0) + (h.totalAmount || 0);
    });
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      monthlyRevenue.push({ month: monthNames[d.getMonth()], amount: monthlyMap[key] || 0 });
    }
    const maxRevenue = Math.max(...monthlyRevenue.map(m => m.amount), 1);

    const currentMonth = monthlyRevenue[monthlyRevenue.length - 1]?.amount || 0;
    const lastMonth = monthlyRevenue[monthlyRevenue.length - 2]?.amount || 0;
    const growthPct = lastMonth > 0
      ? Math.round(((currentMonth - lastMonth) / lastMonth) * 100)
      : currentMonth > 0 ? 100 : 0;

    const dailyRate = vehicle?.dailyRate || 0;
    const expectedRevenue = dailyRate * totalTrips;
    const roiRatio = expectedRevenue > 0 ? totalRevenue / expectedRevenue : 0;
    let roiGrade = "D";
    if (roiRatio >= 0.9) roiGrade = "A+";
    else if (roiRatio >= 0.75) roiGrade = "A";
    else if (roiRatio >= 0.6) roiGrade = "B";
    else if (roiRatio >= 0.4) roiGrade = "C";

    const serviceInterval = vehicle?.performance?.serviceInterval || 20;
    const rentalsUntilService = vehicle?.performance?.rentalsUntilService ?? serviceInterval;
    const healthRatio = serviceInterval > 0 ? rentalsUntilService / serviceInterval : 1;
    let healthLabel = "Critical";
    let healthColor = "#ef4444";
    if (healthRatio > 0.6) { healthLabel = "Good"; healthColor = "#10b981"; }
    else if (healthRatio > 0.2) { healthLabel = "Fair"; healthColor = "#f59e0b"; }

    return { totalRevenue, totalTrips, avgTicket, utilization, monthlyRevenue, maxRevenue, growthPct, roiGrade, healthLabel, healthColor, rentalsUntilService };
  }, [history, vehicle?.performance, vehicle?.dailyRate]);

  if (!mounted || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-4" />
        <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Computing Analytics...</p>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="p-20 text-center">
        <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-6" />
        <h2 className="text-2xl font-black text-gray-900 uppercase">Asset Not Found</h2>
        <button onClick={() => router.back()} className="mt-6 text-indigo-600 font-black uppercase tracking-widest text-xs">Return to Fleet</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center gap-6 pb-2 border-b border-gray-100">
        <button
          onClick={() => router.back()}
          className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:shadow-lg transition-all active:scale-95"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Asset Deep-Dive</p>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">
            {vehicle.make} {vehicle.model}
          </h1>
          <p className="text-gray-500 font-black text-xs uppercase tracking-widest mt-1">{vehicle.plate}</p>
        </div>
      </div>

      {/* Profit Card */}
      <div className="bg-gray-900 rounded-[2.5rem] p-10 text-white shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Gross Yield</p>
            <p className="text-4xl font-black mt-2 tracking-tight">KES {analytics.totalRevenue.toLocaleString()}</p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${analytics.growthPct >= 0 ? "bg-emerald-500/15" : "bg-red-500/15"}`}>
            <TrendingUp className={`w-4 h-4 ${analytics.growthPct >= 0 ? "text-emerald-400" : "text-red-400"}`} />
            <span className={`text-sm font-black ${analytics.growthPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {analytics.growthPct >= 0 ? "+" : ""}{analytics.growthPct}%
            </span>
          </div>
        </div>
        <div className="h-px bg-white/10 my-8" />
        <div className="grid grid-cols-3 gap-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Total Hires</p>
            <p className="text-2xl font-black mt-2">{analytics.totalTrips}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Avg. Daily</p>
            <p className="text-2xl font-black mt-2">KES {analytics.avgTicket.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">ROI Score</p>
            <p className="text-2xl font-black mt-2">{analytics.roiGrade}</p>
          </div>
        </div>
      </div>

      {/* Utilization & Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Utilization</p>
          <div className="flex items-center justify-center">
            <div className="relative w-24 h-24 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center">
              <div className="absolute bottom-0 w-full bg-purple-500 rounded-full transition-all" style={{ height: `${analytics.utilization}%` }} />
              <span className="text-2xl font-black text-gray-900 z-10">{analytics.utilization}%</span>
            </div>
          </div>
          <p className="text-center text-xs font-bold text-gray-500 mt-4">On-Road Time</p>
        </div>
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Health Score</p>
          <div className="flex flex-col items-center justify-center">
            <Zap size={40} color={analytics.healthColor} fill={analytics.healthColor} />
            <p className="text-2xl font-black text-gray-900 mt-3">{analytics.healthLabel}</p>
            <p className="text-xs font-bold mt-1" style={{ color: analytics.healthColor }}>
              {analytics.rentalsUntilService} hires until service
            </p>
          </div>
        </div>
      </div>

      {/* Revenue Velocity Chart */}
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Revenue Velocity</p>
          <Calendar className="w-4 h-4 text-gray-400" />
        </div>
        {analytics.monthlyRevenue.every(m => m.amount === 0) ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Calendar size={40} className="mb-4 opacity-50" />
            <p className="text-sm italic">No revenue data for the last 6 months.</p>
          </div>
        ) : (
          <div className="flex items-end gap-4 h-48">
            {analytics.monthlyRevenue.map((data, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[10px] font-black text-gray-500">
                  {data.amount > 0 ? `${(data.amount / 1000).toFixed(0)}k` : "0"}
                </span>
                <div
                  className={`w-full max-w-[40px] rounded-t-lg transition-all ${
                    idx === analytics.monthlyRevenue.length - 1 ? "bg-purple-500" : "bg-gray-200"
                  }`}
                  style={{ height: analytics.maxRevenue > 0 ? `${(data.amount / analytics.maxRevenue) * 140}px` : "0px" }}
                />
                <span className="text-[10px] font-black text-gray-400">{data.month}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Performance Ledger */}
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Performance Ledger</p>
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Activity size={40} className="mb-4 opacity-50" />
            <p className="text-sm italic">No historical data for this asset.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.slice(0, 10).map((hire) => (
              <div key={hire.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-gray-900 truncate">{hire.customerName || "Customer"}</p>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    {hire.completedAt ? parseDate(hire.completedAt).toLocaleDateString() : "—"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-gray-900">KES {hire.totalAmount?.toLocaleString()}</p>
                  <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-md mt-1">
                    Verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export */}
      <button
        disabled
        className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 opacity-50 cursor-not-allowed"
      >
        <ArrowUpRight className="w-4 h-4" /> Generate Fiscal Report
      </button>
    </div>
  );
}
