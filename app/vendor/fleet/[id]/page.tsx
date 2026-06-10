"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from "@/lib/auth-context";
import {
  Car, Settings, Clock, ShieldCheck, Wrench, Fuel, Milestone,
  ChevronLeft, Loader2, Calendar, AlertTriangle, Zap,
  CheckCircle2, ArrowRight, Users, BarChart3, Trash2, Plus,
  TrendingUp, X, Eye, EyeOff
} from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from "@/lib/firebase";
import { Vehicle, Company } from "@/lib/types";
import { getCompanyDetail } from "@/lib/company-service";

import { logError } from "@/lib/logger";import {
  toggleVehicleStatus, approveStaffVehicle, rejectStaffVehicle,
  addMaintenanceLog, deleteMaintenanceLog
} from "@/lib/actions/vehicle-actions";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/90 text-white border-emerald-400",
  draft: "bg-amber-500/90 text-white border-amber-400",
  suspended: "bg-red-500/90 text-white border-red-400",
  in_use: "bg-blue-500/90 text-white border-blue-400",
  hired: "bg-blue-500/90 text-white border-blue-400",
  pending_approval: "bg-amber-500/90 text-white border-amber-400",
  rejected: "bg-red-500/90 text-white border-red-400",
  available: "bg-emerald-500/90 text-white border-emerald-400",
};

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=800";

