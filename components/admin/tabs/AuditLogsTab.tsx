"use client";

import { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs, 
  QueryDocumentSnapshot, 
  where,
  onSnapshot
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/firestore-constants";

import { logError } from "@/lib/logger";import { 
  ClipboardList, 
  Clock, 
  Search, 
  User, 
  Activity, 
  Download, 
  Filter, 
  Shield, 
  ChevronDown,
  Info,
  AlertTriangle,
  AlertOctagon,
  MoreVertical,
  History
} from "lucide-react";

const PAGE_SIZE = 50;

interface AuditLog {
  id: string;
  actorEmail?: string;
  actorUid?: string;
  action: string;
  category?: string;
  severity?: "info" | "warning" | "critical";
  targetId?: string;
  targetType?: string;
  description?: string;
  timestamp: any;
  metadata?: Record<string, any>;
}

export default function AuditLogsTab() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>("all");
  const [severity, setSeverity] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    loadLogs(true);
  }, [category, severity]);

  async function loadLogs(reset = false) {
    setLoading(true);
    try {
      let constraints: any[] = [orderBy("timestamp", "desc"), limit(PAGE_SIZE)];
      if (category !== "all") constraints = [where("category", "==", category), ...constraints];
      if (severity !== "all") constraints = [where("severity", "==", severity), ...constraints];
      if (!reset && lastDoc) constraints = [...constraints, startAfter(lastDoc)];

      const q = query(collection(db, COLLECTIONS.ADMIN_AUDIT_EVENTS), ...constraints);
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog));
      
      setLogs(reset ? list : prev => [...prev, ...list]);
      setLastDoc(snap.docs[snap.docs.length - 1] ?? null);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (err) {
      logError("AuditLogsTab", err);
    } finally {
      setLoading(false);
    }
  }

  function exportCsv() {
    const header = "Timestamp,Actor,Action,Category,Severity,Target";
    const rows = logs.map(l => [
      l.timestamp?.toDate ? l.timestamp.toDate().toISOString() : "",
      l.actorEmail || l.actorUid,
      l.action,
      l.category || "",
      l.severity || "",
      l.targetId || ""
    ].join(","));
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `taxi-tao-audit-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const getSeverityStyle = (sev: string) => {
    const styles: Record<string, string> = {
      critical: "bg-rose-100 text-rose-700 border-rose-200",
      warning: "bg-amber-100 text-amber-700 border-amber-200",
      info: "bg-blue-100 text-blue-700 border-blue-200",
    };
    return styles[sev] || styles.info;
  };

  const filtered = logs.filter(l => 
    l.actorEmail?.toLowerCase().includes(search.toLowerCase()) || 
    l.action?.toLowerCase().includes(search.toLowerCase()) || 
    l.targetId?.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-6">
          <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
            <History size={28} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Administrative Audit</h2>
            <p className="text-sm text-slate-400 font-medium">Tracking system changes and admin actions</p>
          </div>
        </div>
        <button 
          onClick={exportCsv}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-white border border-slate-200 rounded-3xl font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
        >
          <Download size={20} /> Export Audit
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col xl:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex gap-4 flex-wrap">
          <div className="flex gap-1 p-1 bg-slate-50 rounded-xl border border-slate-100">
            {["all", "payment", "user", "driver", "system"].map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all
                  ${category === c ? "bg-white text-indigo-600 shadow-sm border border-slate-200" : "text-slate-400"}
                `}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex gap-1 p-1 bg-slate-50 rounded-xl border border-slate-100">
            {["all", "info", "warning", "critical"].map((s) => (
              <button
                key={s}
                onClick={() => setSeverity(s)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all
                  ${severity === s ? "bg-white text-indigo-600 shadow-sm border border-slate-200" : "text-slate-400"}
                `}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full xl:w-80">
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

      {/* Log Feed */}
      <div className="space-y-3">
        {loading && logs.length === 0 ? (
          <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <Activity size={48} className="text-slate-200 mb-4" />
            <p className="text-slate-500 font-medium">No audit logs found</p>
          </div>
        ) : (
          <>
            {filtered.map((log) => (
              <div key={log.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4 hover:border-indigo-200 transition-colors group">
                <div className={`p-2 rounded-xl mt-1 ${log.severity === "critical" ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-400 group-hover:text-indigo-600"}`}>
                  {log.severity === "critical" ? <AlertOctagon size={20} /> : log.severity === "warning" ? <AlertTriangle size={20} /> : <Info size={20} />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-bold text-slate-900">{log.action}</span>
                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-md border ${getSeverityStyle(log.severity || "info")}`}>
                      {log.severity || "info"}
                    </span>
                    <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 uppercase tracking-widest">
                      {log.category || "system"}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1">
                      <User size={12} />
                      <span className="font-medium text-slate-600">{log.actorEmail || "System Agent"}</span>
                    </div>
                    {log.targetId && (
                      <div className="flex items-center gap-1">
                        <Shield size={12} />
                        Target: <span className="font-mono">{log.targetId}</span>
                      </div>
                    )}
                  </div>
                  
                  {log.description && (
                    <p className="mt-2 text-xs text-slate-500 leading-relaxed italic border-l-2 border-slate-100 pl-3">
                      {log.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 text-right">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                    <Clock size={12} />
                    {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : "—"}
                  </div>
                  <button className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-300 transition-colors">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>
            ))}

            {hasMore && !search && (
              <div className="pt-4 flex justify-center">
                <button 
                  onClick={() => loadLogs(false)}
                  disabled={loading}
                  className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition shadow-lg disabled:opacity-50"
                >
                  {loading ? "Loading..." : "Load More Logs"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
