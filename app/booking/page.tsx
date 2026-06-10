"use client";

import Link from "next/link";
import { Smartphone, Download, MapPin, ChevronRight, ArrowRight } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Logo from "@/components/Logo";

function BookingContent() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const price = searchParams.get("price");

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-50 flex flex-col">
      {/* Simple Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <Logo />
          <Link href="/" className="text-gray-600 hover:text-primary-600 font-medium transition flex items-center gap-1">
            Back to Home <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-primary-100">
          <div className="bg-gradient-to-br from-gray-900 to-primary-900 text-white p-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10 mix-blend-overlay"></div>
            <Smartphone className="w-16 h-16 mx-auto mb-6 text-primary-400" />
            <h1 className="text-3xl md:text-4xl font-extrabold mb-4 relative z-10">
              Complete Your Booking on the App
            </h1>
            <p className="text-lg text-primary-100 max-w-lg mx-auto relative z-10">
              To ensure your safety, real-time tracking, and the best prices, all bookings are now handled securely through our mobile app.
            </p>
          </div>

          <div className="p-8 md:p-12">
            {/* Contextual Trip Info if available */}
            {(from || to) && (
              <div className="mb-10 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Your Trip Details</h3>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                    <div className="w-0.5 h-6 bg-gray-300"></div>
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="text-sm text-gray-500">Pickup</p>
                      <p className="font-bold text-gray-800">{from || 'Current Location'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Destination</p>
                      <p className="font-bold text-gray-800">{to || 'Selected Destination'}</p>
                    </div>
                  </div>
                </div>
                {price && Number(price) > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500 mb-1">Estimated Fare</p>
                    <p className="text-2xl font-black text-primary-600">KES {Number(price).toLocaleString()}</p>
                  </div>
                )}
                {price && Number(price) === 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500 mb-1">Estimated Fare</p>
                    <p className="text-xl font-black text-primary-600">Price Negotiable In-App</p>
                  </div>
                )}
              </div>
            )}

            {/* App Store Links */}
            <div className="space-y-6">
              <h2 className="text-center text-xl font-bold text-gray-800">Download TaxiTao Now</h2>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <div 
                  className="flex items-center justify-center gap-3 bg-gray-100 text-gray-400 border border-gray-200 px-8 py-4 rounded-xl cursor-not-allowed"
                  title="iOS App Coming Soon"
                >
                  <Smartphone className="w-6 h-6 opacity-50" />
                  <div className="text-left">
                    <div className="text-xs uppercase tracking-wider font-semibold">Coming Soon</div>
                    <div className="text-lg font-bold">App Store</div>
                  </div>
                </div>
                <a 
                  href="https://play.google.com/store/apps/details?id=com.taxitao.mobile" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl transition transform hover:-translate-y-1 shadow-lg group"
                >
                  <Download className="w-6 h-6 group-hover:animate-bounce" />
                  <div className="text-left">
                    <div className="text-xs text-primary-100">GET IT ON</div>
                    <div className="text-lg font-bold">Google Play</div>
                  </div>
                </a>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                Already have the app? <span className="font-semibold text-gray-800">Open it to complete your ride request.</span>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    }>
      <BookingContent />
    </Suspense>
  );
}
