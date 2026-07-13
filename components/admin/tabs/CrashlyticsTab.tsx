"use client";

import { useState, useEffect } from "react";
import {
  Bug,
  RefreshCw,
  Search,
  ChevronRight,
  Smartphone,
  Clock,
  Users,
  Activity,
  ExternalLink,
  Copy,
  CheckCircle,
  MapPin,
  Monitor,
  User,
  Terminal,
  Globe,
} from "lucide-react";

interface CrashlyticsIssue {
  name: string;
  title: string;
  subtitle: string;
  appVersion: string;
  firstOccurrenceTime: string;
  latestOccurrenceTime: string;
  state: string;
  type: string;
  userCount: string;
  eventCount: string;
  crashlyticsType: string;
  userId?: string;
  userRole?: string;
  userEmail?: string;
  screen?: string;
  userAction?: string;
  osVersion?: string;
  deviceModel?: string;
  sessionId?: string;
  isFatal?: boolean;
  severity?: "low" | "medium" | "high" | "critical";
  platform?: string;
  buildNumber?: string;
  resolved?: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
}

interface CrashDetails {
  id: string;
  errorMessage?: string;
  errorStack?: string;
  errorType?: string;
  errorName?: string;
  screen?: string;
  userAction?: string;
  componentStack?: string;
  userId?: string;
  userRole?: string;
  userEmail?: string;
  platform?: string;
  osVersion?: string;
  deviceModel?: string;
  appVersion?: string;
  buildNumber?: string;
  sessionId?: string;
  timestamp?: string;
  isFatal?: boolean;
  severity?: "low" | "medium" | "high" | "critical";
  resolved?: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
}

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-KE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function extractIssueId(name: string) {
  const parts = name.split("/");
  return parts[parts.length - 1] || name;
}

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-rose-100 text-rose-700 border-rose-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function CrashlyticsTab() {
  const [issues, setIssues] = useState<CrashlyticsIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<"open" | "closed" | "all">("open");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [crashDetails, setCrashDetails] = useState<CrashDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchIssues = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ action: "issues", state });
      const res = await fetch(`/api/admin/crashlytics?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setIssues(data.issues || []);
    } catch (err: any) {
      setError(err.message || "Failed to load Crashlytics data");
    } finally {
      setLoading(false);
    }
  };

  const fetchCrashDetails = async (issueId: string) => {
    setDetailsLoading(true);
    try {
      const params = new URLSearchParams({ action: "details", issueId });
      const res = await fetch(`/api/admin/crashlytics?${params}`);
      const data = await res.json();
      if (res.ok && data.details) {
        setCrashDetails(data.details);
      }
    } catch {
      // silently fail, issue summary still visible
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [state]);

  const toggleExpand = (issueId: string) => {
    if (expandedId === issueId) {
      setExpandedId(null);
      setCrashDetails(null);
    } else {
      setExpandedId(issueId);
      setCrashDetails(null);
      fetchCrashDetails(issueId);
    }
  };

  const copyForAI = (issue: CrashlyticsIssue, details: CrashDetails | null) => {
    const ts = details?.timestamp || issue.latestOccurrenceTime || "N/A";
    const stack = details?.errorStack || issue.subtitle || "No stack trace available";
    const componentStack = details?.componentStack || "No component stack available";

    const text = `## Crash Report
- **Error**: ${issue.type || details?.errorName || details?.errorType || "Unknown"}: ${issue.title}
- **Screen**: ${issue.screen || details?.screen || "N/A"}
- **User action**: ${issue.userAction || details?.userAction || "N/A"}
- **Device**: ${issue.platform || details?.platform || "unknown"} ${issue.osVersion || details?.osVersion || ""}, ${issue.deviceModel || details?.deviceModel || "unknown"}, App v${issue.appVersion || details?.appVersion || "?"}${issue.buildNumber || details?.buildNumber ? ` (build ${issue.buildNumber || details?.buildNumber})` : ""}
- **User role**: ${issue.userRole || details?.userRole || "N/A"}
- **Session**: ${issue.sessionId || details?.sessionId || "N/A"}
- **Timestamp**: ${ts}
- **Fatal**: ${issue.isFatal || details?.isFatal ? "Yes" : "No"}
- **Severity**: ${issue.severity || details?.severity || "unknown"}
- **Crash ID**: ${extractIssueId(issue.name)}
- **Event count**: ${issue.eventCount}
- **Affected users**: ${issue.userCount}

## Stack Trace
\`\`\`
${stack}
\`\`\`

## Component Stack
\`\`\`
${componentStack}
\`\`\`

## What I need
Analyze the crash described above. Trace the error path from the stack trace, identify the root cause, and propose a fix. Consider the device info, screen, and user action context.`;

    navigator.clipboard.writeText(text);
    setCopiedId(extractIssueId(issue.name));
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = issues.filter((issue) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      issue.title?.toLowerCase().includes(q) ||
      issue.subtitle?.toLowerCase().includes(q) ||
      issue.appVersion?.toLowerCase().includes(q) ||
      issue.screen?.toLowerCase().includes(q) ||
      issue.deviceModel?.toLowerCase().includes(q)
    );
  });

  const openCount = issues.filter((i) => i.state === "open").length;
  const closedCount = issues.filter((i) => i.state === "closed").length;
  const totalUsers = issues.reduce((sum, i) => sum + (parseInt(i.userCount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Activity size={20} className="text-indigo-600" />
            Crash Reports
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Native mobile + web crashes from app_crashes collection
          </p>
        </div>
        <button
          onClick={fetchIssues}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Open Issues</p>
          <p className="text-2xl font-bold text-rose-600">{openCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Closed Issues</p>
          <p className="text-2xl font-bold text-green-600">{closedCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Users Affected</p>
          <p className="text-2xl font-bold text-slate-900">{totalUsers}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex gap-1 p-1 bg-slate-50 rounded-xl border border-slate-100">
          {["open", "closed", "all"].map((s) => (
            <button
              key={s}
              onClick={() => setState(s as typeof state)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all
                ${state === s ? "bg-white text-indigo-600 shadow-sm border border-slate-200" : "text-slate-400"}
              `}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Search issues, screens, devices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
            <RefreshCw className="animate-spin text-indigo-500" size={32} />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-red-300">
            <Bug size={48} className="text-red-300 mb-4" />
            <p className="text-red-500 font-medium mb-2">{error}</p>
            <p className="text-xs text-slate-400">
              Make sure FIREBASE_ADMIN credentials are configured and the Crashlytics API is enabled.
            </p>
            <button
              onClick={fetchIssues}
              className="mt-4 px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-xl hover:bg-red-100 transition"
            >
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <Bug size={48} className="text-slate-200 mb-4" />
            <p className="text-slate-500 font-medium">No crash reports found</p>
            <p className="text-xs text-slate-400 mt-1">
              {state === "open" ? "All issues are resolved!" : "No issues match your filters."}
            </p>
          </div>
        ) : (
          filtered.map((issue) => {
            const issueId = extractIssueId(issue.name);
            const isExpanded = expandedId === issueId;
            const isCopied = copiedId === issueId;
            return (
              <div
                key={issueId}
                className={`bg-white rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md
                  ${issue.state === "open" ? "border-rose-200 bg-rose-50/30" : "border-slate-200"}
                `}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-xl mt-1 ${issue.state === "open" ? "bg-rose-50 text-rose-600" : "bg-green-50 text-green-600"}`}>
                    <Bug size={20} />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Badges Row */}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-md border ${
                          issue.state === "open"
                            ? "bg-rose-100 text-rose-700 border-rose-200"
                            : "bg-green-100 text-green-700 border-green-200"
                        }`}
                      >
                        {issue.state}
                      </span>
                      {issue.isFatal && (
                        <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-md border bg-red-100 text-red-700 border-red-200">
                          FATAL
                        </span>
                      )}
                      {issue.severity && (
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-md border ${SEVERITY_STYLES[issue.severity] || SEVERITY_STYLES.low}`}>
                          {issue.severity}
                        </span>
                      )}
                      {issue.platform && (
                        <span className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                          {issue.platform === "web" ? <Globe size={10} /> : <Smartphone size={10} />}
                          {issue.platform}
                        </span>
                      )}
                      {issue.appVersion && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          v{issue.appVersion}
                        </span>
                      )}
                    </div>

                    {/* Error Message */}
                    <h3 className="text-sm font-bold text-slate-900 mb-1 leading-snug">
                      {issue.title || "Unknown Issue"}
                    </h3>
                    {issue.subtitle && (
                      <p className="text-xs text-slate-500 mb-2 line-clamp-2 font-mono">{issue.subtitle}</p>
                    )}

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <Users size={12} />
                        {issue.userCount || "0"} users
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <Activity size={12} />
                        {issue.eventCount || "0"} events
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <Clock size={12} />
                        First: {formatDate(issue.firstOccurrenceTime)}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <Clock size={12} />
                        Latest: {formatDate(issue.latestOccurrenceTime)}
                      </div>
                    </div>

                    {/* Context Info (visible even when collapsed) */}
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      {issue.screen && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <MapPin size={12} />
                          {issue.screen}
                        </div>
                      )}
                      {issue.deviceModel && issue.deviceModel !== "unknown" && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <Monitor size={12} />
                          {issue.deviceModel}
                          {issue.osVersion && ` (${issue.osVersion})`}
                        </div>
                      )}
                      {issue.userRole && (
                        <span className="text-[10px] text-slate-400 capitalize">{issue.userRole}</span>
                      )}
                    </div>

                    {/* Expand for details */}
                    <div className="mt-3">
                      <button
                        onClick={() => toggleExpand(issueId)}
                        className="text-[10px] font-bold text-indigo-600 cursor-pointer hover:text-indigo-700 flex items-center gap-1"
                      >
                        <ChevronRight
                          size={12}
                          className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}
                        />
                        {isExpanded ? "Hide Details" : "Show Details"}
                      </button>

                      {isExpanded && (
                        <div className="mt-3 space-y-3">
                          {/* Loading state */}
                          {detailsLoading && (
                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                              <RefreshCw size={12} className="animate-spin" />
                              Loading full crash details...
                            </div>
                          )}

                          {/* Basic Issue Info */}
                          <div className="p-3 bg-slate-50 rounded-xl text-[10px] font-mono text-slate-600 space-y-1">
                            <p><strong>Crash ID:</strong> {issueId}</p>
                            <p><strong>Type:</strong> {issue.crashlyticsType || issue.type || "—"}</p>
                            <p><strong>Platform:</strong> {issue.platform || "—"}</p>
                            <p><strong>Version:</strong> {issue.appVersion || "—"}{issue.buildNumber ? ` (build ${issue.buildNumber})` : ""}</p>
                            <p><strong>State:</strong> {issue.state}</p>
                            <p><strong>Severity:</strong> {issue.severity || "—"}</p>
                            <p><strong>Fatal:</strong> {issue.isFatal ? "Yes" : "No"}</p>
                            {issue.sessionId && <p><strong>Session:</strong> {issue.sessionId}</p>}
                            {issue.userId && (
                              <p><strong>User ID:</strong> {issue.userId.slice(0, 16)}...</p>
                            )}
                          </div>

                          {/* Full Stack Trace */}
                          {crashDetails?.errorStack && (
                            <div>
                              <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold text-slate-500">
                                <Terminal size={12} />
                                Stack Trace
                              </div>
                              <pre className="p-4 bg-slate-900 text-slate-300 rounded-xl text-[10px] font-mono overflow-x-auto whitespace-pre-wrap max-h-64 scrollbar-thin scrollbar-thumb-slate-700">
                                {crashDetails.errorStack}
                              </pre>
                            </div>
                          )}

                          {/* Component Stack */}
                          {crashDetails?.componentStack && (
                            <div>
                              <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold text-slate-500">
                                <Terminal size={12} />
                                Component Stack
                              </div>
                              <pre className="p-4 bg-slate-800 text-slate-400 rounded-xl text-[10px] font-mono overflow-x-auto whitespace-pre-wrap max-h-48 scrollbar-thin scrollbar-thumb-slate-700">
                                {crashDetails.componentStack}
                              </pre>
                            </div>
                          )}

                          {/* Device & User Context */}
                          {crashDetails && (
                            <div className="p-3 bg-slate-50 rounded-xl text-[10px] font-mono text-slate-600 space-y-1">
                              <div className="flex items-center gap-1 mb-1 text-slate-500 font-bold not-italic">
                                <Monitor size={12} /> Device & Context
                              </div>
                              <p><strong>Screen:</strong> {crashDetails.screen || "—"}</p>
                              {crashDetails.userAction && (
                                <p><strong>User action:</strong> {crashDetails.userAction}</p>
                              )}
                              <p><strong>OS:</strong> {crashDetails.osVersion || "—"}</p>
                              <p><strong>Device:</strong> {crashDetails.deviceModel || "—"}</p>
                              <p><strong>Timestamp:</strong> {formatDate(crashDetails.timestamp || "")}</p>
                              {crashDetails.resolved && (
                                <>
                                  <p><strong>Resolved:</strong> Yes</p>
                                  {crashDetails.resolvedAt && (
                                    <p><strong>Resolved at:</strong> {formatDate(crashDetails.resolvedAt)}</p>
                                  )}
                                </>
                              )}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() => copyForAI(issue, crashDetails)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                              title="Copy crash context for AI debugging"
                            >
                              {isCopied ? <CheckCircle size={12} className="text-green-600" /> : <Copy size={12} />}
                              {isCopied ? "Copied!" : "Copy for AI"}
                            </button>
                            <a
                              href={`https://console.firebase.google.com/project/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/crashlytics/issues/${issueId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-2 text-indigo-600 hover:text-indigo-700 text-xs font-bold rounded-xl bg-indigo-50 hover:bg-indigo-100 transition"
                            >
                              <ExternalLink size={12} />
                              Open in Firebase Console
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Copy button (always visible) */}
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => copyForAI(issue, crashDetails)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                      title="Copy crash context for AI debugging"
                    >
                      {isCopied ? <CheckCircle size={12} className="text-green-600" /> : <Copy size={12} />}
                      {isCopied ? "Copied!" : "Copy AI"}
                    </button>
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
