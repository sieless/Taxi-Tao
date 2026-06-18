"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Vehicle } from "@/lib/types";
import {
  ShieldCheck,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Smartphone,
  Star,
  Users,
  Info,
  Building2,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { logError } from "@/lib/logger";

function HireRequestContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const vehicleId = searchParams.get("vehicleId");
  const providerId = searchParams.get("providerId");
  const driverId = searchParams.get("driverId");
  const googlePlayLink = "https://play.google.com/apps/internaltest/4701167634066348442";

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicle = async () => {
      if (!vehicleId) {
        setLoading(false);
        return;
      }
      try {
        const docSnap = await getDoc(doc(db, "vehicles", vehicleId));
        if (docSnap.exists()) {
          setVehicle({ id: docSnap.id, ...docSnap.data() } as Vehicle);
        }
      } catch (error) {
        logError("page", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicle();
  }, [vehicleId]);

  const backHref = driverId
    ? `/hire/driver/${driverId}`
    : providerId
      ? `/hire/${providerId}`
      : "/hire/all";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold">Vehicle not found</h1>
        <button onClick={() => router.back()} className="mt-4 text-primary-600 font-bold">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 md:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm font-bold text-gray-400 mb-8">
          <Link href="/hire" className="hover:text-primary-600 transition">
            Hire
          </Link>
          <ChevronRight className="w-3 h-3" />
          {providerId ? (
            <>
              <Link href={`/hire/${providerId}`} className="hover:text-primary-600 transition">
                Company Fleet
              </Link>
              <ChevronRight className="w-3 h-3" />
            </>
          ) : driverId ? (
            <>
              <Link href={`/hire/driver/${driverId}`} className="hover:text-primary-600 transition">
                Driver Fleet
              </Link>
              <ChevronRight className="w-3 h-3" />
            </>
          ) : (
            <>
              <Link href="/hire/all" className="hover:text-primary-600 transition">
                All Fleet
              </Link>
              <ChevronRight className="w-3 h-3" />
            </>
          )}
          <span className="text-gray-900">
            {vehicle.make} {vehicle.model}
          </span>
        </nav>

        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition font-bold mb-8"
        >
          <ChevronLeft className="w-5 h-5" /> Back to Fleet
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Vehicle Summary */}
          <div className="space-y-8">
            <div className="bg-white rounded-[2.5rem] overflow-hidden border shadow-sm">
              <div className="aspect-[16/10] bg-gray-100 relative">
                {vehicle.images?.[0] && (
                  <Image src={vehicle.images[0]} alt={vehicle.model} fill className="object-cover" />
                )}
                <div className="absolute top-5 left-5">
                  <span className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl border border-white/50">
                    {vehicle.type}
                  </span>
                </div>
                <div className="absolute top-5 right-5">
                  {vehicle.companyId ? (
                    <span className="bg-blue-600/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-xl flex items-center gap-1">
                      <Building2 className="w-2.5 h-2.5" /> Fleet
                    </span>
                  ) : (
                    <span className="bg-amber-500/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-xl flex items-center gap-1">
                      <User className="w-2.5 h-2.5" /> Private
                    </span>
                  )}
                </div>
                {vehicle.averageRating && (
                  <div className="absolute bottom-5 right-5 flex items-center gap-1 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-white text-xs font-bold">{vehicle.averageRating.toFixed(1)}</span>
                  </div>
                )}
              </div>
              <div className="p-8">
                <h1 className="text-3xl font-black text-gray-900">{vehicle.make} {vehicle.model}</h1>
                <p className="text-gray-500 font-bold mt-1 capitalize">
                  {vehicle.type} • {vehicle.year} {vehicle.fuelType ? `• ${vehicle.fuelType}` : ""} {vehicle.transmissionType ? `• ${vehicle.transmissionType}` : ""}
                </p>

                <div className="mt-6 flex items-center gap-4 text-sm font-bold text-gray-600">
                  <div className="px-3 py-1 bg-gray-100 rounded-lg flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> {vehicle.seats || 5} Seats
                  </div>
                  <div className="px-3 py-1 bg-gray-100 rounded-lg flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" /> {vehicle.transmissionType || "Automatic"}
                  </div>
                  <div className="px-3 py-1 bg-primary-50 text-primary-700 rounded-lg flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> Insured
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-2xl flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-500">Daily Rate</span>
                  <span className="text-2xl font-black text-gray-900">
                    KSH {(vehicle.dailyRate || 0).toLocaleString()}
                  </span>
                </div>

                {vehicle.securityDeposit && vehicle.securityDeposit > 0 && (
                  <div className="mt-2 p-4 bg-gray-50 rounded-2xl flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-500">Security Deposit</span>
                    <span className="text-lg font-black text-gray-900">
                      KSH {vehicle.securityDeposit.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-primary-600 rounded-[2rem] p-8 text-white">
              <h3 className="text-xl font-black mb-4">Zero-Liability Policy</h3>
              <p className="text-primary-50 text-sm opacity-80 leading-relaxed">
                Your security is our priority. All transactions and documentation are handled through our encrypted handshake protocol.
                Documents are only shared once you confirm the vendor.
              </p>
            </div>
          </div>

          {/* Right: App Redirect */}
          <section className="bg-white rounded-[2.5rem] p-8 md:p-10 border shadow-xl space-y-8">
            <div className="space-y-4">
              <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center">
                <Smartphone className="w-7 h-7 text-primary-600" />
              </div>
              <div>
                <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-3">Mobile App Required</p>
                <h2 className="text-2xl md:text-3xl font-black text-gray-900">Continue in the TaxiTao App</h2>
              </div>
              <p className="text-gray-500 font-medium leading-relaxed">
                Vehicle hire requests are completed in the mobile app so your account, documents, chat, approval updates, and vendor handoff stay secure in one place.
              </p>
            </div>

            <div className="space-y-4">
              <a
                href={googlePlayLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-5 bg-gray-900 text-white rounded-[1.5rem] font-black text-lg hover:bg-gray-800 transition shadow-xl shadow-gray-200 flex items-center justify-center gap-3"
              >
                Open on Google Play <ExternalLink className="w-5 h-5" />
              </a>

              <Link
                href="/download"
                className="w-full py-4 bg-primary-50 text-primary-700 rounded-[1.25rem] font-black hover:bg-primary-100 transition flex items-center justify-center gap-3"
              >
                Go to Download Page <Download className="w-5 h-5" />
              </Link>
            </div>

            <div className="pt-6 border-t space-y-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                  Use the app to submit your request, share documents only after vendor confirmation, and track every approval notification.
                </p>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3 gap-4">
                <span className="text-sm font-bold text-gray-600">Selected vehicle</span>
                <span className="text-sm font-black text-gray-900 text-right">{vehicle.make} {vehicle.model}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function HireRequestPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
        </div>
      }
    >
      <HireRequestContent />
    </Suspense>
  );
}
