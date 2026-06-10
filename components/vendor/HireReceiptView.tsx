"use client";

import { X, Download, Printer, CheckCircle } from "lucide-react";
import { HireReceipt } from "@/lib/types";

interface HireReceiptViewProps {
  receipt: HireReceipt;
  onClose: () => void;
}

export default function HireReceiptView({ receipt, onClose }: HireReceiptViewProps) {
  const formatCurrency = (amount: number) => {
    return `KSH ${amount.toLocaleString()}`;
  };

  const formatDate = (date: any) => {
    if (!date) return "N/A";
    if (date.toDate) return date.toDate().toLocaleDateString();
    if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString();
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b flex items-center justify-between bg-primary-600 text-white">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8" />
            <div>
              <h2 className="text-xl font-black">Payment Receipt</h2>
              <p className="text-sm text-primary-100 font-medium">
                {receipt.receiptNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* Company Info */}
          <div className="text-center">
            {receipt.companyLogo && (
              <img
                src={receipt.companyLogo}
                alt="Company Logo"
                className="w-16 h-16 rounded-full mx-auto mb-3 object-cover"
              />
            )}
            <p className="text-lg font-black text-gray-900">
              {receipt.companyName}
            </p>
            <p className="text-xs text-gray-400 font-medium">
              {receipt.companyId}
            </p>
          </div>

          {/* Customer Info */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Customer</span>
              <span className="text-sm font-bold text-gray-900">
                {receipt.customerName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Vehicle</span>
              <span className="text-sm font-bold text-gray-900">
                {receipt.vehicleName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Plate</span>
              <span className="text-sm font-bold text-gray-900 font-mono">
                {receipt.vehiclePlate}
              </span>
            </div>
          </div>

          {/* Booking Details */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Booking Details
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Start Date</p>
                <p className="text-sm font-bold text-gray-900">
                  {formatDate(receipt.startDate)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">End Date</p>
                <p className="text-sm font-bold text-gray-900">
                  {formatDate(receipt.endDate)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Duration</p>
                <p className="text-sm font-bold text-gray-900">
                  {receipt.durationDays} days
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Service</p>
                <p className="text-sm font-bold text-gray-900 capitalize">
                  {receipt.serviceType}
                </p>
              </div>
            </div>
          </div>

          {/* Fee Breakdown */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Fee Breakdown
            </p>
            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Base Rental</span>
                <span className="text-sm font-bold text-gray-900">
                  {formatCurrency(receipt.baseRentalAmount)}
                </span>
              </div>
              {receipt.deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Delivery Fee</span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatCurrency(receipt.deliveryFee)}
                  </span>
                </div>
              )}
              {receipt.chauffeurFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Chauffeur Fee</span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatCurrency(receipt.chauffeurFee)}
                  </span>
                </div>
              )}
              {receipt.washFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Wash Fee</span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatCurrency(receipt.washFee)}
                  </span>
                </div>
              )}
              {receipt.securityDeposit > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Security Deposit (Refundable)
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatCurrency(receipt.securityDeposit)}
                  </span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="text-sm font-black text-gray-900">
                  Total Due
                </span>
                <span className="text-lg font-black text-gray-900">
                  {formatCurrency(receipt.totalDue)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Payment Information
            </p>
            <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-primary-700">Amount Paid</span>
                <span className="text-sm font-bold text-primary-900">
                  {formatCurrency(receipt.amountPaid)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-primary-700">Payment Method</span>
                <span className="text-sm font-bold text-primary-900 uppercase">
                  {receipt.paymentMethod}
                </span>
              </div>
              {receipt.mpesaTransactionCode && (
                <div className="flex justify-between">
                  <span className="text-sm text-primary-700">M-Pesa Code</span>
                  <span className="text-sm font-bold text-primary-900 font-mono">
                    {receipt.mpesaTransactionCode}
                  </span>
                </div>
              )}
              {receipt.bankReference && (
                <div className="flex justify-between">
                  <span className="text-sm text-primary-700">Bank Reference</span>
                  <span className="text-sm font-bold text-primary-900">
                    {receipt.bankReference}
                  </span>
                </div>
              )}
              {receipt.balanceRemaining > 0 && (
                <div className="border-t border-primary-200 pt-3 flex justify-between">
                  <span className="text-sm font-bold text-primary-900">
                    Balance Remaining
                  </span>
                  <span className="text-sm font-black text-primary-900">
                    {formatCurrency(receipt.balanceRemaining)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-400 font-medium">
            <p>Generated on {formatDate(receipt.generatedAt)}</p>
            <p className="mt-1">TaxiTao Car Hire Platform</p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-8 py-6 border-t flex gap-3 bg-gray-50">
          <button
            onClick={() => window.print()}
            className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-100 transition flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
