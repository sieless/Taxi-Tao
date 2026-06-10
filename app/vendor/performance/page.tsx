"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  TrendingUp,
  TrendingDown,
  Car,
  DollarSign,
  Clock,
  AlertTriangle,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";


import { logError } from "@/lib/logger";interface VehicleAnalytics {
  id: string;
  name: string;
  plate: string;
  dailyRate: number;
  totalBookings: number;
  totalRevenue: number;
  activeDays: number;
  utilizationRate: number;
  averageRating: number;
  maintenanceAlerts: number;
}

interface FleetMetrics {
  totalVehicles: number;
  activeVehicles: number;
  totalRevenue: number;
  totalBookings: number;
  averageUtilization: number;
  averageRating: number;
  maintenanceAlerts: number;
  revenueTrend: number;
}

export default function FleetAnalyticsPage() {
  const { user, userProfile } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<FleetMetrics>({
    totalVehicles: 0,
    activeVehicles: 0,
    totalRevenue: 0,
    totalBookings: 0,
    averageUtilization: 0,
    averageRating: 0,
    maintenanceAlerts: 0,
    revenueTrend: 0,
  });
  const [topVehicles, setTopVehicles] = useState<VehicleAnalytics[]>([]);
  const [period, setPeriod] = useState<"week" | "month" | "quarter">("month");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !userProfile?.companyId) return;

    setLoading(true);

    const vehiclesQuery = query(
      collection(db, "vehicles"),
      where("companyId", "==", userProfile.companyId)
    );

    const unsubscribeVehicles = onSnapshot(
      vehiclesQuery,
      (vehicleSnap) => {
        const vehicles = vehicleSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as any[];

        const totalVehicles = vehicles.length;
        const activeVehicles = vehicles.filter(
          (v) => v.status === "active" || v.status === "available"
        ).length;

        const totalDailyRate = vehicles.reduce(
          (sum, v) => sum + (v.dailyRate || 0),
          0
        );
        const avgDailyRate = totalVehicles > 0 ? totalDailyRate / totalVehicles : 0;

        const totalMaintenanceAlerts = vehicles.filter(
          (v) => v.status === "maintenance" || v.needsMaintenance
        ).length;

        setMetrics((prev) => ({
          ...prev,
          totalVehicles,
          activeVehicles,
          maintenanceAlerts: totalMaintenanceAlerts,
        }));

        const vehicleAnalytics: VehicleAnalytics[] = vehicles
          .filter((v) => v.status === "active" || v.status === "available")
          .map((v) => ({
            id: v.id,
            name: `${v.year || ""} ${v.make || ""} ${v.model || ""}`.trim() || "Unknown Vehicle",
            plate: v.plate || "N/A",
            dailyRate: v.dailyRate || 0,
            totalBookings: v.totalBookings || 0,
            totalRevenue: v.totalRevenue || 0,
            activeDays: v.activeDays || 0,
            utilizationRate: v.utilizationRate || 0,
            averageRating: v.averageRating || 0,
            maintenanceAlerts: v.needsMaintenance ? 1 : 0,
          }))
          .sort((a, b) => b.totalRevenue - a.totalRevenue)
          .slice(0, 10);

        setTopVehicles(vehicleAnalytics);

        const totalRevenue = vehicleAnalytics.reduce(
          (sum, v) => sum + v.totalRevenue,
          0
        );
        const totalBookings = vehicleAnalytics.reduce(
          (sum, v) => sum + v.totalBookings,
          0
        );
        const avgUtilization =
          vehicleAnalytics.length > 0
            ? vehicleAnalytics.reduce((sum, v) => sum + v.utilizationRate, 0) /
              vehicleAnalytics.length
            : 0;
        const avgRating =
          vehicleAnalytics.length > 0
            ? vehicleAnalytics.reduce((sum, v) => sum + v.averageRating, 0) /
              vehicleAnalytics.length
            : 0;

        setMetrics((prev) => ({
          ...prev,
          totalRevenue,
          totalBookings,
          averageUtilization: avgUtilization,
          averageRating: avgRating,
        }));

        setLoading(false);
      },
      (error) => {
        logError("page", error);
        setLoading(false);
      }
    );

    return () => unsubscribeVehicles();
  }, [user, userProfile, mounted, period]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-8 w-20 bg-gray-200 rounded-full animate-pulse" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 animate-pulse">
              <div className="h-3 w-1/2 bg-gray-200 rounded mb-2" />
              <div className="h-7 w-1/3 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 h-64 animate-pulse" />
      </div>
    );
  }

  const metricCards = [
    {
      label: "Total Revenue",
      value: `KES ${metrics.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "emerald",
      trend: metrics.revenueTrend,
    },
    {
      label: "Total Bookings",
      value: metrics.totalBookings.toLocaleString(),
      icon: BarChart3,
      color: "blue",
      trend: 12,
    },
    {
      label: "Fleet Utilization",
      value: `${metrics.averageUtilization.toFixed(1)}%`,
      icon: TrendingUp,
      color: "purple",
      trend: 5,
    },
    {
      label: "Active Vehicles",
      value: `${metrics.activeVehicles} / ${metrics.totalVehicles}`,
      icon: Car,
      color: "indigo",
      trend: 0,
    },
    {
      label: "Average Rating",
      value: metrics.averageRating.toFixed(1),
      icon: TrendingUp,
      color: "amber",
      trend: 2,
    },
    {
      label: "Maintenance Alerts",
      value: metrics.maintenanceAlerts.toString(),
      icon: AlertTriangle,
      color: metrics.maintenanceAlerts > 0 ? "red" : "emerald",
      trend: 0,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-gray-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Performance Analytics
            </span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none uppercase">
            Fleet Analytics
          </h1>
          <p className="text-gray-500 font-medium text-sm">
            Real-time insights into your fleet performance and revenue.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-xl p-1">
            {(["week", "month", "quarter"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${
                  period === p
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      {loading ? (
        <div className="p-20 text-center">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">
            Loading Analytics...
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {metricCards.map((card) => (
              <div
                key={card.label}
                className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      card.color === "emerald"
                        ? "bg-primary-50 text-primary-600"
                        : card.color === "blue"
                        ? "bg-blue-50 text-blue-600"
                        : card.color === "purple"
                        ? "bg-primary-50 text-primary-600"
                        : card.color === "indigo"
                        ? "bg-indigo-50 text-indigo-600"
                        : card.color === "amber"
                        ? "bg-amber-50 text-amber-600"
                        : card.color === "red"
                        ? "bg-red-50 text-red-600"
                        : "bg-gray-50 text-gray-600"
                    }`}
                  >
                    <card.icon className="w-5 h-5" />
                  </div>
                  {card.trend !== 0 && (
                    <div
                      className={`flex items-center gap-1 text-[10px] font-black ${
                        card.trend > 0 ? "text-primary-600" : "text-red-600"
                      }`}
                    >
                      {card.trend > 0 ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      {Math.abs(card.trend)}%
                    </div>
                  )}
                </div>
                <p className="text-2xl font-black text-gray-900 tracking-tight">
                  {card.value}
                </p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                  {card.label}
                </p>
              </div>
            ))}
          </div>

          {/* Vehicle Performance Table */}
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">
                Vehicle Performance Ranking
              </h2>
              <p className="text-xs font-bold text-gray-500 mt-1">
                Top performing vehicles by revenue
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
                      Rank
                    </th>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
                      Vehicle
                    </th>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
                      Plate
                    </th>
                    <th className="text-right px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
                      Daily Rate
                    </th>
                    <th className="text-right px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
                      Bookings
                    </th>
                    <th className="text-right px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
                      Revenue
                    </th>
                    <th className="text-right px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
                      Utilization
                    </th>
                    <th className="text-right px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
                      Rating
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {topVehicles.map((vehicle, index) => (
                    <tr
                      key={vehicle.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${
                            index === 0
                              ? "bg-amber-100 text-amber-700"
                              : index === 1
                              ? "bg-gray-200 text-gray-700"
                              : index === 2
                              ? "bg-orange-100 text-orange-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-gray-900">
                          {vehicle.name}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-gray-100 rounded-lg text-[10px] font-black text-gray-600">
                          {vehicle.plate}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-gray-900">
                          KES {vehicle.dailyRate.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-gray-900">
                          {vehicle.totalBookings}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-black text-primary-600">
                          KES {vehicle.totalRevenue.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                vehicle.utilizationRate >= 70
                                  ? "bg-primary-500"
                                  : vehicle.utilizationRate >= 40
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                              }`}
                              style={{
                                width: `${Math.min(vehicle.utilizationRate, 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-600 w-12 text-right">
                            {vehicle.utilizationRate.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-amber-600">
                          ★ {vehicle.averageRating.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {topVehicles.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-12 text-center text-gray-400"
                      >
                        <Car className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-sm font-bold">
                          No vehicle data available
                        </p>
                        <p className="text-xs mt-1">
                          Add vehicles to see performance metrics
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Revenue Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-6">
                Revenue by Vehicle
              </h3>
              <div className="space-y-4">
                {topVehicles.slice(0, 5).map((vehicle, index) => {
                  const maxRevenue = topVehicles[0]?.totalRevenue || 1;
                  const percentage = (vehicle.totalRevenue / maxRevenue) * 100;
                  return (
                    <div key={vehicle.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-700 truncate max-w-[200px]">
                          {vehicle.name}
                        </span>
                        <span className="text-xs font-black text-gray-500">
                          KES {vehicle.totalRevenue.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-6">
                Fleet Health Summary
              </h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-primary-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                      <Car className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-primary-900">
                        Active Vehicles
                      </p>
                      <p className="text-xs text-primary-600">
                        Available for hire
                      </p>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-primary-700">
                    {metrics.activeVehicles}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-amber-900">
                        Inactive Vehicles
                      </p>
                      <p className="text-xs text-amber-600">
                        Needs attention
                      </p>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-amber-700">
                    {metrics.totalVehicles - metrics.activeVehicles}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-red-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-red-900">
                        Maintenance Required
                      </p>
                      <p className="text-xs text-red-600">
                        Service needed
                      </p>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-red-700">
                    {metrics.maintenanceAlerts}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
