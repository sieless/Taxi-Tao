"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  limit, 
  where,
  doc,
  getDoc,
  startAfter,
  QueryDocumentSnapshot
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  AlertTriangle, 
  User, 
  MessageSquare,
  RefreshCw,
  Phone,
  Filter,
  Calendar,
  Smartphone,
  Car,
  Zap
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useModal } from "@/lib/admin-modal-context";
import { verifyDriverPayment, rejectDriverPayment } from "@/lib/admin-service";
import { useAuth } from "@/lib/auth-context";
import { hasAdminPermission } from "@/lib/admin-permission-helper";

import { logError } from "@/lib/logger";

interface PaymentVerification {
  id: string;
  driverId: string;
  driverName?: string;
  driverPhone?: string;
  amount?: number;
  transactionCode?: string;
  mpesaMessage?: string;
  status: "pending" | "verified" | "rejected";
  rejectionReason?: string;
  submittedAt: any;
  serviceType?: string;
  plan?: string;
  durationDays?: number;
  messageTimestamp?: any;
  isLateSubmission?: boolean;
  minutesDelayed?: number;
  verifiedAt?: any;
  verifiedBy?: string;
  rejectedAt?: any;
}

const PAGE_SIZE = 20;

export default function PaymentsTab() {
  const { userProfile, user } = useAuth();
  const modal = useModal();
  const [payments, setPayments] = useState<PaymentVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [acting, setActing] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [cursors, setCursors] = useState<QueryDocumentSnapshot[]>([]);
  
  const canManage = hasAdminPermission(userProfile, "managePayments");

  const searchParams = useSearchParams();
  const search = searchParams.get("search") || "";

  const resolveDriverData = async (driverId: string) => {
    try {
      const driverSnap = await getDoc(doc(db, "drivers", driverId));
      if (driverSnap.exists()) {
        const d = driverSnap.data();
        const name = d.fullName || d.name || d.displayName || null;
        const phone = d.phone || d.phoneNumber || null;
        return { name, phone };
      }
      const userSnap = await getDoc(doc(db, "users", driverId));
      if (userSnap.exists()) {
        const u = userSnap.data();
        return { name: u.fullName || u.displayName || u.name || null, phone: u.phone || null };
      }
    } catch {}
    return { name: null, phone: null };
  };

  const loadPayments = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      let q;
      const constraints: any[] = [];

      if (statusFilter !== "all") {
        constraints.push(where("status", "==", statusFilter));
      }
      if (serviceFilter !== "all") {
        constraints.push(where("serviceType", "==", serviceFilter));
      }
      if (planFilter !== "all") {
        constraints.push(where("plan", "==", planFilter));
      }

      constraints.push(orderBy("submittedAt", "desc"));
      constraints.push(limit(PAGE_SIZE + 1));

      if (pageNum > 0 && cursors[pageNum - 1]) {
        constraints.splice(constraints.length - 2, 0, startAfter(cursors[pageNum - 1]));
      }

      q = query(collection(db, "paymentVerifications"), ...constraints);
      const snap = await getDocs(q);
      const docs = snap.docs;
      const more = docs.length > PAGE_SIZE;
      const pageDocs = docs.slice(0, PAGE_SIZE);

      const raw = pageDocs.map(d => ({ id: d.id, ...d.data() } as PaymentVerification));

      const driverIds = [...new Set(raw.map(p => p.driverId).filter(Boolean))] as string[];
      const driverMap = new Map<string, { name: string | null; phone: string | null }>();
      await Promise.all(driverIds.map(async (id) => {
        const data = await resolveDriverData(id);
        driverMap.set(id, data);
      }));

      const enriched = raw.map(p => ({
        ...p,
        driverName: p.driverName || driverMap.get(p.driverId)?.name || null,
        driverPhone: p.driverPhone || driverMap.get(p.driverId)?.phone || null,
      }));

      setPayments(enriched);
      setHasMore(more);
      if (more && pageNum >= cursors.length) {
        setCursors(prev => [...prev, docs[PAGE_SIZE - 1]]);
      }
    } catch (err) {
      logError("PaymentsTab", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, planFilter, serviceFilter, cursors]);

  useEffect(() => {
    loadPayments(page);
  }, [page, statusFilter, planFilter, serviceFilter]);

  const resetFilters = (newStatus?: string, newPlan?: string, newService?: string) => {
    if (newStatus !== undefined) setStatusFilter(newStatus);
    if (newPlan !== undefined) setPlanFilter(newPlan);
    if (newService !== undefined) setServiceFilter(newService);
    setPage(0);
    setCursors([]);
  };

  async function handleVerify(p: PaymentVerification) {
    const ok = await modal.showConfirm(`Verify KSH ${p.amount?.toLocaleString() || "—"} for ${p.driverName || p.driverId}?`, "Confirm Verification", "Verify");
    if (!ok) return;
    setActing(p.id);
    try {
      await verifyDriverPayment(p.driverId, p.id, user?.uid || "admin");
      setPayments(prev => prev.map(x => x.id === p.id ? { ...x, status: "verified" } : x));
      modal.showAlert("Payment verified successfully", "success");
    } catch (err: any) {
      modal.showAlert(`Verification failed: ${err.message}`, "error");
    } finally {
      setActing(null);
    }
  }

  async function handleReject(p: PaymentVerification) {
    const reason = await modal.showPrompt("Rejection Reason", "e.g., Invalid code, incorrect amount...");
    if (!reason) return;
    setActing(p.id);
    try {
      await rejectDriverPayment(p.id, user?.uid || "admin", reason);
      setPayments(prev => prev.map(x => x.id === p.id ? { ...x, status: "rejected", rejectionReason: reason } : x));
      modal.showAlert("Payment rejected", "info");
    } catch (err: any) {
      modal.showAlert(`Rejection failed: ${err.message}`, "error");
    } finally {
      setActing(null);
    }
  }

  const filtered = payments.filter(p => 
    !search || 
    p.driverName?.toLowerCase().includes(search.toLowerCase()) || 
    p.transactionCode?.toLowerCase().includes(search.toLowerCase()) ||
    p.mpesaMessage?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {/* Status Filters */}
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100">
            {["pending", "verified", "rejected", "all"].map((f) => (
              <button
                key={f}
                onClick={() => resetFilters(f)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all
                  ${statusFilter === f 
                    ? "bg-white text-indigo-600 shadow-sm border border-slate-200" 
                    : "text-slate-400 hover:text-slate-600"}
                `}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Prev
            </button>
            <span className="text-xs text-slate-400 font-mono">Page {page + 1}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!hasMore}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        </div>

        {/* Secondary Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Car size={14} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Service:</span>
            <div className="flex gap-1">
              {["all", "taxi", "hire"].map(s => (
                <button
                  key={s}
                  onClick={() => resetFilters(undefined, undefined, s)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition
                    ${serviceFilter === s ? "bg-indigo-100 text-indigo-700" : "bg-slate-50 text-slate-400 hover:bg-slate-100"}
                  `}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="w-px h-4 bg-slate-200" />

          <div className="flex items-center gap-2">
            <Zap size={14} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Plan:</span>
            <div className="flex gap-1">
              {["all", "daily", "weekly", "monthly"].map(p => (
                <button
                  key={p}
                  onClick={() => resetFilters(undefined, p)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition
                    ${planFilter === p ? "bg-indigo-100 text-indigo-700" : "bg-slate-50 text-slate-400 hover:bg-slate-100"}
                  `}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
          <RefreshCw className="animate-spin text-indigo-500" size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
          <CreditCard size={48} className="text-slate-200 mb-4" />
          <p className="text-slate-500 font-medium">No payment verifications found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filtered.map((p) => {
            const isActing = acting === p.id;
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden group hover:border-indigo-300 transition-colors">
                <div className="p-4 flex-1">
                  {/* Header: Driver + Status */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                        <User size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{p.driverName || "Unknown Driver"}</h3>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Phone size={9} /> {p.driverPhone || "No phone"}
                        </p>
                      </div>
                    </div>
                    <div className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider
                      ${p.status === "verified" ? "bg-primary-100 text-primary-700" : 
                        p.status === "pending" ? "bg-amber-100 text-amber-700" : 
                        "bg-rose-100 text-rose-700"}
                    `}>
                      {p.status}
                    </div>
                  </div>

                  {/* Badges Row */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-3">
                    {p.serviceType && (
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase
                        ${p.serviceType === "hire" ? "bg-purple-50 text-purple-600 border border-purple-100" : "bg-blue-50 text-blue-600 border border-blue-100"}
                      `}>
                        {p.serviceType === "hire" ? "Car Hire" : "Taxi"}
                      </span>
                    )}
                    {p.plan && (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                        {p.plan} {p.durationDays ? `(${p.durationDays}d)` : ""}
                      </span>
                    )}
                    {p.isLateSubmission && (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-rose-50 text-rose-600 border border-rose-100">
                        Late {p.minutesDelayed ? `${p.minutesDelayed}m` : ""}
                      </span>
                    )}
                  </div>

                  {/* M-Pesa Message */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-3 relative overflow-hidden">
                    <MessageSquare size={10} className="absolute top-2 right-2 text-slate-200" />
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">M-Pesa Message</p>
                    <p className="text-[10px] text-slate-600 font-mono leading-relaxed break-all line-clamp-3">
                      {p.mpesaMessage || "No message"}
                    </p>
                  </div>

                  {/* Amount + Date + Tx Code */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Amount</p>
                      <p className="text-sm font-bold text-slate-900">KSH {p.amount?.toLocaleString() || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Submitted</p>
                      <p className="text-[11px] font-medium text-slate-600">
                        {p.submittedAt?.toDate ? p.submittedAt.toDate().toLocaleDateString() : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Tx Code</p>
                      <p className="text-[10px] font-mono font-bold text-slate-500 truncate" title={p.transactionCode}>
                        {p.transactionCode || "—"}
                      </p>
                    </div>
                  </div>
                  
                  {p.rejectionReason && (
                    <div className="mt-3 p-2 bg-rose-50 border border-rose-100 rounded-xl flex gap-2">
                      <AlertTriangle size={12} className="text-rose-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-rose-700"><strong>Rejected:</strong> {p.rejectionReason}</p>
                    </div>
                  )}
                </div>

                {p.status === "pending" && canManage && (
                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
                    <button 
                      onClick={() => handleVerify(p)}
                      disabled={isActing}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      {isActing ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                      Verify
                    </button>
                    <button 
                      onClick={() => handleReject(p)}
                      disabled={isActing}
                      className="flex-1 bg-white border border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <XCircle size={14} />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
