"use client";

import { useState, useEffect } from "react";
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  doc, 
  deleteDoc, 
  updateDoc, 
  limit 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/firestore-constants";
import { 
  Link2, 
  Copy, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  Search, 
  ExternalLink,
  MousePointer2,
  TrendingUp,
  Filter,
  CheckCircle2,
  Clock,
  MoreVertical,
  Plus
} from "lucide-react";
import { useModal } from "@/lib/admin-modal-context";
import { useAuth } from "@/lib/auth-context";
import { hasAdminPermission } from "@/lib/admin-permission-helper";


import { logError } from "@/lib/logger";interface ShareLink {
  id: string;
  code: string;
  driverId?: string;
  driverName?: string;
  type?: "referral" | "profile" | "campaign";
  active?: boolean;
  clicks?: number;
  conversions?: number;
  createdAt?: any;
  expiresAt?: any;
}

export default function ShareLinksTab() {
  const { userProfile } = useAuth();
  const modal = useModal();
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  
  const canManage = hasAdminPermission(userProfile, "manageRides");

  useEffect(() => {
    loadLinks();
  }, []);

  async function loadLinks() {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, COLLECTIONS.SHARE_LINKS), orderBy("createdAt", "desc"), limit(50)));
      setLinks(snap.docs.map(d => ({ id: d.id, ...d.data() } as ShareLink)));
    } catch (err) {
      logError("ShareLinksTab", err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(link: ShareLink) {
    if (!canManage) return;
    try {
      await updateDoc(doc(db, COLLECTIONS.SHARE_LINKS, link.id), { active: !link.active });
      setLinks(prev => prev.map(l => l.id === link.id ? { ...l, active: !l.active } : l));
    } catch (err: any) {
      modal.showAlert(`Failed: ${err.message}`, "error");
    }
  }

  async function handleDelete(id: string) {
    if (!canManage) return;
    const ok = await modal.showConfirm("Permanently delete this share link?", "Delete Link", "Delete");
    if (!ok) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.SHARE_LINKS, id));
      setLinks(prev => prev.filter(l => l.id !== id));
      modal.showAlert("Link deleted", "success");
    } catch (err: any) {
      modal.showAlert(`Failed: ${err.message}`, "error");
    }
  }

  function copyLink(link: ShareLink) {
    const url = `https://taxitao.co.ke/ref/${link.code}`;
    navigator.clipboard.writeText(url);
    setCopied(link.id);
    setTimeout(() => setCopied(null), 2000);
  }

  const filtered = links.filter(l => 
    l.code?.toLowerCase().includes(search.toLowerCase()) || 
    l.driverName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
            <Link2 size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Active Links</p>
            <p className="text-3xl font-bold text-slate-900">{links.filter(l => l.active !== false).length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6">
          <div className="w-14 h-14 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center">
            <MousePointer2 size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Total Clicks</p>
            <p className="text-3xl font-bold text-slate-900">{links.reduce((a, b) => a + (b.clicks || 0), 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Conversions</p>
            <p className="text-3xl font-bold text-slate-900">{links.reduce((a, b) => a + (b.conversions || 0), 0)}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search code or driver..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
          />
        </div>
        
        {canManage && (
          <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition shadow-lg shadow-indigo-100">
            <Plus size={16} /> Create Link
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Link Code</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Performance</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Target</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No share links found</td>
                </tr>
              ) : (
                filtered.map((link) => (
                  <tr key={link.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <code className="font-mono text-sm font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                          {link.code}
                        </code>
                        {link.type && (
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{link.type}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-6">
                        <div>
                          <p className="text-xs font-bold text-slate-700">{link.clicks || 0}</p>
                          <p className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">Clicks</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700">{link.conversions || 0}</p>
                          <p className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">Conv.</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <p className="text-sm font-bold text-slate-700">{link.driverName || "Platform Wide"}</p>
                        <p className="text-[10px] text-slate-400">Created: {link.createdAt?.toDate ? link.createdAt.toDate().toLocaleDateString() : "—"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => toggleActive(link)}
                        className={`flex items-center gap-2 text-xs font-bold transition-colors
                          ${link.active !== false ? "text-primary-600" : "text-slate-400"}
                        `}
                      >
                        {link.active !== false ? <ToggleRight size={24} className="text-primary-500" /> : <ToggleLeft size={24} />}
                        {link.active !== false ? "Active" : "Paused"}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => copyLink(link)}
                          className={`p-2 rounded-lg transition-colors ${copied === link.id ? "bg-primary-50 text-primary-600" : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"}`}
                        >
                          <Copy size={16} />
                        </button>
                        <a 
                          href={`https://taxitao.co.ke/ref/${link.code}`}
                          target="_blank"
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <ExternalLink size={16} />
                        </a>
                        {canManage && (
                          <button 
                            onClick={() => handleDelete(link.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
