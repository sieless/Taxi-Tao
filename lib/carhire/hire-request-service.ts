/**
 * Hire Request Service
 *
 * Client-side service for car hire request lifecycle management.
 * Adapted from mobile app for Next.js web application.
 *
 * SECURITY: All mutations should go through Cloud Functions for server-side
 * validation. This service handles real-time subscriptions and client-side reads.
 */
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  limit,
  runTransaction,
  increment,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/firestore-constants";

import { logError } from "@/lib/logger";import {
  HireRequest,
  InspectionCheckItem,
  InspectionRecord,
  PrefilledInvoice,
  InvoiceLineItem,
} from "@/lib/types";

// ============ DEFAULT INSPECTION TEMPLATE ============
// Used when a company hasn't yet configured their own template in Settings.
export const DEFAULT_INSPECTION_TEMPLATE: InspectionCheckItem[] = [
  // Exterior
  { id: "ext_front", label: "Front Bumper & Grille", category: "exterior", type: "checkbox", enabled: true },
  { id: "ext_rear", label: "Rear Bumper & Boot", category: "exterior", type: "checkbox", enabled: true },
  { id: "ext_left", label: "Left Body Panel", category: "exterior", type: "checkbox", enabled: true },
  { id: "ext_right", label: "Right Body Panel", category: "exterior", type: "checkbox", enabled: true },
  { id: "ext_windscreen", label: "Windscreen (No Cracks)", category: "exterior", type: "checkbox", enabled: true },
  // Interior
  { id: "int_seats", label: "Seat Condition", category: "interior", type: "checkbox", enabled: true },
  { id: "int_dashboard", label: "Dashboard & Controls", category: "interior", type: "checkbox", enabled: true },
  { id: "int_floormats", label: "Floor Mats & Cleanliness", category: "interior", type: "checkbox", enabled: true },
  // Mechanical
  { id: "mech_tires", label: "Tyre Condition (All 4)", category: "mechanical", type: "checkbox", enabled: true },
  { id: "mech_spare", label: "Spare Tyre & Jack", category: "mechanical", type: "checkbox", enabled: true },
  { id: "mech_brakes", label: "Brakes Responsive", category: "mechanical", type: "checkbox", enabled: true },
  { id: "mech_notes", label: "Mechanical Notes", category: "mechanical", type: "text", enabled: true },
  // Documents
  { id: "doc_insurance", label: "Insurance Card Present", category: "documents", type: "checkbox", enabled: true },
  { id: "doc_logbook", label: "Logbook Copy Present", category: "documents", type: "checkbox", enabled: true },
];

// ============ REAL-TIME SUBSCRIPTIONS ============

/**
 * Subscribe to hire requests for a specific company (Vendor View).
 * Returns an unsubscribe function.
 */
export function subscribeToCompanyRequests(
  companyId: string,
  callback: (requests: HireRequest[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(
    collection(db, COLLECTIONS.HIRE_REQUESTS),
    where("companyId", "==", companyId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const requests = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as HireRequest)
      );
      callback(requests);
    },
    (error) => {
      logError("hire-request", error);
      onError?.(error);
    }
  );
}

/**
 * Subscribe to hire requests for a specific customer.
 */
export function subscribeToCustomerRequests(
  customerId: string,
  callback: (requests: HireRequest[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(
    collection(db, COLLECTIONS.HIRE_REQUESTS),
    where("customerId", "==", customerId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const requests = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as HireRequest)
      );
      callback(requests);
    },
    (error) => {
      logError("hire-request", error);
      onError?.(error);
    }
  );
}

/**
 * Subscribe to active/approved rentals for a customer.
 */
export function subscribeToActiveRental(
  customerId: string,
  callback: (rentals: HireRequest[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(
    collection(db, COLLECTIONS.HIRE_REQUESTS),
    where("customerId", "==", customerId),
    where("status", "in", ["approved", "active"]),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const rentals = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as HireRequest)
      );
      callback(rentals);
    },
    (error) => {
      logError("hire-request", error);
      onError?.(error);
    }
  );
}

/**
 * Subscribe to pending hire indicator for a customer.
 */
