"use client";

import { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Vehicle } from "@/lib/types";
import { 
  Search, 
  Filter, 
  Car, 
  ShieldCheck, 
  Loader2,
  ChevronRight,
  Info,
  Users,
  MapPin,
  Sparkles
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";


import { logError } from "@/lib/logger";export default function PublicFleetPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    const fetchVehicles = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "vehicles"),
          where("status", "==", "active"),
          where("isVisibleToPublic", "==", true),
          where("dailyRate", ">", 0),
          orderBy("dailyRate", "asc")
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
        setVehicles(data);
      } catch (error) {
        logError("page", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.make.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         v.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || v.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-[#fafafa] pb-20 font-sans">
      {/* Premium Hero Header */}
      <div className="relative bg-[#0a0a0a] text-white py-16 px-4 md:px-6 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] bg-primary-600/20 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[50%] bg-blue-600/10 blur-[100px] rounded-full"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-primary-400 mb-6">
                <Sparkles className="w-3 h-3" /> Exclusive Fleet Registry
              </div>
              <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter leading-none">
                Drive the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">Extraordinary.</span>
              </h1>
              <p className="text-gray-400 text-xl leading-relaxed max-w-lg">
                Curated selection of premium self-drive and chauffeur experiences across Kenya's most iconic landscapes.
              </p>
            </div>
            
            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-xl px-8 py-5 rounded-[2.5rem] border border-white/10 shadow-2xl">
              <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                <ShieldCheck className="text-white w-7 h-7" />
              </div>
              <div>
                <p className="font-black text-lg">Verified Fleet</p>
                <p className="text-white/50 text-sm font-medium">Fully insured & vetted assets</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-10">
        {/* Glassmorphism Search & Filters */}
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

        {/* Fleet Section Header */}
        <div className="flex items-center justify-between mb-8 px-4">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Available Assets <span className="text-gray-400 font-medium ml-2">({filteredVehicles.length})</span></h2>
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 bg-white px-4 py-2 rounded-full border">
             <MapPin className="w-4 h-4 text-primary-600" /> All Locations
          </div>
        </div>

        {/* Premium Fleet Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="w-16 h-16 text-primary-600 animate-spin mb-6" />
            <p className="text-gray-400 font-bold tracking-widest uppercase text-sm">Initializing Registry Sync...</p>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-gray-200">
            <Car className="w-24 h-24 text-gray-100 mx-auto mb-6" />
            <h2 className="text-3xl font-black text-gray-800 tracking-tight">No Matches Found</h2>
            <p className="text-gray-500 mt-2 font-medium">Try broadening your search or switching categories.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredVehicles.map((vehicle) => (
              <div key={vehicle.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-[0_30px_60px_rgba(0,0,0,0.1)] transition-all duration-500 group border border-transparent hover:border-gray-100">
                {/* Image Section */}
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
                  
                  {/* Badge */}
                  <div className="absolute top-5 left-5">
                    <span className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl border border-white/50">
                      {vehicle.type}
                    </span>
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="max-w-[70%]">
                      <h3 className="text-xl font-black text-gray-900 leading-tight tracking-tight group-hover:text-primary-600 transition-colors">{vehicle.make} {vehicle.model}</h3>
                      <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-wider">{vehicle.year} • Premium Edition</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-gray-900 leading-none">
                        <span className="text-[10px] font-bold align-top mt-1 mr-1 text-gray-400">KSH</span>
                        {vehicle.dailyRate.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">Per Day</p>
                    </div>
                  </div>

                  {/* Feature Icons */}
                  <div className="grid grid-cols-2 gap-3 py-4 border-t border-gray-50 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                        <Users className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold text-gray-600">5 Passengers</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        <Info className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold text-gray-600 capitalize">Automatic</span>
                    </div>
                  </div>

                  <Link 
                    href={`/hire/request?vehicleId=${vehicle.id}`}
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

      {/* Premium CTA Banner */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 mt-32">
        <div className="relative bg-gray-900 rounded-[4rem] p-12 md:p-24 text-white overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-primary-600/20 to-transparent"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-16">
            <div className="max-w-xl text-center md:text-left">
              <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter leading-tight">
                Scale Your Fleet with <span className="text-primary-400">TaxiTao.</span>
              </h2>
              <p className="text-gray-300 text-xl leading-relaxed opacity-80 mb-10">
                Join our premium partner network. Gain access to verified customers and end-to-end management tools.
              </p>
              <Link 
                href="/signup?role=car_hire"
                className="inline-flex items-center gap-3 px-10 py-5 bg-white text-gray-900 font-black rounded-[1.8rem] hover:bg-primary-50 transition-all shadow-2xl hover:scale-105 active:scale-95 duration-300"
              >
                Register Your Company <ChevronRight className="w-6 h-6 text-primary-600" />
              </Link>
            </div>
            
            <div className="relative w-full max-w-sm aspect-square">
               <div className="absolute inset-0 bg-primary-500/20 rounded-[4rem] rotate-6 border-2 border-white/10"></div>
               <div className="absolute inset-0 bg-gray-800 rounded-[4rem] -rotate-3 border border-white/10 shadow-2xl flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-20 h-20 bg-primary-500 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-primary-500/30">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-6xl font-black mb-2 tracking-tighter">100%</p>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-white/50">Verified Business Network</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
