/**
 * Vehicle Management Service
 *
 * Client-side service for car hire vehicle fleet management.
 * Adapted from mobile app for Next.js web application.
 */
import {
  collection,
  doc,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  writeBatch,
  increment,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/firestore-constants";
import { Vehicle } from "@/lib/types";

// ============ QUERIES ============

/**
 * Get all vehicles for a company.
 */
export async function getFleetByCompany(companyId: string): Promise<Vehicle[]> {
  const q = query(
    collection(db, COLLECTIONS.VEHICLES),
    where("companyId", "==", companyId),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Vehicle));
}

/**
 * Get all hireable vehicles (Admin: global fleet).
 */
export async function getGlobalFleet(limitCount: number = 100): Promise<Vehicle[]> {
  const q = query(
    collection(db, COLLECTIONS.VEHICLES),
    where("isRental", "==", true),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.slice(0, limitCount).map(
    (doc) => ({ id: doc.id, ...doc.data() } as Vehicle)
  );
}

/**
 * Get a single vehicle by ID.
 */
export async function getVehicleDetail(vehicleId: string): Promise<Vehicle | null> {
  const vehicleSnap = await getDoc(doc(db, COLLECTIONS.VEHICLES, vehicleId));
  if (!vehicleSnap.exists()) return null;
  return { id: vehicleSnap.id, ...vehicleSnap.data() } as Vehicle;
}

// ============ MUTATIONS ============

/**
 * Save a vehicle draft (create or update).
 * If company is active and not staff-added, auto-activates.
 */
export async function saveVehicleDraft(
  data: Partial<Vehicle> & { make: string; model: string; plate: string },
  companyId: string,
  options?: { isStaffSubmission?: boolean }
): Promise<string> {
  const vehicleData: Record<string, any> = {
    ...data,
    companyId,
    isRental: true,
    updatedAt: serverTimestamp(),
  };

  // If staff submission, always save as draft
  if (options?.isStaffSubmission) {
    vehicleData.status = "draft";
    vehicleData.addedBy = "staff";
  } else if (!data.status) {
    // Default to active if company is active
    vehicleData.status = "active";
    vehicleData.addedBy = "owner";
  }

  if (data.id) {
    // Update existing vehicle
    const vehicleRef = doc(db, COLLECTIONS.VEHICLES, data.id);
    await updateDoc(vehicleRef, vehicleData);
    return data.id;
  } else {
    // Create new vehicle
    vehicleData.createdAt = serverTimestamp();
    vehicleData.availability = [];
    vehicleData.maintenanceLogs = [];
    vehicleData.performance = {
      totalTrips: 0,
      totalRevenue: 0,
      rentalsUntilService: 50,
    };
    const docRef = await addDoc(collection(db, COLLECTIONS.VEHICLES), vehicleData);

    // Increment fleet count
    if (companyId) {
      const companyRef = doc(db, COLLECTIONS.COMPANIES, companyId);
      await updateDoc(companyRef, {
        "stats.fleetCount": increment(1),
      });
    }

    return docRef.id;
  }
}

/**
 * Delete a vehicle (drafts only).
 */
export async function deleteVehicleAsset(
  vehicleId: string,
  companyId: string
): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.VEHICLES, vehicleId));

  // Decrement fleet count
  if (companyId) {
    const companyRef = doc(db, COLLECTIONS.COMPANIES, companyId);
    await updateDoc(companyRef, {
      "stats.fleetCount": increment(-1),
    });
  }
}

/**
 * Batch activate all draft vehicles for a company.
 */
export async function batchActivateFleet(companyId: string): Promise<number> {
  const q = query(
    collection(db, COLLECTIONS.VEHICLES),
    where("companyId", "==", companyId),
    where("status", "==", "draft")
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return 0;

  const batch = writeBatch(db);
  let count = 0;

  snapshot.docs.forEach((docSnap) => {
    batch.update(docSnap.ref, {
      status: "active",
      updatedAt: serverTimestamp(),
    });
    count++;
  });

  await batch.commit();
  return count;
}

/**
 * Search active fleet with filters.
 * Matches mobile app's searchActiveFleet signature.
 */
export async function searchActiveFleet(options: {
  companyId?: string;
  driverId?: string;
  isCorporate?: boolean;
  vehicleType?: string;
  minPrice?: number;
  maxPrice?: number;
  limitCount?: number;
}): Promise<Vehicle[]> {
  let q = query(
    collection(db, COLLECTIONS.VEHICLES),
    where("status", "==", "active"),
    where("isRental", "==", true)
  );

  // 1. Ownership Filters (mutually exclusive)
  if (options.companyId) {
    q = query(q, where("companyId", "==", options.companyId));
  } else if (options.driverId) {
    q = query(q, where("driverId", "==", options.driverId));
  }

  // 2. Corporate/Executive Filter
  if (options.isCorporate && !options.companyId) {
    q = query(q, where("isCorporate", "==", true));
  }

  // 3. Price Filters (requires orderBy dailyRate)
  if (options.minPrice !== undefined || options.maxPrice !== undefined) {
    if (options.minPrice !== undefined) {
      q = query(q, where("dailyRate", ">=", options.minPrice));
    }
    if (options.maxPrice !== undefined) {
      q = query(q, where("dailyRate", "<=", options.maxPrice));
    }
    q = query(q, orderBy("dailyRate", "asc"));
  } else {
    q = query(q, orderBy("createdAt", "desc"));
  }

  if (options.limitCount) {
    q = query(q, limit(options.limitCount));
  }

  const snapshot = await getDocs(q);
  let vehicles = snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Vehicle)
  );

  // 4. Client-side vehicleType filter (if not using Firestore index)
  if (options.vehicleType && options.vehicleType !== "All") {
    vehicles = vehicles.filter((v) => v.type === options.vehicleType);
  }

  return vehicles;
}
