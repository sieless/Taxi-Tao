"use client";

import DriverPricingManager from "@/components/DriverPricingManager";

export default function DriverPricingPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Route Pricing</h1>
          <p className="text-gray-600">Manage your route prices and standard rates</p>
        </div>
        
        <DriverPricingManager />
      </div>
    </div>
  );
}
