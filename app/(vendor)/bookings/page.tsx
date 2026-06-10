"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/firestore-constants";
import { HireRequest } from "@/lib/types";
import { 
  Calendar, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  XCircle,
  Loader2,
  RefreshCcw
} from "lucide-react";
import BookingList from "@/components/vendor/BookingList";
import HireRequestDetails from "@/components/vendor/HireRequestDetails";


import { logError } from "@/lib/logger";export default function BookingHubPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<HireRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<HireRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    // Listen for hire requests where companyId matches user.uid
    const q = query(
      collection(db, COLLECTIONS.HIRE_REQUESTS),
      where("companyId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as HireRequest));
      setRequests(requestsData);
      setLoading(false);
    }, (error) => {
      logError("page", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredRequests = requests.filter(req => 
    statusFilter === "all" || req.status === statusFilter
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Booking Hub</h1>
          <p className="text-gray-500 mt-1">Manage incoming hire requests and verify customer documents.</p>
        </div>
      </div>

      {/* Tabs / Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-2 rounded-2xl border shadow-sm overflow-x-auto">
        <button 
          onClick={() => setStatusFilter("all")}
          className={`px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
            statusFilter === "all" ? "bg-gray-900 text-white shadow-lg" : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          All Requests ({requests.length})
        </button>
        <button 
          onClick={() => setStatusFilter("pending")}
          className={`px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
            statusFilter === "pending" ? "bg-amber-500 text-white shadow-lg" : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          <Clock className="w-4 h-4" /> Pending ({requests.filter(r => r.status === "pending").length})
        </button>
        <button 
          onClick={() => setStatusFilter("approved")}
          className={`px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
            statusFilter === "approved" ? "bg-primary-600 text-white shadow-lg" : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          <CheckCircle className="w-4 h-4" /> Approved ({requests.filter(r => r.status === "approved").length})
        </button>
        <button 
          onClick={() => setStatusFilter("active")}
          className={`px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
            statusFilter === "active" ? "bg-blue-600 text-white shadow-lg" : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          <RefreshCcw className="w-4 h-4" /> Active ({requests.filter(r => r.status === "active").length})
        </button>
      </div>

      {/* Booking List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Syncing requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-20 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-gray-300" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Requests Found</h2>
          <p className="text-gray-500 max-w-sm mx-auto">
            When customers request to hire your vehicles, they will appear here in real-time.
          </p>
        </div>
      ) : (
        <BookingList 
          requests={filteredRequests} 
          onSelectRequest={(req) => setSelectedRequest(req)} 
        />
      )}

      {/* Details Modal */}
      {selectedRequest && (
        <HireRequestDetails 
          request={selectedRequest} 
          onClose={() => setSelectedRequest(null)} 
        />
      )}
    </div>
  );
}
