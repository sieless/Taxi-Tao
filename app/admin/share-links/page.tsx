"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { hasAdminPermission } from "@/lib/admin-permission-helper";
import { Link2, Copy, Trash2, ToggleLeft, ToggleRight, Search, ExternalLink } from "lucide-react";
import { useModal } from "@/lib/admin-modal-context";
import { graphqlClient } from "@/lib/graphql/client";
import { SHARE_LINKS_QUERY, TOGGLE_SHARE_LINK_MUTATION, DELETE_SHARE_LINK_MUTATION } from "@/lib/graphql/queries";

import { logError } from "@/lib/logger";

interface ShareLink {
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

function formatDate(ts: any) {
  if (!ts) return "—";
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ShareLinksPage() {
  const { userProfile } = useAuth();
  const modal = useModal();
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const canManage = hasAdminPermission(userProfile, "manageRides");

  useEffect(() => { loadLinks(); }, []);

  async function loadLinks() {
    setLoading(true);
    try {
      const result = await graphqlClient.query(SHARE_LINKS_QUERY, {}).toPromise();
      setLinks(result.data?.shareLinks ?? []);
    } catch (err) { logError("share-links-page", err); }
    finally { setLoading(false); }
  }

  async function toggleActive(link: ShareLink) {
    if (!canManage) { await modal.showAlert("Permission denied", "error"); return; }
    try {
      await graphqlClient.mutation(TOGGLE_SHARE_LINK_MUTATION, { id: link.id }).toPromise();
      setLinks((prev) => prev.map((l) => l.id === link.id ? { ...l, active: !l.active } : l));
    } catch (err: any) { logError("share-links-page toggle", err); await modal.showAlert(`Failed: ${err?.message}`, "error"); }
  }

  async function handleDelete(id: string) {
    if (!canManage) { await modal.showAlert("Permission denied", "error"); return; }
    const ok = await modal.showConfirm("Delete this share link?", "Delete Link", "Delete");
    if (!ok) return;
    try {
      await graphqlClient.mutation(DELETE_SHARE_LINK_MUTATION, { id }).toPromise();
      setLinks((prev) => prev.filter((l) => l.id !== id));
    } catch (err: any) { logError("share-links-page delete", err); await modal.showAlert(`Failed: ${err?.message}`, "error"); }
  }

  function copyLink(link: ShareLink) {
    const url = `https://taxitao.co.ke/ref/${link.code}`;
    navigator.clipboard.writeText(url);
    setCopied(link.id);
    setTimeout(() => setCopied(null), 2000);
  }

  const displayed = search
    ? links.filter((l) => l.code?.toLowerCase().includes(search.toLowerCase()) || l.driverName?.toLowerCase().includes(search.toLowerCase()))
    : links;

  const activeCount = links.filter((l) => l.active !== false).length;
  const totalClicks = links.reduce((a, l) => a + (l.clicks || 0), 0);
  const totalConversions = links.reduce((a, l) => a + (l.conversions || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Link2 size={24} className="text-primary-600" />Share Links</h1>
        <p className="text-gray-500 text-sm mt-1">Manage driver referral and profile share links</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Links", value: links.length },
          { label: "Active Links", value: activeCount },
          { label: "Total Clicks", value: totalClicks.toLocaleString() },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search code or driver name…" className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20"><div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100"><Link2 size={40} className="text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No share links found</p></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
          {displayed.map((link) => (
            <div key={link.id} className="p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="font-mono text-sm font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded">{link.code}</code>
                  {link.type && <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700 uppercase">{link.type}</span>}
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${link.active !== false ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-500"}`}>{link.active !== false ? "Active" : "Inactive"}</span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 flex-wrap">
                  {link.driverName && <span>Driver: {link.driverName}</span>}
                  <span>{(link.clicks || 0).toLocaleString()} clicks</span>
                  <span>{(link.conversions || 0)} conversions</span>
                  <span>Created {formatDate(link.createdAt)}</span>
                  {link.expiresAt && <span>Expires {formatDate(link.expiresAt)}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a href={`https://taxitao.co.ke/ref/${link.code}`} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition"><ExternalLink size={15} /></a>
                <button onClick={() => copyLink(link)} className={`p-2 rounded-lg transition ${copied === link.id ? "bg-primary-100 text-primary-700" : "bg-gray-100 hover:bg-gray-200 text-gray-500"}`}><Copy size={15} /></button>
                {canManage && (
                  <>
                    <button onClick={() => toggleActive(link)} className="p-2 rounded-lg bg-gray-100 hover:bg-primary-100 hover:text-primary-600 text-gray-500 transition">
                      {link.active !== false ? <ToggleRight size={17} className="text-primary-600" /> : <ToggleLeft size={17} />}
                    </button>
                    <button onClick={() => handleDelete(link.id)} className="p-2 rounded-lg bg-gray-100 hover:bg-red-100 hover:text-red-600 text-gray-400 transition"><Trash2 size={15} /></button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
