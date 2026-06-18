"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams } from "next/navigation";
import { searchActiveFleet } from "@/lib/carhire/vehicle-management-service";
import { getDriverForHire } from "@/lib/carhire/driver-service";
import { Vehicle } from "@/lib/types";
import {
  Car,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  Users,
  Info,
  UserCheck,
  ShieldCheck,
  Star,
  X,
  MapPin,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { logError } from "@/lib/logger";

const VEHICLE_TYPES = ["All", "sedan", "suv", "van", "pickup"];
const PRICE_RANGES = [
  { label: "Any Price", min: undefined, max: undefined },
  { label: "Under 5k", min: 0, max: 5000 },
  { label: "5k - 10k", min: 5000, max: 10000 },
  { label: "10k - 20k", min: 10000, max: 20000 },
  { label: "Over 20k", min: 20000, max: 1000000 },
];

interface DriverProfile {
  id: string;
  name: string;
  img: string;
  businessLocation?: string;
  rating: number;
  totalRides: number;
  vehicles: any[];
}

function DriverFleetContent() {
  const params = useParams();
  const driverId = params.driverId as string;

  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("All");
  const [selectedPrice, setSelectedPrice] = useState(PRICE_RANGES[0]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!driverId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [driverData, vehicleData] = await Promise.all([
          getDriverForHire(driverId),
          searchActiveFleet({
            driverId,
            vehicleType: selectedType !== "All" ? selectedType : undefined,
            minPrice: selectedPrice.min,
            maxPrice: selectedPrice.max,
          }),
        ]);

        setDriver(driverData);
        setVehicles(vehicleData);
      } catch (err) {
        logError("driver-fleet-page", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [driverId, selectedType, selectedPrice]);

  return (
    <div className="min-h-screen bg-[#fafafa] pb-20 font-sans">
      {/* Header */}
      <div className="bg-[#0a0a0a] text-white py-10 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/hire"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition font-bold text-sm mb-6"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Partners
          </Link>

          <div className="flex items-center gap-6">
            {driver?.img ? (
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white/10">
                <Image src={driver.img} alt={driver.name} fill className="object-cover" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-2xl">
                {(driver?.name || "H").charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-4xl font-black tracking-tight">
                  {driver?.name || "Loading..."}
                </h1>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-xs font-black uppercase tracking-widest">
                  <UserCheck className="w-3 h-3" /> Peer Host
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1">
                {driver?.businessLocation && (
                  <p className="text-gray-400 font-medium text-sm flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {driver.businessLocation}
                  </p>
                )}
                {driver?.rating && (
                  <p className="text-gray-400 font-medium text-sm flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /> {driver.rating.toFixed(1)}
                  </p>
                )}
                {driver?.totalRides ? (
                  <p className="text-gray-400 font-medium text-sm">{driver.totalRides} rides</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-6">
        {/* Filter Bar */}
        <div className="bg-white/80 backdrop-blur-2xl p-3 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white/50 mb-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 pl-4">
            <MapPin className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-gray-700 text-sm">
              {loading ? "Searching..." : `${vehicles.length} vehicles`}
            </span>
          </div>
          <button
            onClick={() => setShowFilters(true)}
            className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-[2.2rem] font-bold text-sm hover:bg-gray-800 transition shadow-lg"
          >
            <Filter className="w-4 h-4" />
            Filters
            {(selectedType !== "All" || selectedPrice.label !== "Any Price") && (
              <span className="w-2 h-2 bg-primary-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Vehicle Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-6" />
            <p className="text-gray-400 font-bold tracking-widest uppercase text-sm">Loading fleet...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-gray-200">
            <Car className="w-24 h-24 text-gray-100 mx-auto mb-6" />
            <h2 className="text-3xl font-black text-gray-800 tracking-tight">No Vehicles Found</h2>
            <p className="text-gray-500 mt-2 font-medium">This host has no available vehicles.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {vehicles.map((vehicle) => (
              <div key={vehicle.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-[0_30px_60px_rgba(0,0,0,0.1)] transition-all duration-500 group border border-transparent hover:border-gray-100">
                <div className="aspect-[16/10] bg-gray-50 relative overflow-hidden">
                  {vehicle.images?.[0] ? (
                    <Image
                      src={vehicle.images[0]}
                      alt={`${vehicle.make} ${vehicle.model}`}
                      fill
                      className="object-cover group-hover:scale-110 transition duration-1000 ease-out"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-200">
                      <Car className="w-20 h-20 opacity-20" />
                      <p className="text-[10px] font-black uppercase tracking-widest mt-2">Image Pending</p>
                    </div>
                  )}
                  <div className="absolute top-5 left-5">
                    <span className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl border border-white/50">
                      {vehicle.type}
                    </span>
                  </div>
                  <div className="absolute top-5 right-5">
                    <span className="bg-blue-600/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-xl">
                      Private
                    </span>
                  </div>
                  {vehicle.averageRating && (
                    <div className="absolute bottom-5 right-5 flex items-center gap-1 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-white text-xs font-bold">{vehicle.averageRating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="max-w-[70%]">
                      <h3 className="text-xl font-black text-gray-900 leading-tight tracking-tight group-hover:text-primary-600 transition-colors">
                        {vehicle.make} {vehicle.model}
                      </h3>
                      <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-wider">
                        {vehicle.year} {vehicle.fuelType ? `• ${vehicle.fuelType}` : ""} {vehicle.transmissionType ? `• ${vehicle.transmissionType}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-gray-900 leading-none">
                        <span className="text-[10px] font-bold align-top mt-1 mr-1 text-gray-400">KSH</span>
                        {(vehicle.dailyRate || 0).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">Per Day</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 py-4 border-t border-gray-50 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                        <Users className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold text-gray-600">{vehicle.seats || 5} Passengers</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        <Info className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold text-gray-600 capitalize">{vehicle.transmissionType || "Automatic"}</span>
                    </div>
                  </div>

                  <Link
                    href={`/hire/request?vehicleId=${vehicle.id}&driverId=${driverId}`}
                    className="w-full py-5 bg-gray-900 text-white rounded-[1.5rem] font-black text-center flex items-center justify-center gap-3 group/btn hover:bg-primary-600 transition-all duration-500 shadow-xl shadow-gray-200 hover:shadow-primary-500/20"
                  >
                    Request Hire <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter Modal */}
      {showFilters && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center" onClick={() => setShowFilters(false)}>
          <div className="bg-white rounded-t-[3rem] md:rounded-[3rem] w-full md:max-w-lg p-8 space-y-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-gray-900">Filters</h3>
              <button onClick={() => setShowFilters(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Vehicle Type</p>
              <div className="flex flex-wrap gap-2">
                {VEHICLE_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`px-5 py-3 rounded-2xl text-sm font-bold capitalize transition ${
                      selectedType === type ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {type === "All" ? "All Types" : type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Daily Rate (KES)</p>
              <div className="flex flex-wrap gap-2">
                {PRICE_RANGES.map((range) => (
                  <button
                    key={range.label}
                    onClick={() => setSelectedPrice(range)}
                    className={`px-5 py-3 rounded-2xl text-sm font-bold transition ${
                      selectedPrice.label === range.label ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setSelectedType("All");
                  setSelectedPrice(PRICE_RANGES[0]);
                }}
                className="flex-1 py-4 text-gray-500 font-bold rounded-2xl hover:bg-gray-100 transition"
              >
                Reset
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="flex-[2] py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-gray-800 transition shadow-xl"
              >
                Show Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DriverFleetPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
        </div>
      }
    >
      <DriverFleetContent />
    </Suspense>
  );
}
