"use client";

import { useState, useEffect } from "react";
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  where,
  doc,
  updateDoc,
  addDoc,
  Timestamp,
  onSnapshot
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  MessageSquare, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  User, 
  Send, 
  Filter,
  ArrowLeft,
  RefreshCw,
  MoreVertical,
  Flag
} from "lucide-react";
import { useModal } from "@/lib/admin-modal-context";
import { useAuth } from "@/lib/auth-context";

interface IssueReply {
  id: string;
  adminId: string;
  adminName: string;
  message: string;
  createdAt: any;
}

interface Issue {
  id: string;
  userId: string;
  userName?: string;
  userType: "customer" | "driver";
  subject: string;
  description: string;
  status: "open" | "pending" | "resolved" | "closed";
  createdAt: any;
  updatedAt: any;
  replies?: IssueReply[];
}

export default function IssuesTab() {
  const { user, userProfile } = useAuth();
  const modal = useModal();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("open");
  const [search, setSearch] = useState("");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "issues"), 
      orderBy("createdAt", "desc"), 
      limit(50)
    );
    
    const unsub = onSnapshot(q, (snap) => {
      setIssues(snap.docs.map(d => ({ id: d.id, ...d.data() } as Issue)));
      setLoading(false);
    });

    return () => unsub();
  }, []);

  async function handleSendReply() {
    if (!selectedIssue || !replyText.trim()) return;
    setSending(true);
    try {
      // 1. Add reply to subcollection
      const repliesRef = collection(db, "issues", selectedIssue.id, "replies");
      await addDoc(repliesRef, {
        adminId: user?.uid,
        adminName: userProfile?.name || "Admin",
        message: replyText,
        createdAt: Timestamp.now()
      });

      // 2. Update issue status to pending (waiting for user)
      await updateDoc(doc(db, "issues", selectedIssue.id), {
        status: "pending",
        updatedAt: Timestamp.now()
      });

      setReplyText("");
      modal.showAlert("Reply sent successfully", "success");
    } catch (err: any) {
      modal.showAlert(`Failed: ${err.message}`, "error");
    } finally {
      setSending(false);
    }
  }

  async function handleResolve(issueId: string) {
    const ok = await modal.showConfirm("Mark this issue as resolved?", "Resolve Issue", "Resolve");
    if (!ok) return;
    try {
      await updateDoc(doc(db, "issues", issueId), {
        status: "resolved",
        updatedAt: Timestamp.now()
      });
      modal.showAlert("Issue resolved", "success");
      if (selectedIssue?.id === issueId) {
        setSelectedIssue(prev => prev ? { ...prev, status: "resolved" } : null);
      }
    } catch (err: any) {
      modal.showAlert(`Failed: ${err.message}`, "error");
    }
  }

  const filtered = issues.filter(i => {
    const matchSearch = i.subject?.toLowerCase().includes(search.toLowerCase()) || 
                      i.description?.toLowerCase().includes(search.toLowerCase()) ||
                      i.userName?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || i.status === filter;
    return matchSearch && matchFilter;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      open: "bg-rose-100 text-rose-700 border-rose-200",
      pending: "bg-amber-100 text-amber-700 border-amber-200",
      resolved: "bg-primary-100 text-primary-700 border-primary-200",
      closed: "bg-slate-100 text-slate-600 border-slate-200",
    };
    return styles[status] || styles.open;
  };

  if (selectedIssue) {
    return (
      <div className="space-y-6 animate-in slide-in-from-right duration-300">
        {/* Back Button */}
        <button 
          onClick={() => setSelectedIssue(null)}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-bold text-sm"
        >
          <ArrowLeft size={16} /> Back to Issues
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Thread */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-100">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                      <Flag size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{selectedIssue.subject}</h2>
                      <p className="text-xs text-slate-400 mt-1">Issue ID: {selectedIssue.id}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(selectedIssue.status)}`}>
                    {selectedIssue.status.toUpperCase()}
                  </span>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{selectedIssue.description}</p>
                </div>
              </div>

              {/* Reply Area */}
              <div className="p-8 bg-slate-50/30">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Send Response</h3>
                <textarea 
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your response to the user..."
                  className="w-full h-32 p-4 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none mb-4"
                />
                <div className="flex justify-between items-center">
                  <button 
                    onClick={() => handleResolve(selectedIssue.id)}
                    className="text-primary-600 hover:bg-primary-50 px-4 py-2 rounded-xl text-sm font-bold transition"
                  >
                    Mark as Resolved
                  </button>
                  <button 
                    onClick={handleSendReply}
                    disabled={sending || !replyText.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-100 disabled:opacity-50"
                  >
                    {sending ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                    Send Reply
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* User Info Sidebar */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Reporter Information</h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-bold">
                  {selectedIssue.userName?.charAt(0) || <User size={20} />}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{selectedIssue.userName || "User"}</p>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">
                    {selectedIssue.userType}
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">User ID</span>
                  <span className="text-slate-700 font-mono">{selectedIssue.userId}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Created</span>
                  <span className="text-slate-700">{selectedIssue.createdAt?.toDate().toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100">
          {["open", "pending", "resolved", "all"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all
                ${filter === f 
                  ? "bg-white text-indigo-600 shadow-sm border border-slate-200" 
                  : "text-slate-400 hover:text-slate-600"}
              `}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search by subject or user..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
            <RefreshCw className="animate-spin text-indigo-500" size={32} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <MessageSquare size={48} className="text-slate-200 mb-4" />
            <p className="text-slate-500 font-medium">No support issues found</p>
          </div>
        ) : (
          filtered.map((issue) => (
            <div 
              key={issue.id} 
              onClick={() => setSelectedIssue(issue)}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-md border ${getStatusBadge(issue.status)}`}>
                      {issue.status}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {issue.createdAt?.toDate ? issue.createdAt.toDate().toLocaleString() : "Just now"}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-1 group-hover:text-indigo-600 transition-colors">{issue.subject}</h3>
                  <p className="text-sm text-slate-500 line-clamp-1">{issue.description}</p>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-800">{issue.userName || "User"}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-tighter">{issue.userType}</p>
                    </div>
                    <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                      <User size={16} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
