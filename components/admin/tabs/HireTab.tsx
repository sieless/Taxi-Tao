"use client";

import { useState, useEffect } from "react";
import { 
  collection,
  query,
  onSnapshot,
  orderBy, 
  limit, 
  where,
  serverTimestamp,
  updateDoc,
  doc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  Car, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  AlertTriangle, 
  User, 
  MessageSquare,
  RefreshCw,
  Phone,
  Briefcase,
  Shield,
  Building2,
  FileText,
  ExternalLink,
  Zap,
  CreditCard,
  Wallet,
  MapPin,
  Image as ImageIcon
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useModal } from "@/lib/admin-modal-context";
import { 
  verifyDriverPayment, 
  rejectDriverPayment,
  approveCompany,
  rejectCompany,
  forceReleaseVehicle,
  recordCompanyPayment,
  syncCompanySubscriptionAndInvoice,
  COMPANY_SUBSCRIPTION_TIERS
} from "@/lib/admin-service";
import { useAuth } from "@/lib/auth-context";
import { hasAdminPermission } from "@/lib/admin-permission-helper";


import { logError } from "@/lib/logger";type SubTab = "vetting" | "fleet" | "payments" | "active-hires" | "company-subs";

interface PaymentCardProps {
  p: any;
  acting: string | null;
  onVerify: (p: any) => void;
  onReject: (p: any) => void;
}

