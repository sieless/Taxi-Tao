"use client";

import { Car } from 'lucide-react';

interface DriverProfileCardProps {
  driver: {
    name: string;
    phone: string;
    profilePhotoUrl?: string;
    vehicle?: {
      make: string;
      model: string;
      plate: string;
    };
  };
}

export default function DriverProfileCard({ driver }: DriverProfileCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-4 flex items-center gap-4">
      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
        {driver.profilePhotoUrl ? (
          <img src={driver.profilePhotoUrl} alt="Driver Photo" className="w-full h-full object-cover" />
        ) : (
          <Car className="w-8 h-8 text-gray-400" />
        )}
      </div>
      <div>
        <p className="font-bold text-gray-800">{driver.name}</p>
        <p className="text-sm text-gray-500">{driver.phone}</p>
        {driver.vehicle && (
          <p className="text-xs text-gray-400">
            {driver.vehicle.make} {driver.vehicle.model} ({driver.vehicle.plate})
          </p>
        )}
      </div>
    </div>
  );
}
