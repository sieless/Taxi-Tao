"use client";

import { useState } from "react";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { 
  Database, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  Car, 
  Search,
  Activity,
  ShieldAlert,
  ChevronRight,
  ClipboardList
} from "lucide-react";
import { useModal } from "@/lib/admin-modal-context";

interface DiagResult {
  totalUsers: number;
  totalDrivers: number;
  driverUserRecords: number;
  orphanedDrivers: string[];
  orphanedUserDrivers: string[];
  driversWithNoVehicles: string[];
  driversWithNoPhone: string[];
}

export default function DbDiagnosticsTab() {
  const { userProfile } = useAuth();
  const modal = useModal();
  const [result, setResult] = useState<DiagResult | null>(null);
  const [loading, setLoading] = useState(false);

  const isAdmin = userProfile?.role === "admin";

  async function runDiagnostics() {
    setLoading(true);
    try {
      const [usersSnap, driversSnap] = await Promise.all([
        getDocs(query(collection(db, "users"))),
        getDocs(query(collection(db, "drivers"))),
      ]);

      const usersMap = new Map(usersSnap.docs.map((d) => [d.id, d.data()]));
      const driversMap = new Map(driversSnap.docs.map((d) => [d.id, d.data()]));

      const driverUserIds = new Set<string>(usersSnap.docs.filter((d) => d.data().role === "driver").map((d) => d.id));

      const orphanedDrivers = driversSnap.docs.filter((d) => !usersMap.has(d.id)).map((d) => d.id);
      const orphanedUserDrivers = [...driverUserIds].filter((uid) => !driversMap.has(uid));
      const driversWithNoVehicles = driversSnap.docs.filter((d) => {
        const v = d.data().vehicles;
        return !v || (Array.isArray(v) && v.length === 0);
      }).map((d) => d.id);
      const driversWithNoPhone = driversSnap.docs.filter((d) => !d.data().phone).map((d) => d.id);

      setResult({
        totalUsers: usersSnap.size,
        totalDrivers: driversSnap.size,
        driverUserRecords: driverUserIds.size,
        orphanedDrivers,
        orphanedUserDrivers,
        driversWithNoVehicles,
        driversWithNoPhone,
      });
      modal.showAlert("Diagnostics scan complete", "success");
    } catch (err: any) { 
      modal.showAlert(`Diagnostics failed: ${err.message}`, "error"); 
    } finally { 
      setLoading(false); 
    }
  }

  const IssueCard = ({ title, ids, color, icon: Icon }: { title: string; ids: string[]; color: string; icon: any }) => (
    <div className={`bg-white rounded-3xl border p-6 shadow-sm transition-all hover:shadow-md ${ids.length > 0 ? "border-rose-200" : "border-slate-200"}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${ids.length > 0 ? "bg-rose-50 text-rose-600" : "bg-primary-50 text-primary-600"}`}>
            <Icon size={18} />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
        </div>
        <span className={`text-lg font-bold ${ids.length > 0 ? "text-rose-600" : "text-primary-600"}`}>{ids.length}</span>
      </div>
      
      {ids.length === 0 ? (
        <div className="flex items-center gap-2 text-primary-600 bg-primary-50/50 p-3 rounded-2xl border border-primary-100">
          <CheckCircle size={14} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Integrity Verified</span>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-2">Impacted Document IDs</p>
          <div className="max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 pr-2">
            {ids.map((id) => (
              <div key={id} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
                <span className="text-[10px] font-mono text-slate-500">{id}</span>
                <ChevronRight size={10} className="text-slate-300" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Hero Header */}
      <div className="bg-slate-900 rounded-[32px] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-slate-200">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <Database size={240} />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
              <Database size={24} className="text-white" />
            </div>
            <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-bold uppercase tracking-widest">System Health</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Database Diagnostics</h2>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-8">
            Perform a deep-scan of the Firestore architecture to identify orphaned records, 
            missing data links, and cross-collection integrity issues. This tool ensures 
            the application remains stable and synchronized.
          </p>
          <button
            onClick={runDiagnostics}
            disabled={loading || !isAdmin}
            className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-bold text-sm hover:bg-slate-100 transition shadow-xl shadow-black/20 flex items-center gap-3 disabled:opacity-50"
          >
            {loading ? <RefreshCw size={18} className="animate-spin" /> : <Activity size={18} />}
            {loading ? "Scanning Collections..." : "Execute Full System Scan"}
          </button>
        </div>
      </div>

      {!isAdmin && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 flex items-center gap-4 text-rose-700">
          <ShieldAlert size={24} />
          <div>
            <p className="font-bold">Access Restricted</p>
            <p className="text-xs opacity-80">This tool is limited to administrative accounts for data privacy and performance reasons.</p>
          </div>
        </div>
      )}

      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { label: "Total Users", value: result.totalUsers, icon: <Users size={20} />, color: "text-indigo-600", bg: "bg-indigo-50" },
              { label: "Total Drivers", value: result.totalDrivers, icon: <Car size={20} />, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Driver Records", value: result.driverUserRecords, icon: <ClipboardList size={20} />, color: "text-primary-600", bg: "bg-primary-50" },
              { label: "Integrity Issues", value: result.orphanedDrivers.length + result.orphanedUserDrivers.length + result.driversWithNoVehicles.length + result.driversWithNoPhone.length, icon: <AlertTriangle size={20} />, color: "text-rose-600", bg: "bg-rose-50" },
            ].map((s, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className={`w-10 h-10 ${s.bg} ${s.color} rounded-xl flex items-center justify-center mb-4`}>
                  {s.icon}
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Detailed Reports */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <IssueCard title="Orphaned Driver Docs" ids={result.orphanedDrivers} color="bg-rose-50 border-rose-200" icon={AlertTriangle} />
            <IssueCard title="Orphaned Auth Records" ids={result.orphanedUserDrivers} color="bg-orange-50 border-orange-200" icon={ShieldAlert} />
            <IssueCard title="Drivers Missing Vehicles" ids={result.driversWithNoVehicles} color="bg-amber-50 border-amber-200" icon={Car} />
            <IssueCard title="Drivers Missing Contact Info" ids={result.driversWithNoPhone} color="bg-yellow-50 border-yellow-200" icon={Users} />
          </div>
        </div>
      )}
    </div>
  );
}
