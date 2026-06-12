"use client";

import { ChevronRight, MapPin, Car } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface PeerHostCardProps {
  host: {
    id: string;
    name: string;
    img: string;
    businessLocation?: string;
    vehicleCount: number;
  };
}

export default function PeerHostCard({ host }: PeerHostCardProps) {
  return (
    <Link
      href={`/hire/driver/${host.id}`}
      className="min-w-[260px] max-w-[300px] flex-shrink-0 bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all duration-500 group border border-transparent hover:border-gray-100 p-5"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0">
          {host.img ? (
            <Image
              src={host.img}
              alt={host.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-600 font-black text-lg">
                {host.name.charAt(0)}
              </span>
            </div>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-black text-gray-900 tracking-tight group-hover:text-primary-600 transition-colors truncate">
            {host.name}
          </h3>
          {host.businessLocation && (
            <div className="flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-500 font-medium truncate">{host.businessLocation}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
          <Car className="w-4 h-4 text-primary-500" />
          <span>{host.vehicleCount} rental vehicle{host.vehicleCount !== 1 ? "s" : ""}</span>
        </div>
        <div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary-50 transition-colors">
          <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary-600 transition-colors" />
        </div>
      </div>
    </Link>
  );
}
