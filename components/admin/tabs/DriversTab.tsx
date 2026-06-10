"use client";

import { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  limit,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Driver, Vehicle } from "@/lib/types";
import { 
  Car, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Users, 
  Phone, 
  Mail, 
  MapPin, 
  Star, 
  Trash2, 
  MessageSquare, 
  Eye,
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap, 
  MoreVertical,
  Copy,
  Ban,
  UserX,
  X,
  Download,
  Image as ImageIcon,
  FileText,
  BadgeCheck
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { forceTokenRefresh } from "@/lib/admin-service";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { suspendUser, unsuspendUser } from "@/lib/admin-user-service";
import { useModal } from "@/lib/admin-modal-context";
import { 
  manuallyActivateSubscription, 
  sendAdminMessage,
  approveDriverKYC,
  rejectDriverKYC,
  updateDriverVehicle,
  syncVehicleToMarketplace 
} from "@/lib/admin-service";
import { deleteUser as deleteUserFn } from "@/lib/admin-user-service";
import { useAuth } from "@/lib/auth-context";
import { hasAdminPermission } from "@/lib/admin-permission-helper";


import { logError } from "@/lib/logger";export default function DriversTab() {
  const { user, userProfile } = useAuth();
  const modal = useModal();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  
  const canManage = hasAdminPermission(userProfile, "manageDrivers");

  const searchParams = useSearchParams();
  const search = searchParams.get("search") || "";

  useEffect(() => {
    setLoading(true);
    let q;
    
    if (search) {
      // Database-level prefix search on Name
      // Note: This only works for prefix matching (starts with)
      // For true "contains" search, a third-party engine like Algolia is required
      const searchTerm = search.charAt(0).toUpperCase() + search.slice(1);
      q = query(
        collection(db, "drivers"),
        where("name", ">=", searchTerm),
        where("name", "<=", searchTerm + "\uf8ff"),
        limit(50)
      );
    } else {
      q = query(
        collection(db, "drivers"), 
        orderBy("createdAt", "desc"), 
        limit(100)
      );
    }

    const unsub = onSnapshot(q, (snap) => {
      setDrivers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Driver)));
      setLoading(false);
    }, (err) => {
      logError("DriversTab", err);
      // Fallback or alert if indexes are missing
      setLoading(false);
    });
    return () => unsub();
  }, [search]); // Re-run when search changes

  async function handleActivate(driverId: string) {
    const ok = await modal.showConfirm("Manually activate this driver's subscription?", "Activate Subscription", "Activate");
    if (!ok) return;
    setActing(driverId);
    try {
      await manuallyActivateSubscription(driverId, user?.uid || "admin");
      modal.showAlert("Subscription activated", "success");
    } catch (err: any) {
      modal.showAlert(`Failed: ${err.message}`, "error");
    } finally {
      setActing(null);
    }
  }

  async function handleDelete(driver: Driver) {
    const ok = await modal.showConfirm(`Permanently DELETE ${driver.name}? This cannot be undone.`, "Delete Driver", "Delete");
    if (!ok) return;
    try {
      await deleteUserFn(driver.id, driver.email || "", user?.uid || "admin");
      modal.showAlert("Driver deleted", "success");
    } catch (err: any) {
      modal.showAlert(`Failed: ${err.message}`, "error");
    }
  }

  async function handleApproveKyc(driverId: string) {
    const ok = await modal.showConfirm("Approve this driver's KYC documents?", "Approve KYC", "Approve");
    if (!ok) return;
    setActing(driverId);
    try {
      await forceTokenRefresh();
      await approveDriverKYC(driverId, user?.uid || "admin");
      modal.showAlert("KYC approved", "success");
      setSelectedDriver(prev => prev ? { ...prev, kycStatus: "approved" } : null);
    } catch (err: any) {
      modal.showAlert(`Failed: ${err.message}`, "error");
    } finally {
      setActing(null);
    }
  }

  async function handleRejectKyc(driverId: string) {
    const reason = await modal.showPrompt("Rejection Reason", "e.g., Blurred documents, expired ID...");
    if (!reason) return;
    setActing(driverId);
    try {
      await forceTokenRefresh();
      await rejectDriverKYC(driverId, user?.uid || "admin", reason);
      modal.showAlert("KYC rejected", "info");
      setSelectedDriver(prev => prev ? { ...prev, kycStatus: "rejected" } : null);
    } catch (err: any) {
      modal.showAlert(`Failed: ${err.message}`, "error");
    } finally {
      setActing(null);
    }
  }

  async function handleSendMessage(driver: Driver) {
    const msg = await modal.showPrompt(`Message to ${driver.name}`, "Type your message...");
    if (!msg) return;
    try {
      await sendAdminMessage(driver.id, msg, user?.uid || "admin");
      modal.showAlert("Message sent", "success");
    } catch (err: any) {
      modal.showAlert(`Failed: ${err.message}`, "error");
    }
  }

  async function handleToggleSuspension(driver: Driver) {
    const isSuspended = driver.subscriptionStatus === "suspended";
    const action = isSuspended ? "Unsuspend" : "Suspend";
    const ok = await modal.showConfirm(`${action} account for ${driver.name}?`, `${action} Driver`, action);
    if (!ok) return;
    setActing(driver.id);
    try {
      if (isSuspended) {
        await unsuspendUser(driver.id, user?.uid || "admin");
        modal.showAlert("Driver unsuspended", "success");
      } else {
        await suspendUser(driver.id, driver.email || "", user?.uid || "admin");
        modal.showAlert("Driver suspended", "success");
      }
    } catch (err: any) {
      modal.showAlert(`Failed: ${err.message}`, "error");
    } finally {
      setActing(null);
      setActiveMenu(null);
    }
  }

