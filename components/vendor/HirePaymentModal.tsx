"use client";

import { useState } from "react";
import {
  X,
  Check,
  AlertTriangle,
  Loader2,
  CreditCard,
  Banknote,
} from "lucide-react";
import { HirePayment } from "@/lib/types";
import { confirmPaymentReceipt, rejectHirePayment } from "@/lib/carhire/hire-payment-service";
import { useAuth } from "@/lib/auth-context";


import { logError } from "@/lib/logger";interface HirePaymentModalProps {
  payment: HirePayment;
  onClose: () => void;
  onSuccess: () => void;
}

export default function HirePaymentModal({
  payment,
  onClose,
  onSuccess,
}: HirePaymentModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<"confirm" | "reject" | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const handleConfirm = async () => {
    if (!user?.uid) return;
    setLoading(true);

    try {
      await confirmPaymentReceipt({
        paymentId: payment.id,
        confirmedBy: user.uid,
      });
      onSuccess();
    } catch (error) {
      logError("HirePaymentModal", error);
      alert("Failed to confirm payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!user?.uid || !rejectReason.trim()) return;
    setLoading(true);

    try {
      await rejectHirePayment({
        paymentId: payment.id,
        rejectedBy: user.uid,
        reason: rejectReason.trim(),
      });
      onSuccess();
    } catch (error) {
      logError("HirePaymentModal", error);
      alert("Failed to reject payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `KSH ${amount.toLocaleString()}`;
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b flex items-center justify-between bg-white">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                payment.paymentMethod === "mpesa"
                  ? "bg-primary-100 text-primary-600"
                  : "bg-blue-100 text-blue-600"
              }`}
            >
              {payment.paymentMethod === "mpesa" ? (
                <CreditCard className="w-6 h-6" />
              ) : (
                <Banknote className="w-6 h-6" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">Payment Details</h2>
              <p className="text-xs text-gray-500 font-medium uppercase">
                {payment.paymentMethod.toUpperCase()} Payment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Amount */}
          <div className="text-center py-6 bg-gray-50 rounded-2xl">
            <p className="text-sm text-gray-500 font-medium mb-2">Amount</p>
            <p className="text-4xl font-black text-gray-900">
              {formatCurrency(payment.amount)}
            </p>
            <p className="text-xs text-gray-400 mt-2 uppercase font-black">
              {payment.paymentType.replace("_", " ")}
            </p>
          </div>

          {/* Payment Info */}
          <div className="space-y-4">
            {payment.mpesaTransactionCode && (
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-sm text-gray-500">M-Pesa Code</span>
                <span className="text-sm font-bold text-gray-900 font-mono">
                  {payment.mpesaTransactionCode}
                </span>
              </div>
            )}

            {payment.bankReference && (
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-sm text-gray-500">Bank Reference</span>
                <span className="text-sm font-bold text-gray-900">
                  {payment.bankReference}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-sm text-gray-500">Balance Due</span>
              <span className="text-sm font-bold text-gray-900">
                {formatCurrency(payment.balanceRemaining)}
              </span>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-sm text-gray-500">Status</span>
              <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full uppercase">
                {payment.status}
              </span>
            </div>
          </div>

          {/* Action Buttons or Reject Form */}
          {action === "reject" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <p className="text-sm font-bold text-red-900">
                  Reject Payment
                </p>
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 block mb-2">
                  Reason for Rejection *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full h-24 px-4 py-3 border border-gray-200 rounded-2xl text-sm font-medium outline-none focus:border-red-300 transition resize-none"
                  placeholder="Enter reason for rejection..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setAction(null)}
                  disabled={loading}
                  className="flex-1 py-4 border border-gray-200 text-gray-600 rounded-2xl font-bold text-sm hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={loading || !rejectReason.trim()}
                  className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold text-sm hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Confirm Reject"
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => setAction("reject")}
                disabled={loading}
                className="flex-1 py-4 border border-red-200 text-red-600 rounded-2xl font-bold text-sm hover:bg-red-50 transition disabled:opacity-50"
              >
                Reject Payment
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 py-4 bg-primary-600 text-white rounded-2xl font-bold text-sm hover:bg-primary-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5" /> Confirm Payment
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
