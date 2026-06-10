"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { 
  Plus, 
  Search, 
  Filter, 
  Car,
  Loader2,
  RefreshCcw
} from "lucide-react";
import FleetGrid from "@/components/vendor/FleetGrid";
import AddVehicleModal from "@/components/vendor/AddVehicleModal";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Vehicle } from "@/lib/types";


import { logError } from "@/lib/logger";export default function FleetManagementPage() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchFleet = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, "vehicles"), where("companyId", "==", user.uid));
      const snapshot = await getDocs(q);
      const fleetData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
      setVehicles(fleetData);
    } catch (error) {
      logError("page", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFleet();
  }, [user]);

  const filteredVehicles = vehicles.filter(v => 
    v.make.toLowerCase().includes(searchQuery.toLowerCase()) || 
    v.model.toLowerCase().includes(searchQuery.toLowerCase()) || 
    v.plate.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fleet Management</h1>
          <p className="text-gray-500 mt-1">Manage your vehicles, rates, and availability.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-700 transition shadow-lg shadow-primary-600/20 w-fit"
        >
          <Plus className="w-5 h-5" /> Add Vehicle
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search by make, model, or plate..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition">
            <Filter className="w-4 h-4" /> Filters
          </button>
          <button 
            onClick={fetchFleet}
            className="p-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition"
            title="Refresh Fleet"
          >
            <RefreshCcw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Fleet Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Loading your fleet...</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-20 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Car className="w-10 h-10 text-gray-300" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Vehicles Found</h2>
          <p className="text-gray-500 max-w-sm mx-auto mb-8">
            You haven't added any vehicles to your fleet yet. Start by adding your first vehicle to get bookings.
          </p>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-8 py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition shadow-xl"
          >
            Add Your First Vehicle
          </button>
        </div>
      ) : (
        <FleetGrid vehicles={filteredVehicles} onRefresh={fetchFleet} viewMode="grid" />
      )}

      {/* Modals */}
      <AddVehicleModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={fetchFleet}
      />
    </div>
  );
}
