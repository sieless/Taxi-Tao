// lib/matching-service.ts

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { getDriverPricing, createRouteKey } from "./pricing-service";
import { getNearbyHub } from "./location-mapping";


import { logError } from "@/lib/logger";// Type for driver user documents that combine User and Driver fields
interface DriverUser {
  id: string;
  driverId?: string;
  name?: string;
  active?: boolean;
  averageRating?: number;
  rating?: number;
  totalRides?: number;
}

export interface DriverMatch {
  driverId: string;
  driverName: string;
  rating: number;
  totalRides: number;
  price: number;
  matchScore: number;
  category?: "best_value" | "lowest_price" | "best_rated";
  matchType: "exact" | "nearby";
  viaLocation?: string; // e.g., "Via Machakos"
  // Driver contact details
  phone?: string;
  whatsapp?: string;
  // Driver profile
  profilePhotoUrl?: string;
  bio?: string;
  // Vehicle details
  vehicle?: {
    make: string;
    model: string;
    type: "sedan" | "suv" | "van" | "bike" | "tuk-tuk";
    color?: string;
    carPhotoUrl?: string;
  };
}

/**
 * Find drivers who have pricing for a specific route.
 * Supports exact matches and "Hub & Spoke" fallback matches.
 */
export async function findDriversForRoute(
  fromLocation: string,
  toLocation: string
): Promise<DriverMatch[]> {
  try {
    // Query drivers collection directly instead of users collection
    // This avoids permission issues since drivers collection allows read for everyone
    const driversRef = collection(db, "drivers");
    const snapshot = await getDocs(driversRef);

    const matches: DriverMatch[] = [];

    // 1. Determine standardized keys and hubs
    const exactRouteKey = createRouteKey(fromLocation, toLocation);

    const toHub = getNearbyHub(toLocation);
    const hubRouteKey = toHub ? createRouteKey(fromLocation, toHub) : null;

    for (const docSnap of snapshot.docs) {
      const driverData = { id: docSnap.id, ...docSnap.data() } as any;

      // Skip inactive drivers
      if (driverData.active === false) continue;

      const driverId = driverData.id;
      const pricing = await getDriverPricing(driverId);
      
      let routePrice = pricing?.routePricing?.[exactRouteKey];
      let matchType: "exact" | "nearby" = "exact";
      let viaLocation: string | undefined = undefined;

      // 3. Check for HUB match (Fallback 1)
      if ((!routePrice || !routePrice.price) && hubRouteKey && pricing?.routePricing) {
        const hubPrice = pricing.routePricing[hubRouteKey];
        if (hubPrice && hubPrice.price) {
          routePrice = hubPrice;
          matchType = "nearby";
          viaLocation = toHub || undefined;
        }
      }

      // 4. Check for TEXT MATCH (Fallback 2 - match based on user's location text)
      if (!routePrice || !routePrice.price) {
        const normalizedFrom = fromLocation.toLowerCase().trim();
        const baseLocation = (driverData.baseLocation || "").toLowerCase();
        const currentLocationStr = (driverData.currentLocation?.text || driverData.location?.address || "").toLowerCase();
        const serviceAreas = Array.isArray(driverData.serviceAreas) 
            ? driverData.serviceAreas.map((a: string) => a.toLowerCase()) 
            : [];
            
        // Text Match: If the pickup location text is mentioned in any of the driver's recorded locations
        if (
            (baseLocation && (baseLocation.includes(normalizedFrom) || normalizedFrom.includes(baseLocation))) ||
            (currentLocationStr && (currentLocationStr.includes(normalizedFrom) || normalizedFrom.includes(currentLocationStr))) ||
            serviceAreas.some((area: string) => area && (area.includes(normalizedFrom) || normalizedFrom.includes(area))) ||
            // General Fallback: If they are active and have *no* specific regions, we can assume they are available generally
            (serviceAreas.length === 0 && !baseLocation && !currentLocationStr)
        ) {
            const fallbackPrice = driverData.baseFare || 
                                  driverData.vehicle?.baseFare || 
                                  (driverData.vehicles && driverData.vehicles.length > 0 ? driverData.vehicles[0].baseFare : 0);
            routePrice = { price: fallbackPrice };
            matchType = "nearby";
            viaLocation = undefined;
        }
      }

      if (routePrice && routePrice.price !== undefined) {
        const primaryVehicle = driverData.vehicle || (Array.isArray(driverData.vehicles) && driverData.vehicles.length > 0 ? driverData.vehicles[0] : null);
        
        matches.push({
          driverId: driverId,
          driverName: driverData.name || "Unknown Driver",
          rating: driverData.averageRating || driverData.rating || 4.5,
          totalRides: driverData.totalRides || 0,
          price: routePrice.price,
          matchScore: 0, // Will be calculated later
          matchType,
          viaLocation,
          phone: driverData.phone,
          whatsapp: driverData.whatsapp,
          profilePhotoUrl: driverData.profilePhotoUrl,
          bio: driverData.bio,
          vehicle: primaryVehicle
            ? {
                make: primaryVehicle.make,
                model: primaryVehicle.model,
                type: primaryVehicle.type,
                color: primaryVehicle.color,
                carPhotoUrl: primaryVehicle.carPhotoUrl || (Array.isArray(primaryVehicle.images) && primaryVehicle.images.length > 0 ? primaryVehicle.images[0] : undefined),
              }
            : undefined,
        });
      }
    }

    return matches;
  } catch (error) {
    logError("matching", error);
    return [];
  }
}

