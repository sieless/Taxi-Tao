// lib/pricing-service.ts

import { collection, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase'; // assume existing firebase init
import { Timestamp } from 'firebase/firestore';

/**
 * Creates a standardized route key from origin and destination.
 * @param from - Origin location
 * @param to - Destination location
 * @returns Lowercase route key (e.g., "nairobi-mombasa")
 */
export function createRouteKey(from: string, to: string): string {
  return `${from.toLowerCase().trim()}-${to.toLowerCase().trim()}`;
}

/**
 * Retrieves the pricing configuration for a driver.
 */
export async function getDriverPricing(driverId: string) {
  const ref = doc(collection(db, 'driverPricing'), driverId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    // Return empty pricing structure if none exists
    return {
      routePricing: {},
      specialZones: {},
      packages: {},
      modifiers: {},
      autoAcceptRules: {},
      visibility: {},
      lastUpdated: Timestamp.now(),
    };
  }
  return snap.data();
}

/**
 * Subscribes to real-time pricing updates for a driver.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function subscribeToDriverPricing(driverId: string, callback: (data: any) => void) {
  const ref = doc(collection(db, 'driverPricing'), driverId);
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      callback(snap.data());
    } else {
      callback({
        routePricing: {},
        specialZones: {},
        packages: {},
        modifiers: {},
        autoAcceptRules: {},
        visibility: {},
        lastUpdated: Timestamp.now(),
      });
    }
  });
}

/**
 * Updates the pricing configuration for a driver.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updatePricing(driverId: string, newPricing: Partial<any>) {
  const ref = doc(collection(db, 'driverPricing'), driverId);
  await setDoc(ref, { ...newPricing, lastUpdated: Timestamp.now() }, { merge: true });
}

/**
 * Calculates the fare for a given route, applying modifiers.
 * Supports bidirectional route lookup (checks both from->to and to->from).
 * @param driverPricing - pricing object from getDriverPricing
 * @param from - Origin location
 * @param to - Destination location
 * @returns Calculated fare in KES
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function calculateFare(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  driverPricing: any,
  from: string,
  to: string,
): number {
  // Try to find the route in either direction
  const routeKey = createRouteKey(from, to);
  const reverseKey = createRouteKey(to, from);
  
  const routeData = driverPricing?.routePricing?.[routeKey] || 
                    driverPricing?.routePricing?.[reverseKey];
  
  const base = routeData?.price ?? 0;
  if (!base) return 0;

  let fare = base;
  // Apply special zone surcharges if route includes a known zone (simplified)
  // In a real implementation you would parse the route and match zones.
  if (driverPricing.specialZones) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Object.values(driverPricing.specialZones).forEach((zone: any) => {
      if (zone.surchargePercent) {
        fare += (fare * zone.surchargePercent) / 100;
      } else if (zone.flatSurcharge) {
        fare += zone.flatSurcharge;
      }
    });
  }

  // Apply dynamic modifiers (night, holiday, peak)
  if (driverPricing.modifiers) {
    const now = new Date();
    const time = now.getHours() + now.getMinutes() / 60;
    // Night shift (example 20:00-06:00)
    if (driverPricing.modifiers.nightShift?.enabled) {
      const start = parseFloat(driverPricing.modifiers.nightShift.startTime.split(':')[0]);
      const end = parseFloat(driverPricing.modifiers.nightShift.endTime.split(':')[0]);
      const isNight = start <= time || time <= end;
      if (isNight) fare *= driverPricing.modifiers.nightShift.multiplier;
    }
    // Holiday (simplified: always apply if enabled)
    if (driverPricing.modifiers.holiday?.enabled) {
      fare *= driverPricing.modifiers.holiday.multiplier;
    }
    // Peak hours (array of slots)
    if (driverPricing.modifiers.peakHours?.enabled) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      driverPricing.modifiers.peakHours.timeSlots?.forEach((slot: any) => {
        const s = parseFloat(slot.start.split(':')[0]);
        const e = parseFloat(slot.end.split(':')[0]);
        if (s <=time && time <= e) {
          fare *= slot.multiplier;
        }
      });
    }
  }

  return Math.round(fare);
}
