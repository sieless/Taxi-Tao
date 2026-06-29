"use client";

import { useState, useEffect } from "react";
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  limit 
} from "firebase/firestore";
import { db, functions } from "@/lib/firebase";
import { httpsCallable } from "firebase/functions";
import { 
  Building2, 
  Search, 
  CheckCircle, 
  XCircle, 
  Phone, 
  Mail, 
  MapPin, 
  Users, 
  Car, 
  ArrowUpRight,
  TrendingUp,
  MoreVertical,
  Briefcase,
  Copy,
  Trash2,
  Eye,
  X,
  FileText,
  MessageSquare
} from "lucide-react";
import { useModal } from "@/lib/admin-modal-context";
import { 
  forceTokenRefresh,
  approveCompany,
  rejectCompany,
  toggleCorporateStatus
} from "@/lib/admin-service";
import { useAuth } from "@/lib/auth-context";


import { logError } from "@/lib/logger";interface Company {
  id: string;
  name: string;
  contactEmail?: string;
  contactPhone?: string;
  location?: string;
  officeLocation?: {
    address?: string;
  };
  status?: "pending" | "active" | "suspended";
  isCorporate?: boolean;
  driverCount?: number;
  vehicleCount?: number;
  stats?: {
    driverCount?: number;
    fleetCount?: number;
  };
  permitUrls?: string[];
  yardImageUrl?: string;
  paymentDetails?: {
    bankName?: string;
    accountNumber?: string;
    mpesaTill?: string;
    mpesaPaybill?: string;
  };
  email?: string;
  phone?: string;
  createdAt?: any;
}

