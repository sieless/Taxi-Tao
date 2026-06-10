"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  CreditCard,
  Loader2,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
} from "lucide-react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { HirePayment, HireReceipt } from "@/lib/types";
import HirePaymentModal from "@/components/vendor/HirePaymentModal";
import HireReceiptView from "@/components/vendor/HireReceiptView";


import { logError } from "@/lib/logger";/**
 * Payments Page
 *
 * Shows payment records with:
 * - Real-time list from Firestore
 * - Confirm/Reject actions
 * - Receipt generation and display
 */
export default function PaymentsPage() {
  const { userProfile } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [payments, setPayments] = useState<HirePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<HirePayment | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState<HireReceipt | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !userProfile?.companyId) return;

    // Query all payments for this company's hire requests
    // Note: This is a simplified query - in production, you'd query hirePayments
    // filtered by companyId from the hire requests
    const q = query(
      collection(db, "hirePayments"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as HirePayment))
          .filter((payment) => payment.companyId === userProfile.companyId);
        setPayments(data);
        setLoading(false);
      },
      (error) => {
        logError("page", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [mounted, userProfile?.companyId]);

  const handlePaymentSuccess = () => {
    setSelectedPayment(null);
  };

  const formatDate = (date: any) => {
    if (!date) return "N/A";
    if (date.toDate) return date.toDate().toLocaleDateString();
    if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString();
    return new Date(date).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return `KSH ${amount.toLocaleString()}`;
  };

  const filteredPayments = payments.filter(
    (payment) =>
      payment.mpesaTransactionCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.bankReference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    pending: payments.filter((p) => p.status === "pending").length,
    confirmed: payments.filter((p) => p.status === "confirmed").length,
    totalAmount: payments
      .filter((p) => p.status === "confirmed" || p.status === "verified")
      .reduce((sum, p) => sum + (p.amount || 0), 0),
  };

  if (!mounted || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh]">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        <p className="mt-4 text-gray-500 font-medium">Loading payments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by transaction code or reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-gray-200 rounded-xl text-sm font-bold outline-none transition-all"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-center">
          <p className="text-2xl font-black text-amber-700">{stats.pending}</p>
          <p className="text-[10px] text-amber-600 uppercase font-black">
            Pending
          </p>
        </div>
        <div className="bg-primary-50 p-4 rounded-2xl border border-primary-100 text-center">
          <p className="text-2xl font-black text-primary-700">
            {stats.confirmed}
          </p>
          <p className="text-[10px] text-primary-600 uppercase font-black">
            Confirmed
          </p>
        </div>
        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-center">
          <p className="text-2xl font-black text-blue-700">
            {formatCurrency(stats.totalAmount)}
          </p>
          <p className="text-[10px] text-blue-600 uppercase font-black">
            Total Received
          </p>
        </div>
      </div>

      {/* Payments List */}
      {filteredPayments.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-100 rounded-[2rem] p-16 text-center">
          <CreditCard className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-black text-gray-900 mb-2">
            No Payments Found
          </h3>
          <p className="text-gray-500 font-medium">
            Payment records will appear here once customers submit payments.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Transaction
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Method
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Date
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Status
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-black text-gray-900 text-sm">
                        {payment.mpesaTransactionCode || payment.bankReference || payment.id.substring(0, 8)}
                      </p>
                      <p className="text-[10px] text-gray-400 uppercase font-medium">
                        {payment.paymentType.replace("_", " ")}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-black text-gray-900">
                        {formatCurrency(payment.amount)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 text-xs font-black rounded-full uppercase ${
                          payment.paymentMethod === "mpesa"
                            ? "bg-primary-100 text-primary-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {payment.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">
                        {formatDate(payment.createdAt)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 text-xs font-black rounded-full uppercase ${
                          payment.status === "pending"
                            ? "bg-amber-100 text-amber-700"
                            : payment.status === "confirmed"
                            ? "bg-primary-100 text-primary-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {payment.status === "pending" && (
                          <button
                            onClick={() => setSelectedPayment(payment)}
                            className="px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-bold hover:bg-primary-700 transition"
                          >
                            Review
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {selectedPayment && (
        <HirePaymentModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Receipt Modal */}
      {showReceipt && currentReceipt && (
        <HireReceiptView
          receipt={currentReceipt}
          onClose={() => {
            setShowReceipt(false);
            setCurrentReceipt(null);
          }}
        />
      )}
    </div>
  );
}
