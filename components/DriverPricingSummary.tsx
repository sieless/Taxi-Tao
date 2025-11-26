"use client";

import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, MapPin } from 'lucide-react';
import { getDriverPricing, subscribeToDriverPricing } from '../lib/pricing-service';
import { useAuth } from '../lib/auth-context';

interface RoutePricingData {
  from?: string;
  to?: string;
  price?: number;
  distance?: number;
  duration?: string;
}

export default function DriverPricingSummary() {
  const { userProfile } = useAuth();
  const driverId = userProfile?.driverId || '';
  const [routes, setRoutes] = useState<Array<{ route: string; price: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!driverId) return;
    
    setLoading(true);
    const unsubscribe = subscribeToDriverPricing(driverId, (data) => {
      const rp = data?.routePricing || {};
      const entries = Object.entries(rp)
        .filter(([_, info]) => info !== null && info !== undefined)
        .map(([routeKey, info]) => {
          const routeData = info as RoutePricingData;
          let routeName = routeKey;

          // Try to use from/to if available
          if (routeData.from && routeData.to) {
            routeName = `${routeData.from} → ${routeData.to}`;
          } else {
            // Fallback parsing for old format
            const parts = routeKey.split('-');
            if (parts.length >= 2) {
              const from = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
              const to = parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('-');
              routeName = `${from} → ${to}`;
            }
          }

          return { 
            route: routeName, 
            price: routeData.price || 0
          };
        });
      setRoutes(entries);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [driverId]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (routes.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-bold text-gray-800">My Route Pricing</h3>
        </div>
        <p className="text-gray-500 text-sm">No routes added yet. Click "Pricing" in Quick Actions to add your first route.</p>
      </div>
    );
  }

  // Calculate stats
  const avgPrice = Math.round(routes.reduce((sum, r) => sum + r.price, 0) / routes.length);
  const minPrice = Math.min(...routes.map(r => r.price));
  const maxPrice = Math.max(...routes.map(r => r.price));

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-bold text-gray-800">My Route Pricing</h3>
        </div>
        <span className="text-sm text-gray-500">{routes.length} routes</span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-200">
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Average</p>
          <p className="text-lg font-bold text-gray-800">KES {avgPrice.toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Lowest</p>
          <p className="text-lg font-bold text-green-600">KES {minPrice.toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Highest</p>
          <p className="text-lg font-bold text-blue-600">KES {maxPrice.toLocaleString()}</p>
        </div>
      </div>

      {/* Routes List */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {routes.map((r, idx) => (
          <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
            <div className="flex items-center gap-2 flex-1">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-700">{r.route}</span>
            </div>
            <span className="text-sm font-bold text-gray-800">KES {r.price.toLocaleString()}</span>
          </div>
        ))}
      </div>

      {/* Market Insight */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
          <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-blue-800">Market Insight</p>
            <p className="text-xs text-blue-700 mt-1">
              Your prices are competitive. Keep monitoring market rates to stay ahead.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
