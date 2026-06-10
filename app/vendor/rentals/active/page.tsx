"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  Clock,
  CheckCircle,
  Loader2,
  Search,
  Car,
  Calendar,
  ClipboardCheck,
  Eye,
  FileText,
  Phone,
  MessageCircle,
  Receipt,
  CreditCard,
  ShieldCheck,
  Zap,
  AlertTriangle,
} from "lucide-react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { HireRequest, HireReceipt, HirePayment } from "@/lib/types";
import RentalTimer from "@/components/vendor/RentalTimer";
import InspectionWizard from "@/components/vendor/InspectionWizard";
import HireReceiptView from "@/components/vendor/HireReceiptView";
import HirePaymentModal from "@/components/vendor/HirePaymentModal";
import { calculateRentalTimer, TimerState } from "@/lib/carhire/rental-timer-utils";


import { logError } from "@/lib/logger";
/**
 * Active Rentals Page
 *
 * Shows currently active/approved rentals with:
 * - Real-time list from Firestore
 * - Rental timer countdown with overdue indicator
 * - Customer contact (call / WhatsApp)
 * - Payment status (paid / partial / unpaid)
 * - Receipt view
 * - Payment confirmation modal
 * - Dispatch to staff
 * - Owner approved badge
 * - Check-in completion
 * - Inspection triggers
 */
export default function ActiveRentalsPage() {
  const { userProfile } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [requests, setRequests] = useState<HireRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<HireRequest | null>(null);
  const [inspectionType, setInspectionType] = useState<"pre-release" | "post-return">("pre-release");
  const [showInspection, setShowInspection] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);

  const [receiptRequest, setReceiptRequest] = useState<HireRequest | null>(null);
  const [paymentRequest, setPaymentRequest] = useState<HireRequest | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !userProfile?.companyId) return;

    const q = query(
      collection(db, "hireRequests"),
      where("companyId", "==", userProfile.companyId),
      where("status", "in", ["approved", "active"]),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as HireRequest)
        );
        setRequests(data);
        setLoading(false);
      },
      (error) => {
        logError("page", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [mounted, userProfile?.companyId]);

  const handleInspectionSuccess = () => {
    setShowInspection(false);
    setSelectedRequest(null);
  };

  const handleDispatch = async (request: HireRequest) => {
    try {
      await updateDoc(doc(db, "hireRequests", request.id), {
        dispatchedToStaff: true,
        dispatchedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      logError("ActiveRentals", error);
      alert("Could not dispatch to staff. Please try again.");
    }
  };

  const formatDate = (date: any) => {
    if (!date) return "N/A";
    if (date.toDate) return date.toDate().toLocaleDateString();
    if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString();
    return new Date(date).toLocaleDateString();
  };

  const filteredRequests = requests.filter(
    (req) =>
      req.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!mounted || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh]">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        <p className="mt-4 text-gray-500 font-medium">
          Loading active rentals...
        </p>
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
            placeholder="Search by customer name or request ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-gray-200 rounded-xl text-sm font-bold outline-none transition-all"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-primary-50 p-4 rounded-2xl border border-primary-100 text-center">
          <p className="text-2xl font-black text-primary-700">
            {requests.filter((r) => r.status === "active").length}
          </p>
          <p className="text-[10px] text-primary-600 uppercase font-black">
            Active Rentals
          </p>
        </div>
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-center">
          <p className="text-2xl font-black text-amber-700">
            {requests.filter((r) => r.status === "approved").length}
          </p>
          <p className="text-[10px] text-amber-600 uppercase font-black">
            Awaiting Handover
          </p>
        </div>
        <div className="bg-red-50 p-4 rounded-2xl border border-red-100 text-center">
          <p className="text-2xl font-black text-red-700">
            {requests.filter((r) => {
              const timer = calculateRentalTimer(r.startDate, r.endDate);
              return timer.isOverdue;
            }).length}
          </p>
          <p className="text-[10px] text-red-600 uppercase font-black">
            Overdue
          </p>
        </div>
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-100 rounded-[2rem] p-16 text-center">
          <Car className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-black text-gray-900 mb-2">
            No Active Rentals
          </h3>
          <p className="text-gray-500 font-medium">
            Active rentals will appear here once approved.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <ActiveRentalCard
              key={request.id}
              request={request}
              formatDate={formatDate}
              onInspect={(type, view) => {
                setSelectedRequest(request);
                setInspectionType(type);
                setViewOnly(view);
                setShowInspection(true);
              }}
              onDispatch={() => handleDispatch(request)}
              onViewReceipt={() => setReceiptRequest(request)}
              onConfirmPayment={() => setPaymentRequest(request)}
            />
          ))}
        </div>
      )}

      {/* Inspection Modal */}
      {showInspection && selectedRequest && (
        <InspectionWizard
          request={selectedRequest}
          type={inspectionType}
          onClose={() => {
            setShowInspection(false);
            setSelectedRequest(null);
            setViewOnly(false);
          }}
          onSuccess={handleInspectionSuccess}
          viewOnly={viewOnly}
        />
      )}

      {/* Receipt Modal */}
      {receiptRequest?.receipt && (
        <HireReceiptView
          receipt={receiptRequest.receipt}
          onClose={() => setReceiptRequest(null)}
        />
      )}

      {/* Payment Confirmation Modal */}
      {paymentRequest && (
        <PaymentConfirmationBridge
          request={paymentRequest}
          onClose={() => setPaymentRequest(null)}
        />
      )}
    </div>
  );
}

