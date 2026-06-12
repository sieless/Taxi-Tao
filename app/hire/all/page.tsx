"use client";

import { useState, useEffect, useCallback } from "react";
import { Vehicle } from "@/lib/types";
import { searchActiveFleet } from "@/lib/carhire/vehicle-management-service";
import VehicleCard from "@/components/hire/VehicleCard";
import {
  Search,
  Filter,
  Car,
  Loader2,
  ChevronRight,
  MapPin,
  Sparkles,
  ChevronLeft,
} from "lucide-react";

const PAGE_SIZE = 20;

export default function AllVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [hasMore, setHasMore] = useState(true);

  const fetchVehicles = useCallback(
    async (reset = false) => {
      if (reset) {
        setLoading(true);
        setVehicles([]);
      } else {
        setLoadingMore(true);
      }

      try {
        const data = await searchActiveFleet({
          limitCount: reset ? PAGE_SIZE : undefined,
          vehicleType: typeFilter !== "all" ? typeFilter : undefined,
        });

        if (reset) {
          setVehicles(data);
          setHasMore(data.length >= PAGE_SIZE);
        } else {
          setVehicles((prev) => [...prev, ...data]);
          setHasMore(data.length >= PAGE_SIZE);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [typeFilter]
  );

  useEffect(() => {
    fetchVehicles(true);
  }, [fetchVehicles]);

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#fafafa] pb-20 font-sans">
      <div className="relative bg-[#0a0a0a] text-white py-16 px-4 md:px-6 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] bg-primary-600/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[50%] bg-blue-600/10 blur-[100px] rounded-full" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <a
                href="/hire"
                className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm font-bold mb-6 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Fleet
              </a>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-primary-400 mb-6">
                <Sparkles className="w-3 h-3" /> Complete Fleet
              </div>
              <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter leading-none">
                Browse <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">All Vehicles.</span>
              </h1>
              <p className="text-gray-400 text-xl leading-relaxed max-w-lg">
                Every premium vehicle available across our verified fleet partners in Kenya.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-xl px-8 py-5 rounded-[2.5rem] border border-white/10 shadow-2xl">
              <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                <Car className="text-white w-7 h-7" />
              </div>
              <div>
                <p className="font-black text-lg">{filteredVehicles.length} Vehicles</p>
                <p className="text-white/50 text-sm font-medium">Active & Verified</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-10">
        <div className="bg-white/80 backdrop-blur-2xl p-3 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white/50 mb-16 flex flex-col md:flex-row gap-2">
          <div className="flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary-600 transition" />
            <input
              type="text"
              placeholder="Search make or model (e.g. Toyota Prado)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-5 bg-white rounded-[2.2rem] border-none focus:ring-2 focus:ring-primary-500 outline-none transition text-gray-800 font-semibold text-lg"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="pl-8 pr-12 py-5 bg-white border-none rounded-[2.2rem] focus:ring-2 focus:ring-primary-500 outline-none transition text-gray-800 font-bold appearance-none cursor-pointer text-lg shadow-sm"
              >
                <option value="all">All Vehicle Types</option>
                <option value="suv">SUVs</option>
                <option value="sedan">Sedans</option>
                <option value="pickup">Pickups</option>
                <option value="van">Vans</option>
              </select>
              <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 rotate-90 pointer-events-none" />
            </div>
            <button className="bg-gray-900 p-5 rounded-[2.2rem] hover:bg-gray-800 transition shadow-xl group">
              <Filter className="w-6 h-6 text-white group-hover:rotate-180 transition-transform duration-500" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-8 px-4">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
            All Vehicles <span className="text-gray-400 font-medium ml-2">({filteredVehicles.length})</span>
          </h2>
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 bg-white px-4 py-2 rounded-full border">
            <MapPin className="w-4 h-4 text-primary-600" /> All Locations
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="w-16 h-16 text-primary-600 animate-spin mb-6" />
            <p className="text-gray-400 font-bold tracking-widest uppercase text-sm">Loading Fleet...</p>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-gray-200">
            <Car className="w-24 h-24 text-gray-100 mx-auto mb-6" />
            <h2 className="text-3xl font-black text-gray-800 tracking-tight">No Matches Found</h2>
            <p className="text-gray-500 mt-2 font-medium">Try broadening your search or switching categories.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {filteredVehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>

            {hasMore && !searchTerm && typeFilter === "all" && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={() => fetchVehicles(false)}
                  disabled={loadingMore}
                  className="px-10 py-5 bg-gray-900 text-white rounded-[1.5rem] font-black text-lg hover:bg-primary-600 transition-all shadow-xl hover:shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Loading...
                    </>
                  ) : (
                    <>
                      Load More <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
