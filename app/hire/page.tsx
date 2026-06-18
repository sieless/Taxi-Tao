"use client";

import { useState, useEffect } from "react";
import {
  Briefcase,
  CheckCircle,
  UserCheck,
  Building2,
  ChevronRight,
  Search,
  Car,
  MapPin,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getCorporateCompanies, getActiveCompanies } from "@/lib/carhire/company-service";
import { getPeerHostsForHire } from "@/lib/carhire/driver-service";
import { Company } from "@/lib/types";
import { logError } from "@/lib/logger";

function extractLocation(val: unknown): string | undefined {
  if (!val) return undefined;
  if (typeof val === "string") return val;
  if (typeof val === "object" && val !== null && "address" in val) {
    return (val as { address?: string }).address;
  }
  return undefined;
}

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

function ProviderCard({
  logo,
  name,
  badge,
  badgeColor,
  tagline,
  vehicleCount,
  location,
  href,
}: {
  logo: string;
  name: string;
  badge: "executive" | "verified" | "peer";
  badgeColor: string;
  tagline?: string;
  vehicleCount: number;
  location?: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-5 p-5 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-200"
    >
      <div className="relative flex-shrink-0">
        <div
          className={`w-16 h-16 rounded-xl overflow-hidden ${
            badge === "peer" ? "rounded-full" : ""
          } bg-gray-50`}
        >
          <Image src={logo} alt={name} fill className="object-cover" />
        </div>
        <span
          className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center shadow-sm border-2 border-white ${badgeColor}`}
        >
          {badge === "executive" && <Briefcase className="w-2.5 h-2.5 text-white" />}
          {badge === "verified" && <CheckCircle className="w-2.5 h-2.5 text-white" />}
          {badge === "peer" && <UserCheck className="w-2.5 h-2.5 text-white" />}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
            {name}
          </h3>
          {badge === "executive" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] font-semibold uppercase tracking-wide">
              Executive
            </span>
          )}
        </div>
        {tagline && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{tagline}</p>
        )}
        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Car className="w-3 h-3" />
            {vehicleCount} vehicle{vehicleCount !== 1 ? "s" : ""}
          </span>
          {location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {location}
            </span>
          )}
        </div>
      </div>

      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </Link>
  );
}

function SectionSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-5 p-5 rounded-xl border border-gray-50 animate-pulse">
          <div className="w-16 h-16 rounded-xl bg-gray-100" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-gray-100 rounded" />
            <div className="h-3 w-48 bg-gray-50 rounded" />
            <div className="h-3 w-24 bg-gray-50 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HireLandingPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [corporateCompanies, setCorporateCompanies] = useState<Company[]>([]);
  const [fleetCompanies, setFleetCompanies] = useState<Company[]>([]);
  const [peerHosts, setPeerHosts] = useState<PeerHost[]>([]);
  const [loading, setLoading] = useState<LoadingState>({ corporate: true, fleet: true, peers: true });
  const [filter, setFilter] = useState<"all" | "executive" | "fleet" | "peer">("all");

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

  const totalVehicles = corporateCompanies.reduce((sum, c) => sum + (c.stats?.fleetCount || 0), 0)
    + fleetCompanies.reduce((sum, c) => sum + (c.stats?.fleetCount || 0), 0)
    + peerHosts.reduce((sum, h) => sum + h.vehicleCount, 0);

  const allLoaded = !loading.corporate && !loading.fleet && !loading.peers;

  const handleSearch = () => {
    if (searchTerm.trim()) {
      router.push(`/hire/all?q=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      router.push("/hire/all");
    }
  };

  const filteredCorporate = filter === "all" || filter === "executive" ? corporateCompanies : [];
  const filteredFleet = filter === "all" || filter === "fleet" ? fleetCompanies : [];
  const filteredPeers = filter === "all" || filter === "peer" ? peerHosts : [];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero — Search-First */}
      <div className="border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-16 md:py-24 text-center">
          <h1 className="text-4xl md:text-5xl font-light text-gray-900 tracking-tight">
            Find Your Perfect{" "}
            <span className="font-semibold">Ride</span>
          </h1>
          <p className="mt-4 text-gray-500 text-lg font-light max-w-md mx-auto">
            Browse Kenya&apos;s top car hire partners. Self-drive or chauffeur, executive or budget.
          </p>

          {/* Search Bar */}
          <div className="mt-8 max-w-xl mx-auto">
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-primary-400 focus-within:ring-4 focus-within:ring-primary-50 transition-all">
              <Search className="w-5 h-5 text-gray-400 ml-3 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search by make, model, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 px-2 py-3 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm"
              />
              <button
                onClick={handleSearch}
                className="px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex-shrink-0"
              >
                Search
              </button>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
            {([
              { key: "all", label: "All" },
              { key: "executive", label: "Executive" },
              { key: "fleet", label: "Fleet Companies" },
              { key: "peer", label: "Peer Hosts" },
            ] as const).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                  filter === f.key
                    ? "bg-gray-900 text-white"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Stats */}
          {allLoaded && (
            <div className="mt-8 flex items-center justify-center gap-6 text-xs text-gray-400 font-medium">
              <span>{totalVehicles} vehicles</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              <span>{corporateCompanies.length + fleetCompanies.length} companies</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              <span>{peerHosts.length} hosts</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-16">
        {/* Executive Partners */}
        {(filter === "all" || filter === "executive") && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <Briefcase className="w-4 h-4 text-amber-600" />
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Executive Partners
                </h2>
              </div>
              {corporateCompanies.length > 0 && (
                <Link
                  href="/hire/all?isCorporate=true"
                  className="text-xs font-medium text-gray-400 hover:text-gray-900 transition-colors flex items-center gap-1"
                >
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>

            {loading.corporate ? (
              <SectionSkeleton />
            ) : filteredCorporate.length === 0 ? (
              <p className="text-sm text-gray-400 italic py-8">No executive partners available.</p>
            ) : (
              <div className="space-y-3">
                {filteredCorporate.map((company) => (
                  <ProviderCard
                    key={company.id}
                    logo={
                      company.logoUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&background=fff7ed&color=b45309&size=128&bold=true`
                    }
                    name={company.name}
                    badge="executive"
                    badgeColor="bg-amber-600"
                    tagline={company.corporateTagline}
                    vehicleCount={company.stats?.fleetCount || 0}
                    href={`/hire/${company.id}?isCorporate=true`}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Fleet Companies */}
        {(filter === "all" || filter === "fleet") && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-green-600" />
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Fleet Companies
                </h2>
              </div>
              {fleetCompanies.length > 0 && (
                <Link
                  href="/hire/all"
                  className="text-xs font-medium text-gray-400 hover:text-gray-900 transition-colors flex items-center gap-1"
                >
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>

            {loading.fleet ? (
              <SectionSkeleton />
            ) : filteredFleet.length === 0 ? (
              <p className="text-sm text-gray-400 italic py-8">No fleet companies available.</p>
            ) : (
              <div className="space-y-3">
                {filteredFleet.map((company) => (
                  <ProviderCard
                    key={company.id}
                    logo={
                      company.logoUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&background=f0fdf4&color=16a34a&size=128&bold=true`
                    }
                    name={company.name}
                    badge="verified"
                    badgeColor="bg-green-500"
                    vehicleCount={company.stats?.fleetCount || 0}
                    location={extractLocation(company.officeLocation)}
                    href={`/hire/${company.id}`}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Peer Hosts */}
        {(filter === "all" || filter === "peer") && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Peer Hosts
                </h2>
              </div>
            </div>

            {loading.peers ? (
              <SectionSkeleton />
            ) : filteredPeers.length === 0 ? (
              <p className="text-sm text-gray-400 italic py-8">No peer hosts available.</p>
            ) : (
              <div className="space-y-3">
                {filteredPeers.map((host) => (
                  <ProviderCard
                    key={host.id}
                    logo={host.img}
                    name={host.name}
                    badge="peer"
                    badgeColor="bg-blue-500"
                    vehicleCount={host.vehicleCount}
                    location={extractLocation(host.businessLocation)}
                    href={`/hire/driver/${host.id}`}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* CTA */}
        <section className="border-t border-gray-100 pt-12">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              List Your Vehicle on TaxiTao
            </h2>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
              Join {corporateCompanies.length + fleetCompanies.length} verified companies earning with our platform.
            </p>
            <Link
              href="/signup?role=car_hire"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
