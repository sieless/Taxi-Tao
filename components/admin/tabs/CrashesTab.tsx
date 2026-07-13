"use client";

import { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  orderBy, 
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
  Search, 
  RefreshCw, 
  ChevronRight, 
  Smartphone, 
  Globe, 
  Terminal,
  Clock,
  Monitor,
  MapPin,
  User,
  Layers,
  Copy
} from "lucide-react";
import { useModal } from "@/lib/admin-modal-context";
import { useAuth } from "@/lib/auth-context";

interface AppCrash {
  id: string;
  message?: string;
  stack?: string;
  errorType?: string;
  errorName?: string;
  userId?: string;
  userRole?: string;
  platform?: "android" | "ios" | "web";
  appVersion?: string;
  osVersion?: string;
  deviceModel?: string;
  buildNumber?: string;
  screen?: string;
  userAction?: string;
  componentStack?: string;
  sessionId?: string;
  severity?: "low" | "medium" | "high" | "critical";
  isFatal?: boolean;
  resolved?: boolean;
  resolvedBy?: string;
  resolvedAt?: any;
  timestamp: any;
  count?: number;
  category?: string;
}

const CATEGORY_STYLES: Record<string, string> = {
  payment: "bg-rose-100 text-rose-700 border-rose-200",
  booking: "bg-blue-100 text-blue-700 border-blue-200",
  auth: "bg-purple-100 text-purple-700 border-purple-200",
  network: "bg-orange-100 text-orange-700 border-orange-200",
  ui: "bg-slate-100 text-slate-600 border-slate-200",
};

const CATEGORY_LABELS: Record<string, string> = {
  payment: "Payment",
  booking: "Booking/Ride",
  auth: "Auth",
  network: "Network",
  ui: "UI/Other",
};

function categorizeCrash(crash: AppCrash): string {
  const msg = (crash.message || "").toLowerCase();
  const screen = (crash.screen || "").toLowerCase();
  const action = (crash.userAction || "").toLowerCase();

  if (
    msg.includes("payment") || msg.includes("mpesa") || msg.includes("transaction") ||
    screen.includes("payment") || action.includes("payment")
  ) return "payment";
  if (
    msg.includes("booking") || msg.includes("ride") || msg.includes("driver") ||
    screen.includes("book") || screen.includes("ride") ||
    action.includes("booking") || action.includes("ride")
  ) return "booking";
  if (
    msg.includes("auth") || msg.includes("session") || msg.includes("login") || msg.includes("signup")
  ) return "auth";
  if (
    msg.includes("network") || msg.includes("fetch") || msg.includes("timeout") || msg.includes("connection")
  ) return "network";
  return "ui";
}

