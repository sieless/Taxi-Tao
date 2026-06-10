"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { HireRequest } from "@/lib/types";
import { 
  Calendar, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  Loader2,
  RefreshCcw,
  Zap,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import BookingList from "@/components/vendor/BookingList";
import HireRequestDetails from "@/components/vendor/HireRequestDetails";


import { logError } from "@/lib/logger";export default function BookingHubPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Accessing Satellite Operations...</p>
      </div>
    }>
      <BookingHubContent />
    </Suspense>
  );
}

function BookingHubContent() {
  const { user, userProfile } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [requests, setRequests] = useState<HireRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<HireRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !userProfile) return;
    const vendorId = userProfile.companyId;
    if (!vendorId) return;

    setLoading(true);
    const q = query(
      collection(db, "hireRequests"),
      where("companyId", "==", vendorId),
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
  }, [user, userProfile, mounted]);

  // Handle URL param for direct selection
  const searchParams = useSearchParams();
  const requestId = searchParams.get("id");

  useEffect(() => {
    if (requestId && requests.length > 0) {
      const target = requests.find(r => r.id === requestId);
      if (target) {
        setSelectedRequest(target);
      }
    }
  }, [requestId, requests]);

  const filteredRequests = requests.filter(req => {
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    const matchesSearch = req.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         req.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    pending: requests.filter(r => r.status === "pending").length,
    active: requests.filter(r => r.status === "active").length,
    completed: requests.filter(r => r.status === "completed").length
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-8 w-20 bg-gray-200 rounded-full animate-pulse" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 animate-pulse">
              <div className="h-3 w-1/2 bg-gray-200 rounded mb-2" />
              <div className="h-7 w-1/3 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/4 bg-gray-200 rounded" />
                  <div className="h-3 w-1/3 bg-gray-200 rounded" />
                </div>
                <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-gray-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Mission Control</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none uppercase">Booking Operations</h1>
          <p className="text-gray-500 font-medium text-sm">Real-time oversight of {requests.length} hire operations.</p>
        </div>
        
        <div className="flex gap-3">
          <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
            <button 
              onClick={() => setStatusFilter("all")}
              className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${statusFilter === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              All Assets
            </button>
            <button 
              onClick={() => setStatusFilter("pending")}
              className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${statusFilter === 'pending' ? 'bg-amber-500 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {stats.pending > 0 && <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
              Review
            </button>
            <button 
              onClick={() => setStatusFilter("active")}
              className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${statusFilter === 'active' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Active
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "New Requests", value: stats.pending, sub: "Action Required", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "On Trip", value: stats.active, sub: "Live Deployments", icon: Zap, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Completed", value: stats.completed, sub: "Revenue Generated", icon: CheckCircle, color: "text-primary-600", bg: "bg-primary-50" },
          { label: "Integrity Score", value: "99%", sub: "Service Reliability", icon: ShieldCheck, color: "text-blue-600", bg: "bg-blue-50" },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-6 shadow-inner`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-3xl font-black text-gray-900 tracking-tight">{stat.value}</p>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{stat.label}</p>
            <p className="text-[9px] text-gray-400 font-bold mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Control Tools */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Locate deployment by customer name or request ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-gray-50 border-transparent focus:bg-white focus:border-gray-200 rounded-2xl text-sm font-bold outline-none transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-6 py-4 bg-white border border-gray-100 rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition shadow-sm">
          <Filter className="w-4 h-4" /> Operational Filters
        </button>
      </div>

      {/* Booking List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-dashed border-gray-200">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
          <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Syncing Satellite Data...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-100 rounded-[3rem] p-32 text-center">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <Calendar className="w-10 h-10 text-gray-200" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2 uppercase">Quiet Ops</h2>
          <p className="text-gray-400 max-w-sm mx-auto mb-10 font-medium leading-relaxed">
            {searchQuery || statusFilter !== 'all' 
              ? "No hire operations match your current filter criteria."
              : "Awaiting incoming requests from the Marketplace."}
          </p>
        </div>
      ) : (
        <div className="animate-in fade-in duration-700">
          <BookingList 
            requests={filteredRequests} 
            onSelectRequest={(req) => setSelectedRequest(req)} 
          />
        </div>
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
