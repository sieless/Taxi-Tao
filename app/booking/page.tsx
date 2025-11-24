"use client";

import BookingForm from "@/components/BookingForm";
import LiveDriverCarousel from "@/components/LiveDriverCarousel";
import BookingGuidelines from "@/components/BookingGuidelines";
import Link from "next/link";
import { Phone, Loader2 } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useEffect, Suspense } from "react";

function BookingContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const vehicleType = searchParams.get("type") || undefined;

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <Link href="/" className="text-green-600 hover:underline font-semibold mb-6 inline-block">
          ← Back to Home
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            Book Your {vehicleType ? `${vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1)} ` : ""}Ride
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Fill in your details and see our available drivers in real-time
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left Column - Booking Form */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-fit">
            <div className="bg-green-600 text-white p-6">
              <h2 className="text-2xl font-bold">Booking Details</h2>
              <p className="text-sm text-green-100 mt-1">
                Enter your trip information below
              </p>
            </div>
            <div className="p-6">
              <BookingForm />
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-center text-gray-600 text-sm">
                  Call for enquiries:{" "}
                  <a
                    href="tel:+254708674665"
                    className="font-semibold text-green-600 hover:underline inline-flex items-center gap-1"
                  >
                    <Phone className="w-4 h-4" />
                    +254 708 674 665
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Live Driver Carousel */}
          <div>
            <LiveDriverCarousel vehicleType={vehicleType} />
          </div>
        </div>
            
        {/* Booking Guidelines */}
        <BookingGuidelines />

        {/* Contact Us Section */}
        <div className="mt-12 bg-white rounded-xl shadow-md p-8 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Contact Us for Inquiries
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a
              href="tel:+254710450640"
              className="flex flex-col items-center p-4 bg-gray-50 hover:bg-green-50 rounded-xl transition group text-center"
            >
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-green-200 transition">
                <Phone className="w-6 h-6 text-green-600" />
              </div>
              <p className="font-bold text-gray-800 mb-1">+254 710 450 640</p>
              <p className="text-sm text-gray-600">Primary Booking Line</p>
            </a>
            <a
              href="tel:+254743942883"
              className="flex flex-col items-center p-4 bg-gray-50 hover:bg-green-50 rounded-xl transition group text-center"
            >
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-green-200 transition">
                <Phone className="w-6 h-6 text-green-600" />
              </div>
              <p className="font-bold text-gray-800 mb-1">+254 743 942 883</p>
              <p className="text-sm text-gray-600">Customer Support</p>
            </a>
            <a
              href="tel:+254708674665"
              className="flex flex-col items-center p-4 bg-gray-50 hover:bg-green-50 rounded-xl transition group text-center"
            >
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-green-200 transition">
                <Phone className="w-6 h-6 text-green-600" />
              </div>
              <p className="font-bold text-gray-800 mb-1">+254 708 674 665</p>
              <p className="text-sm text-gray-600">Corporate Bookings</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    }>
      <BookingContent />
    </Suspense>
  );
}
