"use client";

import { useEffect, useState } from "react";
import { doc, updateDoc, where, writeBatch, serverTimestamp, collection, query, getDocs } from "firebase/firestore";
import { db, functions } from "@/lib/firebase";
import { httpsCallable } from "firebase/functions";
import { useAuth } from "@/lib/auth-context";
import { Building2, Search, CheckCircle, XCircle, Phone, Mail, MapPin, Users, Trash2, Briefcase, MessageSquare, X } from "lucide-react";
import { useModal } from "@/lib/admin-modal-context";
import { graphqlClient } from "@/lib/graphql/client";
import { ADMIN_COMPANIES_QUERY, UPDATE_COMPANY_STATUS_MUTATION, TOGGLE_CORPORATE_MUTATION } from "@/lib/graphql/queries";

import { logError } from "@/lib/logger";

type CompanyStatus = "all" | "pending" | "active" | "suspended";

interface Company {
  id: string;
  name: string;
  contactEmail?: string;
  contactPhone?: string;
  location?: string;
  status?: "pending" | "active" | "suspended";
  isCorporate?: boolean;
  subscriptionTier?: string;
  driverCount?: number;
  vehicleCount?: number;
  subscriptionStatus?: string;
  createdAt?: any;
}

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  active: "bg-primary-100 text-primary-800",
  suspended: "bg-red-100 text-red-800",
};

function formatDate(ts: any) {
  if (!ts) return "—";
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" });
}

