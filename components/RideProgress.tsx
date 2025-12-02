"use client";

import { BookingRequest, Driver } from '@/lib/types';
import { Navigation, MapPinned, Play, CheckCheck, Clock, MapPin as MapPinIcon, Star, User } from 'lucide-react';

interface RideProgressProps {
  booking: BookingRequest;
  driver?: Driver | null;
}

export default function RideProgress({ booking, driver }: RideProgressProps) {
  // Get status badge styling
  const getStatusBadge = () => {
    const rideStatus = booking.rideStatus || 'pending';
    
    const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
      pending: { label: 'Pending', color: 'bg-gray-100 text-gray-800', icon: Clock },
      confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800', icon: CheckCheck },
      en_route: { label: 'Driver En Route', color: 'bg-blue-500 text-white', icon: Navigation },
      arrived: { label: 'Driver Arrived', color: 'bg-purple-500 text-white', icon: MapPinned },
      in_progress: { label: 'Trip In Progress', color: 'bg-green-500 text-white', icon: Play },
      completed: { label: 'Completed', color: 'bg-gray-500 text-white', icon: CheckCheck },
      cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: Clock }
    };

    const config = statusConfig[rideStatus] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold ${config.color}`}>
        <Icon className="w-5 h-5" />
        <span>{config.label}</span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="space-y-6">
        {/* Status Badge */}
        <div>
          <p className="text-xs text-gray-500 font-medium mb-2 uppercase">Current Status</p>
          {getStatusBadge()}
        </div>

        {/* ETA & Distance - Show only when driver is en route or in progress */}
        {booking.eta && (booking.rideStatus === 'en_route' || booking.rideStatus === 'in_progress') && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-gray-600" />
                <p className="text-xs text-gray-500 font-medium uppercase">ETA</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {booking.eta.minutes} <span className="text-sm text-gray-600">min</span>
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <MapPinIcon className="w-4 h-4 text-gray-600" />
                <p className="text-xs text-gray-500 font-medium uppercase">Distance</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{booking.eta.distance}</p>
            </div>
          </div>
        )}

        {/* Driver Info - Show when driver is assigned */}
        {driver && booking.acceptedBy && (
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 font-medium mb-3 uppercase">Your Driver</p>
            <div className="flex items-center gap-4">
              {/* Driver Avatar */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0">
                {driver.profilePhotoUrl ? (
                  <img 
                    src={driver.profilePhotoUrl} 
                    alt={driver.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-white" />
                )}
              </div>

              {/* Driver Details */}
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg">{driver.name}</h3>
                
                {/* Rating */}
                {driver.rating && (
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-semibold text-gray-700">
                      {driver.rating.toFixed(1)}
                    </span>
                    {driver.totalRides && (
                      <span className="text-xs text-gray-500">
                        ({driver.totalRides} trips)
                      </span>
                    )}
                  </div>
                )}

                {/* Vehicle Info */}
                {driver.vehicle && (
                  <p className="text-sm text-gray-600 mt-1">
                    {driver.vehicle.color} {driver.vehicle.make} {driver.vehicle.model}
                    {driver.vehicle.plate && (
                      <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                        {driver.vehicle.plate}
                      </span>
                    )}
                  </p>
                )}

                {/* Phone */}
                {driver.phone && (
                  <a 
                    href={`tel:${driver.phone}`}
                    className="text-sm text-green-600 hover:text-green-700 font-medium mt-2 inline-block"
                  >
                    📞 {driver.phone}
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Arrival Message */}
        {booking.rideStatus === 'arrived' && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-purple-900 font-semibold text-center">
              🎉 Your driver has arrived at the pickup location!
            </p>
          </div>
        )}

        {/* In Progress Message */}
        {booking.rideStatus === 'in_progress' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-900 font-semibold text-center">
              🚗 Trip is in progress to {booking.destination}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