async function handleToggleRental(driverId: string, vehicle: any) {
  const newVal = !vehicle.isRental;
  const action = newVal ? "Enable Car Hire" : "Disable Car Hire";
  const ok = await modal.showConfirm(`${action} for vehicle ${vehicle.plate}?`, action, newVal ? "Enable" : "Disable");
  if (!ok) return;
  
  setActing(driverId + vehicle.id);
   try {
    // 1. Update the driver document's vehicle array
    await updateDriverVehicle(driverId, vehicle.id, { isRental: newVal }, user?.uid || "admin");
    
    // 2. If enabling, sync to marketplace
    if (newVal) {
      await syncVehicleToMarketplace({ ...vehicle, isRental: newVal, driverId }, user?.uid || "admin");
      modal.showAlert("Vehicle listed for hire", "success");
    } else {
      modal.showAlert("Vehicle removed from hire", "info");
    }
    
    // Refresh local state
    setSelectedDriver(prev => {
      if (!prev) return null;
      return {
        ...prev,
        vehicles: prev.vehicles?.map(v => v.id === vehicle.id ? { ...v, isRental: newVal as boolean } : v)
      };
    });
  } catch (err: any) {
    modal.showAlert(`Failed: ${err.message}`, "error");
  } finally {
    setActing(null);
  }
}

