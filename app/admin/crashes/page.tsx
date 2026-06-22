"use client";

import { useEffect, useState } from "react";
import { useModal } from "@/lib/admin-modal-context";
import { Bug, CheckCircle, AlertTriangle, Search, RefreshCw } from "lucide-react";
import { graphqlClient } from "@/lib/graphql/client";
import { APP_CRASHES_QUERY, RESOLVE_CRASH_MUTATION } from "@/lib/graphql/queries";

import { logError } from "@/lib/logger";

type SeverityFilter = "all" | "low" | "medium" | "high" | "critical";
type ResolvedFilter = "open" | "resolved" | "all";

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

const SEV_BADGE: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-800",
};

function formatDate(ts: any) {
  if (!ts) return "—";
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("en-KE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function CrashesPage() {
  const modal = useModal();
  const [crashes, setCrashes] = useState<AppCrash[]>([]);
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState<SeverityFilter>("all");
  const [resolved, setResolved] = useState<ResolvedFilter>("open");
  const [search, setSearch] = useState("");
  const [resolving, setResolving] = useState<string | null>(null);

  useEffect(() => { loadCrashes(); }, []);

  async function loadCrashes() {
    setLoading(true);
    try {
      const result = await graphqlClient.query(APP_CRASHES_QUERY, {}).toPromise();
      setCrashes(result.data?.appCrashes ?? []);
    } catch (err) { logError("crashes-page", err); }
    finally { setLoading(false); }
  }

  async function markResolved(id: string) {
    setResolving(id);
    try {
      await graphqlClient.mutation(RESOLVE_CRASH_MUTATION, { id }).toPromise();
      setCrashes((prev) => prev.map((c) => c.id === id ? { ...c, resolved: true } : c));
    } catch (err: any) { logError("crashes-page resolve", err); await modal.showAlert(`Failed: ${err?.message}`, "error"); }
    finally { setResolving(null); }
  }

  const filtered = crashes.filter((c) => {
    const matchSev = severity === "all" || c.severity === severity;
    const matchRes = resolved === "all" || (resolved === "open" ? !c.resolved : !!c.resolved);
    const matchSearch = !search || c.message?.toLowerCase().includes(search.toLowerCase()) || c.userId?.includes(search) || c.appVersion?.includes(search);
    return matchSev && matchRes && matchSearch;
  });

  const counts = {
    open: crashes.filter((c) => !c.resolved).length,
    critical: crashes.filter((c) => c.severity === "critical" && !c.resolved).length,
    resolved: crashes.filter((c) => c.resolved).length,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Bug size={24} className="text-primary-600" />Crash Reports</h1>
          <p className="text-gray-500 text-sm mt-1">Monitor and resolve app errors</p>
        </div>
        <button onClick={loadCrashes} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl transition"><RefreshCw size={15} className={loading ? "animate-spin" : ""} />Refresh</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Open Crashes", value: counts.open, color: "text-red-600 bg-red-50" },
          { label: "Critical (open)", value: counts.critical, color: "text-orange-600 bg-orange-50" },
          { label: "Resolved", value: counts.resolved, color: "text-primary-600 bg-primary-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <p className={`text-2xl font-bold ${s.color.split(" ")[0]}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 space-y-3">
        <div className="flex gap-2 flex-wrap">
          {(["open", "all", "resolved"] as ResolvedFilter[]).map((r) => (
            <button key={r} onClick={() => setResolved(r)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${resolved === r ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{r.charAt(0).toUpperCase() + r.slice(1)}</button>
          ))}
          <div className="w-px bg-gray-200 mx-1 self-stretch" />
          {(["all", "critical", "high", "medium", "low"] as SeverityFilter[]).map((s) => (
            <button key={s} onClick={() => setSeverity(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${severity === s ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
          ))}
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search error message, user ID, version…" className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20"><div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100"><Bug size={40} className="text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No crashes found</p></div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((crash) => (
            <div key={crash.id} className={`bg-white rounded-xl shadow-sm border p-4 ${crash.severity === "critical" && !crash.resolved ? "border-red-300" : "border-gray-100"}`}>
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg mt-0.5 ${crash.resolved ? "bg-primary-50" : crash.severity === "critical" ? "bg-red-50" : "bg-gray-50"}`}>
                  {crash.resolved ? <CheckCircle size={18} className="text-primary-600" /> : <AlertTriangle size={18} className={crash.severity === "critical" ? "text-red-600" : "text-amber-600"} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {crash.severity && <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${SEV_BADGE[crash.severity]}`}>{crash.severity.toUpperCase()}</span>}
                    {crash.platform && <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700">{crash.platform}</span>}
                    {crash.appVersion && <span className="text-xs text-gray-400">v{crash.appVersion}</span>}
                    {crash.count && crash.count > 1 && <span className="text-xs text-gray-500">×{crash.count} occurrences</span>}
                    {crash.resolved && <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-primary-100 text-primary-700">RESOLVED</span>}
                  </div>
                  <p className="text-sm font-medium text-gray-800 mb-1 line-clamp-2">{crash.message || "Unknown error"}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    {crash.userId && <span>User: {crash.userId}</span>}
                    <span>{formatDate(crash.timestamp)}</span>
                  </div>
                  {crash.stack && (
                    <details className="mt-2">
                      <summary className="text-xs text-primary-600 cursor-pointer hover:underline">Show stack trace</summary>
                      <pre className="text-[10px] text-gray-600 bg-gray-50 rounded-lg p-3 mt-1 overflow-x-auto whitespace-pre-wrap">{crash.stack}</pre>
                    </details>
                  )}
                </div>
                {!crash.resolved && (
                  <button onClick={() => markResolved(crash.id)} disabled={resolving === crash.id} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-50">
                    {resolving === crash.id ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle size={13} />}Resolve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