export default function CompaniesTab() {
  const { user } = useAuth();
  const modal = useModal();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
  const [messagingCompany, setMessagingCompany] = useState<any | null>(null);
  const [messageText, setMessageText] = useState("");

  useEffect(() => {
    loadCompanies();
  }, [filter]);

  async function loadCompanies() {
    setLoading(true);
    try {
      const q = query(collection(db, "companies"), orderBy("createdAt", "desc"), limit(50));
      const snap = await getDocs(q);
      setCompanies(snap.docs.map(d => ({ id: d.id, ...d.data() } as Company)));
    } catch (err) {
      logError("CompaniesTab", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(company: Company, newStatus: "active" | "suspended") {
    const ok = await modal.showConfirm(`Update ${company.name} status to ${newStatus}?`, "Confirm Status Change", "Update");
    if (!ok) return;
    setActing(company.id);
    try {
      if (newStatus === "active") {
        await approveCompany(company.id, user?.uid || "admin");
      } else if (newStatus === "suspended") {
        await updateDoc(doc(db, "companies", company.id), { 
          status: newStatus, 
          updatedAt: new Date(),
          updatedBy: user?.uid 
        });
      }
      setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, status: newStatus } : c));
      if (selectedCompany?.id === company.id) {
        setSelectedCompany({ ...selectedCompany, status: newStatus });
      }
      modal.showAlert(`Company ${newStatus} successfully`, "success");
    } catch (err: any) {
      modal.showAlert(`Update failed: ${err.message}`, "error");
    } finally {
      setActing(null);
    }
  }

  async function handleToggleCorporate(company: Company) {
    const newStatus = !company.isCorporate;
    const ok = await modal.showConfirm(
      newStatus 
        ? `Elevate ${company.name} to Corporate Status? This grants them Executive Tier visibility.` 
        : `Revoke Corporate Status from ${company.name}?`,
      newStatus ? "Elevate Partner" : "Revoke Privilege",
      newStatus ? "Elevate" : "Revoke"
    );
    if (!ok) return;
    
    setActing(company.id);
    try {
      await toggleCorporateStatus(company.id, newStatus, user?.uid || "admin");
      setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, isCorporate: newStatus } : c));
      modal.showAlert(`Corporate status ${newStatus ? "granted" : "revoked"} successfully`, "success");
    } catch (err: any) {
      modal.showAlert(`Update failed: ${err.message}`, "error");
    } finally {
      setActing(null);
      setActiveMenu(null);
    }
  }

  async function handleDeleteCompany(company: Company) {
    const ok = await modal.showConfirm(
      `Permanently delete ${company.name} and ALL associated data (vehicles, staff, bookings, auth accounts)? This action cannot be undone.`,
      "Delete Company Forever",
      "Delete Forever"
    );
    if (!ok) return;
    setActing(company.id);
    try {
      const purgeFn = httpsCallable(functions, "adminPurgeCompany");
      await purgeFn({ companyId: company.id });
      setCompanies(prev => prev.filter(c => c.id !== company.id));
      modal.showAlert("Company and all associated data purged successfully", "success");
    } catch (err: any) {
      modal.showAlert(`Deletion failed: ${err?.message || "Internal error"}`, "error");
    } finally {
      setActing(null);
      setActiveMenu(null);
    }
  }

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    modal.showAlert("Company ID copied", "info");
    setActiveMenu(null);
  };

  const filtered = companies.filter(c => {
    const matchSearch = c.name?.toLowerCase().includes(search.toLowerCase()) || 
                      c.contactEmail?.toLowerCase().includes(search.toLowerCase()) ||
                      c.location?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || (c.status || "pending") === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
            <Building2 size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Registered Companies</p>
            <p className="text-3xl font-bold text-slate-900">{companies.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6">
          <div className="w-14 h-14 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Active Partners</p>
            <p className="text-3xl font-bold text-slate-900">{companies.filter(c => c.status === "active").length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6">
          <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
            <Briefcase size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Pending Approvals</p>
            <p className="text-3xl font-bold text-slate-900">{companies.filter(c => !c.status || c.status === "pending").length}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100">
          {["all", "pending", "active", "suspended"].map((f) => (
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
            placeholder="Search company or location..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
          <Building2 size={48} className="text-slate-200 mb-4" />
          <p className="text-slate-500 font-medium">No companies found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
          {filtered.map((company) => (
            <div key={company.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4">
                <button 
                  onClick={() => setActiveMenu(activeMenu === company.id ? null : company.id)}
                  className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors"
                >
                  <MoreVertical size={18} />
                </button>

                {activeMenu === company.id && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                    <div className="absolute right-6 top-12 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                      <button 
                        onClick={() => copyId(company.id)}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <Copy size={14} /> Copy Company ID
                      </button>
                      <button 
                        onClick={() => handleToggleCorporate(company)}
                        disabled={acting === company.id}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors font-bold
                          ${company.isCorporate ? "text-amber-600 hover:bg-amber-50" : "text-indigo-600 hover:bg-indigo-50"}
                        `}
                      >
                        <Briefcase size={14} /> {company.isCorporate ? "Revoke Corporate" : "Elevate to Corporate"}
                      </button>
                      <button 
                        onClick={() => { setMessagingCompany(company); setActiveMenu(null); }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors font-bold"
                      >
                        <MessageSquare size={14} /> Send Message
                      </button>
                      <div className="h-px bg-slate-50 my-1" />
                      <button 
                        onClick={() => handleDeleteCompany(company)}
                        disabled={acting === company.id}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors font-bold"
                      >
                        <Trash2 size={14} /> Delete Partner
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-bold text-xl border border-slate-200 overflow-hidden shadow-sm">
                  {(company as any).logoUrl ? (
                    <img src={(company as any).logoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    company.name?.charAt(0)
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{company.name}</h3>
                    {company.isCorporate && (
                      <div className="text-amber-600 flex items-center" title="Corporate Executive Partner">
                        <Briefcase size={18} fill="currentColor" fillOpacity={0.2} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border
                      ${company.status === "active" ? "bg-primary-50 text-primary-700 border-primary-100" : 
                        company.status === "suspended" ? "bg-rose-50 text-rose-700 border-rose-100" : 
                        "bg-amber-50 text-amber-700 border-amber-100"}
                    `}>
                      {company.status || "pending"}
                    </span>
                    {company.isCorporate && (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-amber-50 text-amber-700 border border-amber-100">
                        Corporate
                      </span>
                    )}
                    {(company as any).subscriptionTier && (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {(company as any).subscriptionTier}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-mono">{company.id}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-6">
               <div className="flex items-center gap-3 text-sm text-slate-600">
                   <Mail size={16} className="text-slate-300" /> {company.contactEmail || "No email"}
               </div>
               <div className="flex items-center gap-3 text-sm text-slate-600">
                   <Phone size={16} className="text-slate-300" /> {company.contactPhone || "No phone"}
               </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <MapPin size={16} className="text-slate-300" /> {company.officeLocation?.address || company.location || "Location not set"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Drivers</p>
                  <p className="text-lg font-bold text-slate-800">{company.stats?.driverCount || company.driverCount || 0}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Vehicles</p>
                  <p className="text-lg font-bold text-slate-800">{company.stats?.fleetCount || company.vehicleCount || 0}</p>
                </div>
              </div>

              <div className="flex gap-2">
                {company.status !== "active" && (
                  <button 
                    onClick={() => handleStatusChange(company, "active")}
                    disabled={acting === company.id}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={16} /> Approve
                  </button>
                )}
                {company.status !== "suspended" && (
                  <button 
                    onClick={() => handleStatusChange(company, "suspended")}
                    disabled={acting === company.id}
                    className="flex-1 bg-white border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"
                  >
                    <XCircle size={16} /> Suspend
                  </button>
                )}
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('changeAdminTab', { detail: { tab: 'car-hire', search: company.name } }))}
                  className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-400 transition"
                  title="View Company Fleet"
                >
                  <ArrowUpRight size={20} />
                </button>
                <button 
                  onClick={() => setSelectedCompany(company)}
                  className="p-2.5 bg-indigo-50 hover:bg-indigo-100 rounded-xl text-indigo-600 transition"
                  title="Review Company Documents"
                >
                  <Eye size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl my-8 relative animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center shadow-sm overflow-hidden">
                  {selectedCompany.logoUrl ? (
                    <img src={selectedCompany.logoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="text-slate-300" size={24} />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedCompany.name}</h2>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Partner Review & Audit</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCompany(null)}
                className="p-2 bg-white hover:bg-slate-100 text-slate-400 rounded-full transition-all border border-slate-200 shadow-sm"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: General Info */}
                <div className="space-y-8">
                  <section>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Identity & Status</h3>
                    <div className="space-y-3">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Company Status</p>
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border
                          ${selectedCompany.status === "active" ? "bg-primary-50 text-primary-700 border-primary-100" : 
                            selectedCompany.status === "suspended" ? "bg-rose-50 text-rose-700 border-rose-100" : 
                            "bg-amber-50 text-amber-700 border-amber-100"}
                        `}>
                          {selectedCompany.status || "pending"}
                        </span>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Registered Since</p>
                        <p className="text-sm font-bold text-slate-700">{new Date(selectedCompany.createdAt?.seconds * 1000).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Contact Details</h3>
                    <div className="space-y-3">
                       <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl text-sm text-slate-600">
                         <Mail size={16} className="text-slate-300" /> {selectedCompany.contactEmail || "No email"}
                       </div>
                      <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl text-sm text-slate-600">
                        <Phone size={16} className="text-slate-300" /> {selectedCompany.phone || selectedCompany.contactPhone || "No phone"}
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl text-sm text-slate-600">
                        <MapPin size={16} className="text-slate-300" /> {selectedCompany.officeLocation?.address || selectedCompany.location || "No address"}
                      </div>
                    </div>
                  </section>
                </div>

                {/* Middle: Documents */}
                <div className="lg:col-span-2 space-y-8">
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Legal Documentation</h3>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                        {selectedCompany.permitUrls?.length || 0} Files
                      </span>
                    </div>
                    
                    {selectedCompany.permitUrls && selectedCompany.permitUrls.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedCompany.permitUrls.map((url: string, idx: number) => (
                          <div key={idx} className="group relative bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 aspect-video flex items-center justify-center shadow-sm">
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2 z-10 p-4">
                              <a 
                                href={url} 
                                target="_blank" 
                                className="bg-white text-slate-900 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                              >
                                <Eye size={14} /> View
                              </a>
                            </div>
                            {url.toLowerCase().includes('.pdf') ? (
                              <div className="flex flex-col items-center gap-2 text-slate-400">
                                <FileText size={32} />
                                <p className="text-[10px] font-bold">Document #{idx + 1}</p>
                              </div>
                            ) : (
                              <img src={url} className="w-full h-full object-cover" alt={`Doc ${idx + 1}`} />
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-12 bg-rose-50 border-2 border-dashed border-rose-100 rounded-3xl flex flex-col items-center justify-center text-rose-400">
                        <XCircle size={40} className="mb-2" />
                        <p className="text-sm font-bold uppercase tracking-widest">No Documents Uploaded</p>
                      </div>
                    )}
                  </section>

                  {/* Office Anchor / Yard Image */}
                  <section>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Office Anchor (Yard Image)</h3>
                    {selectedCompany.yardImageUrl ? (
                      <div className="group relative bg-slate-50 rounded-3xl overflow-hidden border border-slate-200 aspect-[21/9] flex items-center justify-center shadow-sm">
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center z-10">
                          <a 
                            href={selectedCompany.yardImageUrl} 
                            target="_blank" 
                            className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                          >
                            <MapPin size={18} /> View Full Location Image
                          </a>
                        </div>
                        <img src={selectedCompany.yardImageUrl} className="w-full h-full object-cover" alt="Yard Anchor" />
                      </div>
                    ) : (
                      <div className="p-8 bg-amber-50 border border-dashed border-amber-200 rounded-3xl flex flex-col items-center justify-center text-amber-500">
                        <MapPin size={32} className="mb-2" />
                        <p className="text-xs font-bold uppercase tracking-widest">Yard Photo Missing</p>
                      </div>
                    )}
                  </section>

                  <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Bank Payout Info</h3>
                      <div className="p-5 bg-white border border-slate-200 rounded-3xl space-y-3 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><Building2 size={16} /></div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Bank Name</p>
                            <p className="text-sm font-bold text-slate-800">{selectedCompany.paymentDetails?.bankName || "—"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><Copy size={16} /></div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Account</p>
                            <p className="text-sm font-bold text-slate-800">{selectedCompany.paymentDetails?.accountNumber || "—"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">M-Pesa Business Info</h3>
                      <div className="p-5 bg-white border border-slate-200 rounded-3xl space-y-3 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center font-bold text-xs">T</div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Till Number</p>
                            <p className="text-sm font-bold text-slate-800">{selectedCompany.paymentDetails?.mpesaTill || "—"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center font-bold text-xs">P</div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Paybill</p>
                            <p className="text-sm font-bold text-slate-800">{selectedCompany.paymentDetails?.mpesaPaybill || "—"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex gap-4">
              {selectedCompany.status !== "active" && (
                <button 
                  onClick={() => {
                    handleStatusChange(selectedCompany, "active");
                  }}
                  disabled={acting === selectedCompany.id}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold transition flex items-center justify-center gap-3 shadow-lg shadow-indigo-200 disabled:opacity-50"
                >
                  <CheckCircle size={20} /> Approve & Activate Partner
                </button>
              )}
              {selectedCompany.status !== "suspended" && (
                <button 
                  onClick={() => handleStatusChange(selectedCompany, "suspended")}
                  disabled={acting === selectedCompany.id}
                  className="flex-1 bg-white border-2 border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 py-4 rounded-2xl font-bold transition flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  <XCircle size={20} /> Suspend Partner
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messaging Modal */}
      {messagingCompany && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => { setMessagingCompany(null); setMessageText(""); }}
              className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-xl transition"
            >
              <X size={20} className="text-slate-400" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Send Message</h3>
                <p className="text-xs text-slate-500">To {messagingCompany.name}</p>
              </div>
            </div>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message to this company..."
              className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setMessagingCompany(null); setMessageText(""); }}
                className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-200 transition"
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
                className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 transition disabled:opacity-50"
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
