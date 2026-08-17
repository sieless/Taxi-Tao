"use client";

import React from "react";
import { Phone, MessageCircle, Lock } from "lucide-react";
import { Driver } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  driver: Driver;
}

export default function DriverDirectoryCard({ driver }: Props) {
  const { user } = useAuth();
  const pathname = usePathname();

  // We use the first service town or the business location as fallback
  const location = driver.serviceTowns && driver.serviceTowns.length > 0 
    ? driver.serviceTowns[0] 
    : (driver.businessLocation || "Local Area");

  // Determine primary vehicle type if available, otherwise generic
  const vehicleType = driver.vehicles && driver.vehicles.length > 0
    ? driver.vehicles[0].type
    : "Taxi";

  // Phone number for calling
  const cleanPhone = driver.phone ? driver.phone.replace(/[^0-9+]/g, "") : "";
  
  // WhatsApp link format
  // Ensure the whatsapp number has no spaces/pluses for wa.me link
  const cleanWhatsapp = driver.whatsapp ? driver.whatsapp.replace(/[^0-9]/g, "") : cleanPhone.replace(/[^0-9]/g, "");
  const whatsappUrl = `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(`Hi ${driver.name}, I found your contact on Taxi-Tao. I need a ride.`)}`;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 text-indigo-600 font-bold text-xl uppercase">
          {driver.name.charAt(0)}
        </div>
        <div>
          <h3 className="font-bold text-lg text-gray-900">{driver.name}</h3>
          <p className="text-sm text-gray-500 capitalize">{vehicleType} • {location}</p>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-gray-100">
        {user ? (
          <div className="grid grid-cols-2 gap-3">
            <a 
              href={`tel:${cleanPhone}`}
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-900 rounded-xl font-medium transition-colors text-sm"
            >
              <Phone className="w-4 h-4 text-indigo-600" />
              <span>Call</span>
            </a>
            <a 
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 rounded-xl font-medium transition-colors text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Contact details hidden
            </p>
            <Link 
              href={`/login?returnTo=${encodeURIComponent(pathname || "/")}`}
              className="w-full text-center py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors text-sm"
            >
              Log in to view contact
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
