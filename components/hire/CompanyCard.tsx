"use client";

import { Company } from "@/lib/types";
import { Building2, ChevronRight, Car } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface CompanyCardProps {
  company: Company;
}

export default function CompanyCard({ company }: CompanyCardProps) {
  const fleetCount = company.stats?.fleetCount ?? 0;

  return (
    <Link
      href={`/hire?providerId=${company.id}`}
      className="min-w-[300px] max-w-[340px] flex-shrink-0 bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all duration-500 group border border-transparent hover:border-gray-100"
    >
      <div className="aspect-[16/9] bg-gray-50 relative overflow-hidden">
        {company.logoUrl ? (
          <Image
            src={company.logoUrl}
            alt={company.name}
            fill
            className="object-cover group-hover:scale-105 transition duration-700"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300">
            <Building2 className="w-16 h-16 opacity-30" />
          </div>
        )}
        {company.isCorporate && (
          <div className="absolute top-4 left-4">
            <span className="bg-primary-500/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg">
              Corporate
            </span>
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="text-lg font-black text-gray-900 tracking-tight group-hover:text-primary-600 transition-colors truncate">
          {company.name}
        </h3>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
            <Car className="w-4 h-4 text-primary-500" />
            <span>{fleetCount} vehicle{fleetCount !== 1 ? "s" : ""}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary-50 transition-colors">
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
          </div>
        </div>
      </div>
    </Link>
  );
}
