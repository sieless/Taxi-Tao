"use client";

import { Menu, X, Phone, DollarSign, Star, Car } from "lucide-react";

export default function PhoneMockup() {
  return (
    <div className="relative w-[280px] md:w-[320px] mx-auto">
      {/* Phone Frame */}
      <div className="relative bg-gray-900 rounded-[3rem] p-2 shadow-2xl">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-10"></div>
        
        {/* Screen */}
        <div className="relative bg-white rounded-[2.5rem] overflow-hidden" style={{ aspectRatio: "9/19.5" }}>
          {/* Status Bar */}
          <div className="absolute top-0 left-0 right-0 bg-white px-6 pt-2 pb-1 z-20 flex justify-between items-center text-xs font-semibold">
            <span>9:41</span>
            <div className="flex gap-1">
              <div className="w-4 h-2 border border-gray-900 rounded-sm">
                <div className="w-3/4 h-full bg-gray-900"></div>
              </div>
            </div>
          </div>

          {/* App Content - Based on provided screenshot */}
          <div className="h-full pt-8 pb-4 overflow-y-auto bg-white">
            {/* Header with blurred cityscape background */}
            <div className="relative h-32 bg-gradient-to-br from-green-400 via-green-500 to-green-600 overflow-hidden">
              {/* Blurred cityscape effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-green-300/50 to-green-600/50 backdrop-blur-sm">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzEwYjk4MSIvPjwvc3ZnPg==')] opacity-20"></div>
                </div>
              </div>
              
              {/* Top Navigation */}
              <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between">
                <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md">
                  <Menu className="w-3.5 h-3.5 text-gray-700" />
                </div>
                <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-semibold text-gray-800">
                  Hi, Christine
                </div>
                <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md">
                  <X className="w-3.5 h-3.5 text-gray-700" />
                </div>
              </div>

              {/* Logo and Tagline */}
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 mt-6">
                <h1 className="text-xl font-bold text-green-600 mb-0.5">TaxiTao</h1>
                <p className="text-[10px] text-white font-medium">find a taxi anywhere you are</p>
              </div>
            </div>

            {/* White Card Content */}
            <div className="bg-white rounded-t-3xl -mt-6 relative z-10 px-3 pt-4 pb-3">
              {/* Review Price Bar */}
              <div className="bg-blue-50 rounded-lg p-2 mb-3 flex items-center gap-2 border border-blue-100">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-3 h-3 text-white" />
                </div>
                <span className="text-[10px] font-semibold text-blue-700">Review Price</span>
              </div>

              {/* Driver Profile Section */}
              <div className="mb-3">
                <div className="flex items-start gap-2 mb-2">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 overflow-hidden border-2 border-white shadow-md">
                      <div className="w-full h-full bg-gray-300"></div>
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className="font-bold text-xs text-gray-900 truncate">justac gilbert</h3>
                      <div className="flex items-center gap-0.5 bg-yellow-100 px-1.5 py-0.5 rounded flex-shrink-0 ml-1">
                        <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
                        <span className="text-[9px] font-bold text-yellow-700">5.0</span>
                      </div>
                    </div>
                    <p className="text-[9px] text-gray-600 mb-1">4+ rides completed</p>
                    <div className="flex items-center gap-1.5 text-[9px] text-gray-700 flex-wrap">
                      <Car className="w-2.5 h-2.5 text-gray-500 flex-shrink-0" />
                      <span className="truncate">Grey Volkswagen Gti</span>
                      <span className="bg-yellow-200 text-yellow-800 px-1 py-0.5 rounded text-[9px] font-bold flex-shrink-0">KBJ 828</span>
                    </div>
                  </div>
                </div>
                
                {/* Phone Button */}
                <a
                  href="tel:0712345678"
                  className="flex items-center justify-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg font-semibold text-[10px] mb-3"
                >
                  <Phone className="w-3 h-3" />
                  0712345678
                </a>
              </div>

              {/* Review Price Bar 2 */}
              <div className="bg-blue-50 rounded-lg p-2 mb-3 flex items-center gap-2 border border-blue-100">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-3 h-3 text-white" />
                </div>
                <span className="text-[10px] font-semibold text-blue-700">Review Price</span>
              </div>

              {/* Pickup and Dropoff */}
              <div className="space-y-2 mb-3">
                <div className="flex items-start gap-2">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full mt-0.5 flex-shrink-0"></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-semibold text-gray-500 mb-0.5">Pickup</p>
                    <p className="text-[9px] text-gray-700 leading-tight">F8HP+576, Kaani, Machakos County</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full mt-0.5 flex-shrink-0"></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-semibold text-gray-500 mb-0.5">Dropoff</p>
                    <p className="text-[9px] text-gray-700 leading-tight">Tanzania</p>
                  </div>
                </div>
              </div>

              {/* Ride Fare */}
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-3 h-3 text-green-600" />
                  <span className="text-[10px] font-semibold text-gray-700">Ride Fare</span>
                </div>
                <span className="text-sm font-bold text-green-600">KSH 5000</span>
              </div>

              {/* Driver's Proposed Fare Box */}
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-[10px] font-semibold text-gray-800">Driver's Proposed Fare</h4>
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-3 h-3 text-white" />
                  </div>
                </div>
                <p className="text-lg font-bold text-gray-900 mb-0.5">KSH 5000</p>
                <p className="text-[9px] text-gray-600 mb-3">Review and accept or negotiate</p>
                
                {/* Action Buttons */}
                <div className="space-y-1.5">
                  <div className="flex gap-1.5">
                    <button className="flex-1 bg-white border-2 border-blue-500 text-blue-600 font-semibold py-1.5 rounded-lg text-[10px]">
                      Negotiate
                    </button>
                    <button className="flex-1 bg-green-600 text-white font-semibold py-1.5 rounded-lg text-[10px]">
                      Accept & OK
                    </button>
                  </div>
                  <button className="w-full bg-red-500 text-white font-semibold py-1.5 rounded-lg text-[10px] flex items-center justify-center gap-1.5">
                    <X className="w-3 h-3" />
                    Cancel Ride
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