function ActiveRentalCard({
  request,
  formatDate,
  onInspect,
  onDispatch,
  onViewReceipt,
  onConfirmPayment,
}: {
  request: HireRequest;
  formatDate: (date: any) => string;
  onInspect: (type: "pre-release" | "post-return", viewOnly: boolean) => void;
  onDispatch: () => void;
  onViewReceipt: () => void;
  onConfirmPayment: () => void;
}) {
  const [timer, setTimer] = useState<TimerState>(() =>
    calculateRentalTimer(request.startDate, request.endDate)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(calculateRentalTimer(request.startDate, request.endDate));
    }, 60000);
    return () => clearInterval(interval);
  }, [request.startDate, request.endDate]);

  const isActive = request.status === "active";
  const isApproved = request.status === "approved";
  const isDispatched = (request as any).dispatchedToStaff === true && isApproved;
  const isInspected = request.preReleaseInspection?.status === "complete";
  const isReturned = request.postReturnInspection?.status === "complete";

  const amountPaid = request.amountPaid || 0;
  const totalAmount = request.totalAmount || 0;
  const balanceRemaining = Math.max(0, totalAmount - amountPaid);
  const isFullyPaid = balanceRemaining <= 0 && amountPaid > 0;
  const isPartial = amountPaid > 0 && !isFullyPaid;
  const isUnpaid = amountPaid === 0;

  const handleCall = () => {
    if (request.customerPhone) {
      window.open(`tel:${request.customerPhone}`, "_self");
    }
  };

  const handleWhatsApp = () => {
    if (request.customerPhone) {
      const msg = `Hello ${request.customerName}, this is ${request.companyName || "your rental partner"}.`;
      window.open(
        `https://wa.me/${request.customerPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(msg)}`,
        "_blank"
      );
    }
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition">
      {/* Header: Vehicle + Status */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden ${
              isActive
                ? "bg-primary-100 text-primary-600"
                : isDispatched
                ? "bg-indigo-100 text-indigo-600"
                : "bg-amber-100 text-amber-600"
            }`}
          >
            {request.vehicleImage ? (
              <img
                src={request.vehicleImage}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <Car className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-black text-gray-900">
                {request.vehicleName || "Vehicle"}
              </p>
              {request.vehiclePlate && (
                <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                  {request.vehiclePlate}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 font-medium">
              {request.customerName || "Unknown Customer"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isInspected && isApproved && (
            <span className="px-2 py-1 text-[10px] font-black rounded-full bg-indigo-100 text-indigo-700 uppercase flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Approved
            </span>
          )}
          <span
            className={`px-3 py-1 text-xs font-black rounded-full uppercase ${
              isActive
                ? "bg-primary-100 text-primary-700"
                : isDispatched
                ? "bg-indigo-100 text-indigo-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {isActive
              ? "Live"
              : isDispatched
              ? "Dispatched"
              : "Awaiting Release"}
          </span>
        </div>
      </div>

      {/* Rental Timer */}
      <div className="mb-4">
        <RentalTimer startDate={request.startDate} endDate={request.endDate} />
      </div>

      {/* Customer Contact */}
      {request.customerPhone && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold text-xs">
            {request.customerName?.charAt(0) || "C"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">
              {request.customerName}
            </p>
            <p className="text-xs text-gray-500">{request.customerPhone}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCall}
              className="p-2 bg-primary-100 text-primary-600 rounded-xl hover:bg-primary-200 transition"
              title="Call customer"
            >
              <Phone className="w-4 h-4" />
            </button>
            <button
              onClick={handleWhatsApp}
              className="p-2 bg-primary-100 text-primary-600 rounded-xl hover:bg-primary-200 transition"
              title="WhatsApp customer"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Rental Details */}
      <div className="grid grid-cols-3 gap-4 mb-4 py-4 border-t border-gray-50">
        <div>
          <p className="text-[10px] text-gray-400 uppercase font-black">
            Duration
          </p>
          <p className="text-sm font-bold text-gray-900">
            {request.days} days
          </p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 uppercase font-black">
            Start Date
          </p>
          <p className="text-sm font-bold text-gray-900">
            {formatDate(request.startDate)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 uppercase font-black">
            Total
          </p>
          <p className="text-sm font-black text-indigo-600">
            KSH {totalAmount.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Payment Status */}
      <div className="mb-4 py-3 border-t border-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-bold text-gray-500 uppercase">
              Payment
            </span>
          </div>
          {isFullyPaid ? (
            <span className="px-2 py-1 text-[10px] font-black rounded-full bg-primary-100 text-primary-700 uppercase">
              Fully Paid
            </span>
          ) : isPartial ? (
            <span className="px-2 py-1 text-[10px] font-black rounded-full bg-amber-100 text-amber-700 uppercase">
              Partial
            </span>
          ) : (
            <span className="px-2 py-1 text-[10px] font-black rounded-full bg-red-100 text-red-700 uppercase">
              Unpaid
            </span>
          )}
        </div>
        <div className="flex gap-4 mt-2 text-xs">
          <span className="text-gray-500">
            Paid: <span className="font-bold text-gray-900">KSH {amountPaid.toLocaleString()}</span>
          </span>
          {!isFullyPaid && (
            <span className="text-gray-500">
              Balance: <span className="font-bold text-red-600">KSH {balanceRemaining.toLocaleString()}</span>
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        {isApproved && !isDispatched && !isInspected && (
          <button
            onClick={() => onInspect("pre-release", false)}
            className="flex-1 min-w-[120px] py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition flex items-center justify-center gap-2"
          >
            <ClipboardCheck className="w-4 h-4" /> Start Handover
          </button>
        )}
        {isApproved && !isDispatched && isInspected && (
          <button
            onClick={onDispatch}
            className="flex-1 min-w-[120px] py-3 bg-indigo-100 text-indigo-700 rounded-xl font-bold text-sm hover:bg-indigo-200 transition flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" /> Dispatch to Staff
          </button>
        )}
        {isDispatched && (
          <span className="flex-1 min-w-[120px] py-3 bg-indigo-50 text-indigo-500 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Awaiting Inspection
          </span>
        )}
        {isActive && !isReturned && (
          <button
            onClick={() => onInspect("post-return", false)}
            className="flex-1 min-w-[120px] py-3 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 transition flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" /> Check-In Return
          </button>
        )}
        {isInspected && (
          <button
            onClick={() => onInspect("pre-release", true)}
            className="py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" /> Inspection
          </button>
        )}
        {isReturned && (
          <button
            onClick={() => onInspect("post-return", true)}
            className="py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" /> Return
          </button>
        )}
        {request.receipt && (
          <button
            onClick={onViewReceipt}
            className="py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition flex items-center justify-center gap-2"
          >
            <Receipt className="w-4 h-4" /> Receipt
          </button>
        )}
        {!isFullyPaid && isActive && (
          <button
            onClick={onConfirmPayment}
            className="py-3 px-4 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 transition flex items-center justify-center gap-2"
          >
            <CreditCard className="w-4 h-4" /> Payment
          </button>
        )}
      </div>
    </div>
  );
}

function PaymentConfirmationBridge({
  request,
  onClose,
}: {
  request: HireRequest;
  onClose: () => void;
}) {
  const [payments, setPayments] = useState<HirePayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "hirePayments"),
      where("hireRequestId", "==", request.id),
      where("status", "==", "pending")
    );
    const unsub = onSnapshot(q, (snap) => {
      setPayments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as HirePayment)));
      setLoading(false);
    });
    return () => unsub();
  }, [request.id]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[400] flex items-center justify-center">
        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin relative z-10" />
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gray-900/60 backdrop-bl-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl p-8 text-center max-w-sm w-full">
          <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-bold text-gray-900">No Pending Payments</p>
          <p className="text-sm text-gray-500 mt-1">There are no pending payments for this rental.</p>
          <button onClick={onClose} className="mt-4 px-6 py-2 bg-gray-100 rounded-xl text-sm font-bold hover:bg-gray-200 transition">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <HirePaymentModal
      payment={payments[0]}
      onClose={onClose}
      onSuccess={onClose}
    />
  );
}
