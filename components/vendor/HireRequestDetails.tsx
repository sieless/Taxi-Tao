"use client";

import { useState, useEffect } from "react";
import { HireRequest, AppUser } from "@/lib/types";
import { 
  X, 
  User, 
  Car, 
  Calendar, 
  MapPin, 
  FileText, 
  ShieldCheck, 
  ShieldAlert,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Wallet,
  ClipboardCheck,
  RotateCcw
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import InspectionWizard from "./InspectionWizard";


import { logError } from "@/lib/logger";interface HireRequestDetailsProps {
  request: HireRequest;
  onClose: () => void;
}

export default function HireRequestDetails({ request, onClose }: HireRequestDetailsProps) {
  const [loading, setLoading] = useState(false);
  const [customerProfile, setCustomerProfile] = useState<AppUser | null>(null);
  const [showInspection, setShowInspection] = useState<"pre-release" | "post-return" | null>(null);

  useEffect(() => {
    const fetchCustomer = async () => {
      if (request.kycGranted) {
        const customerDoc = await getDoc(doc(db, "users", request.customerId));
        if (customerDoc.exists()) {
          setCustomerProfile(customerDoc.data() as AppUser);
        }
      }
    };
    fetchCustomer();
  }, [request.kycGranted, request.customerId]);

  const handleApprove = async () => {
    const startMillis = request.startDate.toMillis();
    const endMillis = request.endDate.toMillis();
    const calculatedDays = Math.max(1, Math.ceil((endMillis - startMillis) / (1000 * 60 * 60 * 24)) + 1);

    if (calculatedDays !== request.days) {
      if (!confirm(`Duration Mismatch: The selected dates suggest ${calculatedDays} days, but the request says ${request.days} days. Proceed with ${request.days} days?`)) {
        return;
      }
    }

    setLoading(true);
    try {
      const response = await fetch("/api/vendor/hire-requests/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          vehicleId: request.vehicleId,
          companyId: request.companyId,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to approve request");
      }

      alert("Request approved and invoice sent to customer!");
      onClose();
    } catch (error: any) {
      if (process.env.NODE_ENV === "development") {
        logError("HireRequestDetails", error);
      }
      alert(error.message || "Failed to approve request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-end">
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose}
      ></div>
      
      <div className="relative bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
        {/* Header */}
        <div className="px-8 py-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Request Details</h2>
            <p className="text-sm text-gray-500">ID: {request.id}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
          {/* Summary Card */}
          <div className="bg-gray-900 text-white rounded-[2.5rem] p-8 grid grid-cols-2 gap-8 shadow-2xl shadow-gray-900/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-full bg-primary-500/10 blur-3xl pointer-events-none" />
            
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total to Pay</p>
              <p className="text-4xl font-black text-white">
                KSH {(request.totalAmount + (request.depositAmount || 0)).toLocaleString()}
              </p>
              <p className="text-[10px] text-primary-400 font-bold uppercase tracking-widest">Includes KSH {request.depositAmount?.toLocaleString()} Deposit</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rental Duration</p>
              <div className="flex items-center gap-2">
                <p className="text-4xl font-black text-white">{request.days} Days</p>
                <Calendar className="w-5 h-5 text-gray-600" />
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                {new Date(request.startDate.toDate()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - {new Date(request.endDate.toDate()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
              </p>
            </div>
          </div>

          {/* Customer KYC Handshake */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                <User className="w-5 h-5 text-gray-400" /> Identity Handshake
              </h3>
              {request.kycGranted && (
                <span className="px-3 py-1 bg-primary-50 text-primary-600 text-[10px] font-black rounded-full border border-primary-100 uppercase tracking-widest">Verified</span>
              )}
            </div>
            
            {!request.kycGranted ? (
              <div className="bg-amber-50 border border-amber-100 rounded-[2rem] p-8 flex items-center gap-6">
                <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-8 h-8 text-amber-600" />
                </div>
                <div className="space-y-1">
                  <p className="font-black text-amber-900">Private Vault Locked</p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Customer has not shared their ID/License yet. Approval is possible, but handover requires verification.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Name</label>
                    <p className="font-black text-gray-900 text-lg">{request.customerName}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Direct Contact</label>
                    <p className="font-black text-gray-900 text-lg">{request.customerPhone}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 flex items-center justify-between hover:border-gray-300 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <FileText className="w-5 h-5 text-gray-600" />
                      </div>
                      <span className="text-sm font-black text-gray-800">ID Document</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 flex items-center justify-between hover:border-gray-300 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <FileText className="w-5 h-5 text-gray-600" />
                      </div>
                      <span className="text-sm font-black text-gray-800">License Card</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Pricing Breakdown */}
          <section className="space-y-6">
            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
              <Wallet className="w-5 h-5 text-gray-400" /> Financial Breakdown
            </h3>
            <div className="bg-gray-50 rounded-[2rem] p-8 space-y-4 border border-gray-100">
              <div className="flex justify-between items-center group">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-tight">Base Hire ({request.days}d)</span>
                <span className="font-black text-gray-900">KSH {(request.baseRate * request.days).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-tight">Logistics & Delivery</span>
                <span className="font-black text-gray-900">KSH {request.logisticsFee.toLocaleString()}</span>
              </div>
              {request.chauffeurFee > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-500 uppercase tracking-tight">Chauffeur Service</span>
                  <span className="font-black text-gray-900">KSH {request.chauffeurFee.toLocaleString()}</span>
                </div>
              )}
               {request.washFee !== undefined && request.washFee > 0 && (
                 <div className="flex justify-between items-center">
                   <span className="text-sm font-bold text-gray-500 uppercase tracking-tight">Standard Prep / Wash</span>
                   <span className="font-black text-gray-900">KSH {request.washFee.toLocaleString()}</span>
                 </div>
               )}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <span className="text-sm font-bold text-gray-400 uppercase tracking-tight">Hire Subtotal</span>
                <span className="text-lg font-black text-gray-900">KSH {request.totalAmount.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Security Deposit</span>
                  <div className="px-1.5 py-0.5 bg-amber-200 text-amber-800 text-[8px] font-black rounded-full uppercase">Refundable</div>
                </div>
                <span className="font-black text-amber-900">KSH {request.depositAmount?.toLocaleString()}</span>
              </div>

              <div className="pt-4 border-t-2 border-dashed border-gray-200 flex justify-between items-center">
                <span className="text-md font-black text-gray-900 uppercase">Grand Total</span>
                <span className="text-2xl font-black text-primary-600 tracking-tighter">
                  KSH {(request.totalAmount + (request.depositAmount || 0)).toLocaleString()}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="p-10 bg-white border-t flex flex-wrap gap-4 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
          {request.status === "pending" && (
            <>
              <button 
                disabled={loading}
                className="flex-1 py-5 border-2 border-gray-100 text-gray-400 text-xs font-black uppercase tracking-widest rounded-[1.5rem] hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all"
              >
                Reject Request
              </button>
              <button 
                onClick={handleApprove}
                disabled={loading}
                className="flex-[2] py-5 bg-gray-900 text-white text-xs font-black uppercase tracking-widest rounded-[1.5rem] hover:bg-gray-800 transition-all shadow-2xl shadow-gray-900/20 flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Approve & Send Invoice <CheckCircle2 className="w-4 h-4" /></>}
              </button>
            </>
          )}

          {request.status === "approved" && (
            <button 
              onClick={() => setShowInspection("pre-release")}
              className="w-full py-5 bg-primary-600 text-white text-xs font-black uppercase tracking-widest rounded-[1.5rem] hover:bg-primary-700 transition shadow-xl flex items-center justify-center gap-3"
            >
              <ClipboardCheck className="w-5 h-5" /> Initiate Handover Protocol
            </button>
          )}

          {request.status === "active" && (
            <button 
              onClick={() => setShowInspection("post-return")}
              className="w-full py-5 bg-amber-500 text-white text-xs font-black uppercase tracking-widest rounded-[1.5rem] hover:bg-amber-600 transition shadow-xl flex items-center justify-center gap-3"
            >
              <RotateCcw className="w-5 h-5" /> Start Return Verification
            </button>
          )}

          {(request.status === "completed" || request.status === "rejected") && (
            <div className="w-full py-5 text-center text-xs text-gray-400 font-black uppercase tracking-widest bg-gray-50 rounded-[1.5rem] border border-gray-100">
              Contract Lifecycle: {request.status}
            </div>
          )}
        </div>
      </div>

      {showInspection && (
        <InspectionWizard 
          request={request}
          type={showInspection}
          onClose={() => setShowInspection(null)}
          onSuccess={() => {
            setShowInspection(null);
            onClose();
          }}
        />
      )}
    </div>
  );
}
