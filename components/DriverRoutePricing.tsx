import React, { useEffect, useState } from 'react';
import { getDriverPricing, subscribeToDriverPricing } from '../lib/pricing-service';
import { MapPin, DollarSign, ArrowRight, Loader2, Navigation } from 'lucide-react';

interface RouteEntry {
  routeKey: string;
  from: string;
  to: string;
  price: number;
  distance?: number;
  duration?: string;
}

interface DriverRoutePricingProps {
  driverId: string;
  showTitle?: boolean;
  maxRoutes?: number;
  compactView?: boolean;
}

interface RoutePricingData {
  from?: string;
  to?: string;
  price?: number;
  distance?: number;
  duration?: string;
}

export default function DriverRoutePricing({ 
  driverId, 
  showTitle = true, 
  maxRoutes,
  compactView = false 
}: DriverRoutePricingProps) {
  const [routes, setRoutes] = useState<RouteEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');

  useEffect(() => {
    if (!driverId) return;
    
    const unsubscribe = subscribeToDriverPricing(driverId, (data) => {
      const rp = data?.routePricing || {};
      
      const entries: RouteEntry[] = Object.entries(rp)
        .filter(([_, info]) => info !== null && info !== undefined)
        .map(([routeKey, info]) => {
          const routeData = info as RoutePricingData;
          
          if (routeData.from && routeData.to) {
            return {
              routeKey,
              from: routeData.from,
              to: routeData.to,
              price: routeData.price || 0,
              distance: routeData.distance,
              duration: routeData.duration,
            };
          }
          
          // Fallback parsing for old format
          const parts = routeKey.split('-');
          const from = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : '';
          const to = parts.slice(1).map(part => 
            part.charAt(0).toUpperCase() + part.slice(1)
          ).join('-') || '';
          
          return {
            routeKey,
            from,
            to,
            price: routeData.price || 0,
            distance: routeData.distance,
            duration: routeData.duration,
          };
        });
      
      setRoutes(entries);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [driverId]);

  //Filter routes based on search
  const filteredRoutes = routes.filter(route => {
    const matchesFrom = !searchFrom || route.from.toLowerCase().includes(searchFrom.toLowerCase());
    const matchesTo = !searchTo || route.to.toLowerCase().includes(searchTo.toLowerCase());
    return matchesFrom && matchesTo;
  });

  // Limit routes if maxRoutes is specified
  const displayedRoutes = maxRoutes ? filteredRoutes.slice(0, maxRoutes) : filteredRoutes;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-green-600" />
      </div>
    );
  }

  if (routes.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <Navigation className="w-10 h-10 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No route pricing available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showTitle && (
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          Route Pricing
        </h3>
      )}

      {/* Search Filters - Only show if not compact view */}
      {!compactView && routes.length > 3 && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <input
            type="text"
            placeholder="From..."
            value={searchFrom}
            onChange={(e) => setSearchFrom(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <input
            type="text"
            placeholder="To..."
            value={searchTo}
            onChange={(e) => setSearchTo(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      )}

      {/* Routes List */}
      <div className={compactView ? "space-y-2" : "space-y-3"}>
        {displayedRoutes.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No routes match your search</p>
        ) : (
          displayedRoutes.map((route) => (
            <div
              key={route.routeKey}
              className={`flex items-center justify-between ${
                compactView 
                  ? 'p-3 bg-gray-50 rounded-lg' 
                  : 'p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-green-300 transition-colors'
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                {!compactView && (
                  <div className="p-2 bg-green-100 rounded-lg">
                    <MapPin className="w-4 h-4 text-green-600" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold text-gray-800 ${compactView ? 'text-sm' : ''}`}>
                      {route.from}
                    </span>
                    <ArrowRight className={`text-gray-400 ${compactView ? 'w-3 h-3' : 'w-4 h-4'}`} />
                    <span className={`font-semibold text-gray-800 ${compactView ? 'text-sm' : ''}`}>
                      {route.to}
                    </span>
                  </div>
                  {!compactView && (route.distance || route.duration) && (
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      {route.distance && <span>{route.distance} km</span>}
                      {route.duration && <span>• {route.duration}</span>}
                    </div>
                  )}
                </div>
              </div>
              <div className={`flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg font-bold ${
                compactView ? 'text-xs' : 'text-sm'
              }`}>
                <DollarSign className={compactView ? 'w-3 h-3' : 'w-4 h-4'} />
                <span>{route.price.toLocaleString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Show more indicator */}
      {maxRoutes && filteredRoutes.length > maxRoutes && (
        <p className="text-xs text-center text-gray-500">
          +{filteredRoutes.length - maxRoutes} more routes available
        </p>
      )}
    </div>
  );
}
