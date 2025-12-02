"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Users, ShieldCheck, XCircle, CheckCircle } from "lucide-react";

interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: string;
  vehicle?: {
    make?: string;
    model?: string;
    plate?: string;
  };
  createdAt: any;
}

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  useEffect(() => {
    loadDrivers();
  }, [filter]);

  const loadDrivers = async () => {
    setLoading(true);
    try {
      let q = query(collection(db, "drivers"), orderBy("createdAt", "desc"));
      
      if (filter !== "all") {
        q = query(
          collection(db, "drivers"),
          where("status", "==", filter),
          orderBy("createdAt", "desc")
        );
      }

      const snapshot = await getDocs(q);
      const driversList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Driver[];
      
      setDrivers(driversList);
    } catch (error) {
      console.error("Error loading drivers:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      suspended: "bg-red-100 text-red-800",
    };
    return styles[status as keyof typeof styles] || styles.inactive;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Drivers Management</h1>
          <p className="text-gray-600">Manage all registered drivers</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex gap-2">
            {["all", "active", "inactive"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === f
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Drivers List */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading drivers...</p>
          </div>
        ) : drivers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No drivers found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {drivers.map((driver) => (
              <div
                key={driver.id}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{driver.name}</h3>
                      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${getStatusBadge(driver.status)}`}>
                        {driver.status}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>📧 {driver.email}</p>
                      <p>📱 {driver.phone}</p>
                      {driver.vehicle && (
                        <p>🚗 {driver.vehicle.make} {driver.vehicle.model} ({driver.vehicle.plate})</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition">
                      <CheckCircle size={20} />
                    </button>
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                      <XCircle size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