export default function CrashesTab() {
  const { user } = useAuth();
  const modal = useModal();
  const [crashes, setCrashes] = useState<AppCrash[]>([]);
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState<string>("all");
  const [platform, setPlatform] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [resolvedStatus, setResolvedStatus] = useState<string>("open");
  const [search, setSearch] = useState("");
  const [resolving, setResolving] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, COLLECTIONS.APP_CRASHES), orderBy("timestamp", "desc"), limit(200));
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

  function copyForAI(crash: AppCrash) {
    const timestamp = crash.timestamp?.toDate?.()?.toISOString() || "N/A";
    const text = `## Crash Report
- **Error**: ${crash.errorName || crash.errorType || "Unknown"}: ${crash.message}
- **Screen**: ${crash.screen || "N/A"}
- **User action**: ${crash.userAction || "N/A"}
- **Device**: ${crash.platform} ${crash.osVersion}, ${crash.deviceModel}, App v${crash.appVersion}
- **User role**: ${crash.userRole || "N/A"}
- **Session**: ${crash.sessionId || "N/A"}
- **Timestamp**: ${timestamp}
- **Fatal**: ${crash.isFatal ? "Yes" : "No"}
- **Severity**: ${crash.severity}

## Stack Trace
\`\`\`
${crash.stack || "No stack trace available"}
\`\`\`

## Component Stack
\`\`\`
${crash.componentStack || "No component stack"}
\`\`\`

## What I need
Fix the crash described above. Trace the error path, identify the root cause, and propose a fix.`;

    navigator.clipboard.writeText(text);
    modal.showAlert("Copied! Paste into your AI agent.", "success");
  }

  const filtered = crashes.filter(c => {
    const matchSev = severity === "all" || c.severity === severity;
    const matchRes = resolvedStatus === "all" || (resolvedStatus === "open" ? !c.resolved : !!c.resolved);
    const matchPlat = platform === "all" || c.platform === platform;
    const matchCat = category === "all" || categorizeCrash(c) === category;
    const matchSearch = !search || 
                      c.message?.toLowerCase().includes(search.toLowerCase()) || 
                      c.userId?.includes(search) || 
                      c.appVersion?.includes(search) ||
                      c.screen?.toLowerCase().includes(search.toLowerCase()) ||
                      c.userAction?.toLowerCase().includes(search.toLowerCase()) ||
                      c.deviceModel?.toLowerCase().includes(search.toLowerCase());
    return matchSev && matchRes && matchPlat && matchCat && matchSearch;
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

  const platformCounts = {
    all: crashes.length,
    web: crashes.filter(c => c.platform === "web").length,
    android: crashes.filter(c => c.platform === "android").length,
    ios: crashes.filter(c => c.platform === "ios").length,
  };

  const categoryCounts = {
    all: crashes.length,
    payment: crashes.filter(c => categorizeCrash(c) === "payment").length,
    booking: crashes.filter(c => categorizeCrash(c) === "booking").length,
    auth: crashes.filter(c => categorizeCrash(c) === "auth").length,
    network: crashes.filter(c => categorizeCrash(c) === "network").length,
    ui: crashes.filter(c => categorizeCrash(c) === "ui").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Web Crashes</p>
          <p className="text-2xl font-bold text-blue-600">{platformCounts.web}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Mobile Crashes</p>
          <p className="text-2xl font-bold text-violet-600">{platformCounts.android + platformCounts.ios}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        {/* Row 1: Status + Severity */}
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

        {/* Row 2: Platform */}
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">Platform:</span>
          {(["all", "web", "android", "ios"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all
                ${platform === p ? "bg-white text-indigo-600 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"}
              `}
            >
              {p === "web" && <Globe size={10} />}
              {p === "android" && <Smartphone size={10} />}
              {p === "ios" && <Smartphone size={10} />}
              {p === "all" && <Layers size={10} />}
              {p}
              <span className="text-[9px] opacity-60">({platformCounts[p]})</span>
            </button>
          ))}
        </div>

        {/* Row 3: Category */}
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">Category:</span>
          {(["all", "payment", "booking", "auth", "network", "ui"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all
                ${category === cat ? "bg-white text-indigo-600 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"}
              `}
            >
              {cat === "all" ? "All" : CATEGORY_LABELS[cat] || cat}
              <span className="text-[9px] opacity-60">({categoryCounts[cat]})</span>
            </button>
          ))}
        </div>

        {/* Row 4: Search */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input 
            type="text" 
            placeholder="Search errors, screens, user actions, device models..." 
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
          filtered.map((crash) => {
            const cat = categorizeCrash(crash);
            return (
              <div 
                key={crash.id} 
                className={`bg-white rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md 
                  ${crash.severity === "critical" && !crash.resolved ? "border-rose-200 bg-rose-50/5" : "border-slate-200"}
                `}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-xl mt-1 ${crash.resolved ? "bg-primary-50 text-primary-600" : crash.severity === "critical" ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-400"}`}>
                    {crash.resolved ? <CheckCircle size={20} /> : <Bug size={20} />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {/* Badges Row */}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-md border ${getSeverityStyle(crash.severity || "low")}`}>
                        {crash.severity || "LOW"}
                        {crash.isFatal && " / Fatal"}
                      </span>
                      <span className="flex items-center gap-1 text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                        {crash.platform === "web" ? <Globe size={10} /> : <Smartphone size={10} />}
                        {crash.platform?.toUpperCase() || "UNKNOWN"}
                      </span>
                      <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-md border ${CATEGORY_STYLES[cat]}`}>
                        {CATEGORY_LABELS[cat] || cat}
                      </span>
                      {crash.appVersion && <span className="text-[10px] text-slate-400 font-mono">v{crash.appVersion}</span>}
                      {crash.count && crash.count > 1 && (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">x{crash.count}</span>
                      )}
                      {crash.resolved && (
                        <span className="px-2 py-0.5 text-[9px] font-bold text-green-700 bg-green-50 rounded-md border border-green-200">RESOLVED</span>
                      )}
                    </div>

                    {/* Error Message */}
                    <h3 className="text-sm font-bold text-slate-900 mb-1 leading-snug line-clamp-2">{crash.message || "Generic Application Error"}</h3>

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <Clock size={12} />
                        {crash.timestamp?.toDate ? crash.timestamp.toDate().toLocaleString() : "—"}
                      </div>
                      {crash.userId && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <User size={12} />
                          {crash.userId.slice(0, 12)}...
                        </div>
                      )}
                      {crash.userRole && (
                        <span className="text-[10px] text-slate-400 capitalize">{crash.userRole}</span>
                      )}
                      {crash.screen && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <MapPin size={12} />
                          {crash.screen}
                        </div>
                      )}
                      {crash.deviceModel && crash.deviceModel !== "unknown" && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <Monitor size={12} />
                          {crash.deviceModel}
                          {crash.osVersion && crash.osVersion !== "unknown" && ` (${crash.osVersion})`}
                        </div>
                      )}
                    </div>

                    {/* User Action */}
                    {crash.userAction && (
                      <div className="mt-2 text-[10px] text-slate-500 bg-slate-50 rounded-lg px-2 py-1 inline-block">
                        Action: {crash.userAction}
                      </div>
                    )}

                    {/* Stack Trace */}
                    {crash.stack && (
                      <div className="mt-3">
                        <details className="group">
                          <summary className="text-[10px] font-bold text-indigo-600 cursor-pointer hover:text-indigo-700 flex items-center gap-1 outline-none">
                            <ChevronRight size={12} className="group-open:rotate-90 transition-transform" />
                            Stack Trace
                          </summary>
                          <pre className="mt-2 p-4 bg-slate-900 text-slate-300 rounded-xl text-[10px] font-mono overflow-x-auto whitespace-pre-wrap max-h-64 scrollbar-thin scrollbar-thumb-slate-700">
                            {crash.stack}
                          </pre>
                        </details>
                      </div>
                    )}

                    {/* Component Stack */}
                    {crash.componentStack && (
                      <div className="mt-2">
                        <details className="group">
                          <summary className="text-[10px] font-bold text-slate-500 cursor-pointer hover:text-slate-700 flex items-center gap-1 outline-none">
                            <ChevronRight size={12} className="group-open:rotate-90 transition-transform" />
                            Component Stack
                          </summary>
                          <pre className="mt-2 p-4 bg-slate-800 text-slate-400 rounded-xl text-[10px] font-mono overflow-x-auto whitespace-pre-wrap max-h-48 scrollbar-thin scrollbar-thumb-slate-700">
                            {crash.componentStack}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => copyForAI(crash)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                      title="Copy crash context for AI debugging"
                    >
                      <Copy size={12} />
                      Copy AI
                    </button>
                    {!crash.resolved && (
                      <button 
                        onClick={() => handleResolve(crash.id)}
                        disabled={resolving === crash.id}
                        className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-primary-100 disabled:opacity-50"
                      >
                        {resolving === crash.id ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
