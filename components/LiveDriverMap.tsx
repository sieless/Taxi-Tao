"use client";

import { useEffect, useState, useRef } from 'react';
import { MapPin, Navigation, Clock, Loader2 } from 'lucide-react';
import MapBanner from './MapBanner';

interface LiveDriverMapProps {
  driverPosition: { lat: number; lng: number } | null;
  pickupPosition: { lat: number; lng: number };
  destinationPosition?: { lat: number; lng: number };
  driverName?: string;
  eta?: number; // in minutes
  showPlaceholder?: boolean;
}

export default function LiveDriverMap({
  driverPosition,
  pickupPosition,
  destinationPosition,
  driverName,
  eta,
  showPlaceholder = false,
}: LiveDriverMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // TODO: Initialize actual map (Google Maps, Mapbox, or Leaflet)
  useEffect(() => {
    // Simulate map loading
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [driverPosition]);

  return (
    <div className="relative w-full h-full min-h-[400px]">
      {/* Placeholder / Banner View */}
      {showPlaceholder && (
        <div className="absolute inset-0 z-20">
          <MapBanner />
        </div>
      )}

      {/* Loading State */}
      {loading && !showPlaceholder && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50 rounded-xl">
          <div className="text-center">
            <div className="relative mb-4">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
              <div className="absolute inset-0 w-12 h-12 border-4 border-blue-100 rounded-full mx-auto"></div>
            </div>
            <p className="text-lg font-bold text-gray-800">Locating Driver</p>
            <p className="text-sm text-gray-500">Connecting to live GPS...</p>
          </div>
        </div>
      )}

      {/* Map Container - Replace with actual map component */}
      <div
        ref={mapContainerRef}
        className={`w-full h-full bg-gray-200 flex items-center justify-center rounded-xl transition-opacity duration-700 ${loading || showPlaceholder ? 'opacity-0' : 'opacity-100'}`}
      >
        {/* Placeholder for map */}
        <div className="text-center p-4">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Map View</p>
          <p className="text-sm text-gray-500 mt-2">
            Google Maps Integration Ready
          </p>
        </div>
      </div>

      {/* Driver Info Overlay */}
      {driverPosition && !showPlaceholder && !loading && (
        <div className="absolute top-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <Navigation className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-800">{driverName || 'Your Driver'}</p>
                <p className="text-sm text-gray-600">On the way</p>
              </div>
            </div>
            {eta && (
              <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
                <Clock className="w-4 h-4 text-green-600" />
                <span className="font-bold text-green-700">{eta} min</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error State */}
      {mapError && (
        <div className="absolute bottom-4 left-4 right-4 bg-red-50 border border-red-200 rounded-lg p-3 z-40">
          <p className="text-red-800 text-sm">{mapError}</p>
        </div>
      )}
    </div>
  );
}