export default function CompaniesPage() {
  const { user, userProfile } = useAuth();
  const modal = useModal();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<CompanyStatus>("all");
  const [search, setSearch] = useState("");
  const [acting, setActing] = useState<string | null>(null);
  const [messagingCompany, setMessagingCompany] = useState<any | null>(null);
  const [messageText, setMessageText] = useState("");

  useEffect(() => { loadCompanies(); }, []);

  async function loadCompanies() {
    setLoading(true);
    try {
      const result = await graphqlClient.query(ADMIN_COMPANIES_QUERY, {}).toPromise();
      setCompanies(result.data?.adminCompanies ?? []);
    } catch (err) { logError("companies-page", err); }
    finally { setLoading(false); }
  }

  async function setStatus(company: Company, newStatus: "active" | "suspended" | "pending") {
    const ok = await modal.showConfirm(`Set ${company.name} status to ${newStatus}?`, "Change Company Status", "Change");
    if (!ok) return;
    setActing(company.id);
    try {
      await graphqlClient.mutation(UPDATE_COMPANY_STATUS_MUTATION, { id: company.id, status: newStatus }).toPromise();
      setCompanies((prev) => prev.map((c) => c.id === company.id ? { ...c, status: newStatus } : c));
    } catch (err: any) { logError("companies-page setStatus", err); await modal.showAlert(`Failed: ${err?.message}`, "error"); }
    finally { setActing(null); }
  }
  
  async function purgeCompany(company: Company) {
    const ok = await modal.showConfirm(
      `CRITICAL: This will permanently delete ${company.name} and their LOGIN account. This cannot be undone. Proceed?`,
      "Full System Purge",
      "Delete Forever"
    );
    if (!ok) return;
    
    setActing(company.id);
    try {
      const purgeFn = httpsCallable(functions, "adminPurgeCompany");
      await purgeFn({ companyId: company.id });
      
      await modal.showAlert("Company and login account purged successfully.", "success");
      setCompanies((prev) => prev.filter((c) => c.id !== company.id));
    } catch (err: any) {
      logError("companies-page purgeCompany", err);
      await modal.showAlert(`Purge failed: ${err?.message || "Internal error"}`, "error");
    } finally {
      setActing(null);
    }
  }

  async function toggleCorporate(company: Company) {
    const newStatus = !company.isCorporate;
    const ok = await modal.showConfirm(
      newStatus ? `Elevate ${company.name} to Corporate Status?` : `Revoke Corporate Status from ${company.name}?`,
      newStatus ? "Elevate Partner" : "Revoke Privilege",
      newStatus ? "Elevate" : "Revoke"
    );
    if (!ok) return;
    setActing(company.id);
    try {
      await graphqlClient.mutation(TOGGLE_CORPORATE_MUTATION, { id: company.id, isCorporate: newStatus }).toPromise();
      setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, isCorporate: newStatus } : c));
      modal.showAlert(`Corporate status ${newStatus ? "granted" : "revoked"} successfully`, "success");
    } catch (err: any) {
      logError("companies-page toggleCorporate", err);
      modal.showAlert(`Update failed: ${err?.message || "Internal error"}`, "error");
    } finally {
      setActing(null);
    }
  }

  const filtered = companies.filter((c) => {
    const matchFilter = filter === "all" || (c.status || "pending") === filter;
    const matchSearch = !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.contactEmail?.toLowerCase().includes(search.toLowerCase()) || c.location?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = {
    all: companies.length,
    pending: companies.filter((c) => !c.status || c.status === "pending").length,
    active: companies.filter((c) => c.status === "active").length,
    suspended: companies.filter((c) => c.status === "suspended").length,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Building2 size={24} className="text-primary-600" />Companies</h1>
        <p className="text-gray-500 text-sm mt-1">Corporate fleet and partner company registry</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {(["all", "pending", "active", "suspended"] as CompanyStatus[]).map((k) => (
          <div key={k} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 text-center">
            <p className="text-2xl font-bold text-gray-900">{counts[k]}</p>
            <p className="text-xs text-gray-500 capitalize">{k}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2">
          {(["all", "pending", "active", "suspended"] as CompanyStatus[]).map((t) => (
            <button key={t} onClick={() => setFilter(t)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filter === t ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
          ))}
        </div>
        <div className="relative ml-auto w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Company name, email, location…" className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20"><div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100"><Building2 size={40} className="text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No companies found</p></div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((company) => (
            <div key={company.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex-shrink-0 flex items-center justify-center text-primary-700 font-bold">{company.name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-900">{company.name}</p>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${STATUS_BADGE[company.status || "pending"]}`}>{company.status || "pending"}</span>
                    {company.isCorporate && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                        <Briefcase size={10} /> Corporate
                      </span>
                    )}
                    {company.subscriptionTier && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-800">
                        {company.subscriptionTier}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                    {company.contactEmail && <span className="flex items-center gap-1"><Mail size={11} />{company.contactEmail}</span>}
                    {company.contactPhone && <span className="flex items-center gap-1"><Phone size={11} />{company.contactPhone}</span>}
                    {company.location && <span className="flex items-center gap-1"><MapPin size={11} />{company.location}</span>}
                    {company.driverCount != null && <span className="flex items-center gap-1"><Users size={11} />{company.driverCount} drivers</span>}
                    <span>Joined {formatDate(company.createdAt)}</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {(company.status || "pending") !== "active" && (
                    <button onClick={() => setStatus(company, "active")} disabled={acting === company.id} className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-50"><CheckCircle size={13} />Approve</button>
                  )}
                  {(company.status || "pending") !== "suspended" && (
                    <button onClick={() => setStatus(company, "suspended")} disabled={acting === company.id} className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition disabled:opacity-50"><XCircle size={13} />Suspend</button>
                  )}
                  <button onClick={() => toggleCorporate(company)} disabled={acting === company.id} className={`flex items-center justify-center w-9 h-9 rounded-xl transition disabled:opacity-50 border border-gray-100 ${company.isCorporate ? "bg-amber-50 hover:bg-amber-100 text-amber-600" : "bg-gray-50 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600"}`} title={company.isCorporate ? "Revoke Corporate" : "Elevate to Corporate"}>
                    <Briefcase size={15} />
                  </button>
                  <button onClick={() => { setMessagingCompany(company); }} className="flex items-center justify-center w-9 h-9 bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-xl transition border border-gray-100" title="Send Message">
                    <MessageSquare size={15} />
                  </button>
                  <button onClick={() => purgeCompany(company)} disabled={acting === company.id} className="flex items-center justify-center w-9 h-9 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl transition disabled:opacity-50 border border-gray-100"><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Messaging Modal */}
      {messagingCompany && (
        <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => { setMessagingCompany(null); setMessageText(""); }}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-xl transition"
            >
              <X size={20} className="text-gray-400" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Send Message</h3>
                <p className="text-xs text-gray-500">To {messagingCompany.name}</p>
              </div>
            </div>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message to this company..."
              className="w-full h-32 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setMessagingCompany(null); setMessageText(""); }}
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!messageText.trim()) return;
                  navigator.clipboard.writeText(`Message for ${messagingCompany.name}:\n\n${messageText}`);
                  modal.showAlert("Message copied to clipboard (email integration coming soon)", "info");
                  setMessagingCompany(null);
                  setMessageText("");
                }}
                disabled={!messageText.trim()}
                className="flex-1 py-3 bg-primary-600 text-white font-bold rounded-xl text-sm hover:bg-primary-700 transition disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
