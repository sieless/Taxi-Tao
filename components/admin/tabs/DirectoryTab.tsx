"use client";

import React, { useState, useEffect } from "react";
import { collection, addDoc, query, where, getDocs, Timestamp, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Driver } from "@/lib/types";
import { toast } from "sonner";
import { Search, Plus, Trash2, Edit2, Phone, MapPin, Car } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAllLocations } from "@/lib/seo/location-data";

export default function DirectoryTab() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [serviceTown, setServiceTown] = useState("");
  const [vehicleType, setVehicleType] = useState("sedan");

  const fetchDirectory = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "drivers"), where("isPublicDirectory", "==", true));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Driver));
      setDrivers(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load directory drivers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectory();
  }, []);

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !serviceTown) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      if (editId) {
        // Update existing
        await updateDoc(doc(db, "drivers", editId), {
          name,
          slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          phone,
          whatsapp: whatsapp || phone,
          serviceTowns: [serviceTown.toLowerCase()],
          businessLocation: serviceTown,
          "vehicles.0.type": vehicleType
        });
        toast.success("Directory listing updated");
      } else {
        // Add new
        const newDriver: Partial<Driver> = {
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        phone,
        whatsapp: whatsapp || phone,
        email: `${phone.replace(/[^0-9]/g, '')}@taxitao.local`,
        bio: "Local taxi and car hire driver.",
        active: true,
        status: "approved",
        rating: 5.0,
        averageRating: 5.0,
        totalRatings: 1,
        totalRides: 0,
        isVisibleToPublic: true,
        isPublicDirectory: true,
        addedBy: "admin",
        serviceTowns: [serviceTown.toLowerCase()],
        businessLocation: serviceTown,
        createdAt: Timestamp.now(),
        subscriptionStatus: "active",
        vehicles: [{
          id: `veh-${Date.now()}`,
          make: "Toyota",
          model: "Standard",
          year: 2018,
          plate: "TBA",
          images: [],
          seats: 4,
          type: vehicleType as any,
          active: true,
          baseFare: 200,
          status: "active",
          dailyRate: 3500,
          securityDeposit: 0,
          availability: []
        }],
        paymentHistory: []
      };

        await addDoc(collection(db, "drivers"), newDriver);
        toast.success("Driver added to directory");
      }

      setIsAdding(false);
      setEditId(null);
      setName("");
      setPhone("");
      setWhatsapp("");
      setServiceTown("");
      fetchDirectory();
    } catch (err) {
      console.error(err);
      toast.error(editId ? "Failed to update driver" : "Failed to add driver");
    }
  };

  const handleEdit = (driver: Driver) => {
    setName(driver.name);
    setPhone(driver.phone);
    setWhatsapp(driver.whatsapp || "");
    setServiceTown(driver.serviceTowns?.[0] || "");
    setVehicleType(driver.vehicles?.[0]?.type || "sedan");
    setEditId(driver.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditId(null);
    setName("");
    setPhone("");
    setWhatsapp("");
    setServiceTown("");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this directory listing?")) return;
    try {
      await deleteDoc(doc(db, "drivers", id));
      toast.success("Listing deleted");
      setDrivers(drivers.filter(d => d.id !== id));
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Directory Listings</h2>
          <p className="text-gray-500">Manage manual driver listings for specific towns</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Listing</span>
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold mb-4">{editId ? "Edit Directory Driver" : "Add New Directory Driver"}</h3>
          <form onSubmit={handleAddDriver} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name *</label>
              <input 
                type="text" 
                value={name} onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl"
                placeholder="e.g. John Doe"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input 
                type="text" 
                value={phone} onChange={e => setPhone(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl"
                placeholder="e.g. +254 712 345 678"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp (Optional)</label>
              <input 
                type="text" 
                value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl"
                placeholder="Defaults to phone if empty"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Town *</label>
              <select 
                value={serviceTown} 
                onChange={e => setServiceTown(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl bg-white"
                required
              >
                <option value="">Select a town...</option>
                {getAllLocations()
                  .sort((a, b) => a.town.localeCompare(b.town))
                  .map(loc => (
                  <option key={loc.slug} value={loc.slug}>
                    {loc.town} ({loc.county})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl bg-white"
              >
                <option value="sedan">Sedan (Taxi)</option>
                <option value="suv">SUV</option>
                <option value="van">Van</option>
                <option value="bike">Boda Boda</option>
                <option value="tuk-tuk">Tuk-Tuk</option>
              </select>
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
              <button type="button" onClick={handleCancel} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">
                {editId ? "Update Listing" : "Save Listing"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : drivers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
          <p className="text-gray-500">No directory listings found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drivers.map(driver => (
            <div key={driver.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative group">
              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleEdit(driver)}
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                  title="Edit listing"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(driver.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  title="Delete listing"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                  {driver.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{driver.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <MapPin className="w-3 h-3" />
                    <span className="capitalize">{driver.serviceTowns?.[0] || driver.businessLocation}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{driver.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4" />
                  <span className="capitalize">{driver.vehicles?.[0]?.type || "Taxi"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
