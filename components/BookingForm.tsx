"use client";

import { Smartphone, Download, QrCode, Apple } from "lucide-react";
import Link from "next/link";

export default function BookingForm() {
  return (
    <div className="relative min-h-[300px]">
      <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-center md:items-start">
        {/* Left Side - Title (Untouched) */}
        <div className="flex-shrink-0 md:w-56 text-left w-full">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1 leading-tight">
            Where
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-500">
              to?
            </span>
          </h2>
          <div className="mt-3 h-1 w-16 bg-gradient-to-r from-primary-500 to-primary-300 rounded-full"></div>
        </div>

        {/* Right Side - Download CTA (Replaces the booking form) */}
        <div className="flex-1 w-full min-w-0 bg-gradient-to-br from-primary-50 to-primary-50 rounded-2xl border border-primary-100 p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            
            {/* Text & Buttons */}
            <div className="flex-1 text-center lg:text-left space-y-4">
              <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-semibold mb-2">
                <Smartphone className="w-4 h-4" />
                <span>Now Exclusively on Mobile</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                Get the full <br className="hidden lg:block" /> TaxiTao experience
              </h3>
              <p className="text-gray-600 text-lg max-w-lg mx-auto lg:mx-0">
                Booking is now exclusively available on our mobile app. Download it today for instant rides, real-time tracking, and exclusive discounts.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center lg:justify-start">
                <div
                  className="flex items-center justify-center gap-3 bg-gray-100 text-gray-400 font-semibold py-3 px-6 rounded-xl cursor-not-allowed border border-gray-200"
                  title="iOS App Coming Soon"
                >
                  <Apple className="w-6 h-6 opacity-50" />
                  <div className="text-left">
                    <div className="text-[10px] leading-none uppercase tracking-wider">Coming Soon</div>
                    <div className="text-sm leading-tight">App Store</div>
                  </div>
                </div>
                <a
                  href="https://play.google.com/store/apps/details?id=com.taxitao.mobile"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-1"
                >
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a1.984 1.984 0 01-.61-.92L3 2.734a1.984 1.984 0 01.609-.92z" fill="#4CAF50"/>
                    <path d="M14.656 12.865L18.42 15.02a2.43 2.43 0 010 3.96L4.85 22.185l9.806-9.32z" fill="#F44336"/>
                    <path d="M14.656 11.135l-9.806-9.32L18.42 4.98a2.43 2.43 0 010 3.96l-3.764 2.195z" fill="#FFEB3B"/>
                    <path d="M19.125 15.422L21.57 14.02a2.43 2.43 0 000-3.96l-2.445-1.402-4.469 4.477 4.469 4.287z" fill="#2196F3"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-[10px] leading-none text-gray-300">GET IT ON</div>
                    <div className="text-sm leading-tight">Google Play</div>
                  </div>
                </a>
              </div>
            </div>

            {/* QR Code Graphic */}
            <div className="hidden md:flex flex-col items-center justify-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex-shrink-0">
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 relative group overflow-hidden cursor-pointer">
                <div className="absolute inset-0 bg-primary-500/10 scale-0 group-hover:scale-100 transition-transform duration-300 rounded-xl"></div>
                <QrCode className="w-32 h-32 text-gray-800 relative z-10" strokeWidth={1} />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-md z-20">
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                    <Download className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
              <p className="text-xs font-medium text-gray-500 mt-4 uppercase tracking-wider">Scan to Download</p>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
