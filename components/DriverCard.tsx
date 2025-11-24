import Link from "next/link";
import { Phone, Star } from "lucide-react";
import { Driver, Vehicle } from "@/lib/types";

interface DriverCardProps {
  driver: Driver;
  vehicle?: Vehicle;
}

export default function DriverCard({ driver, vehicle }: DriverCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col transition hover:-translate-y-1 hover:shadow-xl">
      <div className="h-48 bg-gray-200 relative">
        {vehicle?.images?.[0] ? (
          <img
            src={vehicle.images[0]}
            alt={`${vehicle.make} ${vehicle.model}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            {vehicle ? `${vehicle.make} ${vehicle.model}` : "No Vehicle Image"}
          </div>
        )}
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-xl font-bold text-gray-800">{driver.name}</h3>
            {vehicle && (
              <p className="text-sm text-gray-500">
                {vehicle.make} {vehicle.model} ({vehicle.year})
              </p>
            )}
          </div>
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${
              driver.active
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {driver.active ? "Available" : "Busy"}
          </span>
        </div>

        <div className="flex items-center mb-4 text-yellow-500 text-sm">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < Math.round(driver.rating) ? "fill-current" : "text-gray-300"
              }`}
            />
          ))}
          <span className="ml-2 text-gray-600">({driver.rating.toFixed(1)})</span>
        </div>

        {vehicle && (
          <>
            <p className="text-gray-600 mb-1 text-sm">
              Capacity: <span className="font-medium">{vehicle.seats} Passengers</span>
            </p>
            <p className="text-gray-600 mb-4 text-sm">
              Base Fare: <span className="font-medium">KES {vehicle.baseFare}</span>
            </p>
          </>
        )}

        <div className="mt-auto flex gap-2">
          <Link
            href={`/d/${driver.id}`}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center text-sm"
          >
            View Profile
          </Link>
          <a
            href={`tel:${driver.phone}`}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2 text-sm"
          >
            <Phone className="w-4 h-4" /> Call
          </a>
        </div>
      </div>
    </div>
  );
}
