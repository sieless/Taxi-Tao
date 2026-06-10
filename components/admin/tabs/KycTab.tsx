"use client";

import { useState, useEffect } from "react";
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  where 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  ShieldCheck, 
  CheckCircle, 
  XCircle, 
  Search, 
  Eye, 
  Phone, 
  Mail, 
  Car, 
  AlertTriangle,
  X,
  ExternalLink,
  Download,
  AlertCircle
} from "lucide-react";
import { useModal } from "@/lib/admin-modal-context";
import { 
  forceTokenRefresh, 
  approveDriverKYC, 
  rejectDriverKYC 
} from "@/lib/admin-service";
import { useAuth } from "@/lib/auth-context";
import { hasAdminPermission } from "@/lib/admin-permission-helper";


import { logError } from "@/lib/logger";interface DriverKyc {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  kycStatus?: "pending" | "approved" | "rejected";
  idNumber?: string;
  licenseNumber?: string;
  idFrontUrl?: string;
  idBackUrl?: string;
  licenseUrl?: string;
  profilePhotoUrl?: string;
  createdAt?: any;
  isDuplicate?: boolean;
}

const REJECTION_REASONS = [
  "Blurred Document: Photos are unclear or unreadable.",
  "Expired Document: License or ID has expired.",
  "Missing Back Side: Only front side of ID/License provided.",
  "Information Mismatch: Name or ID doesn't match account details.",
  "Invalid License Type: License doesn't allow commercial driving.",
  "Selfie Missing: Driver must provide a clear profile photo.",
  "Wrong Document: Uploaded a non-KYC document.",
  "Duplicate Entry: This driver or ID already exists.",
];

