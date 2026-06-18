"use client";

import { useState, useEffect, useRef } from "react";
import {
  Briefcase,
  CheckCircle,
  UserCheck,
  Building2,
  ChevronLeft,
  ChevronRight,
  Search,
  Car,
  ShieldCheck,
  Loader2,
  Sparkles,
  MapPin,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { getCorporateCompanies, getActiveCompanies } from "@/lib/carhire/company-service";
import { getPeerHostsForHire } from "@/lib/carhire/driver-service";
import { Company } from "@/lib/types";
import { logError } from "@/lib/logger";

interface PeerHost {
  id: string;
  name: string;
  img: string;
  businessLocation?: string;
  vehicleCount: number;
}

interface LoadingState {
  corporate: boolean;
  fleet: boolean;
  peers: boolean;
}

function CorporateBadge() {
  return (
    <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-600 text-white rounded-full flex items-center justify-center shadow-md">
      <Briefcase className="w-2.5 h-2.5" />
    </span>
  );
}

function VerifiedBadge() {
  return (
    <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center shadow-md">
      <CheckCircle className="w-2.5 h-2.5" />
    </span>
  );
}

function PeerBadge() {
  return (
    <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-md">
      <UserCheck className="w-2.5 h-2.5" />
    </span>
  );
}

function CompanyCard({ company, isCorporate }: { company: Company; isCorporate: boolean }) {
  return (
    <Link
      href={isCorporate ? `/hire/${company.id}?isCorporate=true` : `/hire/${company.id}`}
      className="w-32 flex-shrink-0 group"
    >
      <div className={`relative w-20 h-20 rounded-2xl mx-auto mb-3 overflow-hidden ${
        isCorporate ? "border-2 border-amber-200 bg-amber-50" : "border border-gray-100 bg-white"
      }`}>
        {company.logoUrl ? (
          <Image src={company.logoUrl} alt={company.name} fill className="object-cover group-hover:scale-110 transition duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 font-black text-xl">
            {company.name.charAt(0)}
          </div>
        )}
        {isCorporate ? <CorporateBadge /> : <VerifiedBadge />}
      </div>
      <p className="text-center text-sm font-black text-gray-900 truncate group-hover:text-primary-600 transition-colors">{company.name}</p>
      {company.corporateTagline && (
        <p className="text-center text-[10px] text-amber-600 font-bold italic truncate mt-0.5">{company.corporateTagline}</p>
      )}
      <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
        {company.stats?.fleetCount || 0} vehicle{(company.stats?.fleetCount || 0) !== 1 ? "s" : ""}
      </p>
    </Link>
  );
}

function PeerHostCard({ host }: { host: PeerHost }) {
  return (
    <Link href={`/hire/driver/${host.id}`} className="w-32 flex-shrink-0 group">
      <div className="relative w-20 h-20 rounded-full mx-auto mb-3 overflow-hidden border-2 border-gray-100">
        <Image src={host.img} alt={host.name} fill className="object-cover group-hover:scale-110 transition duration-500" />
        <PeerBadge />
      </div>
      <p className="text-center text-sm font-black text-gray-900 truncate group-hover:text-primary-600 transition-colors">{host.name}</p>
      {host.businessLocation && (
        <p className="text-center text-[10px] text-gray-400 font-bold truncate mt-0.5">{host.businessLocation}</p>
      )}
      <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
        {host.vehicleCount} vehicle{host.vehicleCount !== 1 ? "s" : ""}
      </p>
    </Link>
  );
}

function CarouselSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="w-32 flex-shrink-0">
          <div className="w-20 h-20 rounded-2xl bg-gray-100 animate-pulse mx-auto mb-3" />
          <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
          <div className="h-2 w-3/4 bg-gray-100 rounded animate-pulse mx-auto mt-1" />
        </div>
      ))}
    </div>
  );
}