async function handleUpdateVehicleStatus(driverId: string, vehicle: any, newStatus: string) {
  // Validate that newStatus is a valid Vehicle status
  const validStatuses = ["draft", "active", "suspended", "pending_approval", "in_use", "hired"] as const;
  if (!validStatuses.includes(newStatus as typeof validStatuses[number])) {
    modal.showAlert(`Invalid vehicle status: ${newStatus}`, "error");
    return;
  }

  // Cast to the correct type
  const status = newStatus as Vehicle["status"];

  setActing(driverId + vehicle.id);
  try {
    await updateDriverVehicle(driverId, vehicle.id, { status }, user?.uid || "admin");
    
    // If listed for hire, sync status change to marketplace
    if (vehicle.isRental) {
      await syncVehicleToMarketplace({ ...vehicle, status, driverId }, user?.uid || "admin");
    }
    
    modal.showAlert(`Status updated to ${newStatus}`, "success");
    
    // Refresh local state
    setSelectedDriver(prev => {
      if (!prev) return null;
      return {
        ...prev,
        vehicles: prev.vehicles?.map(v => v.id === vehicle.id ? { ...v, status } : v)
      };
    });
  } catch (err: any) {
    modal.showAlert(`Failed: ${err.message}`, "error");
  } finally {
    setActing(null);
  }
}

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    modal.showAlert("Driver ID copied", "info");
    setActiveMenu(null);
  };

  const filtered = drivers.filter(d => {
    const matchSearch = d.name?.toLowerCase().includes(search.toLowerCase()) || 
                      d.phone?.includes(search) || 
                      d.email?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || d.subscriptionStatus === filter;
    return matchSearch && matchFilter;
  });

  const getStatusStyle = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-primary-100 text-primary-700 border-primary-200",
      pending: "bg-amber-100 text-amber-700 border-amber-200",
      expired: "bg-rose-100 text-rose-700 border-rose-200",
      suspended: "bg-slate-100 text-slate-600 border-slate-200",
    };
    return styles[status] || styles.suspended;
  };

  return (
    <div className="space-y-6">
      {/* Header Stats & Search */}
      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total</p>
            <p className="text-xl font-bold text-slate-900">{drivers.length}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-primary-500">Active</p>
            <p className="text-xl font-bold text-slate-900">{drivers.filter(d => d.subscriptionStatus === "active").length}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-amber-500">Pending</p>
            <p className="text-xl font-bold text-slate-900">{drivers.filter(d => d.subscriptionStatus === "pending").length}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-rose-500">Expired</p>
            <p className="text-xl font-bold text-slate-900">{drivers.filter(d => d.subscriptionStatus === "expired").length}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-4 focus:ring-indigo-500/10 cursor-pointer shadow-sm"
          >
            <option value="all">Filter by Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="expired">Expired</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Driver List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Driver</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Performance</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Subscription</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No drivers found</td>
                </tr>
              ) : (
                filtered.map((driver) => (
                  <tr key={driver.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                          {driver.profilePhotoUrl ? <img src={driver.profilePhotoUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">{driver.name?.charAt(0)}</div>}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{driver.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{driver.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-xs font-bold text-slate-700">{driver.totalRides || 0}</p>
                          <p className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">Rides</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star size={10} className="fill-amber-400 text-amber-400" />
                          <span className="text-xs font-bold text-slate-700">{driver.averageRating?.toFixed(1) || "—"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`w-fit px-2 py-0.5 text-[9px] font-bold uppercase rounded-md border ${getStatusStyle(driver.subscriptionStatus)}`}>
                          {driver.subscriptionStatus}
                        </span>
                        {driver.nextPaymentDue && (
                          <p className="text-[9px] text-slate-400">Due: {driver.nextPaymentDue.toDate().toLocaleDateString()}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <MapPin size={12} className="text-slate-400" />
                        <span className="truncate max-w-[120px]">{driver.currentLocation || "Offline"}</span>
                      </div>
                    </td>
                     <td className="px-6 py-4 relative">
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => setSelectedDriver(driver)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View Profile"
                        >
                          <Eye size={16} />
                        </button>
                        
                        <button 
                          onClick={() => setActiveMenu(activeMenu === driver.id ? null : driver.id)}
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {activeMenu === driver.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                            <div className="absolute right-6 top-12 w-52 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                              <button 
                                onClick={() => copyId(driver.id)}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                              >
                                <Copy size={14} /> Copy Driver ID
                              </button>
                              <button 
                                onClick={() => handleSendMessage(driver)}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                              >
                                <MessageSquare size={14} /> Send Message
                              </button>
                              <a 
                                href={`https://wa.me/${driver.whatsapp || driver.phone}`}
                                target="_blank"
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                              >
                                <Zap size={14} /> WhatsApp Chat
                              </a>
                              <div className="h-px bg-slate-50 my-1" />
                              <button 
                                onClick={() => handleToggleSuspension(driver)}
                                disabled={acting === driver.id}
                                className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors font-bold ${driver.subscriptionStatus === 'suspended' ? 'text-primary-600 hover:bg-primary-50' : 'text-amber-600 hover:bg-amber-50'}`}
                              >
                                {driver.subscriptionStatus === 'suspended' ? <CheckCircle size={14} /> : <Ban size={14} />}
                                {driver.subscriptionStatus === 'suspended' ? 'Unsuspend Driver' : 'Suspend Driver'}
                              </button>
                              <button 
                                onClick={() => handleDelete(driver)}
                                disabled={acting === driver.id}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors font-bold"
                              >
                                <UserX size={14} /> Delete Driver
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Driver Detail Modal (Slide-over style) */}
      {selectedDriver && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedDriver(null)} />
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                  {selectedDriver.profilePhotoUrl ? <img src={selectedDriver.profilePhotoUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400 text-xl font-bold">{selectedDriver.name?.charAt(0)}</div>}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedDriver.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border ${getStatusStyle(selectedDriver.subscriptionStatus)}`}>
                      {selectedDriver.subscriptionStatus}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{selectedDriver.id}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedDriver(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleSendMessage(selectedDriver)}
                  className="flex items-center justify-center gap-2 p-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
                >
                  <MessageSquare size={16} /> Send Message
                </button>
                <a 
                  href={`https://wa.me/${selectedDriver.whatsapp || selectedDriver.phone}`}
                  target="_blank"
                  className="flex items-center justify-center gap-2 p-3 bg-primary-500 text-white rounded-2xl font-bold text-sm hover:bg-primary-600 transition shadow-lg shadow-primary-100"
                >
                  <Zap size={16} /> WhatsApp
                </a>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl text-center">
                  <p className="text-lg font-bold text-slate-900">{selectedDriver.totalRides || 0}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Total Rides</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star size={14} className="fill-amber-400 text-amber-400" />
                    <p className="text-lg font-bold text-slate-900">{selectedDriver.averageRating?.toFixed(1) || "—"}</p>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Rating</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl text-center">
                  <p className="text-lg font-bold text-slate-900">{selectedDriver.experienceYears || "—"}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Exp (Yrs)</p>
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Contact Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                      <div className="flex items-center gap-3">
                        <Phone size={16} className="text-slate-300" />
                        <span className="text-sm text-slate-600">{selectedDriver.phone}</span>
                      </div>
                      <ExternalLink size={14} className="text-slate-300" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                      <div className="flex items-center gap-3">
                        <Mail size={16} className="text-slate-300" />
                        <span className="text-sm text-slate-600">{selectedDriver.email || "No email"}</span>
                      </div>
                      <ExternalLink size={14} className="text-slate-300" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Vehicle Fleet</h3>
                  <div className="space-y-4">
                    {selectedDriver.vehicles?.map((v, i) => (
                      <div key={i} className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                        <div className="p-4 flex items-center justify-between border-b border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg text-slate-400"><Car size={16} /></div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{v.year} {v.make} {v.model}</p>
                              <p className="text-[10px] text-slate-500">{v.plate} · {v.type}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                         <select 
                               value={v.status}
                               onChange={(e) => handleUpdateVehicleStatus(selectedDriver.id, v, e.target.value)}
                               disabled={acting === selectedDriver.id + v.id}
                               className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20"
                             >
                               <option value="draft">Draft</option>
                               <option value="active">Active</option>
                               <option value="suspended">Suspended</option>
                               <option value="pending_approval">Pending Approval</option>
                               <option value="in_use">In Use</option>
                               <option value="hired">Hired</option>
                             </select>
                            
                            <button 
                              onClick={() => handleToggleRental(selectedDriver.id, v)}
                              disabled={acting === selectedDriver.id + v.id}
                              className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border
                                ${v.isRental 
                                  ? "bg-indigo-600 text-white border-indigo-600" 
                                  : "bg-white text-slate-400 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"}
                              `}
                            >
                              {acting === selectedDriver.id + v.id ? "..." : (v.isRental ? "Listed" : "List for Hire")}
                            </button>
                          </div>
                        </div>
                        {v.images && v.images.length > 0 && (
                          <div className="p-4 grid grid-cols-2 gap-2">
                            {v.images.map((img, idx) => (
                              <a key={idx} href={img} target="_blank" className="relative group">
                                <img src={img} alt="" className="w-full aspect-video object-cover rounded-xl border border-slate-200 shadow-sm" />
                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                                  <ImageIcon size={20} className="text-white" />
                                </div>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {!selectedDriver.vehicles?.length && <p className="text-sm text-slate-400 italic">No vehicles registered</p>}
                  </div>
                </div>

                {/* KYC Documents Section */}
                <div className="pt-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <ShieldCheck size={14} /> Verification Documents
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">National ID (Front)</p>
                      {selectedDriver.idFrontUrl ? (
                        <a href={selectedDriver.idFrontUrl} target="_blank" className="block relative group">
                          <img src={selectedDriver.idFrontUrl} className="w-full aspect-video object-cover rounded-2xl border border-slate-200" alt="" />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                            <ExternalLink size={20} className="text-white" />
                          </div>
                        </a>
                      ) : <div className="w-full aspect-video bg-slate-100 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-xs italic">Not Uploaded</div>}
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">National ID (Back)</p>
                      {selectedDriver.idBackUrl ? (
                        <a href={selectedDriver.idBackUrl} target="_blank" className="block relative group">
                          <img src={selectedDriver.idBackUrl} className="w-full aspect-video object-cover rounded-2xl border border-slate-200" alt="" />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                            <ExternalLink size={20} className="text-white" />
                          </div>
                        </a>
                      ) : <div className="w-full aspect-video bg-slate-100 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-xs italic">Not Uploaded</div>}
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Driving License</p>
                      {selectedDriver.licenseUrl ? (
                        <a href={selectedDriver.licenseUrl} target="_blank" className="block relative group">
                          <img src={selectedDriver.licenseUrl} className="w-full aspect-[21/9] object-cover rounded-2xl border border-slate-200" alt="" />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                            <ExternalLink size={20} className="text-white" />
                          </div>
                        </a>
                      ) : <div className="w-full aspect-[21/9] bg-slate-100 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-xs italic">Not Uploaded</div>}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">ID Number</p>
                      <p className="text-sm font-bold text-slate-700">{selectedDriver.idNumber || "—"}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">License Number</p>
                      <p className="text-sm font-bold text-slate-700">{selectedDriver.licenseNumber || "—"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-wrap gap-3">
              {selectedDriver.kycStatus !== "approved" && canManage && (
                <>
                  <button 
                    onClick={() => handleApproveKyc(selectedDriver.id)}
                    disabled={acting === selectedDriver.id}
                    className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-3 px-4 rounded-2xl font-bold text-sm transition shadow-lg shadow-primary-100 flex items-center justify-center gap-2 min-w-[150px]"
                  >
                    <BadgeCheck size={18} /> Approve KYC
                  </button>
                  <button 
                    onClick={() => handleRejectKyc(selectedDriver.id)}
                    disabled={acting === selectedDriver.id}
                    className="bg-white border border-rose-100 text-rose-600 hover:bg-rose-50 px-6 rounded-2xl font-bold text-sm transition min-w-[120px]"
                  >
                    Reject KYC
                  </button>
                </>
              )}
              
              {selectedDriver.subscriptionStatus !== "active" && canManage && (
                <button 
                  onClick={() => handleActivate(selectedDriver.id)}
                  disabled={acting === selectedDriver.id}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-2xl font-bold text-sm transition shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 min-w-[150px]"
                >
                  <Zap size={16} /> Activate Subscription
                </button>
              )}
              
              {canManage && (
                <button 
                  onClick={() => handleDelete(selectedDriver)}
                  className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 rounded-2xl transition"
                  title="Delete Driver"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
