"use client";

import { useEffect, useState } from "react";
import { DriverMatch, getRecommendations } from "@/lib/matching-service";
import { Loader2, Star, TrendingDown, Award, Zap } from "lucide-react";

interface SmartRecommendationsProps {
  fromLocation: string;
  toLocation: string;
  onSelectDriver: (driverId: string) => void;
}

export default function SmartRecommendations({
  fromLocation,
  toLocation,
  onSelectDriver,
}: SmartRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<{
    bestValue: DriverMatch | null;
    lowestPrice: DriverMatch | null;
    bestRated: DriverMatch | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecommendations() {
      setLoading(true);
      try {
        const data = await getRecommendations(fromLocation, toLocation);
        setRecommendations(data);
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      } finally {
        setLoading(false);
      }
    }

    if (fromLocation && toLocation) {
      fetchRecommendations();
    }
  }, [fromLocation, toLocation]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        <p className="text-sm text-gray-500">Finding best drivers for you...</p>
      </div>
    );
  }

  if (!recommendations || (!recommendations.bestValue && !recommendations.lowestPrice && !recommendations.bestRated)) {
    return (
      <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-100">
        <p className="text-gray-500">No specific recommendations found for this route.</p>
        <p className="text-xs text-gray-400 mt-1">Try searching for all available drivers instead.</p>
      </div>
    );
  }

  const cards = [
    {
      type: "best_value",
      data: recommendations.bestValue,
      title: "Best Value",
      icon: Zap,
      color: "blue",
      description: "Best balance of price & rating",
    },
    {
      type: "lowest_price",
      data: recommendations.lowestPrice,
      title: "Lowest Price",
      icon: TrendingDown,
      color: "green",
      description: "Cheapest option available",
    },
    {
      type: "best_rated",
      data: recommendations.bestRated,
      title: "Top Rated",
      icon: Award,
      color: "purple",
      description: "Highest rated driver",
    },
  ];

  // Filter out duplicates if the same driver is in multiple categories
  // We want to show them in their "best" category, or just show all cards but handle duplicates visually?
  // For simplicity, we show all cards. If a driver is both Best Value and Lowest Price, they appear twice.
  // This is acceptable for now as it highlights their strengths.

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
        <span className="bg-green-100 p-1 rounded-full">✨</span> 
        Recommended for You
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card) => {
          if (!card.data) return null;
          
          const driver = card.data;
          const isBestValue = card.type === "best_value";
          const isLowestPrice = card.type === "lowest_price";
          const isBestRated = card.type === "best_rated";

          let badgeColor = "bg-gray-100 text-gray-800";
          if (isBestValue) badgeColor = "bg-blue-100 text-blue-800";
          if (isLowestPrice) badgeColor = "bg-green-100 text-green-800";
          if (isBestRated) badgeColor = "bg-purple-100 text-purple-800";

          return (
            <div 
              key={card.type}
              className={`relative bg-white rounded-xl border-2 p-4 transition-all hover:shadow-lg cursor-pointer group
                ${isBestValue ? 'border-blue-100 hover:border-blue-300' : ''}
                ${isLowestPrice ? 'border-green-100 hover:border-green-300' : ''}
                ${isBestRated ? 'border-purple-100 hover:border-purple-300' : ''}
              `}
              onClick={() => onSelectDriver(driver.driverId)}
            >
              {/* Badge */}
              <div className={`absolute -top-3 left-4 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm ${badgeColor}`}>
                <card.icon className="w-3.5 h-3.5" />
                {card.title}
              </div>

              <div className="mt-2 flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-gray-900">{driver.driverName}</h4>
                  <div className="flex items-center gap-1 text-sm text-gray-600 mt-0.5">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium">{driver.rating.toFixed(1)}</span>
                    <span className="text-gray-400">({driver.totalRides})</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-700">
                    KES {driver.price.toLocaleString()}
                  </div>
                  {driver.matchType === 'nearby' && (
                    <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                      Nearby
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-50">
                <p className="text-xs text-gray-500 italic mb-3">
                  "{card.description}"
                </p>
                <button 
                  className={`w-full py-2 rounded-lg text-sm font-bold transition-colors
                    ${isBestValue ? 'bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white' : ''}
                    ${isLowestPrice ? 'bg-green-50 text-green-700 group-hover:bg-green-600 group-hover:text-white' : ''}
                    ${isBestRated ? 'bg-purple-50 text-purple-700 group-hover:bg-purple-600 group-hover:text-white' : ''}
                  `}
                >
                  Select Driver
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