export function subscribeToPendingHireIndicator(
  customerId: string,
  callback: (hasPending: boolean) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(
    collection(db, COLLECTIONS.HIRE_REQUESTS),
    where("customerId", "==", customerId),
    where("status", "in", ["pending", "approved"])
  );

  return onSnapshot(
    q,
    (snapshot) => {
      callback(!snapshot.empty);
    },
    (error) => {
      logError("hire-request", error);
      onError?.(error);
    }
  );
}

// ============ MUTATIONS ============

/**
 * Update hire request status (Approve/Reject/Complete).
 * For approve/reject, calls server-side API routes.
 */
export async function updateHireRequestStatus(
  requestId: string,
  status: HireRequest["status"]
): Promise<void> {
  if (status === "approved") {
    throw new Error("Use approveHireWithHandshake() for approval");
  }

  const requestRef = doc(db, COLLECTIONS.HIRE_REQUESTS, requestId);
  const updateData: Record<string, any> = {
    status,
    updatedAt: serverTimestamp(),
  };

  if (status === "active") updateData.startedAt = serverTimestamp();
  if (status === "completed") updateData.completedAt = serverTimestamp();

  await updateDoc(requestRef, updateData);
}

/**
 * Reject a pending hire request with reason.
 * Calls server-side API route for validation and audit logging.
 */
export async function rejectHireRequest(
  requestId: string,
  reason?: string
): Promise<void> {
  const response = await fetch("/api/vendor/hire-requests/reject", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requestId,
      reason: reason || "Declined by company",
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Failed to reject hire request");
  }
}

/**
 * Save a filled inspection record (pre-release OR post-return).
 */
export async function saveInspectionRecord(
  requestId: string,
  type: "preReleaseInspection" | "postReturnInspection",
  record: Partial<InspectionRecord>,
  completedBy: string
): Promise<void> {
  const requestRef = doc(db, COLLECTIONS.HIRE_REQUESTS, requestId);
  const finalRecord: Partial<InspectionRecord> = {
    ...record,
    status: "complete",
    completedAt: serverTimestamp(),
    completedBy,
  };

  await updateDoc(requestRef, {
    [type]: finalRecord,
    updatedAt: serverTimestamp(),
  });

  // If pre-release is complete, move hire to "active"
  if (type === "preReleaseInspection") {
    await updateDoc(requestRef, {
      status: "active",
      startedAt: serverTimestamp(),
    });
  }
}

/**
 * Approve a hire request with handshake.
 * Clones company inspection template and generates prefilled invoice.
 *
 * SECURITY NOTE: For production, this should be a Cloud Function
 * to ensure atomic transactions and server-side pricing calculation.
 */
