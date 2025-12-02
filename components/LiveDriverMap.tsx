"use client";

import { useEffect, useState, useRef } from 'react';
import { MapPin, Navigation, Clock } from 'lucide-react';

interface LiveDriverMapProps {
  driverPosition: { lat: number; lng: number } | null;
  pickupPosition: { lat: number; lng: number };
  destinationPosition?: { lat: number; lng: number };
  driverName?: string;
  eta?: number; // in minutes
}

export default function LiveDriverMap({
  driverPosition,
  pickupPosition,
  destinationPosition,
  driverName,
  eta,
}: LiveDriverMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  // TODO: Initialize actual map (Google Maps, Mapbox, or Leaflet)
  useEffect(() => {
    // This is a placeholder - integrate actual map library here
    console.log('Map should initialize with:', {
      driver: driverPosition,
      pickup: pickupPosition,
      destination: destinationPosition,
    });
  }, [driverPosition, pickupPosition, destinationPosition]);

  return (
    <div className="relative w-full h-full">
      {/* Map Container - Replace with actual map component */}
      <div
        ref={mapContainerRef}
        className="w-full h-full bg-gray-200 flex items-center justify-center"
      >
        {/* Placeholder for map */}
        <div className="text-center p-4">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Map View</p>
          <p className="text-sm text-gray-500 mt-2">
            Integrate Google Maps, Mapbox, or Leaflet here
          </p>
          
          {/* Debug info */}
          {driverPosition && (
            <div className="mt-4 text-xs text-left bg-white p-3 rounded-lg inline-block">
              <p><strong>Driver:</strong> {driverPosition.lat.toFixed(6)}, {driverPosition.lng.toFixed(6)}</p>
              <p><strong>Pickup:</strong> {pickupPosition.lat.toFixed(6)}, {pickupPosition.lng.toFixed(6)}</p>
              {destinationPosition && (
                <p><strong>Destination:</strong> {destinationPosition.lat.toFixed(6)}, {destinationPosition.lng.toFixed(6)}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Driver Info Overlay */}
      {driverPosition && (
        <div className="absolute top-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4">
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

      {/* Loading State */}
      {!driverPosition && (
        <div className="absolute inset-0 bg-white/90 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Waiting for driver location...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {mapError && (
        <div className="absolute bottom-4 left-4 right-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 text-sm">{mapError}</p>
        </div>
      )}
    </div>
  );
}
