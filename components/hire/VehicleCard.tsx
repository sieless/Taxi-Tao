"use client";

import { Vehicle } from "@/lib/types";
import { Car, ChevronRight, Info, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface VehicleCardProps {
  vehicle: Vehicle;
  href?: string;
}

export default function VehicleCard({ vehicle, href }: VehicleCardProps) {
  const linkHref = href || `/hire/request?vehicleId=${vehicle.id}`;

  return (
    <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-[0_30px_60px_rgba(0,0,0,0.1)] transition-all duration-500 group border border-transparent hover:border-gray-100">
      <div className="aspect-[16/10] bg-gray-50 relative overflow-hidden">
        {vehicle.images?.[0] ? (
          <Image
            src={vehicle.images[0]}
            alt={`${vehicle.make} ${vehicle.model}`}
            fill
            className="object-cover group-hover:scale-110 transition duration-1000 ease-out"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-200">
            <Car className="w-20 h-20 opacity-20" />
            <p className="text-[10px] font-black uppercase tracking-widest mt-2">Image Pending</p>
          </div>
        )}
        <div className="absolute top-5 left-5">
          <span className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl border border-white/50">
            {vehicle.type}
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="max-w-[70%]">
            <h3 className="text-xl font-black text-gray-900 leading-tight tracking-tight group-hover:text-primary-600 transition-colors">
              {vehicle.make} {vehicle.model}
            </h3>
            <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-wider">
              {vehicle.year} • Premium Edition
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl font-black text-gray-900 leading-none">
              <span className="text-[10px] font-bold align-top mt-1 mr-1 text-gray-400">KSH</span>
              {vehicle.dailyRate.toLocaleString()}
            </p>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">Per Day</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 py-4 border-t border-gray-50 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-gray-600">5 Passengers</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
              <Info className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-gray-600 capitalize">{vehicle.transmission || "Automatic"}</span>
          </div>
        </div>

        <Link
          href={linkHref}
          className="w-full py-5 bg-gray-900 text-white rounded-[1.5rem] font-black text-center flex items-center justify-center gap-3 group/btn hover:bg-primary-600 transition-all duration-500 shadow-xl shadow-gray-200 hover:shadow-primary-500/20"
        >
          Request Hire <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
