"use client";

import { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  doc, 
  deleteDoc,
  where,
  Timestamp,
  limit
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  Search, 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Trash2, 
  ExternalLink,
  Filter,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  Copy,
  XCircle
} from "lucide-react";
import { updateDoc } from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import { useModal } from "@/lib/admin-modal-context";


import { logError } from "@/lib/logger";interface BookingRequest {
  id: string;
  customerName: string;
  customerPhone: string;
  pickupLocation: string;
  destination: string;
  status: "pending" | "assigned" | "completed" | "cancelled";
  createdAt: any;
  fare?: number;
  driverId?: string;
}

export default function BookingsTab() {
  const modal = useModal();
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const search = searchParams.get("search") || "";

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    setLoading(true);
    try {
      const q = query(collection(db, "bookingRequests"), orderBy("createdAt", "desc"), limit(50));
      const snap = await getDocs(q);
      setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() } as BookingRequest)));
    } catch (err) {
      logError("BookingsTab", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    const ok = await modal.showConfirm("Delete this booking request forever?", "Delete Booking", "Delete");
    if (!ok) return;
    try {
      await deleteDoc(doc(db, "bookingRequests", id));
      setBookings(prev => prev.filter(b => b.id !== id));
    } catch (err: any) {
      modal.showAlert(`Failed: ${err.message}`, "error");
    }
  }

  async function handleCancelBooking(id: string) {
    const ok = await modal.showConfirm("Are you sure you want to cancel this booking?", "Cancel Booking", "Cancel");
    if (!ok) return;
    setActing(id);
    try {
      await updateDoc(doc(db, "bookingRequests", id), { status: "cancelled" });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: "cancelled" } : b));
      modal.showAlert("Booking cancelled", "info");
    } catch (err: any) {
      modal.showAlert(`Failed: ${err.message}`, "error");
    } finally {
      setActing(null);
      setActiveMenu(null);
    }
  }

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    modal.showAlert("Booking ID copied", "info");
    setActiveMenu(null);
  };

  const filtered = bookings.filter(b => {
    const matchSearch = b.customerName?.toLowerCase().includes(search.toLowerCase()) || 
                      b.pickupLocation?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100">
           <p className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
             <Clock size={14} className="text-indigo-400" />
             Live Dispatch Stream
           </p>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={16} className="text-slate-400" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-2 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer font-medium"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-slate-100">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
          <Calendar size={48} className="text-slate-200 mb-4" />
          <p className="text-slate-500 font-medium">No bookings found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((booking) => (
            <div key={booking.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{booking.customerName || "Guest"}</h3>
                    <p className="text-xs text-slate-500">{booking.customerPhone}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                  ${booking.status === "completed" ? "bg-primary-100 text-primary-700" : 
                    booking.status === "pending" ? "bg-amber-100 text-amber-700" : 
                    "bg-slate-100 text-slate-600"}
                `}>
                  {booking.status}
                </div>
              </div>

              <div className="space-y-3 mb-5">
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-indigo-500 mt-1 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-tight">Pickup</p>
                    <p className="text-slate-700 line-clamp-1">{booking.pickupLocation}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-rose-500 mt-1 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-tight">Destination</p>
                    <p className="text-slate-700 line-clamp-1">{booking.destination}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock size={14} />
                  <span>{booking.createdAt?.toDate ? booking.createdAt.toDate().toLocaleString() : "Just now"}</span>
                </div>
                <div className="flex gap-1 relative">
                  <button 
                    onClick={() => setActiveMenu(activeMenu === booking.id ? null : booking.id)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <MoreVertical size={16} />
                  </button>

                  {activeMenu === booking.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                      <div className="absolute right-6 bottom-10 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                        <button 
                          onClick={() => copyId(booking.id)}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          <Copy size={14} /> Copy ID
                        </button>
                        {booking.status !== "cancelled" && booking.status !== "completed" && (
                          <button 
                            onClick={() => handleCancelBooking(booking.id)}
                            disabled={acting === booking.id}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 transition-colors font-bold"
                          >
                            <XCircle size={14} /> Cancel Booking
                          </button>
                        )}
                        <div className="h-px bg-slate-50 my-1" />
                        <button 
                          onClick={() => handleDelete(booking.id)}
                          disabled={acting === booking.id}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors font-bold"
                        >
                          <Trash2 size={14} /> Delete Record
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
