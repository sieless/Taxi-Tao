"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, MapPin, SlidersHorizontal } from "lucide-react";

const BASE_URL = "https://taxitao.co.ke";

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  plate: string;
  images: string[];
  seats: number;
  type: string;
  dailyRate: number;
  securityDeposit: number;
  serviceCounty?: string;
  serviceTown?: string;
  color?: string;
  transmission?: string;
  fuelType?: string;
  companyId?: string;
  companyName?: string;
}

interface SearchFilters {
  q: string;
  county: string;
  town: string;
  vehicleType: string;
  minPrice: string;
  maxPrice: string;
  seats: string;
}

const VEHICLE_TYPES = ["sedan", "suv", "van", "bike", "tuk-tuk"];
const COUNTIES = [
  "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Uasin Gishu",
  "Machakos", "Kiambu", "Kericho", "Kilifi", "Trans Nzoia",
  "Garissa", "Kajiado",
];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [results, setResults] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    q: searchParams.get("q") ?? "",
    county: searchParams.get("county") ?? "",
    town: searchParams.get("town") ?? "",
    vehicleType: searchParams.get("type") ?? "",
    minPrice: searchParams.get("min_price") ?? "",
    maxPrice: searchParams.get("max_price") ?? "",
    seats: searchParams.get("seats") ?? "",
  });

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.q) params.set("q", filters.q);
      if (filters.county) params.set("county", filters.county);
      if (filters.town) params.set("town", filters.town);
      if (filters.vehicleType) params.set("type", filters.vehicleType);
      if (filters.minPrice) params.set("min_price", filters.minPrice);
      if (filters.maxPrice) params.set("max_price", filters.maxPrice);
      if (filters.seats) params.set("seats", filters.seats);

      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();
      setResults(data.vehicles ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResults();
  };

  return (
    <section className="bg-white py-8 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-primary-600">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">Search</span>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Search Vehicles
        </h1>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by make, model, or location..."
                value={filters.q}
                onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors"
            >
              Search
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">County</label>
                <select
                  value={filters.county}
                  onChange={(e) => setFilters({ ...filters, county: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">All Counties</option>
                  {COUNTIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                <select
                  value={filters.vehicleType}
                  onChange={(e) => setFilters({ ...filters, vehicleType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">All Types</option>
                  {VEHICLE_TYPES.map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Price (KES)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Price (KES)</label>
                <input
                  type="number"
                  placeholder="50000"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          )}
        </form>

        <div className="mb-4 text-sm text-gray-500">
          {loading ? "Searching..." : `${total} vehicle${total !== 1 ? "s" : ""} found`}
        </div>

        {results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((v) => (
              <Link
                key={v.id}
                href={`/hire/${v.id}`}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-primary-200 transition-all"
              >
                {v.images[0] ? (
                  <div className="h-40 rounded-lg overflow-hidden bg-gray-100 mb-3">
                    <img
                      src={v.images[0]}
                      alt={`${v.make} ${v.model}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-40 rounded-lg bg-gray-100 flex items-center justify-center mb-3">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
                <h3 className="font-bold text-gray-900">
                  {v.year} {v.make} {v.model}
                </h3>
                <p className="text-primary-600 font-bold">
                  KES {v.dailyRate.toLocaleString()}/day
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <span>{v.seats} seats</span>
                  <span>·</span>
                  <span>{v.type}</span>
                  {v.serviceTown && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {v.serviceTown}
                      </span>
                    </>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No vehicles found matching your criteria.</p>
              <p className="text-sm text-gray-400">Try adjusting your filters or search terms.</p>
            </div>
          )
        )}
      </div>
    </section>
  );
}
