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

// Type for driver user documents that combine User and Driver fields
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

      // Get driver's pricing using their driverId (which is the document ID)
      const driverId = driverData.id;
      const pricing = await getDriverPricing(driverId);
      if (!pricing || !pricing.routePricing) continue;

      // 2. Check for EXACT match first
      let routePrice = pricing.routePricing[exactRouteKey];
      let matchType: "exact" | "nearby" = "exact";
      let viaLocation: string | undefined = undefined;

      // 3. If no exact match, check for HUB match (Fallback)
      if ((!routePrice || !routePrice.price) && hubRouteKey) {
        const hubPrice = pricing.routePricing[hubRouteKey];
        if (hubPrice && hubPrice.price) {
          routePrice = hubPrice;
          matchType = "nearby";
          viaLocation = toHub || undefined;
        }
      }

      if (routePrice && routePrice.price) {
        // Fetch full driver details from /drivers collection
        let driverDetails = null;
        try {
          const driverDocRef = doc(db, "drivers", driverId);
          const driverDoc = await getDoc(driverDocRef);
          if (driverDoc.exists()) {
            driverDetails = driverDoc.data();
          }
        } catch (error) {
          console.error(
            `Error fetching driver details for ${driverId}:`,
            error
          );
        }

        matches.push({
          driverId: driverId,
          driverName:
            driverData.name || driverDetails?.name || "Unknown Driver",
          rating:
            driverData.averageRating ||
            driverData.rating ||
            driverDetails?.averageRating ||
            4.5,
          totalRides: driverData.totalRides || driverDetails?.totalRides || 0,
          price: routePrice.price,
          matchScore: 0, // Will be calculated later
          matchType,
          viaLocation,
          // Contact details
          phone: driverDetails?.phone,
          whatsapp: driverDetails?.whatsapp,
          // Profile
          profilePhotoUrl: driverDetails?.profilePhotoUrl,
          bio: driverDetails?.bio,
          // Vehicle details
          vehicle: driverDetails?.vehicle
            ? {
                make: driverDetails.vehicle.make,
                model: driverDetails.vehicle.model,
                type: driverDetails.vehicle.type,
                color: driverDetails.vehicle.color,
                carPhotoUrl: driverDetails.vehicle.carPhotoUrl,
              }
            : undefined,
        });
      }
    }

    return matches;
  } catch (error) {
    console.error("Error finding drivers for route:", error);
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

  // Best Value: highest match score
  const bestValue = [...drivers].sort((a, b) => b.matchScore - a.matchScore)[0];
  if (bestValue) bestValue.category = "best_value";

  // Lowest Price: cheapest option
  const lowestPrice = [...drivers].sort((a, b) => a.price - b.price)[0];
  if (lowestPrice) lowestPrice.category = "lowest_price";

  // Best Rated: highest rating, then lowest price as tiebreaker
  const bestRated = [...drivers].sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    return a.price - b.price;
  })[0];
  if (bestRated) bestRated.category = "best_rated";

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