function CarouselSection({
  title,
  icon,
  tag,
  tagColor,
  items,
  loading,
  emptyMessage,
  renderItem,
}: {
  title: string;
  icon: React.ReactNode;
  tag: string;
  tagColor: string;
  items: any[];
  loading: boolean;
  emptyMessage: string;
  renderItem: (item: any) => React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    const el = containerRef.current;
    if (el) {
      el.scrollBy({ left: direction === "left" ? -300 : 300, behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <span className="text-gray-700">{icon}</span>
          <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">{title}</h2>
        </div>
        <span className={`text-[10px] font-black uppercase tracking-widest ${tagColor}`}>{tag}</span>
      </div>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />

        <div ref={containerRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
          {loading ? (
            <CarouselSkeleton />
          ) : items.length === 0 ? (
            <p className="text-gray-400 font-medium italic px-4 py-4">{emptyMessage}</p>
          ) : (
            items.map((item) => renderItem(item))
          )}
        </div>

        <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 left-0 right-0 px-2 pointer-events-none z-20">
          <button onClick={() => scroll("left")} className="absolute left-0 w-8 h-16 bg-white/80 backdrop-blur flex items-center justify-center pointer-events-auto rounded-r-xl shadow-lg hover:shadow-xl transition border border-gray-100">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button onClick={() => scroll("right")} className="absolute right-0 w-8 h-16 bg-white/80 backdrop-blur flex items-center justify-center pointer-events-auto rounded-l-xl shadow-lg hover:shadow-xl transition border border-gray-100">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HireLandingPage() {
  const [corporateCompanies, setCorporateCompanies] = useState<Company[]>([]);
  const [fleetCompanies, setFleetCompanies] = useState<Company[]>([]);
  const [peerHosts, setPeerHosts] = useState<PeerHost[]>([]);
  const [loading, setLoading] = useState<LoadingState>({ corporate: true, fleet: true, peers: true });

  useEffect(() => {
    getCorporateCompanies()
      .then((data) => {
        const withVehicles = data.filter((c) => (c.stats?.fleetCount || 0) > 0);
        setCorporateCompanies(withVehicles);
        setLoading((l) => ({ ...l, corporate: false }));
      })
      .catch((err) => {
        logError("hire-landing-corporate", err);
        setLoading((l) => ({ ...l, corporate: false }));
      });

    getActiveCompanies()
      .then((data) => {
        const nonCorporate = data.filter((c) => c.isCorporate !== true && (c.stats?.fleetCount || 0) > 0);
        setFleetCompanies(nonCorporate);
        setLoading((l) => ({ ...l, fleet: false }));
      })
      .catch((err) => {
        logError("hire-landing-fleet", err);
        setLoading((l) => ({ ...l, fleet: false }));
      });

    getPeerHostsForHire(10)
      .then((data) => {
        setPeerHosts(data);
        setLoading((l) => ({ ...l, peers: false }));
      })
      .catch((err) => {
        logError("hire-landing-peers", err);
        setLoading((l) => ({ ...l, peers: false }));
      });
  }, []);

  const totalProviders = corporateCompanies.length + fleetCompanies.length + peerHosts.length;

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
                Premium fleet rentals from verified partners. Self-drive and chauffeur experiences across Kenya.
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
        {/* Browse All Fleet CTA */}
        <div className="bg-white/80 backdrop-blur-2xl p-4 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white/50 mb-16 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 pl-4">
            <Car className="w-6 h-6 text-primary-600" />
            <div>
              <p className="font-black text-gray-900 text-lg">Browse the full marketplace</p>
              <p className="text-sm text-gray-500 font-medium">
                {!loading.corporate && !loading.fleet && !loading.peers
                  ? `${totalProviders} verified providers`
                  : "Loading providers..."}
              </p>
            </div>
          </div>
          <Link
            href="/hire/all"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-[2.2rem] font-black text-sm hover:bg-primary-600 transition-all shadow-xl hover:scale-105 active:scale-95 duration-300"
          >
            <Search className="w-4 h-4" /> Browse All Fleet <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* EXECUTIVE CORPORATE PARTNERS */}
        <div className="mb-12">
          <CarouselSection
            title="Executive Corporate Partners"
            icon={<Briefcase className="w-5 h-5 text-amber-600" />}
            tag="Featured"
            tagColor="text-amber-600"
            items={corporateCompanies}
            loading={loading.corporate}
            emptyMessage="No executive partners currently featured."
            renderItem={(c) => <CompanyCard key={c.id} company={c} isCorporate={true} />}
          />
        </div>

        {/* TOP FLEET COMPANIES */}
        <div className="mb-12">
          <CarouselSection
            title="Top Fleet Companies"
            icon={<Building2 className="w-5 h-5 text-green-600" />}
            tag="Verified B2B"
            tagColor="text-green-600"
            items={fleetCompanies}
            loading={loading.fleet}
            emptyMessage="No fleet companies available."
            renderItem={(c) => <CompanyCard key={c.id} company={c} isCorporate={false} />}
          />
        </div>

        {/* TRUSTED PEER HOSTS */}
        <div className="mb-12">
          <CarouselSection
            title="Trusted Peer Hosts"
            icon={<UserCheck className="w-5 h-5 text-blue-600" />}
            tag="Verified P2P"
            tagColor="text-blue-600"
            items={peerHosts}
            loading={loading.peers}
            emptyMessage="No independent hosts available."
            renderItem={(h) => <PeerHostCard key={h.id} host={h} />}
          />
        </div>

        {/* Premium CTA Banner */}
        <div className="mt-20">
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
    </div>
  );
}
