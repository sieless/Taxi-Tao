"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  User,
  Car,
  Calendar,
  Phone,
  MessageCircle,
} from "lucide-react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { HireRequest } from "@/lib/types";
import {
  updateHireRequestStatus,
  rejectHireRequest,
} from "@/lib/carhire/hire-request-service";
import { calculateRentalTimer } from "@/lib/carhire/rental-timer-utils";


import { logError } from "@/lib/logger";/**
 * Pending Rentals Page
 *
 * Shows hire requests awaiting approval with:
 * - Real-time list from Firestore
 * - Approve/Reject actions
 * - WhatsApp shortcut for customer contact
 */
export default function PendingRentalsPage() {
  const { userProfile } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [requests, setRequests] = useState<HireRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !userProfile?.companyId) return;

    const q = query(
      collection(db, "hireRequests"),
      where("companyId", "==", userProfile.companyId),
      where("status", "==", "pending"),
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

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await updateHireRequestStatus(requestId, "approved");
    } catch (error) {
      logError("page", error);
      alert("Failed to approve request. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!confirm("Are you sure you want to reject this request?")) return;
    setProcessingId(requestId);
    try {
      await rejectHireRequest(requestId, "Rejected by company");
    } catch (error) {
      logError("page", error);
      alert("Failed to reject request. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${cleanPhone}`, "_blank");
  };

  const filteredRequests = requests.filter(
    (req) =>
      req.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: any) => {
    if (!date) return "N/A";
    if (date.toDate) return date.toDate().toLocaleDateString();
    if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString();
    return new Date(date).toLocaleDateString();
  };

  if (!mounted || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh]">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        <p className="mt-4 text-gray-500 font-medium">
          Loading pending rentals...
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
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-center">
          <p className="text-2xl font-black text-amber-700">
            {requests.length}
          </p>
          <p className="text-[10px] text-amber-600 uppercase font-black">
            Pending Review
          </p>
        </div>
        <div className="bg-primary-50 p-4 rounded-2xl border border-primary-100 text-center">
          <p className="text-2xl font-black text-primary-700">
            {requests.filter((r) => r.kycGranted).length}
          </p>
          <p className="text-[10px] text-primary-600 uppercase font-black">
            KYC Verified
          </p>
        </div>
        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-center">
          <p className="text-2xl font-black text-blue-700">
            {requests.filter((r) => r.handoverMode === "delivery").length}
          </p>
          <p className="text-[10px] text-blue-600 uppercase font-black">
            Delivery Mode
          </p>
        </div>
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-100 rounded-[2rem] p-16 text-center">
          <CheckCircle className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-black text-gray-900 mb-2">
            All Caught Up!
          </h3>
          <p className="text-gray-500 font-medium">
            No pending hire requests at the moment.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-black text-gray-900">
                      {request.customerName || "Unknown Customer"}
                    </p>
                    <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {request.customerPhone || "N/A"}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-black rounded-full uppercase">
                  Pending
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 py-4 border-t border-gray-50">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-black">
                    Vehicle
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {request.vehicleName || request.vehicleId.substring(0, 8)}
                  </p>
                </div>
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
                    Total Amount
                  </p>
                  <p className="text-sm font-black text-indigo-600">
                    KSH {request.totalAmount?.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleApprove(request.id)}
                  disabled={processingId === request.id}
                  className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processingId === request.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" /> Approve
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleReject(request.id)}
                  disabled={processingId === request.id}
                  className="py-3 px-6 border border-red-200 text-red-600 rounded-xl font-bold text-sm hover:bg-red-50 transition disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                </button>
                {request.customerPhone && (
                  <button
                    onClick={() => openWhatsApp(request.customerPhone!)}
                    className="py-3 px-4 bg-primary-500 text-white rounded-xl font-bold text-sm hover:bg-primary-600 transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
