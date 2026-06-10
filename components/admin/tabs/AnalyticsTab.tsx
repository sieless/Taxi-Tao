"use client";

import { useState, useEffect } from "react";
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  limit
} from "firebase/firestore";
import { db } from "@/lib/firebase";

import { logError } from "@/lib/logger";import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
} from "recharts";
import { 
  BarChart2, 
  TrendingUp, 
  Car, 
  Users, 
  CheckCircle, 
  AlertTriangle,
  Calendar,
  Wallet,
  Activity,
  Zap,
  Star
} from "lucide-react";

type Range = "7d" | "30d" | "90d";

interface DailyRide { date: string; rides: number; revenue: number; }
interface TopDriver { id: string; name: string; rides: number; rating: number; }
interface SubscriptionBreakdown { name: string; value: number; color: string; }

export default function AnalyticsTab() {
  const [range, setRange] = useState<Range>("30d");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ 
    totalRides: 0, 
    completedRides: 0, 
    totalDrivers: 0, 
    activeDrivers: 0, 
    pendingDrivers: 0, 
    expiredDrivers: 0,
    totalRevenue: 0
  });
  const [dailyRides, setDailyRides] = useState<DailyRide[]>([]);
  const [topDrivers, setTopDrivers] = useState<TopDriver[]>([]);
  const [subBreakdown, setSubBreakdown] = useState<SubscriptionBreakdown[]>([]);

  useEffect(() => {
    loadData();
  }, [range]);

  const daysBack = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const fmtDate = (d: Date, short = false) => {
    return d.toLocaleDateString("en-KE", short ? { month: "short", day: "numeric" } : { weekday: "short", month: "short", day: "numeric" });
  };

  async function loadData() {
    setLoading(true);
    try {
      const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
      const cutoff = Timestamp.fromDate(daysBack(days));

      const [ridesSnap, driversSnap] = await Promise.all([
        getDocs(query(collection(db, "bookingRequests"), where("createdAt", ">=", cutoff), orderBy("createdAt", "asc"))),
        getDocs(query(collection(db, "drivers"))),
      ]);

      const drivers = driversSnap.docs.map(d => d.data() as any);
      const active = drivers.filter(d => d.subscriptionStatus === "active").length;
      const pending = drivers.filter(d => d.subscriptionStatus === "pending").length;
      const expired = drivers.filter(d => d.subscriptionStatus === "expired").length;

      let revenue = 0;
      ridesSnap.docs.forEach(d => {
        const data = d.data();
        if (data.status === "completed") {
          revenue += Number(data.fare || data.price || 0);
        }
      });

      setStats({
        totalRides: ridesSnap.size,
        completedRides: ridesSnap.docs.filter(d => d.data().status === "completed").length,
        totalDrivers: drivers.length,
        activeDrivers: active,
        pendingDrivers: pending,
        expiredDrivers: expired,
        totalRevenue: revenue
      });

      setSubBreakdown([
        { name: "Active", value: active, color: "#10b981" },
        { name: "Pending", value: pending, color: "#f59e0b" },
        { name: "Expired", value: expired, color: "#f43f5e" },
        { name: "Other", value: drivers.length - active - pending - expired, color: "#6366f1" },
      ].filter(s => s.value > 0));

      const dayMap: Record<string, { rides: number; revenue: number }> = {};
      for (let i = days - 1; i >= 0; i--) {
        const d = daysBack(i);
        dayMap[fmtDate(d, true)] = { rides: 0, revenue: 0 };
      }

      ridesSnap.docs.forEach(d => {
        const data = d.data();
        const ts = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
        const key = fmtDate(ts, true);
        if (dayMap[key]) {
          dayMap[key].rides++;
          if (data.status === "completed") {
            dayMap[key].revenue += Number(data.fare || data.price || 0);
          }
        }
      });
      setDailyRides(Object.entries(dayMap).map(([date, v]) => ({ date, ...v })));

      const driverRideCounts: Record<string, { name: string; rides: number; rating: number }> = {};
      ridesSnap.docs.forEach(d => {
        const data = d.data();
        if (data.status === "completed" && data.acceptedBy) {
          if (!driverRideCounts[data.acceptedBy]) {
            driverRideCounts[data.acceptedBy] = { name: data.driverName || "Driver", rides: 0, rating: data.driverRating || 0 };
          }
          driverRideCounts[data.acceptedBy].rides++;
        }
      });
      setTopDrivers(Object.entries(driverRideCounts).map(([id, v]) => ({ id, ...v })).sort((a, b) => b.rides - a.rides).slice(0, 5));

    } catch (err) {
      logError("AnalyticsTab", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
            <BarChart2 size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Platform Analytics</h2>
            <p className="text-xs text-slate-400 font-medium">Real-time performance metrics</p>
          </div>
        </div>
        <div className="flex gap-1 p-1 bg-white rounded-2xl border border-slate-200 shadow-sm">
          {["7d", "30d", "90d"].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r as Range)}
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all
                ${range === r ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"}
              `}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Gross Revenue", value: `KES ${stats.totalRevenue.toLocaleString()}`, icon: <Wallet size={20} />, color: "text-primary-600", bg: "bg-primary-50" },
          { label: "Total Bookings", value: stats.totalRides.toLocaleString(), icon: <Zap size={20} />, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Completion Rate", value: `${stats.totalRides > 0 ? Math.round((stats.completedRides / stats.totalRides) * 100) : 0}%`, icon: <Activity size={20} />, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Active Drivers", value: stats.activeDrivers.toLocaleString(), icon: <Users size={20} />, color: "text-blue-600", bg: "bg-blue-50" },
        ].map((kpi, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className={`w-10 h-10 ${kpi.bg} ${kpi.color} rounded-xl flex items-center justify-center mb-4`}>
              {kpi.icon}
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
            <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-slate-800">Booking Velocity</h3>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-tighter">Daily Volume</span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyRides}>
                <defs>
                  <linearGradient id="colorRides" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ stroke: '#6366f1', strokeWidth: 1 }}
                />
                <Area type="monotone" dataKey="rides" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRides)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 mb-8">Driver Fleet Mix</h3>
          <div className="flex-1 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={subBreakdown} 
                  innerRadius={60} 
                  outerRadius={80} 
                  paddingAngle={8} 
                  dataKey="value"
                  stroke="none"
                >
                  {subBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-6">
            {subBreakdown.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-slate-500 font-medium">{s.name}</span>
                </div>
                <span className="font-bold text-slate-700">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-8">Revenue Performance</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyRides}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(v) => [`KES ${Number(v).toLocaleString()}`, "Revenue"]}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6">Top Performing Drivers</h3>
          <div className="space-y-4">
            {topDrivers.map((d, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-200 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-bold text-slate-400 border border-slate-100">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{d.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Star size={10} className="fill-amber-400 text-amber-400" />
                      <span className="text-[10px] text-slate-500 font-bold">{d.rating?.toFixed(1) || "—"}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-indigo-600">{d.rides} Rides</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Completed</p>
                </div>
              </div>
            ))}
            {topDrivers.length === 0 && (
              <div className="text-center py-12 text-slate-400 italic text-sm">No driver data for this period</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
