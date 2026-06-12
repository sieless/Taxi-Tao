"use client";

import { useState, useEffect } from "react";
import { Vehicle, Company } from "@/lib/types";
import { searchActiveFleet } from "@/lib/carhire/vehicle-management-service";
import { getActiveCompanies } from "@/lib/carhire/company-service";
import { getPeerHostsForHire } from "@/lib/carhire/driver-service";
import VehicleCard from "@/components/hire/VehicleCard";
import CompanyCard from "@/components/hire/CompanyCard";
import PeerHostCard from "@/components/hire/PeerHostCard";
import ScrollableRow from "@/components/hire/ScrollableRow";
import {
  Search,
  Filter,
  Car,
  ShieldCheck,
  Loader2,
  ChevronRight,
  Users,
  MapPin,
  Sparkles,
  Building2,
  UserCheck,
} from "lucide-react";
import Link from "next/link";

export default function PublicFleetPage() {
  const [featuredVehicles, setFeaturedVehicles] = useState<Vehicle[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [peerHosts, setPeerHosts] = useState<{
    id: string;
    name: string;
    img: string;
    businessLocation?: string;
    vehicleCount: number;
  }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [vehicles, activeCompanies, hosts] = await Promise.all([
          searchActiveFleet({ limitCount: 6 }),
          getActiveCompanies(),
          getPeerHostsForHire(10),
        ]);
        setFeaturedVehicles(vehicles);
        setCompanies(activeCompanies);
        setPeerHosts(hosts);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa] pb-20 font-sans">
      {/* Premium Hero Header */}
      <div className="relative bg-[#0a0a0a] text-white py-16 px-4 md:px-6 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] bg-primary-600/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[50%] bg-blue-600/10 blur-[100px] rounded-full" />

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
                Curated selection of premium self-drive and chauffeur experiences across Kenya&apos;s most iconic landscapes.
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
        {/* Glassmorphism Search Bar */}
        <Link
          href="/hire/all"
          className="block bg-white/80 backdrop-blur-2xl p-5 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white/50 mb-20 hover:shadow-[0_25px_60px_rgba(0,0,0,0.08)] transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center group-hover:bg-primary-50 transition-colors">
              <Search className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
            </div>
            <div className="flex-1">
              <p className="text-gray-800 font-bold text-lg">Search make or model...</p>
              <p className="text-gray-400 text-sm font-medium">Browse the complete fleet</p>
            </div>
            <div className="px-6 py-3 bg-gray-900 text-white rounded-[1.5rem] font-black text-sm group-hover:bg-primary-600 transition-colors flex items-center gap-2">
              Browse All <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

        {/* Featured Vehicles */}
        {!loading && featuredVehicles.length > 0 && (
          <section className="mb-20">
            <div className="flex items-center justify-between mb-8 px-4">
              <div>
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Featured Vehicles</h2>
                <p className="text-gray-400 text-sm font-medium mt-1">Top picks from our verified fleet</p>
              </div>
              <Link
                href="/hire/all"
                className="text-sm font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
              >
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {featuredVehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
            <div className="flex justify-center mt-10">
              <Link
                href="/hire/all"
                className="px-10 py-5 bg-gray-900 text-white rounded-[1.5rem] font-black text-lg hover:bg-primary-600 transition-all shadow-xl hover:shadow-primary-500/20 flex items-center gap-3"
              >
                Browse Full Fleet <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </section>
        )}

        {/* Featured Companies */}
        {!loading && companies.length > 0 && (
          <section className="mb-20">
            <div className="flex items-center justify-between mb-8 px-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Fleet Partners</h2>
                  <p className="text-gray-400 text-sm font-medium mt-0.5">{companies.length} verified companies</p>
                </div>
              </div>
            </div>
            <ScrollableRow>
              {companies.map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </ScrollableRow>
          </section>
        )}

        {/* Peer Hosts */}
        {!loading && peerHosts.length > 0 && (
          <section className="mb-20">
            <div className="flex items-center justify-between mb-8 px-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Peer Hosts</h2>
                  <p className="text-gray-400 text-sm font-medium mt-0.5">{peerHosts.length} independent verified drivers</p>
                </div>
              </div>
            </div>
            <ScrollableRow>
              {peerHosts.map((host) => (
                <PeerHostCard key={host.id} host={host} />
              ))}
            </ScrollableRow>
          </section>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="w-16 h-16 text-primary-600 animate-spin mb-6" />
            <p className="text-gray-400 font-bold tracking-widest uppercase text-sm">Initializing Registry Sync...</p>
          </div>
        )}
      </div>

      {/* Premium CTA Banner */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 mt-20">
        <div className="relative bg-gray-900 rounded-[4rem] p-12 md:p-24 text-white overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-primary-600/20 to-transparent" />

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
              <div className="absolute inset-0 bg-primary-500/20 rounded-[4rem] rotate-6 border-2 border-white/10" />
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