export default function HireTab() {
  const { userProfile, user } = useAuth();
  const modal = useModal();
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("vetting");
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [vettingFilter, setVettingFilter] = useState<string>("all");
  
  const searchParams = useSearchParams();
  const search = searchParams.get("search") || "";
  const [paymentFilter, setPaymentFilter] = useState<string>("pending");

  const [companies, setCompanies] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [hires, setHires] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);

  useEffect(() => {
    let unsub: () => void = () => {};
    setLoading(true);

    try {
      if (activeSubTab === "vetting") {
        const q = query(collection(db, "companies"), orderBy("updatedAt", "desc"), limit(50));
        unsub = onSnapshot(q, (snap) => {
          setCompanies(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          setLoading(false);
        }, (err) => {
          logError("HireTab", err);
          setLoading(false);
        });
      } else if (activeSubTab === "fleet") {
        const q = query(collection(db, "vehicles"), orderBy("updatedAt", "desc"), limit(100));
        unsub = onSnapshot(q, (snap) => {
          setVehicles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          setLoading(false);
        }, (err) => {
          logError("HireTab", err);
          setLoading(false);
        });
      } else if (activeSubTab === "payments") {
        let q = query(
          collection(db, "paymentVerifications"), 
          orderBy("submittedAt", "desc"), 
          limit(50)
        );
        
        if (paymentFilter !== "all") {
          q = query(
            collection(db, "paymentVerifications"), 
            where("status", "==", paymentFilter),
            orderBy("submittedAt", "desc"), 
            limit(50)
          );
        }

        unsub = onSnapshot(q, (snap) => {
          const allPayments = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setPayments(allPayments.filter((p: any) => p.serviceType === "hire"));
          setLoading(false);
        }, (err) => {
          logError("HireTab", err);
          setLoading(false);
        });
      } else if (activeSubTab === "company-subs") {
        const q = query(collection(db, "companies"), where("status", "==", "active"), orderBy("updatedAt", "desc"), limit(50));
        unsub = onSnapshot(q, (snap) => {
          setCompanies(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          setLoading(false);
        }, (err) => {
          logError("HireTab", err);
          setLoading(false);
        });
      }
    } catch (err: any) {
      logError("HireTab", err);
      modal.showAlert(`Sync failed: ${err.message}`, "error");
      setLoading(false);
    }

    return () => unsub();
  }, [activeSubTab, paymentFilter]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleApproveCompany = async (company: any) => {
    const ok = await modal.showConfirm(`Approve ${company.name}? This will grant them active status.`, "Approve Company", "Approve");
    if (!ok) return;
    setActing(company.id);
    try {
      await approveCompany(company.id, user?.uid || "admin");
      modal.showAlert("Company approved", "success");
      setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, status: "active" } : c));
    } catch (err: any) {
      modal.showAlert(err.message, "error");
    } finally {
      setActing(null);
    }
  };

  const handleForceRelease = async (vehicle: any) => {
    const ok = await modal.showConfirm(`Force release ${vehicle.plateNumber}? This will reset status to available.`, "Force Release", "Release");
    if (!ok) return;
    setActing(vehicle.id);
    try {
      await forceReleaseVehicle(vehicle.id, user?.uid || "admin");
      modal.showAlert("Vehicle released", "success");
      setVehicles(prev => prev.map(v => v.id === vehicle.id ? { ...v, status: "available" } : v));
    } catch (err: any) {
      modal.showAlert(err.message, "error");
    } finally {
      setActing(null);
    }
  };

  const handleVerify = async (p: any) => {
    const ok = await modal.showConfirm(`Verify KSH ${p.amount?.toLocaleString()} for ${p.driverName || p.driverId}?`, "Verify Payment", "Verify");
    if (!ok) return;
    setActing(p.id);
    try {
      await verifyDriverPayment(p.driverId, p.id, user?.uid || "admin");
      modal.showAlert("Payment verified", "success");
      setPayments(prev => prev.map(x => x.id === p.id ? { ...x, status: "verified" } : x));
    } catch (err: any) {
      modal.showAlert(err.message, "error");
    } finally {
      setActing(null);
    }
  };

  const handleReject = async (p: any) => {
    const reason = await modal.showPrompt("Rejection Reason", "e.g., Invalid code...");
    if (!reason) return;
    setActing(p.id);
    try {
      await rejectDriverPayment(p.id, user?.uid || "admin", reason);
      modal.showAlert("Payment rejected", "info");
      setPayments(prev => prev.map(x => x.id === p.id ? { ...x, status: "rejected" } : x));
    } catch (err: any) {
      modal.showAlert(err.message, "error");
    } finally {
      setActing(null);
    }
  };

  const handleRecordPayment = async (company: any) => {
    const amount = await modal.showPrompt(`Amount paid for ${company.name}? (Tier ${company.subscriptionTier || 1} fee)`, "Amount (KES)");
    if (!amount) return;
    const reference = await modal.showPrompt("M-Pesa Transaction Code", "e.g. RBT8... ");
    if (!reference) return;

    setActing(company.id);
    try {
      await recordCompanyPayment(company.id, parseFloat(amount), reference, user?.uid || "admin");
      modal.showAlert("Payment recorded and subscription extended", "success");
      // Update local state to show active
      setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, subscriptionStatus: "active" } : c));
    } catch (err: any) {
      modal.showAlert(err.message, "error");
    } finally {
      setActing(null);
    }
  };

  const handleSyncTier = async (company: any) => {
    setActing(company.id);
    try {
      await syncCompanySubscriptionAndInvoice(company.id, user?.uid || "admin");
      modal.showAlert("Fleet synchronized and tier updated", "success");
    } catch (err: any) {
      modal.showAlert(err.message, "error");
    } finally {
      setActing(null);
    }
  };

  // ── Render Helpers ────────────────────────────────────────────────────────

  const renderVetting = () => {
    const filtered = companies.filter(c => {
      const matchesSearch = c.name?.toLowerCase().includes(search.toLowerCase()) ||
                            c.email?.toLowerCase().includes(search.toLowerCase()) ||
                            c.phone?.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = vettingFilter === "all" || (c.status || "pending") === vettingFilter;
      return matchesSearch && matchesFilter;
    });

    return (
      <div className="space-y-6">
        {/* Vetting Filter Bar */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100">
            {["all", "pending", "active"].map((f) => (
              <button
                key={f}
                onClick={() => setVettingFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all
                  ${vettingFilter === f 
                    ? "bg-white text-indigo-600 shadow-sm border border-slate-200" 
                    : "text-slate-400 hover:text-slate-600"}
                `}
              >
                {f}
              </button>
            ))}
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">
            {filtered.length} Companies Found
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filtered.map(c => (
          <div key={c.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center overflow-hidden shrink-0">
                    {c.logoUrl ? (
                      <img src={c.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Building2 size={24} className="text-slate-300" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">{c.name}</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-slate-500 font-medium">Reg: {c.registrationNumber || "N/A"}</p>
                      <button 
                        onClick={() => setSelectedCompany(c)}
                        className="text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-widest"
                      >
                        View Profile
                      </button>
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
                  ${c.status === "active" ? "bg-primary-100 text-primary-700" : "bg-amber-100 text-amber-700"}
                `}>
                  {c.status}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-3">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Legal Documents</p>
                  {(c.permitUrls && c.permitUrls.length > 0) ? (
                    c.permitUrls.map((url: string, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                        <span className="text-slate-600 font-medium">Document #{idx + 1}</span>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 transition-colors">
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                      <span className="text-slate-400 font-medium">No Documents Uploaded</span>
                      <span className="text-slate-300"><XCircle size={14} /></span>
                    </div>
                  )}
                  {/* Yard Image (Office Anchor) */}
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider pt-2">Office Anchor</p>
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <span className="text-slate-600 font-medium">Yard Image</span>
                    {c.yardImageUrl ? (
                      <a href={c.yardImageUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 transition-colors">
                        <ExternalLink size={14} />
                      </a>
                    ) : (
                      <span className="text-slate-300"><XCircle size={14} /></span>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Representative</p>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{c.representativeName || c.name || "N/A"}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{c.representativeRole || ""}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{c.phone || "No Phone"}</p>
                    <p className="text-[10px] text-slate-500">{c.email || "No Email"}</p>
                  </div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider pt-2">Address</p>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{c.physicalAddress || c.officeLocation?.address || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>

            {c.status === "pending" && (
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button 
                  onClick={() => handleApproveCompany(c)}
                  disabled={acting === c.id}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-2xl text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  {acting === c.id ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                  Approve Legitimacy
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

  const renderFleet = () => {
    const filtered = vehicles.filter(v => 
      v.plateNumber?.toLowerCase().includes(search.toLowerCase()) ||
      v.make?.toLowerCase().includes(search.toLowerCase()) ||
      v.model?.toLowerCase().includes(search.toLowerCase()) ||
      v.currentCustomerName?.toLowerCase().includes(search.toLowerCase())
    );

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Fleet", value: vehicles.length, icon: <Car />, color: "bg-slate-900" },
            { label: "Currently Hired", value: vehicles.filter(v => v.status === "hired").length, icon: <Clock />, color: "bg-indigo-600" },
            { label: "Overdue", value: vehicles.filter(v => v.status === "hired" && v.dueDate?.toDate?.() < new Date()).length, icon: <AlertTriangle />, color: "bg-rose-600" },
            { label: "Available", value: vehicles.filter(v => v.status === "available").length, icon: <CheckCircle />, color: "bg-primary-600" },
          ].map((stat, i) => (
            <div key={i} className={`${stat.color} rounded-2xl p-4 text-white shadow-lg`}>
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{stat.label}</p>
                {stat.icon}
              </div>
              <p className="text-2xl font-black">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-6">
          {filtered.map(v => {
            const isOverdue = v.status === "hired" && v.dueDate?.toDate?.() < new Date();
            return (
              <div key={v.id} className={`bg-white rounded-3xl border ${isOverdue ? 'border-rose-200' : 'border-slate-200'} shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-xl`}>
                <div className="h-40 bg-slate-100 relative">
                  {v.images?.[0] ? (
                    <img src={v.images[0]} className="w-full h-full object-cover" alt={v.plateNumber} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Car size={48} />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md
                      ${v.status === "available" ? "bg-primary-500 text-white" : "bg-indigo-500 text-white"}
                    `}>
                      {v.status}
                    </div>
                  </div>
                </div>
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-slate-900 leading-tight text-[13px]">{v.make} {v.model} ({v.year || "N/A"})</h3>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{v.plateNumber}</span>
                        <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{v.color || "No Color"}</span>
                        <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{v.seats || "?"} Seats</span>
                      </div>
                    </div>
                    {isOverdue && <AlertTriangle size={16} className="text-rose-500 animate-pulse" />}
                  </div>

                  {v.status === "hired" && (
                    <div className={`p-3 rounded-2xl mb-4 border ${isOverdue ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                      <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Current Customer</p>
                      <p className="text-xs font-bold text-slate-700">{v.currentCustomerName || "Active Hire"}</p>
                      <div className="flex justify-between items-end mt-2">
                        <div>
                          <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Due Date</p>
                          <p className={`text-xs font-bold ${isOverdue ? 'text-rose-600' : 'text-slate-900'}`}>
                            {v.dueDate?.toDate?.().toLocaleDateString() || "N/A"}
                          </p>
                        </div>
                        <button 
                          onClick={() => handleForceRelease(v)}
                          disabled={acting === v.id}
                          className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                        >
                          {acting === v.id ? <RefreshCw size={10} className="animate-spin" /> : <Zap size={10} />}
                          Force Release
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Control Room Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-md">
                  <Briefcase size={20} className="text-indigo-400" />
                </div>
                <h1 className="text-xl font-black tracking-tight">Hire Control Room</h1>
              </div>
              <p className="text-indigo-100/60 max-w-xl text-[11px] font-medium">
                Unified car hire management. Monitor corporate vetting, fleet real-time status, and subscription revenue.
              </p>
            </div>
            <div className="flex bg-white/5 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 self-start">
              {[
                { id: "vetting", label: "Vetting", icon: <Shield size={16} /> },
                { id: "fleet", label: "Fleet", icon: <Car size={16} /> },
                { id: "company-subs", label: "Subscriptions", icon: <CreditCard size={16} /> },
                { id: "payments", label: "Driver Pay", icon: <User size={16} /> },
                { id: "active-hires", label: "Hires", icon: <Clock size={16} /> },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as SubTab)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all
                    ${activeSubTab === tab.id 
                      ? "bg-white text-slate-900 shadow-xl scale-105" 
                      : "text-white/40 hover:text-white/80"}
                  `}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <Car size={300} className="absolute -right-20 -bottom-20 text-white/5 rotate-12" />
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100">
          {activeSubTab === "payments" ? (
            ["all", "verified", "pending", "rejected"].map((f) => (
              <button
                key={f}
                onClick={() => setPaymentFilter(f)}
                className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all
                  ${paymentFilter === f 
                    ? "bg-white text-indigo-600 shadow-sm border border-slate-200" 
                    : "text-slate-400 hover:text-slate-600"}
                `}
              >
                {f === "verified" ? "Approved" : f}
              </button>
            ))
          ) : (
            <div className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Zap size={14} className="text-indigo-400" />
              Live Data Stream Active
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
          <RefreshCw className="animate-spin text-indigo-500 mb-4" size={40} />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Synchronizing Satellite Data...</p>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeSubTab === "vetting" && renderVetting()}
          {activeSubTab === "fleet" && renderFleet()}
          {activeSubTab === "payments" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {payments.filter(p => 
                p.driverName?.toLowerCase().includes(search.toLowerCase()) ||
                p.mpesaCode?.toLowerCase().includes(search.toLowerCase())
              ).map(p => (
                <PaymentCard key={p.id} p={p} acting={acting} onVerify={handleVerify} onReject={handleReject} />
              ))}
            </div>
          )}
          {activeSubTab === "company-subs" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {companies.map(c => {
                  const isExpired = c.nextPaymentDue?.toDate() < new Date();
                  const fleetCount = c.stats?.fleetCount || 0;
                  return (
                    <div key={c.id} className={`bg-white rounded-[2rem] border ${isExpired ? 'border-rose-200 shadow-rose-100' : 'border-slate-200'} p-8 shadow-sm flex flex-col`}>
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 border ${isExpired ? 'bg-rose-50 border-rose-100' : 'bg-white border-slate-100'}`}>
                            {c.logoUrl ? (
                              <img src={c.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                              <Building2 size={28} className={isExpired ? 'text-rose-600' : 'text-slate-300'} />
                            )}
                          </div>
                          <div>
                            <div className="flex justify-between items-center">
                              <h3 className="text-xl font-black text-slate-900">{c.name}</h3>
                            </div>
                            <button 
                              onClick={() => setSelectedCompany(c)}
                              className="text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-widest"
                            >
                              View Profile
                            </button>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Tier {c.subscriptionTier || "Not Set"}</p>
                          </div>
                        </div>
                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isExpired ? 'bg-rose-100 text-rose-700' : 'bg-primary-100 text-primary-700'}`}>
                          {isExpired ? "Expired" : "Active"}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">Fleet Size</p>
                          <p className="text-xl font-black text-slate-900">{fleetCount} Vehicles</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">Due Date</p>
                          <p className={`text-sm font-black ${isExpired ? 'text-rose-600' : 'text-slate-900'}`}>
                            {c.nextPaymentDue?.toDate()?.toLocaleDateString() || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3 mt-auto">
                        <button 
                          onClick={() => handleRecordPayment(c)}
                          disabled={acting === c.id}
                          className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                        >
                          {acting === c.id ? <RefreshCw size={16} className="animate-spin" /> : <Wallet size={16} />}
                          Record Payment
                        </button>
                        <button 
                          onClick={() => handleSyncTier(c)}
                          disabled={acting === c.id}
                          className="w-14 h-14 bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 rounded-2xl transition-all flex items-center justify-center shadow-sm"
                          title="Sync Fleet & Tier"
                        >
                          <RefreshCw size={20} className={acting === c.id ? "animate-spin" : ""} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {activeSubTab === "active-hires" && (
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
               <table className="w-full text-left">
                 <thead className="bg-slate-50 border-b border-slate-200">
                   <tr>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hire ID</th>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vehicle</th>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</th>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {hires.filter(h => 
                     h.vehiclePlateNumber?.toLowerCase().includes(search.toLowerCase()) ||
                     h.id?.toLowerCase().includes(search.toLowerCase())
                   ).map(h => (
                     <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                       <td className="px-6 py-4 text-xs font-mono font-bold text-slate-400">{h.id.slice(0, 8)}...</td>
                       <td className="px-6 py-4">
                         <p className="text-xs font-bold text-slate-900">{h.vehiclePlateNumber || "Unknown"}</p>
                       </td>
                       <td className="px-6 py-4 text-xs text-slate-600 font-medium">
                         {h.startDate?.toDate?.().toLocaleDateString()} - {h.endDate?.toDate?.().toLocaleDateString()}
                       </td>
                       <td className="px-6 py-4 font-bold text-indigo-600 text-sm">KSH {h.totalAmount?.toLocaleString()}</td>
                       <td className="px-6 py-4">
                         <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
                           ${h.status === "active" ? "bg-primary-50 text-primary-600" : "bg-amber-50 text-amber-600"}
                         `}>
                           {h.status}
                         </span>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          )}

          {/* Details Modal */}
          {selectedCompany && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
              <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={() => setSelectedCompany(null)}
              ></div>
              <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                      {selectedCompany.logoUrl ? (
                        <img src={selectedCompany.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Building2 size={32} className="text-slate-300" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900">{selectedCompany.name}</h2>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${selectedCompany.status === 'active' ? 'bg-primary-100 text-primary-700' : 'bg-amber-100 text-amber-700'}`}>
                          {selectedCompany.status}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">Partner since {selectedCompany.createdAt ? new Date(selectedCompany.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedCompany(null)}
                    className="p-3 bg-white hover:bg-slate-100 rounded-2xl text-slate-400 transition shadow-sm border border-slate-100"
                  >
                    <XCircle size={24} />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Business Info */}
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Shield size={14} className="text-indigo-600" /> Business Identity
                        </h4>
                        <div className="space-y-4 p-5 bg-slate-50 rounded-3xl border border-slate-100">
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Registration Number</p>
                            <p className="text-sm font-bold text-slate-900">{selectedCompany.registrationNumber || "Pending Update"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Physical Address</p>
                            <p className="text-sm font-bold text-slate-900">{selectedCompany.physicalAddress || selectedCompany.officeLocation?.address || "No Address Provided"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Bio / Description</p>
                            <p className="text-sm text-slate-600 leading-relaxed italic">"{selectedCompany.bio || "No company bio available."}"</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <User size={14} className="text-indigo-600" /> Key Representative
                        </h4>
                        <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                              <User size={16} />
                            </div>
                            <p className="text-sm font-black text-slate-900">{selectedCompany.representativeName || selectedCompany.name}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Phone size={14} className="text-slate-400" />
                            <p className="text-xs font-bold text-slate-700">{selectedCompany.phone || selectedCompany.representativePhone || "N/A"}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <MessageSquare size={14} className="text-slate-400" />
                            <p className="text-xs font-bold text-slate-700">{selectedCompany.email || selectedCompany.representativeEmail || "N/A"}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payments & Docs */}
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <CreditCard size={14} className="text-primary-600" /> Customer Payment Details
                        </h4>
                        <div className="p-5 bg-primary-50/50 rounded-3xl border border-primary-100 space-y-4">
                          <div className="pb-3 border-b border-primary-100">
                            <p className="text-[10px] text-primary-600 font-black uppercase mb-2 flex items-center gap-1.5">
                              <Building2 size={12} /> Bank Transfer
                            </p>
                            <p className="text-sm font-black text-slate-900">{selectedCompany.bankDetails?.bankName || selectedCompany.paymentDetails?.bankName || "Not Set"}</p>
                            <p className="text-xs font-bold text-slate-500 mt-1">Acc: {selectedCompany.bankDetails?.accountNumber || selectedCompany.paymentDetails?.accountNumber || "N/A"}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{selectedCompany.bankDetails?.accountName || selectedCompany.paymentDetails?.accountName || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-primary-600 font-black uppercase mb-2 flex items-center gap-1.5">
                              <Wallet size={12} /> M-Pesa Merchant
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-[10px] text-slate-400 font-bold">Till Number</p>
                                <p className="text-sm font-black text-slate-900">{selectedCompany.mpesaDetails?.tillNumber || selectedCompany.paymentDetails?.mpesaTill || "None"}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-400 font-bold">Paybill + Account</p>
                                <p className="text-sm font-black text-slate-900">{selectedCompany.mpesaDetails?.paybillNumber || selectedCompany.paymentDetails?.mpesaPaybill || "None"}</p>
                                {(selectedCompany.mpesaDetails?.accountNumber || selectedCompany.paymentDetails?.mpesaAccount) && <p className="text-[10px] font-bold text-primary-600">Acc: {selectedCompany.mpesaDetails?.accountNumber || selectedCompany.paymentDetails?.mpesaAccount}</p>}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <FileText size={14} className="text-indigo-600" /> Compliance Documents
                        </h4>
                        <div className="space-y-3">
                          {selectedCompany.permitUrls && selectedCompany.permitUrls.length > 0 ? (
                            selectedCompany.permitUrls.map((url: string, i: number) => (
                              <a 
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-4 rounded-2xl border transition-all bg-white border-slate-200 hover:border-indigo-500 hover:shadow-md cursor-pointer" 
                              >
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                                    <FileText size={18} />
                                  </div>
                                  <span className="text-sm font-bold text-slate-700">Document #{i + 1}</span>
                                </div>
                                <ExternalLink size={16} className="text-slate-300" />
                              </a>
                            ))
                          ) : (
                            <div className="flex items-center justify-between p-4 rounded-2xl border transition-all bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-slate-100 text-slate-300">
                                  <FileText size={18} />
                                </div>
                                <span className="text-sm font-bold text-slate-700">No Documents Uploaded</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Office Anchor */}
                      <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <MapPin size={14} className="text-indigo-600" /> Office Anchor (Yard Image)
                        </h4>
                        <div className="w-full h-48 bg-slate-100 rounded-3xl overflow-hidden border border-slate-200">
                          {selectedCompany.yardImageUrl ? (
                            <img src={selectedCompany.yardImageUrl} alt="Yard/Office" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 flex-col gap-2">
                              <ImageIcon size={24} />
                              <span className="text-xs font-bold uppercase tracking-widest">No Image</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase">Internal System ID</p>
                    <p className="text-xs font-mono text-slate-500">{selectedCompany.id}</p>
                  </div>
                  <div className="flex gap-4">
                    {selectedCompany.status === "pending" && (
                      <button 
                        onClick={() => { handleApproveCompany(selectedCompany); setSelectedCompany(null); }}
                        className="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-black shadow-lg hover:bg-indigo-700 transition-all"
                      >
                        Approve Company
                      </button>
                    )}
                    <button 
                      onClick={() => setSelectedCompany(null)}
                      className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-black hover:bg-slate-50 transition-all"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PaymentCard({ p, acting, onVerify, onReject }: PaymentCardProps) {
  const isActing = acting === p.id;
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-xl transition-all">
       <div className="flex justify-between items-start mb-6">
         <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
             <CreditCard size={20} />
           </div>
           <div>
             <h4 className="font-bold text-slate-900">{p.driverName || "Driver"}</h4>
             <p className="text-[10px] text-slate-400 font-bold uppercase">{p.mpesaCode}</p>
           </div>
         </div>
         <div className="px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-[9px] font-black uppercase border border-amber-100">
           {p.status}
         </div>
       </div>
       <div className="bg-slate-50 p-3 rounded-2xl mb-6">
         <p className="text-lg font-black text-slate-900">KSH {p.amount?.toLocaleString()}</p>
         <p className="text-[10px] text-slate-500 font-medium mt-1 truncate">{p.mpesaMessage}</p>
       </div>
       <div className="flex gap-2">
         <button 
           onClick={() => onVerify(p)} 
           disabled={isActing}
           className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
         >
           {isActing ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={14} />}
           Approve
         </button>
         <button 
           onClick={() => onReject(p)} 
           disabled={isActing}
           className="px-3 border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 rounded-xl transition-colors"
         >
           <XCircle size={16} />
         </button>
       </div>
    </div>
  );
}