export async function approveHireWithHandshake(
  requestId: string,
  vehicleId: string,
  companyId: string,
  hire: HireRequest
): Promise<void> {
  const requestRef = doc(db, COLLECTIONS.HIRE_REQUESTS, requestId);
  const vehicleRef = doc(db, COLLECTIONS.VEHICLES, vehicleId);
  const companyRef = doc(db, COLLECTIONS.COMPANIES, companyId);

  await runTransaction(db, async (transaction) => {
    const vehicleSnap = await transaction.get(vehicleRef);
    const vehicle = vehicleSnap.data() || {};

    let company: Record<string, any> = {};
    const companySnap = await transaction.get(companyRef);
    company = companySnap.data() || {};

    // Build inspection blank (clone template or use default)
    const template: InspectionCheckItem[] =
      company.inspectionTemplate?.length
        ? company.inspectionTemplate.map((c: InspectionCheckItem) => ({
            ...c,
            checked: undefined,
            value: undefined,
          }))
        : DEFAULT_INSPECTION_TEMPLATE;

    const blankInspection: Partial<InspectionRecord> = {
      status: "pending",
      checks: template,
      fuelLevel: undefined,
      odometerReading: undefined,
      notes: "",
    };

    // Build prefilled invoice
    // PRIORITY: Use vehicle fields first. Fallback to company settings.
    const baseAmount = (vehicle.dailyRate || 0) * (hire.days || 1);
    const washFee = vehicle.washFee ?? company.standardWashFee ?? 0;
    const securityDeposit =
      vehicle.securityDeposit ?? company.defaultSecurityDeposit ?? 500;
    const deliveryFee =
      hire.handoverMode === "delivery"
        ? (vehicle.deliveryFee ?? company.baseDeliveryFee ?? 0)
        : 0;
    const chauffeurFee = hire.chauffeurFee || 0;

    const lineItems: InvoiceLineItem[] = [
      {
        label: `Daily Hire × ${hire.days} day(s)${hire.durationHours ? ` + ${hire.durationHours}h` : ""}`,
        amount: baseAmount,
        type: "base",
      },
      ...(washFee > 0
        ? [{ label: "Vehicle Preparation Fee", amount: washFee, type: "fee" as const }]
        : []),
      ...(deliveryFee > 0
        ? [{ label: "Delivery Logistics", amount: deliveryFee, type: "fee" as const }]
        : []),
      ...(chauffeurFee > 0
        ? [{ label: "Chauffeur Service", amount: chauffeurFee, type: "fee" as const }]
        : []),
      ...(securityDeposit > 0
        ? [{ label: "Security Deposit (Refundable)", amount: securityDeposit, type: "deposit" as const }]
        : []),
    ];

    const prefilledInvoice: PrefilledInvoice = {
      generatedAt: serverTimestamp(),
      lineItems,
      baseRentalAmount: baseAmount,
      washFee,
      deliveryFee,
      securityDeposit,
      totalDue: lineItems.reduce((sum, item) => sum + item.amount, 0),
      status: "draft",
    };

    // Commit core booking updates
    transaction.update(requestRef, {
      status: "approved",
      kycGranted: true,
      approvedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      preReleaseInspection: blankInspection,
      postReturnInspection: { ...blankInspection, status: "pending" },
      prefilledInvoice,
    });

    // Update Company Metrics
    transaction.update(companyRef, {
      "stats.activeRentals": increment(1),
    });
  });
}

/**
 * Complete a rental with handshake.
 * Updates vehicle and company performance metrics atomically.
 */
export async function completeRentalHandshake(
  requestId: string,
  vehicleId: string,
  companyId?: string,
  amount: number = 0
): Promise<void> {
  const requestRef = doc(db, COLLECTIONS.HIRE_REQUESTS, requestId);
  const vehicleRef = doc(db, COLLECTIONS.VEHICLES, vehicleId);
  const companyRef = companyId
    ? doc(db, COLLECTIONS.COMPANIES, companyId)
    : null;

  await runTransaction(db, async (transaction) => {
    // Update Hire Request to Completed
    transaction.update(requestRef, {
      status: "completed",
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Update Vehicle Performance
    transaction.update(vehicleRef, {
      "performance.totalTrips": increment(1),
      "performance.totalRevenue": increment(amount),
      "performance.rentalsUntilService": increment(-1),
      status: "active",
      updatedAt: serverTimestamp(),
    });

    // Update Company Overall Stats
    if (companyRef) {
      transaction.update(companyRef, {
        "stats.totalRevenue": increment(amount),
        "stats.completedTrips": increment(1),
        "stats.activeRentals": increment(-1),
      });
    }
  });
}

/**
 * Release a vehicle to the customer after pre-release inspection.
 * This transitions the hire from "approved" to "active".
 */
export async function releaseVehicle(
  requestId: string,
  vehicleId: string,
  releasedBy: string
): Promise<void> {
  const requestRef = doc(db, COLLECTIONS.HIRE_REQUESTS, requestId);
  const vehicleRef = doc(db, COLLECTIONS.VEHICLES, vehicleId);

  await runTransaction(db, async (transaction) => {
    // Update hire request to active
    transaction.update(requestRef, {
      status: "active",
      startedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Update vehicle status to in_use
    transaction.update(vehicleRef, {
      status: "in_use",
      updatedAt: serverTimestamp(),
    });
  });
}

// ============ ADMIN FUNCTIONS ============

/**
 * Subscribe to all hire requests across the platform (Admin only).
 */
export function subscribeToGlobalHireRequests(
  callback: (requests: HireRequest[]) => void,
  limitCount: number = 50,
  onError?: (error: Error) => void
): () => void {
  const q = query(
    collection(db, COLLECTIONS.HIRE_REQUESTS),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const requests = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as HireRequest)
      );
      callback(requests);
    },
    (error) => {
      logError("hire-request", error);
      onError?.(error);
    }
  );
}
