"use client";

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Loader2 } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const google: any;

// Type declarations for Google Maps
type GoogleMap = any;
type GoogleMarker = any;

interface LiveMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  pickupLocation?: { lat: number; lng: number };
  destinationLocation?: { lat: number; lng: number };
  driverLocation?: { lat: number; lng: number };
}

export default function LiveMap({ center, zoom = 14, pickupLocation, destinationLocation, driverLocation }: LiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<GoogleMap | null>(null);
  const pickupMarkerRef = useRef<GoogleMarker | null>(null);
  const destinationMarkerRef = useRef<GoogleMarker | null>(null);
  const driverMarkerRef = useRef<GoogleMarker | null>(null);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeMap();
  }, [center]);

  useEffect(() => {
    if (googleMapRef.current) {
      updateMarkers();
    }
  }, [pickupLocation, destinationLocation]);

  useEffect(() => {
    if (googleMapRef.current && driverLocation) {
      updateDriverMarker();
    }
  }, [driverLocation]);

  async function initializeMap() {
    if (!mapRef.current) return;

    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        setError('Google Maps API key not configured');
        setLoading(false);
        return;
      }

      const loader = new Loader({
        apiKey: apiKey,
        version: 'weekly',
        libraries: ['places', 'geometry']
      });

      await loader.load();

      // Initialize map
      const map = new google.maps.Map(mapRef.current, {
        center: center,
        zoom: zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      googleMapRef.current = map;
      updateMarkers();
      setLoading(false);
    } catch (err) {
      console.error('Error loading Google Maps:', err);
      setError('Failed to load map. Please check your internet connection.');
      setLoading(false);
    }
  }

  function updateMarkers() {
    if (!googleMapRef.current) return;

    const map = googleMapRef.current;

    // Clear existing markers
    if (pickupMarkerRef.current) {
      pickupMarkerRef.current.setMap(null);
    }
    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.setMap(null);
    }

    const bounds = new google.maps.LatLngBounds();
    let hasMarkers = false;

    // Add pickup marker (green)
    if (pickupLocation) {
      pickupMarkerRef.current = new google.maps.Marker({
        position: pickupLocation,
        map: map,
        title: 'Pickup Location',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#10B981',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3
        },
        label: {
          text: 'P',
          color: '#ffffff',
          fontSize: '12px',
          fontWeight: 'bold'
        }
      });
      bounds.extend(pickupLocation);
      hasMarkers = true;
    }

    // Add destination marker (red)
    if (destinationLocation) {
      destinationMarkerRef.current = new google.maps.Marker({
        position: destinationLocation,
        map: map,
        title: 'Destination',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#EF4444',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3
        },
        label: {
          text: 'D',
          color: '#ffffff',
          fontSize: '12px',
          fontWeight: 'bold'
        }
      });
      bounds.extend(destinationLocation);
      hasMarkers = true;
    }

    // Fit map to show all markers
    if (hasMarkers) {
      map.fitBounds(bounds);
      // Add padding
      const padding = { top: 50, right: 50, bottom: 50, left: 50 };
      map.fitBounds(bounds, padding);
    }
  }

  function updateDriverMarker() {
    if (!googleMapRef.current || !driverLocation) return;

    const map = googleMapRef.current;

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setPosition(driverLocation);
      map.panTo(driverLocation);
    } else {
      const carIcon = {
        path: 'M17.402,0H5.643C2.526,0,0,3.467,0,6.584v34.804c0,3.116,2.526,5.644,5.643,5.644h11.759c3.116,0,5.644-2.527,5.644-5.644 V6.584C23.044,3.467,20.518,0,17.402,0z',
        fillColor: '#3B82F6',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 0.6,
        anchor: new google.maps.Point(11.5, 23)
      };

      driverMarkerRef.current = new google.maps.Marker({
        position: driverLocation,
        map: map,
        title: 'Driver Location',
        icon: carIcon,
        zIndex: 1000
      });

      map.panTo(driverLocation);
    }
  }

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-xl">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-green-600 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-50 rounded-xl border border-red-200">
        <div className="text-center p-6">
          <p className="text-red-600 font-medium mb-2">Map Error</p>
          <p className="text-sm text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full rounded-xl"
      style={{ minHeight: '400px' }}
    />
  );
}
