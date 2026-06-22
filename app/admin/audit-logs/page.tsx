"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Clock, Search, User, Activity } from "lucide-react";
import { graphqlClient } from "@/lib/graphql/client";
import { AUDIT_LOGS_QUERY } from "@/lib/graphql/queries";

import { logError } from "@/lib/logger";

type CategoryFilter = "all" | "payment" | "user" | "driver" | "system";
type SeverityFilter = "all" | "info" | "warning" | "critical";

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

const SEVERITY_BADGE: Record<string, string> = {
  info: "bg-blue-100 text-blue-700",
  warning: "bg-amber-100 text-amber-800",
  critical: "bg-red-100 text-red-800",
};

const CATEGORY_BADGE: Record<string, string> = {
  payment: "bg-primary-100 text-primary-700",
  user: "bg-violet-100 text-violet-700",
  driver: "bg-blue-100 text-blue-700",
  system: "bg-gray-100 text-gray-700",
};

function formatTs(ts: any) {
  if (!ts) return "—";
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("en-KE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [severity, setSeverity] = useState<SeverityFilter>("all");
  const [search, setSearch] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => { loadLogs(true); }, [category, severity]);

  async function loadLogs(reset = false) {
    setLoading(true);
    try {
      const result = await graphqlClient
        .query(AUDIT_LOGS_QUERY, {
          category: category !== "all" ? category : undefined,
          severity: severity !== "all" ? severity : undefined,
          limit: 30,
          cursor: reset ? undefined : cursor ?? undefined,
        })
        .toPromise();

      const data = result.data?.auditLogs;
      const items = data?.items ?? [];
      setLogs(reset ? items : (prev) => [...prev, ...items]);
      setCursor(data?.cursor ?? null);
      setHasMore(data?.hasMore ?? false);
    } catch (err: any) { logError("page", err); }
    finally { setLoading(false); }
  }

  function exportCsv() {
    const header = "Timestamp,Actor,Action,Category,Severity,Target";
    const rows = logs.map((l) => [formatTs(l.timestamp), l.actorEmail || l.actorUid, l.action, l.category || "", l.severity || "", l.targetId || ""].join(","));
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "audit_logs.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const displayed = search
    ? logs.filter((l) => l.actorEmail?.toLowerCase().includes(search.toLowerCase()) || l.action?.toLowerCase().includes(search.toLowerCase()) || l.targetId?.includes(search))
    : logs;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><ClipboardList size={24} className="text-primary-600" />Audit Logs</h1>
          <p className="text-gray-500 text-sm mt-1">Full history of all admin actions</p>
        </div>
        <button onClick={exportCsv} className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-bold rounded-xl transition">Export CSV</button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 space-y-3">
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs text-gray-400 self-center">Category:</span>
          {(["all", "payment", "user", "driver", "system"] as CategoryFilter[]).map((c) => (
            <button key={c} onClick={() => setCategory(c)} className={`px-3 py-1 rounded-lg text-xs font-medium transition ${category === c ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{c.charAt(0).toUpperCase() + c.slice(1)}</button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs text-gray-400 self-center">Severity:</span>
          {(["all", "info", "warning", "critical"] as SeverityFilter[]).map((s) => (
            <button key={s} onClick={() => setSeverity(s)} className={`px-3 py-1 rounded-lg text-xs font-medium transition ${severity === s ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
          ))}
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search actor email, action, target ID…" className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
      </div>

      {loading && logs.length === 0 ? (
        <div className="text-center py-20"><div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100"><Activity size={40} className="text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No audit logs found</p></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
          {displayed.map((log) => (
            <div key={log.id} className="p-4 flex items-start gap-4 hover:bg-gray-50 transition">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex-shrink-0 flex items-center justify-center text-primary-600 mt-0.5"><User size={14} /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900 text-sm">{log.action}</p>
                  {log.severity && <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${SEVERITY_BADGE[log.severity]}`}>{log.severity}</span>}
                  {log.category && <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${CATEGORY_BADGE[log.category] || "bg-gray-100 text-gray-600"}`}>{log.category}</span>}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  by <span className="font-medium text-gray-700">{log.actorEmail || log.actorUid || "system"}</span>
                  {log.targetId && <> · target: <span className="font-mono">{log.targetId}</span></>}
                </p>
                {log.description && <p className="text-xs text-gray-400 mt-0.5">{log.description}</p>}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                <Clock size={12} />{formatTs(log.timestamp)}
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && !search && (
        <div className="mt-6 flex justify-center">
          <button onClick={() => loadLogs(false)} disabled={loading} className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl transition disabled:opacity-50">{loading ? "Loading…" : "Load More"}</button>
        </div>
      )}
    </div>
  );
}
