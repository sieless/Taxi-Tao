"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Driver } from "@/lib/types";
import { Star, Car, MapPin, Briefcase, Loader2, Search } from "lucide-react";
import Link from "next/link";

export default function AllDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [filteredDrivers, setFilteredDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [sortBy, setSortBy] = useState("rating");

  useEffect(() => {
    fetchAllDrivers();
  }, []);

  useEffect(() => {
    filterAndSortDrivers();
  }, [drivers, searchTerm, selectedLocation, selectedType, sortBy]);

  async function fetchAllDrivers() {
    try {
      const q = query(
        collection(db, "drivers"),
        where("subscriptionStatus", "==", "active")
      );

      const snapshot = await getDocs(q);
      const allDrivers: Driver[] = [];
      snapshot.forEach((doc) => {
        allDrivers.push({ id: doc.id, ...doc.data() } as Driver);
      });

      setDrivers(allDrivers);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching drivers:", error);
      setLoading(false);
    }
  }

  function filterAndSortDrivers() {
    let filtered = [...drivers];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (driver) =>
          driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          driver.businessLocation?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Location filter
    if (selectedLocation !== "all") {
      filtered = filtered.filter(
        (driver) => driver.businessLocation === selectedLocation
      );
    }

    // Vehicle type filter
    if (selectedType !== "all") {
      filtered = filtered.filter(
        (driver) => driver.vehicle?.type === selectedType
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      if (sortBy === "rating") {
        return (b.averageRating || 0) - (a.averageRating || 0);
      } else if (sortBy === "experience") {
        return (b.experienceYears || 0) - (a.experienceYears || 0);
      } else if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    setFilteredDrivers(filtered);
  }

  const onlineCount = drivers.filter((d) => d.status === "available").length;
  const locations = Array.from(new Set(drivers.map((d) => d.businessLocation).filter(Boolean)));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">Loading drivers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-green-100 px-4 py-2 rounded-full mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-700 font-semibold">{onlineCount} Online Now</span>
          </div>
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Our Professional Drivers
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose from our fleet of {drivers.length} verified and experienced drivers
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search drivers by name, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* Location Filter */}
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="all">All Locations</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>

            {/* Vehicle Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="all">All Vehicles</option>
              <option value="sedan">Sedan</option>
              <option value="suv">SUV</option>
              <option value="van">Van</option>
              <option value="minibus">Minibus</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white ml-auto"
            >
              <option value="rating">Highest Rated</option>
              <option value="experience">Most Experienced</option>
              <option value="name">Name (A-Z)</option>
            </select>

            {/* Results Count */}
            <span className="text-sm text-gray-600">
              Showing {filteredDrivers.length} of {drivers.length} drivers
            </span>
          </div>
        </div>

        {/* Driver Cards Grid */}
        {filteredDrivers.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Drivers Found</h3>
            <p className="text-gray-600">
              Try adjusting your search or filters to find more drivers.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-12 max-w-[1400px] mx-auto">
            {filteredDrivers.map((driver) => (
              <div
                key={driver.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-visible group relative"
                style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
              >
                {/* Profile Picture - Fully Visible at Top Left */}
                <div className="absolute -top-6 left-4 z-20">
                  <div className="relative w-24 h-24 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-white">
                    {driver.profilePhotoUrl ? (
                      <img
                        src={driver.profilePhotoUrl}
                        alt={driver.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">
                          {driver.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Online status indicator */}
                  {driver.status === "available" && (
                    <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
                  )}
                </div>

                {/* Car Photo Header */}
                <div className="relative h-32 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden rounded-t-2xl mt-6">
                  {driver.vehicle?.carPhotoUrl ? (
                    <img
                      src={driver.vehicle.carPhotoUrl}
                      alt={`${driver.vehicle.make} ${driver.vehicle.model}`}
                      className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-400 to-green-600">
                      <Car className="w-16 h-16 text-white/50" />
                    </div>
                  )}

                  {/* Online Badge */}
                  {driver.status === "available" && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                      ONLINE
                    </div>
                  )}

                  {/* Registration Number */}
                  {driver.vehicle?.plate && (
                    <div className="absolute bottom-2 right-2 bg-white/95 backdrop-blur-sm text-gray-800 px-2 py-1 rounded text-xs font-bold shadow-md border border-gray-200">
                      🚗 {driver.vehicle.plate}
                    </div>
                  )}
                </div>

                {/* Driver Details */}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-1">
                    {driver.name}
                  </h3>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < Math.round(driver.averageRating || 0)
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-gray-700">
                      {driver.averageRating ? driver.averageRating.toFixed(1) : "New"}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({driver.totalRides || 0})
                    </span>
                  </div>

                  {/* Vehicle Info */}
                  {driver.vehicle && (
                    <div className="flex items-center gap-2 text-xs text-gray-700 mb-2 bg-gray-50 px-2 py-1.5 rounded">
                      <Car className="w-3.5 h-3.5 text-green-600" />
                      <span className="font-semibold">
                        {driver.vehicle.make} {driver.vehicle.model}
                      </span>
                      <span className="ml-auto text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full capitalize font-medium">
                        {driver.vehicle.type}
                      </span>
                    </div>
                  )}

                  {/* Experience & Location */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                      <span>{driver.experienceYears || 0} Yrs Exp</span>
                    </div>
                    {driver.businessLocation && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span>{driver.businessLocation}</span>
                      </div>
                    )}
                  </div>

                  {/* Book Now Button */}
                  <Link
                    href="/#book-taxi"
                    className="block w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold py-2.5 rounded-lg text-center transition-all shadow-md hover:shadow-lg text-sm"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