export default function KycTab() {
  const { user, userProfile } = useAuth();
  const modal = useModal();
  const [drivers, setDrivers] = useState<DriverKyc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<DriverKyc | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  
  const canManage = hasAdminPermission(userProfile, "manageDrivers");

  useEffect(() => {
    loadDrivers();
  }, [filter]);

  async function loadDrivers() {
    setLoading(true);
    try {
      // If filtering by pending, we fetch all and filter in memory to catch drivers with missing kycStatus field
      const fetchAll = filter === "pending" || filter === "all";
      
      let q = query(collection(db, "drivers"), orderBy("createdAt", "desc"), limit(100));
      if (!fetchAll) {
        q = query(collection(db, "drivers"), where("kycStatus", "==", filter), orderBy("createdAt", "desc"), limit(100));
      }
      
      const snap = await getDocs(q);
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() } as DriverKyc));
      
      // Memory filter for "pending" to catch missing fields
      if (filter === "pending") {
        list = list.filter(d => !d.kycStatus || d.kycStatus === "pending");
      }
      
      // Simple duplicate detection for UI
      const idSeen: Record<string, number> = {};
      list.forEach(d => { if (d.idNumber) idSeen[d.idNumber] = (idSeen[d.idNumber] || 0) + 1; });
      setDrivers(list.map(d => ({ ...d, isDuplicate: d.idNumber ? idSeen[d.idNumber] > 1 : false })));
    } catch (err) {
      logError("KycTab", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(driverId: string) {
    const ok = await modal.showConfirm("Approve this driver's KYC documents? They will be able to go online.", "Approve KYC", "Approve");
    if (!ok) return;
    setActing(driverId);
    try {
      await forceTokenRefresh();
      await approveDriverKYC(driverId, user?.uid || "admin");
      setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, kycStatus: "approved" } : d));
      modal.showAlert("KYC approved successfully", "success");
    } catch (err: any) {
      modal.showAlert(`Approval failed: ${err.message}`, "error");
    } finally {
      setActing(null);
    }
  }

  async function handleReject(driverId: string) {
    // Custom rejection modal logic with presets
    const reason = await modal.showPrompt(
      "Rejection Reason", 
      "Pick a preset or type a custom reason...", 
      "Reject KYC Documents",
      REJECTION_REASONS
    );
    if (!reason) return;

    setActing(driverId);
    try {
      await forceTokenRefresh();
      await rejectDriverKYC(driverId, user?.uid || "admin", reason);
      setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, kycStatus: "rejected" } : d));
      modal.showAlert("KYC rejected", "info");
    } catch (err: any) {
      modal.showAlert(`Rejection failed: ${err.message}`, "error");
    } finally {
      setActing(null);
    }
  }

  const filtered = drivers.filter(d => 
    d.name?.toLowerCase().includes(search.toLowerCase()) || 
    d.idNumber?.includes(search) ||
    d.phone?.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100">
          {["all", "approved", "pending", "rejected"].map((f) => (
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
            placeholder="Search by name, ID, or phone..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
          <ShieldCheck size={48} className="text-slate-200 mb-4" />
          <p className="text-slate-500 font-medium">No drivers found for verification</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((d) => (
            <div key={d.id} className={`bg-white rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md group ${d.isDuplicate ? "border-amber-200 bg-amber-50/10" : "border-slate-200"}`}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-200">
                  {d.profilePhotoUrl ? <img src={d.profilePhotoUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">{d.name.charAt(0)}</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 truncate">{d.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-md border
                      ${d.kycStatus === "approved" ? "bg-primary-50 text-primary-700 border-primary-100" : 
                        d.kycStatus === "rejected" ? "bg-rose-50 text-rose-700 border-rose-100" : 
                        "bg-amber-50 text-amber-700 border-amber-100"}
                    `}>
                      {d.kycStatus || "pending"}
                    </span>
                    {d.isDuplicate && (
                      <span className="flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-md">
                        <AlertTriangle size={10} /> DUP
                      </span>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => setSelected(d)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                >
                  <Eye size={18} />
                </button>
              </div>

              <div className="space-y-2 mb-5">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Phone size={14} className="text-slate-300" /> {d.phone || "No phone"}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <ShieldCheck size={14} className="text-slate-300" /> ID: {d.idNumber || "Not provided"}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Car size={14} className="text-slate-300" /> Lic: {d.licenseNumber || "Not provided"}
                </div>
              </div>

              {(d.kycStatus || "pending") === "pending" && canManage && (
                <div className="flex gap-2 pt-4 border-t border-slate-50">
                  <button 
                    onClick={() => handleApprove(d.id)}
                    disabled={acting === d.id}
                    className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle size={14} /> Approve
                  </button>
                  <button 
                    onClick={() => handleReject(d.id)}
                    disabled={acting === d.id}
                    className="flex-1 bg-white border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl my-8 relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-all"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col lg:flex-row h-full max-h-[85vh]">
              {/* Left Panel - Info */}
              <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-slate-100 p-8 overflow-y-auto">
                <div className="text-center mb-8">
                  <div className="w-24 h-24 bg-slate-100 rounded-3xl mx-auto mb-4 overflow-hidden border-4 border-white shadow-lg">
                    {selected.profilePhotoUrl ? <img src={selected.profilePhotoUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 text-3xl font-bold">{selected.name.charAt(0)}</div>}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{selected.name}</h2>
                  <p className="text-sm text-slate-500 mt-1">{selected.id}</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Verification Status</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border
                      ${selected.kycStatus === "approved" ? "bg-primary-50 text-primary-700 border-primary-100" : 
                        selected.kycStatus === "rejected" ? "bg-rose-50 text-rose-700 border-rose-100" : 
                        "bg-amber-50 text-amber-700 border-amber-100"}
                    `}>
                      {selected.kycStatus?.toUpperCase() || "PENDING"}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact Information</p>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400"><Mail size={14} /></div>
                      {selected.email || "No email provided"}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400"><Phone size={14} /></div>
                      {selected.phone || "No phone provided"}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identity Details</p>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">ID Number</p>
                      <p className="text-sm font-bold text-slate-700">{selected.idNumber || "—"}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">License Number</p>
                      <p className="text-sm font-bold text-slate-700">{selected.licenseNumber || "—"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel - Documents */}
              <div className="flex-1 p-8 bg-slate-50/50 overflow-y-auto">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Submitted Documents</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-500">National ID (Front)</p>
                    {selected.idFrontUrl ? (
                      <div className="relative group">
                        <img src={selected.idFrontUrl} className="w-full aspect-video object-cover rounded-2xl border border-slate-200 shadow-sm transition-all group-hover:shadow-md" alt="" />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-2xl">
                          <a href={selected.idFrontUrl} target="_blank" className="p-2 bg-white rounded-full text-slate-900 hover:scale-110 transition-transform"><ExternalLink size={18} /></a>
                          <button className="p-2 bg-white rounded-full text-slate-900 hover:scale-110 transition-transform"><Download size={18} /></button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full aspect-video bg-slate-100 border border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-400">
                        <AlertCircle size={24} className="mb-2" />
                        <span className="text-xs">Missing</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-500">National ID (Back)</p>
                    {selected.idBackUrl ? (
                      <div className="relative group">
                        <img src={selected.idBackUrl} className="w-full aspect-video object-cover rounded-2xl border border-slate-200 shadow-sm transition-all group-hover:shadow-md" alt="" />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-2xl">
                          <a href={selected.idBackUrl} target="_blank" className="p-2 bg-white rounded-full text-slate-900 hover:scale-110 transition-transform"><ExternalLink size={18} /></a>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full aspect-video bg-slate-100 border border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-400">
                        <AlertCircle size={24} className="mb-2" />
                        <span className="text-xs">Missing</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <p className="text-xs font-bold text-slate-500">Driving License</p>
                    {selected.licenseUrl ? (
                      <div className="relative group">
                        <img src={selected.licenseUrl} className="w-full aspect-[21/9] object-cover rounded-2xl border border-slate-200 shadow-sm transition-all group-hover:shadow-md" alt="" />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-2xl">
                          <a href={selected.licenseUrl} target="_blank" className="p-2 bg-white rounded-full text-slate-900 hover:scale-110 transition-transform"><ExternalLink size={18} /></a>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full aspect-[21/9] bg-slate-100 border border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-400">
                        <AlertCircle size={24} className="mb-2" />
                        <span className="text-xs">Missing</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 p-6 bg-amber-50 border border-amber-100 rounded-3xl flex gap-4">
                  <div className="p-2 bg-amber-100 rounded-xl text-amber-600 shrink-0 h-fit"><AlertTriangle size={20} /></div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-800">Review Guidelines</h4>
                    <p className="text-xs text-amber-700 leading-relaxed mt-1">
                      Ensure the ID name matches the registered profile name. Check for expiration dates and physical document integrity. Approving will grant immediate platform access.
                    </p>
                  </div>
                </div>

                {selected.kycStatus === "pending" && canManage && (
                  <div className="mt-8 flex gap-4">
                    <button 
                      onClick={() => handleApprove(selected.id)}
                      className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-4 rounded-2xl font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-primary-200"
                    >
                      <CheckCircle size={20} /> Approve All Documents
                    </button>
                    <button 
                      onClick={() => handleReject(selected.id)}
                      className="px-8 bg-white border-2 border-rose-100 text-rose-600 hover:bg-rose-50 hover:border-rose-200 rounded-2xl font-bold transition flex items-center justify-center gap-2"
                    >
                      <XCircle size={20} /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