/**
 * Calculate match score for a driver
 * Score is based on: price (40%), rating (40%), experience (20%)
 */
function calculateMatchScore(driver: DriverMatch, avgPrice: number): number {
  // Normalize price (lower is better, scale 0-100)
  const priceScore =
    avgPrice > 0 ? Math.max(0, 100 - (driver.price / avgPrice) * 100) : 50;

  // Normalize rating (0-5 scale to 0-100)
  const ratingScore = (driver.rating / 5) * 100;

  // Normalize experience (cap at 100 rides = 100 score)
  const experienceScore = Math.min(100, driver.totalRides);

  // Weighted average
  let score = priceScore * 0.4 + ratingScore * 0.4 + experienceScore * 0.2;

  // Penalize nearby matches slightly to prefer exact matches if both exist
  if (driver.matchType === "nearby") {
    score *= 0.9;
  }

  return score;
}

/**
 * Get top 3 driver recommendations for a route
 */
export async function getRecommendations(
  fromLocation: string,
  toLocation: string
): Promise<{
  bestValue: DriverMatch | null;
  lowestPrice: DriverMatch | null;
  bestRated: DriverMatch | null;
}> {
  const drivers = await findDriversForRoute(fromLocation, toLocation);

  if (drivers.length === 0) {
    return { bestValue: null, lowestPrice: null, bestRated: null };
  }

  // Calculate average price for scoring
  const avgPrice =
    drivers.reduce((sum, d) => sum + d.price, 0) / drivers.length;

  // Calculate match scores
  drivers.forEach((driver) => {
    driver.matchScore = calculateMatchScore(driver, avgPrice);
  });

  // Sort all drivers by match score to start
  const sortedDrivers = [...drivers].sort((a, b) => b.matchScore - a.matchScore);

  let bestValue: DriverMatch | null = null;
  let lowestPrice: DriverMatch | null = null;
  let bestRated: DriverMatch | null = null;

  // 1. Best Value: highest match score
  if (sortedDrivers.length > 0) {
    bestValue = sortedDrivers[0];
    bestValue.category = "best_value";
  }

  // Filter out the driver already selected for Best Value
  const remainingAfterValue = sortedDrivers.filter(d => d.driverId !== bestValue?.driverId);

  // 2. Lowest Price: cheapest option among remaining
  if (remainingAfterValue.length > 0) {
    lowestPrice = [...remainingAfterValue].sort((a, b) => a.price - b.price)[0];
    if (lowestPrice) lowestPrice.category = "lowest_price";
  }

  // Filter out the drivers already selected
  const remainingAfterPrice = remainingAfterValue.filter(d => d.driverId !== lowestPrice?.driverId);

  // 3. Best Rated: highest rating among remaining
  if (remainingAfterPrice.length > 0) {
    bestRated = [...remainingAfterPrice].sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return a.price - b.price;
    })[0];
    if (bestRated) bestRated.category = "best_rated";
  }

  return { bestValue, lowestPrice, bestRated };
}

/**
 * Get all drivers with pricing for a route (for displaying all options)
 */
export async function getAllDriversForRoute(
  fromLocation: string,
  toLocation: string
): Promise<DriverMatch[]> {
  const drivers = await findDriversForRoute(fromLocation, toLocation);

  // Calculate average price for scoring
  const avgPrice =
    drivers.reduce((sum, d) => sum + d.price, 0) / drivers.length;

  // Calculate match scores and sort by score
  drivers.forEach((driver) => {
    driver.matchScore = calculateMatchScore(driver, avgPrice);
  });

  return drivers.sort((a, b) => b.matchScore - a.matchScore);
}
