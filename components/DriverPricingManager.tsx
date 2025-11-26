import React, { useEffect, useState } from 'react';
import { getDriverPricing, updatePricing, createRouteKey } from '../lib/pricing-service';
import { useAuth } from '../lib/auth-context';
import { MapPin, DollarSign, Trash2, ArrowRight, Plus, Loader2, Edit3, List } from 'lucide-react';
import { KENYA_LOCATIONS, normalizeLocation, isValidLocation } from '../lib/locations';

interface RouteEntry {
  routeKey: string;
  from: string;
  to: string;
  price: number;
  distance?: number;
  duration?: string;
}

export default function DriverPricingManager() {
  const { userProfile } = useAuth();
  const driverId = userProfile?.driverId || '';
  const [routes, setRoutes] = useState<RouteEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Input mode toggle
  const [inputMode, setInputMode] = useState<'dropdown' | 'manual'>('dropdown');
  
  // Form state
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [price, setPrice] = useState('');
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');

  useEffect(() => {
    if (!driverId) return;
    
    const loadPricing = async () => {
      try {
        const data = await getDriverPricing(driverId);
        const rp = data?.routePricing || {};
        
        // Filter out null/undefined entries and convert to array
        const entries: RouteEntry[] = Object.entries(rp)
          .filter(([_, info]) => info !== null && info !== undefined)
          .map(([routeKey, info]) => {
            const routeData = info as any;
            
            // Check if data has new format (from/to fields)
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
            
            // Handle old format: parse route key to extract from/to
            // e.g., "machakos-masii" -> from: "Machakos", to: "Masii"
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
      } catch (error) {
        console.error('Error loading pricing:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadPricing();
  }, [driverId]);

  const addRoute = async () => {
    if (!driverId) {
      alert('Driver ID not found. Please refresh the page.');
      return;
    }
    
    if (!fromLocation || !toLocation || !price) {
      alert('Please fill in From, To, and Price fields.');
      return;
    }
    
    // Validate manual inputs
    if (inputMode === 'manual') {
      if (!isValidLocation(fromLocation)) {
        alert('Invalid "From" location. Please use only letters, spaces, and hyphens.');
        return;
      }
      if (!isValidLocation(toLocation)) {
        alert('Invalid "To" location. Please use only letters, spaces, and hyphens.');
        return;
      }
    }
    
    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Please enter a valid price.');
      return;
    }
    
    // Normalize locations
    const normalizedFrom = normalizeLocation(fromLocation);
    const normalizedTo = normalizeLocation(toLocation);
    
    if (normalizedFrom.toLowerCase() === normalizedTo.toLowerCase()) {
      alert('From and To locations must be different.');
      return;
    }
    
    const routeKey = createRouteKey(normalizedFrom, normalizedTo);
    
    // Check for duplicate
    if (routes.some(r => r.routeKey === routeKey)) {
      alert('This route already exists. Please edit or delete it first.');
      return;
    }
    
    setSaving(true);
    try {
      const routeData: any = {
        from: normalizedFrom,
        to: normalizedTo,
        price: priceNum,
      };
      
      if (distance && !isNaN(Number(distance))) {
        routeData.distance = Number(distance);
      }
      
      if (duration) {
        routeData.duration = duration;
      }
      
      const updated = {
        routePricing: { [routeKey]: routeData },
      };
      
      await updatePricing(driverId, updated);
      
      setRoutes([...routes, {
        routeKey,
        from: normalizedFrom,
        to: normalizedTo,
        price: priceNum,
        distance: distance ? Number(distance) : undefined,
        duration: duration || undefined,
      }]);
      
      // Reset form
      setFromLocation('');
      setToLocation('');
      setPrice('');
      setDistance('');
      setDuration('');
      
      alert('Route added successfully!');
    } catch (error) {
      console.error('Error adding route:', error);
      alert('Failed to add route. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const deleteRoute = async (routeKey: string) => {
    if (!driverId) {
      alert('Driver ID not found. Please refresh the page.');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this route?')) {
      return;
    }
    
    setSaving(true);
    try {
      const updated = {
        routePricing: { [routeKey]: null }, // Firestore merge with null deletes field
      };
      await updatePricing(driverId, updated);
      setRoutes(routes.filter((r) => r.routeKey !== routeKey));
      alert('Route deleted successfully!');
    } catch (error) {
      console.error('Error deleting route:', error);
      alert('Failed to delete route. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-md">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <MapPin className="w-6 h-6 text-green-600" />
        Route Pricing Management
      </h2>

      {/* Existing Routes */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Your Routes ({routes.length})</h3>
        {routes.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No routes added yet. Add your first route below!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {routes.map((route) => (
              <div
                key={route.routeKey}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-green-300 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <MapPin className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">{route.from}</span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold text-gray-800">{route.to}</span>
                      </div>
                      {(route.distance || route.duration) && (
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          {route.distance && <span>{route.distance} km</span>}
                          {route.duration && <span>• {route.duration}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-bold">
                    <DollarSign className="w-4 h-4" />
                    <span>KES {route.price.toLocaleString()}</span>
                  </div>
                </div>
                <button
                  onClick={() => deleteRoute(route.routeKey)}
                  disabled={saving}
                  className="ml-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Delete route"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Route Form */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-green-600" />
          Add New Route
        </h3>
        
        {/* Input Mode Toggle */}
        <div className="mb-6 flex items-center justify-between bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Input Mode:</span>
            <div className="flex bg-white rounded-lg border border-gray-300 p-1">
              <button
                onClick={() => setInputMode('dropdown')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  inputMode === 'dropdown'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <List className="w-4 h-4" />
                Dropdown
              </button>
              <button
                onClick={() => setInputMode('manual')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  inputMode === 'manual'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                Manual
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            {inputMode === 'dropdown' ? 'Select from predefined locations' : 'Enter custom locations'}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* From Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From <span className="text-red-500">*</span>
            </label>
            {inputMode === 'dropdown' ? (
              <select
                value={fromLocation}
                onChange={(e) => setFromLocation(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={saving}
              >
                <option value="">Select origin...</option>
                {KENYA_LOCATIONS.map((loc: string) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={fromLocation}
                onChange={(e) => setFromLocation(e.target.value)}
                placeholder="e.g., Eastleigh"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={saving}
              />
            )}
          </div>

          {/* To Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To <span className="text-red-500">*</span>
            </label>
            {inputMode === 'dropdown' ? (
              <select
                value={toLocation}
                onChange={(e) => setToLocation(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={saving}
              >
                <option value="">Select destination...</option>
                {KENYA_LOCATIONS.map((loc: string) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={toLocation}
                onChange={(e) => setToLocation(e.target.value)}
                placeholder="e.g., Westlands"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={saving}
              />
            )}
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price (KES) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              placeholder="e.g., 3000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={saving}
              min="0"
            />
          </div>

          {/* Distance (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Distance (km)
            </label>
            <input
              type="number"
              placeholder="e.g., 65"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={saving}
              min="0"
            />
          </div>

          {/* Duration (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration
            </label>
            <input
              type="text"
              placeholder="e.g., 45 mins"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={saving}
            />
          </div>
        </div>

        {/* Add Button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={addRoute}
            disabled={saving || !fromLocation || !toLocation || !price}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add Route
              </>
            )}
          </button>
        </div>

        {/* Helper Text */}
        <p className="mt-4 text-sm text-gray-500">
          <strong>Tip:</strong> Add routes for both directions if pricing differs (e.g., Nairobi → Mombasa and Mombasa → Nairobi).
        </p>
      </div>
    </div>
  );
}