export default function VehicleDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({ type: "", description: "", cost: 0, provider: "" });
  const [maintenanceSubmitting, setMaintenanceSubmitting] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!id || !mounted) return;
    setLoading(true);
    const unsub = onSnapshot(doc(db, "vehicles", id as string), async (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as Vehicle;
        setVehicle(data);
        if (data.companyId && !company) {
          const comp = await getCompanyDetail(data.companyId);
          setCompany(comp);
        }
      }
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [id, mounted]);

  const handleToggleStatus = useCallback(async () => {
    if (!vehicle || actionLoading) return;
    setActionLoading(true);
    try {
      await toggleVehicleStatus(vehicle.id);
    } catch (e) {
      if (process.env.NODE_ENV === "development") logError("page", e);
    }
    setActionLoading(false);
  }, [vehicle, actionLoading]);

  const handleApproveStaff = useCallback(async () => {
    if (!vehicle || actionLoading) return;
    setActionLoading(true);
    try {
      await approveStaffVehicle(vehicle.id);
    } catch (e) {
      if (process.env.NODE_ENV === "development") logError("page", e);
    }
    setActionLoading(false);
  }, [vehicle, actionLoading]);

  const handleRejectStaff = useCallback(async () => {
    if (!vehicle || actionLoading) return;
    setActionLoading(true);
    try {
      await rejectStaffVehicle(vehicle.id);
    } catch (e) {
      if (process.env.NODE_ENV === "development") logError("page", e);
    }
    setActionLoading(false);
  }, [vehicle, actionLoading]);

  const handleAddMaintenance = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle || maintenanceSubmitting) return;
    setMaintenanceSubmitting(true);
    try {
      await addMaintenanceLog(vehicle.id, maintenanceForm);
      setShowMaintenanceForm(false);
      setMaintenanceForm({ type: "", description: "", cost: 0, provider: "" });
    } catch (e) {
      if (process.env.NODE_ENV === "development") logError("page", e);
    }
    setMaintenanceSubmitting(false);
  }, [vehicle, maintenanceForm, maintenanceSubmitting]);

  const handleDeleteMaintenance = useCallback(async (logId: string) => {
    if (!vehicle) return;
    try {
      await deleteMaintenanceLog(vehicle.id, logId);
    } catch (e) {
      if (process.env.NODE_ENV === "development") logError("page", e);
    }
  }, [vehicle]);

  if (!mounted || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Accessing Asset Intelligence...</p>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="p-20 text-center">
        <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-6" />
        <h2 className="text-2xl font-black text-gray-900 uppercase">Asset Not Found</h2>
        <button onClick={() => router.back()} className="mt-6 text-indigo-600 font-black uppercase tracking-widest text-xs">Return to Fleet</button>
      </div>
    );
  }

  const isVerified = vehicle.status === "active" || company?.status === "active";
  const isStaffSubmission = vehicle.addedBy === "staff" && vehicle.status === "draft";
  const images = vehicle.images?.length ? vehicle.images : [FALLBACK_IMAGE];
  const maintenanceLogs = vehicle.maintenanceLogs || [];
  const compliance = vehicle.compliance;
  const nextServiceDays = vehicle.performance?.rentalsUntilService
    ? Math.max(0, vehicle.performance.rentalsUntilService * 3)
    : null;

  const insuranceValid = compliance?.insuranceExpiry
    ? new Date(compliance.insuranceExpiry) > new Date()
    : null;
  const inspectionValid = compliance?.inspectionExpiry
    ? new Date(compliance.inspectionExpiry) > new Date()
    : null;

  return (
    <div className="space-y-6 pb-20">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-indigo-600 transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Fleet
        </button>
        {company && (
          <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 border border-gray-100 shadow-sm">
            {company.logoUrl && (
              <img src={company.logoUrl} alt="" className="w-6 h-6 rounded-md object-contain" />
            )}
            <span className="text-xs font-black text-gray-700 uppercase tracking-wider">{company.name}</span>
          </div>
        )}
      </div>

      {/* Hero Section */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Image Gallery */}
        <div className="relative w-full md:w-80 shrink-0 rounded-3xl overflow-hidden bg-white border border-gray-100 shadow-sm">
          <div className="relative aspect-[4/3]">
            <img
              src={images[activeImageIndex]}
              alt={`${vehicle.make} ${vehicle.model}`}
              className="w-full h-full object-contain bg-gray-50 p-2"
            />
            <div className="absolute top-3 left-3">
              <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-md backdrop-blur-md ${STATUS_COLORS[vehicle.status] || STATUS_COLORS.draft}`}>
                {isVerified ? "Active" : "Draft"}
              </span>
            </div>
            {images.length > 1 && (
              <div className="absolute bottom-14 left-0 right-0 flex justify-center gap-1.5">
                {images.map((_, i) => (
                  <div key={i} className={`h-1 rounded-full transition-all ${i === activeImageIndex ? "w-4 bg-gray-900" : "w-1 bg-gray-400/50"}`} />
                ))}
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 pt-8 pb-3">
              <h1 className="text-xl font-black text-white tracking-tight leading-none uppercase">
                {vehicle.make} {vehicle.model}
              </h1>
              <p className="text-white/70 font-bold text-[10px] uppercase tracking-widest mt-1">{vehicle.plate}</p>
            </div>
          </div>
          {images.length > 1 && (
            <div className="flex gap-1.5 p-2 bg-white overflow-x-auto scrollbar-hide">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImageIndex(i)}
                  className={`w-10 h-10 rounded-lg overflow-hidden shrink-0 border-2 transition ${i === activeImageIndex ? "border-indigo-500" : "border-transparent opacity-50 hover:opacity-100"}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Vehicle Details */}
        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Title + Rate */}
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{vehicle.type || "Vehicle"}</p>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase leading-none">
                {vehicle.make} {vehicle.model}
              </h1>
              <div className="flex items-center gap-4 mt-3">
                <p className="text-2xl font-black text-indigo-600">KES {vehicle.dailyRate?.toLocaleString()}<span className="text-xs text-gray-400 font-bold">/day</span></p>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${STATUS_COLORS[vehicle.status] || STATUS_COLORS.draft}`}>
                  {vehicle.status.replace("_", " ")}
                </span>
              </div>
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Car, label: "Plate", value: vehicle.plate },
                { icon: Fuel, label: "Fuel", value: vehicle.fuelType || "Petrol" },
                { icon: Settings, label: "Trans.", value: vehicle.transmission || vehicle.transmissionType || "Auto" },
                { icon: Users, label: "Seats", value: vehicle.seats ? `${vehicle.seats}` : "—" },
              ].map((spec, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <spec.icon className="w-3 h-3 text-gray-400" />
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{spec.label}</span>
                  </div>
                  <p className="text-sm font-black text-gray-900 uppercase">{spec.value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            {vehicle.description && (
              <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">{vehicle.description}</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => router.push(`/vendor/fleet/${vehicle.id}/analytics`)}
              className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-purple-700 transition flex items-center justify-center gap-2"
            >
              <BarChart3 className="w-4 h-4" /> Analytics
            </button>
            {company?.status === "active" && (
              <button
                onClick={handleToggleStatus}
                disabled={actionLoading}
                className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition flex items-center justify-center gap-2 disabled:opacity-50 ${
                  vehicle.status === "active"
                    ? "bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                {vehicle.status === "active" ? (
                  <><EyeOff className="w-4 h-4" /> Go Offline</>
                ) : (
                  <><Zap className="w-4 h-4" /> Go Live</>
                )}
              </button>
            )}
            <button
              onClick={() => router.push(`/vendor/fleet/${vehicle.id}/analytics`)}
              className="py-3 px-5 bg-gray-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition flex items-center justify-center gap-2"
            >
              <Settings className="w-4 h-4" /> Manage
            </button>
          </div>
        </div>
      </div>

      {/* Audit Warning */}
      {company?.status !== "active" && vehicle.status === "draft" && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-black text-amber-900 text-sm">Action Restricted</p>
            <p className="text-amber-700 text-xs mt-1 leading-relaxed">
              This asset is in <span className="font-bold">Draft Mode</span>. It will become visible on the marketplace immediately after your business audit is complete.
            </p>
          </div>
        </div>
      )}

      {/* Staff Submission Banner */}
      {isStaffSubmission && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-start gap-4">
            <Users className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-amber-900 text-sm">Staff Submission</p>
              <p className="text-amber-700 text-xs mt-1 leading-relaxed">
                Added by <span className="font-bold">{vehicle.addedByName || "Staff Member"}</span>. Review and approve to publish to the marketplace.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRejectStaff}
              disabled={actionLoading}
              className="flex-1 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-100 transition disabled:opacity-50"
            >
              Reject
            </button>
            <button
              onClick={handleApproveStaff}
              disabled={actionLoading}
              className="flex-[2] py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" /> Approve
            </button>
          </div>
        </div>
      )}

      {/* Telemetry */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <Fuel className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Fuel Level</span>
            </div>
            <p className="text-2xl font-black text-gray-900">{vehicle.fuelLevel || 85}%</p>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${vehicle.fuelLevel || 85}%` }} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <Milestone className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Mileage</span>
            </div>
            <p className="text-2xl font-black text-gray-900">{vehicle.mileage?.toLocaleString() || "—"}</p>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">km</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <Calendar className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Next Service</span>
            </div>
            <p className="text-2xl font-black text-gray-900">{nextServiceDays !== null ? `${nextServiceDays} Days` : "—"}</p>
            <p className="text-[9px] text-amber-500 font-bold uppercase tracking-widest">Based on usage</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <Zap className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Rating</span>
            </div>
            <p className="text-2xl font-black text-gray-900">{vehicle.averageRating?.toFixed(1) || "—"}</p>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{vehicle.totalRatings || 0} reviews</p>
          </div>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="bg-purple-600 rounded-3xl p-8 text-white shadow-2xl shadow-purple-600/20">
        <p className="text-[10px] font-black uppercase tracking-widest text-purple-300 mb-2">Rental Logic</p>
        <p className="text-4xl font-black tracking-tight">KES {vehicle.dailyRate?.toLocaleString()}</p>
        <p className="text-sm text-purple-300 font-bold mt-1">Daily Rate</p>
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
            <p className="text-[10px] font-black uppercase tracking-widest text-purple-300">Deposit</p>
            <p className="text-sm font-black mt-1">KES {vehicle.securityDeposit?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
            <p className="text-[10px] font-black uppercase tracking-widest text-purple-300">Chauffeur</p>
            <p className="text-sm font-black mt-1">KES {vehicle.chauffeurDailyRate?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
            <p className="text-[10px] font-black uppercase tracking-widest text-purple-300">Wash Fee</p>
            <p className="text-sm font-black mt-1">KES {vehicle.washFee?.toLocaleString() || 0}</p>
          </div>
        </div>
      </div>

      {/* Compliance + Registry Identity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance */}
        <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-2xl shadow-indigo-600/30">
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="w-6 h-6" />
            <h3 className="text-lg font-black uppercase tracking-tight">Compliance</h3>
          </div>
          <div className="space-y-3">
            <div className={`flex items-center justify-between p-4 rounded-2xl border ${insuranceValid === true ? "bg-white/10 border-white/10" : insuranceValid === false ? "bg-red-500/20 border-red-400/30" : "bg-white/10 border-white/10 opacity-60"}`}>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Insurance</p>
                <p className="text-xs font-bold mt-0.5">
                  {compliance?.insuranceExpiry ? `Expires ${new Date(compliance.insuranceExpiry).toLocaleDateString()}` : "Not set"}
                </p>
              </div>
              {insuranceValid === true ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> :
               insuranceValid === false ? <AlertTriangle className="w-5 h-5 text-red-400" /> :
               <AlertTriangle className="w-5 h-5 text-gray-400" />}
            </div>
            <div className={`flex items-center justify-between p-4 rounded-2xl border ${inspectionValid === true ? "bg-white/10 border-white/10" : inspectionValid === false ? "bg-red-500/20 border-red-400/30" : "bg-white/10 border-white/10 opacity-60"}`}>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">NTSA Inspection</p>
                <p className="text-xs font-bold mt-0.5">
                  {compliance?.inspectionExpiry ? `Expires ${new Date(compliance.inspectionExpiry).toLocaleDateString()}` : "Not set"}
                </p>
              </div>
              {inspectionValid === true ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> :
               inspectionValid === false ? <AlertTriangle className="w-5 h-5 text-red-400" /> :
               <AlertTriangle className="w-5 h-5 text-gray-400" />}
            </div>
            {compliance?.documents && compliance.documents.length > 0 && compliance.documents.map((doc, i) => {
              const docValid = doc.expiry ? new Date(doc.expiry) > new Date() : null;
              return (
                <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border ${docValid === true ? "bg-white/10 border-white/10" : docValid === false ? "bg-red-500/20 border-red-400/30" : "bg-white/10 border-white/10"}`}>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">{doc.name}</p>
                    <p className="text-xs font-bold mt-0.5">
                      {doc.expiry ? `Expires ${new Date(doc.expiry).toLocaleDateString()}` : doc.status || "—"}
                    </p>
                  </div>
                  {docValid === true ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> :
                   docValid === false ? <AlertTriangle className="w-5 h-5 text-red-400" /> :
                   <CheckCircle2 className="w-5 h-5 text-gray-400" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Registry Identity */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-5">
          <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Registry Identity</h3>
          <div className="space-y-4">
            {[
              { label: "Asset ID", value: vehicle.id?.slice(0, 12), mono: true },
              { label: "License Plate", value: vehicle.plate },
              { label: "Category", value: vehicle.type },
              { label: "Year", value: vehicle.year || "—" },
              { label: "Color", value: vehicle.color || "—" },
              { label: "VIN", value: vehicle.vin || "—" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.label}</span>
                <span className={`text-xs font-black text-gray-900 uppercase ${item.mono ? "font-mono" : ""}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      {vehicle.performance && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-6">Performance</h3>
          <div className="grid grid-cols-3 gap-6">
            {[
              { label: "Total Trips", value: vehicle.performance.totalTrips || 0 },
              { label: "Total Revenue", value: `KES ${vehicle.performance.totalRevenue?.toLocaleString() || 0}` },
              { label: "Rentals Until Service", value: vehicle.performance.rentalsUntilService ?? "—" },
            ].map((item, i) => (
              <div key={i} className="text-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{item.label}</p>
                <p className="text-lg font-black text-gray-900">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Maintenance Ledger */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Wrench className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Maintenance Ledger</h2>
          </div>
          <button
            onClick={() => setShowMaintenanceForm(!showMaintenanceForm)}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition"
          >
            <Plus className="w-4 h-4" /> Log Incident
          </button>
        </div>

        {showMaintenanceForm && (
          <form onSubmit={handleAddMaintenance} className="bg-white rounded-2xl border border-indigo-200 p-6 space-y-4 shadow-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">Service Type</label>
                <select
                  required
                  value={maintenanceForm.type}
                  onChange={(e) => setMaintenanceForm(p => ({ ...p, type: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select type</option>
                  <option>Oil Change & Filter</option>
                  <option>Brake Inspection/Replacement</option>
                  <option>Tire Rotation & Alignment</option>
                  <option>Major Service (Full Inspection)</option>
                  <option>Other Repairs</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">Provider</label>
                <input
                  type="text"
                  value={maintenanceForm.provider}
                  onChange={(e) => setMaintenanceForm(p => ({ ...p, provider: e.target.value }))}
                  placeholder="e.g. Main Workshop"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">Description</label>
              <input
                type="text"
                required
                value={maintenanceForm.description}
                onChange={(e) => setMaintenanceForm(p => ({ ...p, description: e.target.value }))}
                placeholder="What was serviced or replaced"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">Cost (KES)</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={maintenanceForm.cost || ""}
                  onChange={(e) => setMaintenanceForm(p => ({ ...p, cost: Number(e.target.value) }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={maintenanceSubmitting}
                  className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {maintenanceSubmitting ? "Saving..." : "Save Record"}
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Service Event</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Provider</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Cost</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {maintenanceLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic text-sm">
                    No maintenance records yet. Click "Log Incident" to add one.
                  </td>
                </tr>
              ) : (
                maintenanceLogs.map((log) => (
                  <tr key={log.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5 font-black text-gray-900 tracking-tight uppercase text-xs">{log.type}</td>
                    <td className="px-6 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      {log.date ? new Date(log.date).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-6 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{log.provider || "—"}</td>
                    <td className="px-6 py-5 text-right font-black text-gray-900 text-xs">KES {log.cost?.toLocaleString()}</td>
                    <td className="px-6 py-5 text-right">
                      <button
                        onClick={() => handleDeleteMaintenance(log.id)}
                        className="w-8 h-8 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center group-hover:bg-red-50 group-hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
