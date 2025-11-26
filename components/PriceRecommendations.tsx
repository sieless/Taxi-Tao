"use client";

import { useState, useEffect } from 'react';
import { DollarSign, Star, TrendingUp, Award, User } from 'lucide-react';

interface DriverMatch {
  driverId: string;
  driverName: string;
  rating: number;
  totalRides: number;
  price: number;
  matchScore: number;
  category?: 'best_value' | 'lowest_price' | 'best_rated';
}

interface PriceRecommendationsProps {
  bestValue: DriverMatch | null;
  lowestPrice: DriverMatch | null;
  bestRated: DriverMatch | null;
  onSelectDriver: (driverId: string, price: number) => void;
}

export default function PriceRecommendations({
  bestValue,
  lowestPrice,
  bestRated,
  onSelectDriver,
}: PriceRecommendationsProps) {
  const recommendations = [
    { driver: bestValue, icon: TrendingUp, color: 'indigo', label: 'BEST VALUE', badge: '🏆' },
    { driver: lowestPrice, icon: DollarSign, color: 'green', label: 'LOWEST PRICE', badge: '💰' },
    { driver: bestRated, icon: Award, color: 'yellow', label: 'BEST RATED', badge: '⭐' },
  ];

  if (!bestValue && !lowestPrice && !bestRated) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl">
        <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-700 mb-2">No Drivers Available</h3>
        <p className="text-gray-500">No drivers have set pricing for this route yet.</p>
        <p className="text-sm text-gray-400 mt-2">Try a different route or check back later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Recommended Drivers</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {recommendations.map(({ driver, icon: Icon, color, label, badge }) => {
          if (!driver) return null;
          
          const colorClasses = {
            indigo: {
              bg: 'bg-indigo-50',
              border: 'border-indigo-200',
              text: 'text-indigo-600',
              button: 'bg-indigo-600 hover:bg-indigo-700',
              badge: 'bg-indigo-100 text-indigo-700',
            },
            green: {
              bg: 'bg-green-50',
              border: 'border-green-200',
              text: 'text-green-600',
              button: 'bg-green-600 hover:bg-green-700',
              badge: 'bg-green-100 text-green-700',
            },
            yellow: {
              bg: 'bg-yellow-50',
              border: 'border-yellow-200',
              text: 'text-yellow-600',
              button: 'bg-yellow-600 hover:bg-yellow-700',
              badge: 'bg-yellow-100 text-yellow-700',
            },
          }[color as 'indigo' | 'green' | 'yellow'] || {
            bg: 'bg-gray-50',
            border: 'border-gray-200',
            text: 'text-gray-600',
            button: 'bg-gray-600 hover:bg-gray-700',
            badge: 'bg-gray-100 text-gray-700',
          };

          return (
            <div
              key={driver.driverId}
              className={`${colorClasses.bg} border-2 ${colorClasses.border} rounded-xl p-6 transition-all hover:shadow-lg`}
            >
              {/* Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs font-bold ${colorClasses.badge} px-3 py-1 rounded-full`}>
                  {badge} {label}
                </span>
                <Icon className={`w-5 h-5 ${colorClasses.text}`} />
              </div>

              {/* Driver Info */}
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{driver.driverName}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold">{driver.rating.toFixed(1)}</span>
                  </div>
                  <div className="text-gray-500">
                    {driver.totalRides} rides
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="text-3xl font-bold text-gray-800">
                  KES {driver.price.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Match Score: {Math.round(driver.matchScore)}/100
                </div>
              </div>

              {/* Book Button */}
              <button
                onClick={() => onSelectDriver(driver.driverId, driver.price)}
                className={`w-full ${colorClasses.button} text-white font-bold py-3 px-4 rounded-lg transition`}
              >
                Book Now
              </button>
            </div>
          );
        })}
      </div>

      {/* Info Note */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>💡 Tip:</strong> Prices are set by drivers based on their experience and service quality. 
          You can also propose a different price when booking.
        </p>
      </div>
    </div>
  );
}
