"use client";

import { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  limit, 
  where,
  Timestamp,
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
  Filter
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useModal } from "@/lib/admin-modal-context";
import { verifyDriverPayment, rejectDriverPayment } from "@/lib/admin-service";
import { useAuth } from "@/lib/auth-context";
import { hasAdminPermission } from "@/lib/admin-permission-helper";


import { logError } from "@/lib/logger";interface PaymentVerification {
  id: string;
  driverId: string;
  driverName?: string;
  driverPhone?: string;
  amount?: number;
  mpesaCode?: string;
  mpesaMessage?: string; // The "real" message the user wants to see
  status: "pending" | "verified" | "rejected";
  rejectionReason?: string;
  submittedAt: any;
  serviceType?: string;
}

export default function PaymentsTab() {
  const { userProfile, user } = useAuth();
  const modal = useModal();
  const [payments, setPayments] = useState<PaymentVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending");
  const [acting, setActing] = useState<string | null>(null);
  
  const canManage = hasAdminPermission(userProfile, "managePayments");

  const searchParams = useSearchParams();
  const search = searchParams.get("search") || "";

  useEffect(() => {
    loadPayments();
  }, [filter, search]);

  async function loadPayments() {
    setLoading(true);
    try {
      let q;
      
      if (search) {
        // Database-level prefix search on M-Pesa code
        const searchTerm = search.toUpperCase();
        q = query(
          collection(db, "paymentVerifications"),
          where("mpesaCode", ">=", searchTerm),
          where("mpesaCode", "<=", searchTerm + "\uf8ff"),
          limit(50)
        );
      } else {
        q = query(collection(db, "paymentVerifications"), orderBy("submittedAt", "desc"), limit(50));
        if (filter !== "all") {
          q = query(collection(db, "paymentVerifications"), where("status", "==", filter), orderBy("submittedAt", "desc"), limit(50));
        }
      }

      const snap = await getDocs(q);
      setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentVerification)));
    } catch (err) {
      logError("PaymentsTab", err);
    } finally {
      setLoading(false);
    }
  }

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
    p.driverName?.toLowerCase().includes(search.toLowerCase()) || 
    p.mpesaCode?.toLowerCase().includes(search.toLowerCase()) ||
    p.mpesaMessage?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Filters Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100">
          {["all", "verified", "pending", "rejected"].map((f) => (
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
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                        <User size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{p.driverName || "Unknown Driver"}</h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Phone size={10} /> {p.driverPhone || "No phone"}
                        </p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                      ${p.status === "verified" ? "bg-primary-100 text-primary-700" : 
                        p.status === "pending" ? "bg-amber-100 text-amber-700" : 
                        "bg-rose-100 text-rose-700"}
                    `}>
                      {p.status}
                    </div>
                  </div>

                  {/* Real Message Display */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-4 relative overflow-hidden">
                    <MessageSquare size={12} className="absolute top-2 right-2 text-slate-200" />
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">M-Pesa Message</p>
                    <p className="text-xs text-slate-700 font-mono leading-relaxed break-all">
                      {p.mpesaMessage || p.mpesaCode || "No message"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Amount</p>
                      <p className="text-lg font-bold text-slate-900">KSH {p.amount?.toLocaleString() || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Submitted</p>
                      <p className="text-sm font-medium text-slate-700">
                        {p.submittedAt?.toDate ? p.submittedAt.toDate().toLocaleDateString() : "Just now"}
                      </p>
                    </div>
                  </div>
                  
                  {p.rejectionReason && (
                    <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-xl flex gap-2">
                      <AlertTriangle size={14} className="text-rose-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-rose-700"><strong>Rejected:</strong> {p.rejectionReason}</p>
                    </div>
                  )}
                </div>

                {p.status === "pending" && canManage && (
                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
                    <button 
                      onClick={() => handleVerify(p)}
                      disabled={isActing}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"
                    >
                      {isActing ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                      Verify
                    </button>
                    <button 
                      onClick={() => handleReject(p)}
                      disabled={isActing}
                      className="flex-1 bg-white border border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 py-2 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"
                    >
                      <XCircle size={16} />
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
