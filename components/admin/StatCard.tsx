"use client";

import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number | undefined;
  icon: ReactNode;
  trend?: {
    value: number;
    isUp: boolean;
  };
  color: string;
  loading?: boolean;
}

export default function StatCard({ label, value, icon, trend, color, loading }: StatCardProps) {
  const colorMap: Record<string, string> = {
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-100 shadow-indigo-100/50",
    emerald: "text-primary-600 bg-primary-50 border-primary-100 shadow-primary-100/50",
    amber: "text-amber-600 bg-amber-50 border-amber-100 shadow-amber-100/50",
    rose: "text-rose-600 bg-rose-50 border-rose-100 shadow-rose-100/50",
    blue: "text-blue-600 bg-blue-50 border-blue-100 shadow-blue-100/50",
    violet: "text-violet-600 bg-violet-50 border-violet-100 shadow-violet-100/50",
    slate: "text-slate-600 bg-slate-50 border-slate-100 shadow-slate-100/50",
  };

  const style = colorMap[color] || colorMap.slate;

  return (
    <div className={`rounded-2xl border bg-white p-5 shadow-sm transition-all hover:shadow-md ${style.split(" ")[2]}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${style.split(" ")[1]} ${style.split(" ")[0]} flex items-center justify-center`}>
          {icon}
        </div>
        {trend && !loading && (
          <div className={`flex items-center gap-1 text-xs font-bold ${trend.isUp ? "text-primary-600" : "text-rose-600"}`}>
            {trend.isUp ? "+" : "-"}{trend.value}%
          </div>
        )}
      </div>
      
      <div>
        <p className="text-2xl font-bold text-slate-900 tracking-tight">
          {loading ? (
            <span className="inline-block w-16 h-8 bg-slate-100 animate-pulse rounded-lg" />
          ) : (
            value ?? "—"
          )}
        </p>
        <p className="text-sm font-medium text-slate-500 mt-1">{label}</p>
      </div>
    </div>
  );
}
