"use client";

import FinancePulse from "@/components/vendor/FinancePulse";

export default function VendorFinancePage() {
  return (
    <div className="space-y-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Financial Intelligence</h1>
          <p className="text-gray-500 font-medium mt-1 tracking-tight">Real-time ledger and revenue aggregation for your fleet operations.</p>
        </div>
      </div>

      <FinancePulse />
    </div>
  );
}
