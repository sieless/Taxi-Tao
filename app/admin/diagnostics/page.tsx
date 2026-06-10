"use client";

import { useState } from "react";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { Database, RefreshCw, AlertTriangle, CheckCircle, Users, Car } from "lucide-react";
import { useModal } from "@/lib/admin-modal-context";

interface DiagResult {
  totalUsers: number;
  totalDrivers: number;
  driverUserRecords: number;
  orphanedDrivers: string[];       // in drivers collection but not in users
  orphanedUserDrivers: string[];   // in users with role=driver but not in drivers
  driversWithNoVehicles: string[];
  driversWithNoPhone: string[];
}

export default function DiagnosticsPage() {
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

      const driverUserIds = new Set(usersSnap.docs.filter((d) => d.data().role === "driver").map((d) => d.id));

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
    } catch (err: any) { await modal.showAlert(`Diagnostics failed: ${err?.message}`, "error"); }
    finally { setLoading(false); }
  }

  const IssueCard = ({ title, ids, color }: { title: string; ids: string[]; color: string }) => (
    <div className={`rounded-xl border p-4 ${ids.length > 0 ? color : "bg-white border-gray-100"}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
        <span className={`text-sm font-bold ${ids.length > 0 ? "text-red-700" : "text-primary-600"}`}>{ids.length}</span>
      </div>
      {ids.length === 0 ? (
        <p className="text-xs text-primary-600 flex items-center gap-1"><CheckCircle size={12} />All clear</p>
      ) : (
        <ul className="text-[11px] text-gray-600 space-y-0.5 mt-2 max-h-32 overflow-y-auto">
          {ids.map((id) => <li key={id} className="font-mono bg-white rounded px-1.5 py-0.5">{id}</li>)}
        </ul>
      )}
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Database size={24} className="text-primary-600" />DB Diagnostics</h1>
        <p className="text-gray-500 text-sm mt-1">Detect orphaned records, missing data, and data integrity issues</p>
      </div>

      {!isAdmin && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3 text-amber-800">
          <AlertTriangle size={18} /><p className="text-sm">This tool is restricted to admin accounts.</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <p className="text-sm text-gray-600 mb-4">This scan reads all <code className="bg-gray-100 px-1 rounded">users</code> and <code className="bg-gray-100 px-1 rounded">drivers</code> documents and cross-references them for data integrity issues. No data is modified.</p>
        <button
          onClick={runDiagnostics}
          disabled={loading || !isAdmin}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl transition disabled:opacity-50"
        >
          {loading ? <RefreshCw size={16} className="animate-spin" /> : <Database size={16} />}
          {loading ? "Running scan…" : "Run Diagnostics"}
        </button>
      </div>

      {result && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total Users", value: result.totalUsers, icon: <Users size={18} /> },
              { label: "Total Drivers", value: result.totalDrivers, icon: <Car size={18} /> },
              { label: "Driver User Records", value: result.driverUserRecords, icon: <Users size={18} /> },
              { label: "Issues Found", value: result.orphanedDrivers.length + result.orphanedUserDrivers.length + result.driversWithNoVehicles.length + result.driversWithNoPhone.length, icon: <AlertTriangle size={18} /> },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                <div className="text-primary-600 mb-2">{s.icon}</div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Issue cards */}
          <div className="grid md:grid-cols-2 gap-4">
            <IssueCard title="Orphaned Drivers (in drivers, not in users)" ids={result.orphanedDrivers} color="bg-red-50 border-red-200" />
            <IssueCard title="Orphaned User Drivers (role=driver, not in drivers)" ids={result.orphanedUserDrivers} color="bg-orange-50 border-orange-200" />
            <IssueCard title="Drivers With No Vehicles" ids={result.driversWithNoVehicles} color="bg-amber-50 border-amber-200" />
            <IssueCard title="Drivers With No Phone Number" ids={result.driversWithNoPhone} color="bg-yellow-50 border-yellow-200" />
          </div>
        </>
      )}
    </div>
  );
}
