"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  Plus,
  Search,
  Car,
  Loader2,
  LayoutGrid,
  List,
  Filter,
  Trash2,
  Zap,
  Users,
} from "lucide-react";
import FleetGrid from "@/components/vendor/FleetGrid";
import AddVehicleModal from "@/components/vendor/AddVehicleModal";
import { graphqlClient } from "@/lib/graphql/client";
import {
  VEHICLES_QUERY,
  BATCH_PUBLISH_MUTATION,
  DELETE_VEHICLE_MUTATION,
} from "@/lib/graphql/queries";
import { Vehicle } from "@/lib/types";
import { logError } from "@/lib/logger";

interface GraphQLVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  plateNumber: string;
  status: string;
  color?: string;
  fuelType?: string;
  transmission?: string;
  seatingCapacity?: number;
  dailyRate?: number;
  imageUrls?: string[];
}

export default function FleetManagementPage() {
  const { user, userProfile } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);
  const [batchPublishing, setBatchPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchVehicles = useCallback(async () => {
    if (!userProfile?.companyId) return;
    setLoading(true);
    try {
      const result = await graphqlClient
        .query(VEHICLES_QUERY, { status: statusFilter === "all" ? undefined : statusFilter })
        .toPromise();

      const items: GraphQLVehicle[] = result.data?.vehicles?.items ?? [];
      const mapped: Vehicle[] = items.map((v) => ({
        id: v.id,
        make: v.make,
        model: v.model,
        plate: v.plateNumber,
        status: v.status as Vehicle["status"],
        images: v.imageUrls ?? [],
        year: v.year,
        dailyRate: v.dailyRate ?? 0,
        fuelType: v.fuelType as Vehicle["fuelType"],
        transmissionType: v.transmission as Vehicle["transmissionType"],
        seats: v.seatingCapacity ?? 5,
        addedBy: "owner",
        maintenanceLogs: [],
        type: "sedan",
        active: v.status === "active",
        baseFare: v.dailyRate ?? 0,
        securityDeposit: 0,
        availability: [],
      }));
      setVehicles(mapped);
    } catch (err) {
      logError("fleet-page-graphql", err);
    } finally {
      setLoading(false);
    }
  }, [userProfile?.companyId, statusFilter]);

  useEffect(() => {
    if (!mounted || !userProfile) return;
    fetchVehicles();
  }, [mounted, userProfile, fetchVehicles]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-10 w-28 bg-gray-200 rounded-lg animate-pulse" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
              <div className="h-40 bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 w-2/3 bg-gray-200 rounded" />
                <div className="h-3 w-1/2 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.plate.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "available" && v.status === "active") ||
      (statusFilter === "in_use" && (v.status === "in_use" || v.status === "hired")) ||
      (statusFilter === "maintenance" && (v.status === "suspended" || v.status === "draft"));

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: vehicles.length,
    available: vehicles.filter((v) => v.status === "active").length,
    inUse: vehicles.filter((v) => v.status === "in_use" || v.status === "hired").length,
    maintenance: vehicles.filter((v) => v.status === "suspended" || v.status === "draft").length,
    draftCount: vehicles.filter((v) => v.status === "draft").length,
    staffAdded: vehicles.filter((v) => v.addedBy === "staff").length,
  };

  const handleDeleteVehicle = async () => {
    if (!deletingVehicle) return;
    setDeleting(true);
    try {
      await graphqlClient.mutation(DELETE_VEHICLE_MUTATION, { id: deletingVehicle.id }).toPromise();
      setDeletingVehicle(null);
      fetchVehicles();
    } catch (err) {
      logError("fleet-page-delete", err);
      alert("Failed to delete vehicle");
    } finally {
      setDeleting(false);
    }
  };

  const handleBatchPublish = async () => {
    setBatchPublishing(true);
    try {
      const result = await graphqlClient.mutation(BATCH_PUBLISH_MUTATION, {}).toPromise();
      const published = result.data?.batchPublishVehicles?.published ?? 0;
      alert(`${published} vehicle(s) published to marketplace`);
      fetchVehicles();
    } catch (err) {
      logError("fleet-page-batch", err);
      alert("Failed to publish vehicles");
    } finally {
      setBatchPublishing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-gray-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 bg-primary-500 rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Fleet Intelligence</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none uppercase">Asset Registry</h1>
          <p className="text-gray-500 font-medium text-sm">Managing {stats.total} total vehicles in your company fleet.</p>
        </div>

        <div className="flex items-center gap-3">
          {stats.draftCount > 0 && (
            <button
              onClick={handleBatchPublish}
              disabled={batchPublishing}
              className="flex items-center gap-2 bg-amber-500 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-600 transition shadow-xl shadow-amber-200 disabled:opacity-50"
            >
              {batchPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Publish All ({stats.draftCount})
            </button>
          )}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition shadow-xl shadow-indigo-200"
          >
            <Plus className="w-4 h-4" /> Add Vehicle
          </button>
        </div>
      </div>

      {/* Filter Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "All Vehicles", count: stats.total, key: "all" },
          { label: "Available", count: stats.available, key: "available" },
          { label: "On Road", count: stats.inUse, key: "in_use" },
          { label: "In Workshop", count: stats.maintenance, key: "maintenance" },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setStatusFilter(item.key)}
            className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden group ${statusFilter === item.key ? "ring-2 ring-indigo-500 border-transparent shadow-lg" : "hover:border-indigo-200"}`}
          >
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{item.label}</p>
            <p className="text-2xl font-black">{item.count}</p>
            {statusFilter === item.key && <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-indigo-500" />}
          </button>
        ))}
      </div>

      {/* Staff Submissions Banner */}
      {stats.staffAdded > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-black text-amber-900">{stats.staffAdded} vehicle(s) added by staff</p>
            <p className="text-xs text-amber-700">Staff-submitted vehicles appear as drafts until you publish them.</p>
          </div>
          {stats.draftCount > 0 && (
            <button
              onClick={handleBatchPublish}
              disabled={batchPublishing}
              className="px-4 py-2 bg-amber-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-amber-700 transition disabled:opacity-50"
            >
              {batchPublishing ? "Publishing..." : "Publish All Drafts"}
            </button>
          )}
        </div>
      )}

      {/* Search & View Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Filter by make, model, or license plate..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-gray-200 rounded-xl text-sm font-bold outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2.5 rounded-lg transition ${viewMode === "grid" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400"}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2.5 rounded-lg transition ${viewMode === "list" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400"}`}
            >
              <List size={18} />
            </button>
          </div>
          <button className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-xl font-black text-[10px] uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition shadow-sm">
            <Filter className="w-3.5 h-3.5" /> Filters
          </button>
        </div>
      </div>

      {/* Fleet Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-dashed border-gray-200">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
          <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Accessing Satellite Telemetry...</p>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-100 rounded-[3rem] p-32 text-center">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <Car className="w-10 h-10 text-gray-200" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2 uppercase">Empty Registry</h2>
          <p className="text-gray-400 max-w-sm mx-auto mb-10 font-medium leading-relaxed">
            {searchQuery || statusFilter !== "all"
              ? "No assets match your current filter criteria."
              : "You haven't added any vehicles to your company fleet yet."}
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-10 py-4 bg-gray-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-black transition shadow-2xl shadow-gray-200"
          >
            Deploy First Asset
          </button>
        </div>
      ) : (
        <div className="animate-in fade-in duration-700">
          <FleetGrid vehicles={filteredVehicles} onRefresh={fetchVehicles} onDelete={(v) => setDeletingVehicle(v)} viewMode={viewMode} />
        </div>
      )}

      {/* Modals */}
      <AddVehicleModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={fetchVehicles} />

      {/* Delete Confirmation Modal */}
      {deletingVehicle && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => !deleting && setDeletingVehicle(null)} />
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-black text-gray-900 text-center mb-2">Delete Vehicle?</h3>
            <p className="text-gray-500 text-center mb-2">
              Are you sure you want to delete <strong>{deletingVehicle.make} {deletingVehicle.model}</strong> ({deletingVehicle.plate})?
            </p>
            <p className="text-xs text-red-500 text-center mb-8">This action cannot be undone. Only draft vehicles can be deleted.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingVehicle(null)}
                disabled={deleting}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-gray-200 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteVehicle}
                disabled={deleting}
                className="flex-1 py-3 bg-red-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
