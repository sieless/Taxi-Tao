"use client";

import { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  doc, 
  updateDoc, 
  limit,
  onSnapshot
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/firestore-constants";
import { 
  Bug, 
  CheckCircle, 
  AlertTriangle, 
  Search, 
  RefreshCw, 
  ChevronRight, 
  Smartphone, 
  Globe, 
  Terminal,
  Activity,
  Filter,
  Eye,
  AlertCircle,
  Clock
} from "lucide-react";
import { useModal } from "@/lib/admin-modal-context";
import { useAuth } from "@/lib/auth-context";

interface AppCrash {
  id: string;
  message?: string;
  stack?: string;
  userId?: string;
  platform?: "android" | "ios" | "web";
  appVersion?: string;
  severity?: "low" | "medium" | "high" | "critical";
  resolved?: boolean;
  resolvedBy?: string;
  timestamp: any;
  count?: number;
}

export default function CrashesTab() {
  const { user } = useAuth();
  const modal = useModal();
  const [crashes, setCrashes] = useState<AppCrash[]>([]);
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState<string>("all");
  const [resolvedStatus, setResolvedStatus] = useState<string>("open");
  const [search, setSearch] = useState("");
  const [resolving, setResolving] = useState<string | null>(null);
  const [selectedCrash, setSelectedCrash] = useState<AppCrash | null>(null);

  useEffect(() => {
    const q = query(collection(db, COLLECTIONS.APP_CRASHES), orderBy("timestamp", "desc"), limit(100));
    const unsub = onSnapshot(q, (snap) => {
      setCrashes(snap.docs.map(d => ({ id: d.id, ...d.data() } as AppCrash)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function handleResolve(id: string) {
    setResolving(id);
    try {
      await updateDoc(doc(db, COLLECTIONS.APP_CRASHES, id), { 
        resolved: true, 
        resolvedAt: new Date(),
        resolvedBy: user?.uid
      });
      modal.showAlert("Crash report marked as resolved", "success");
    } catch (err: any) {
      modal.showAlert(`Failed: ${err.message}`, "error");
    } finally {
      setResolving(null);
    }
  }

  const filtered = crashes.filter(c => {
    const matchSev = severity === "all" || c.severity === severity;
    const matchRes = resolvedStatus === "all" || (resolvedStatus === "open" ? !c.resolved : !!c.resolved);
    const matchSearch = !search || 
                      c.message?.toLowerCase().includes(search.toLowerCase()) || 
                      c.userId?.includes(search) || 
                      c.appVersion?.includes(search);
    return matchSev && matchRes && matchSearch;
  });

  const getSeverityStyle = (sev: string) => {
    const styles: Record<string, string> = {
      critical: "bg-rose-100 text-rose-700 border-rose-200",
      high: "bg-orange-100 text-orange-700 border-orange-200",
      medium: "bg-amber-100 text-amber-700 border-amber-200",
      low: "bg-slate-100 text-slate-600 border-slate-200",
    };
    return styles[sev] || styles.low;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Open Reports</p>
          <p className="text-2xl font-bold text-rose-600">{crashes.filter(c => !c.resolved).length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Critical Issues</p>
          <p className="text-2xl font-bold text-orange-600">{crashes.filter(c => c.severity === "critical" && !c.resolved).length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Resolution Rate</p>
          <p className="text-2xl font-bold text-primary-600">
            {crashes.length ? Math.round((crashes.filter(c => c.resolved).length / crashes.length) * 100) : 0}%
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Affected Users</p>
          <p className="text-2xl font-bold text-slate-900">{new Set(crashes.map(c => c.userId)).size}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex gap-4 flex-wrap">
          <div className="flex gap-1 p-1 bg-slate-50 rounded-xl border border-slate-100">
            {["open", "resolved", "all"].map((s) => (
              <button
                key={s}
                onClick={() => setResolvedStatus(s)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all
                  ${resolvedStatus === s ? "bg-white text-indigo-600 shadow-sm border border-slate-200" : "text-slate-400"}
                `}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-1 p-1 bg-slate-50 rounded-xl border border-slate-100">
            {["all", "critical", "high", "medium", "low"].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverity(sev)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all
                  ${severity === sev ? "bg-white text-indigo-600 shadow-sm border border-slate-200" : "text-slate-400"}
                `}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input 
            type="text" 
            placeholder="Search logs..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Crash List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
            <RefreshCw className="animate-spin text-indigo-500" size={32} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <Bug size={48} className="text-slate-200 mb-4" />
            <p className="text-slate-500 font-medium">No crash reports found</p>
          </div>
        ) : (
          filtered.map((crash) => (
            <div 
              key={crash.id} 
              className={`bg-white rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md 
                ${crash.severity === "critical" && !crash.resolved ? "border-rose-200 bg-rose-50/5" : "border-slate-200"}
              `}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-xl mt-1 ${crash.resolved ? "bg-primary-50 text-primary-600" : crash.severity === "critical" ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-400"}`}>
                  {crash.resolved ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-md border ${getSeverityStyle(crash.severity || "low")}`}>
                      {crash.severity || "LOW"}
                    </span>
                    <span className="flex items-center gap-1 text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      {crash.platform === "web" ? <Globe size={10} /> : <Smartphone size={10} />}
                      {crash.platform?.toUpperCase() || "UNKNOWN"}
                    </span>
                    {crash.appVersion && <span className="text-[10px] text-slate-400 font-mono">v{crash.appVersion}</span>}
                    {crash.count && crash.count > 1 && (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">×{crash.count}</span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mb-1 leading-snug line-clamp-2">{crash.message || "Generic Application Error"}</h3>
                  
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <Clock size={12} />
                      {crash.timestamp?.toDate ? crash.timestamp.toDate().toLocaleString() : "—"}
                    </div>
                    {crash.userId && (
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <Terminal size={12} />
                        User: {crash.userId}
                      </div>
                    )}
                  </div>

                  {crash.stack && (
                    <div className="mt-4">
                      <details className="group">
                        <summary className="text-[10px] font-bold text-indigo-600 cursor-pointer hover:text-indigo-700 flex items-center gap-1 outline-none">
                          <ChevronRight size={12} className="group-open:rotate-90 transition-transform" />
                          View Stack Trace
                        </summary>
                        <pre className="mt-2 p-4 bg-slate-900 text-slate-300 rounded-xl text-[10px] font-mono overflow-x-auto whitespace-pre-wrap max-h-64 scrollbar-thin scrollbar-thumb-slate-700">
                          {crash.stack}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>

                {!crash.resolved && (
                  <button 
                    onClick={() => handleResolve(crash.id)}
                    disabled={resolving === crash.id}
                    className="flex-shrink-0 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-primary-100 disabled:opacity-50"
                  >
                    {resolving === crash.id ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                    Resolve
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
