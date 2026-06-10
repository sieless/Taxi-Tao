/**
 * Hire Payment Service
 *
 * Client-side service for car hire manual payment handling.
 * Adapted from mobile app for Next.js web application.
 *
 * SECURITY: Payment creation should go through Cloud Functions.
 * This service handles reads, confirmation, and rejection.
 */
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/firestore-constants";
import { HirePayment, HireRequest, HireReceipt, Company, Vehicle } from "@/lib/types";


import { logError } from "@/lib/logger";// ============ M-PESA PARSING UTILITIES ============

/**
 * Extract M-Pesa transaction code from message.
 * Code format: 8-12 alphanumeric characters at the start of the message.
 */
export function extractMpesaCode(message: string): string {
  if (!message) return "";
  const trimmed = message.trim();
  const codeMatch = trimmed.match(/^([A-Z0-9]{8,12})\s+/i);
  if (codeMatch) return codeMatch[1].toUpperCase();
  const simpleCode = trimmed.match(/^([A-Z0-9]{8,12})$/i);
  if (simpleCode) return simpleCode[1].toUpperCase();
  const fallbackMatch = trimmed.match(/([A-Z0-9]{8,12})/i);
  if (fallbackMatch) return fallbackMatch[1].toUpperCase();
  return trimmed.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 12);
}

/**
 * Extract KES amount from M-Pesa message.
 */
export function extractMpesaAmount(message: string): number | null {
  if (!message) return null;
  const amountMatch = message.match(/Ksh\s?([0-9,]+\.?\d{0,2})/i);
  if (amountMatch) {
    const amountStr = amountMatch[1].replace(/,/g, "");
    return parseFloat(amountStr);
  }
  return null;
}

/**
 * Parse M-Pesa message to extract code and amount.
 */
export function parseMpesaMessage(message: string): {
  code: string;
  amount: number | null;
} {
  return {
    code: extractMpesaCode(message),
    amount: extractMpesaAmount(message),
  };
}

// ============ REAL-TIME SUBSCRIPTIONS ============

/**
 * Subscribe to payments for a specific hire request.
 */
export function subscribeToHirePayments(
  hireRequestId: string,
  callback: (payments: HirePayment[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(
    collection(db, COLLECTIONS.HIRE_PAYMENTS),
    where("hireRequestId", "==", hireRequestId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const payments = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as HirePayment)
      );
      callback(payments);
    },
    (error) => {
      if (process.env.NODE_ENV === "development") {
        logError("hire-payment", error);
      }
      onError?.(error);
    }
  );
}

// ============ QUERIES ============

/**
 * Get payment summary for a hire request.
 */
export async function getHirePaymentSummary(
  hireRequestId: string
): Promise<{
  totalDue: number;
  amountPaid: number;
  balanceRemaining: number;
  payments: HirePayment[];
  isFullyPaid: boolean;
}> {
  // Get the hire request
  const hireRef = doc(db, COLLECTIONS.HIRE_REQUESTS, hireRequestId);
  const hireSnap = await getDoc(hireRef);
  const hire = hireSnap.data() as HireRequest;

  const totalDue = hire?.totalAmount || 0;

  // Get all confirmed/verified payments
  const paymentsQuery = query(
    collection(db, COLLECTIONS.HIRE_PAYMENTS),
    where("hireRequestId", "==", hireRequestId),
    where("status", "in", ["confirmed", "verified"])
  );

  const paymentsSnapshot = await getDocs(paymentsQuery);
  const payments = paymentsSnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as HirePayment)
  );

  const amountPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const balanceRemaining = Math.max(0, totalDue - amountPaid);
  const isFullyPaid = amountPaid >= totalDue;

  return {
    totalDue,
    amountPaid,
    balanceRemaining,
    payments,
    isFullyPaid,
  };
}

// ============ MUTATIONS ============

/**
 * Confirm payment receipt (Vendor action).
 * Calls the server-side API route for atomic confirmation with audit logging.
 *
 * SECURITY: Payment writes go through /api/vendor/payments/confirm (Admin SDK).
 */
export async function confirmPaymentReceipt(params: {
  paymentId: string;
  confirmedBy: string;
  notes?: string;
}): Promise<{ success: boolean }> {
  const response = await fetch("/api/vendor/payments/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      paymentId: params.paymentId,
      notes: params.notes,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Failed to confirm payment");
  }

  // Auto-revoke overlapping unpaid bookings (best-effort, client-side)
  const paymentSnap = await getDoc(doc(db, COLLECTIONS.HIRE_PAYMENTS, params.paymentId));
  if (paymentSnap.exists()) {
    const payment = paymentSnap.data() as HirePayment;
    await autoRevokeOverlappingBookings(payment.hireRequestId);
  }

  return { success: true };
}

/**
 * Reject payment (Vendor/Admin action).
 * Calls the server-side API route for atomic rejection with audit logging.
 *
 * SECURITY: Payment writes go through /api/vendor/payments/reject (Admin SDK).
 */
export async function rejectHirePayment(params: {
  paymentId: string;
  rejectedBy: string;
  reason: string;
}): Promise<{ success: boolean }> {
  const response = await fetch("/api/vendor/payments/reject", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      paymentId: params.paymentId,
      reason: params.reason,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Failed to reject payment");
  }

  return { success: true };
}

/**
 * Auto-revoke overlapping unpaid bookings.
 * When a booking is fully paid, find and revoke any other unpaid bookings
 * for the same vehicle with overlapping dates.
 */
async function autoRevokeOverlappingBookings(
  paidHireRequestId: string
): Promise<void> {
  try {
    // Fetch the paid hire request
    const paidHireSnap = await getDoc(
      doc(db, COLLECTIONS.HIRE_REQUESTS, paidHireRequestId)
    );
    if (!paidHireSnap.exists()) return;

    const paidHire = paidHireSnap.data() as HireRequest;
    if (!paidHire.vehicleId) return;

    // Query all other bookings for the same vehicle that are pending/approved
    const overlappingQuery = query(
      collection(db, COLLECTIONS.HIRE_REQUESTS),
      where("vehicleId", "==", paidHire.vehicleId),
      where("status", "in", ["pending", "approved"])
    );

    const snapshot = await getDocs(overlappingQuery);
    if (snapshot.empty) return;

    const paidStart =
      paidHire.startDate?.toDate instanceof Function
        ? paidHire.startDate.toDate()
        : new Date(paidHire.startDate);
    const paidEnd =
      paidHire.endDate?.toDate instanceof Function
        ? paidHire.endDate.toDate()
        : new Date(paidHire.endDate);

    for (const docSnap of snapshot.docs) {
      if (docSnap.id === paidHireRequestId) continue;

      const hire = docSnap.data() as HireRequest;
      const hireStart =
        hire.startDate?.toDate instanceof Function
          ? hire.startDate.toDate()
          : new Date(hire.startDate);
      const hireEnd =
        hire.endDate?.toDate instanceof Function
          ? hire.endDate.toDate()
          : new Date(hire.endDate);

      // Check date overlap
      const hasOverlap = paidStart <= hireEnd && hireStart <= paidEnd;

      if (hasOverlap) {
        // Revoke this unpaid booking
        await updateDoc(doc(db, COLLECTIONS.HIRE_REQUESTS, docSnap.id), {
          status: "cancelled",
          cancellationReason: "Vehicle booked and paid by another customer",
          cancelledBy: "system",
          cancelledAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (error) {
    logError("hire-payment", error);
    // Don't throw — this is a best-effort cleanup
  }
}

// ============ RECEIPT GENERATION ============

/**
 * Generate a hire receipt after payment confirmation.
 */
export async function generateHireReceipt(
  hireRequestId: string,
  paymentId: string
): Promise<HireReceipt | null> {
  try {
    // Fetch all required documents
    const hireSnap = await getDoc(
      doc(db, COLLECTIONS.HIRE_REQUESTS, hireRequestId)
    );
    if (!hireSnap.exists()) return null;
    const hire = hireSnap.data() as HireRequest;

    const vehicleSnap = await getDoc(
      doc(db, COLLECTIONS.VEHICLES, hire.vehicleId)
    );
    const vehicle = vehicleSnap.data() as Vehicle | undefined;

    let company: Company | undefined;
    if (hire.companyId) {
      const companySnap = await getDoc(
        doc(db, COLLECTIONS.COMPANIES, hire.companyId)
      );
      company = companySnap.data() as Company;
    }

    // Get confirmed payments
    const paymentsQuery = query(
      collection(db, COLLECTIONS.HIRE_PAYMENTS),
      where("hireRequestId", "==", hireRequestId),
      where("status", "in", ["confirmed", "verified"])
    );
    const paymentsSnapshot = await getDocs(paymentsQuery);
    const payments = paymentsSnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as HirePayment)
    );

    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const lastPayment = payments[0]; // Most recent

    // Generate receipt number
    const date = new Date();
    const dateStr = date.toISOString().split("T")[0].replace(/-/g, "");
    const randomArray = crypto.getRandomValues(new Uint32Array(1));
    const random = (randomArray[0] % 10000)
      .toString()
      .padStart(4, "0");
    const receiptNumber = `TT-HR-${dateStr}-${random}`;

    const receipt: HireReceipt = {
      receiptNumber,
      hireRequestId,
      vehicleId: hire.vehicleId,
      vehicleName: vehicle ? `${vehicle.make} ${vehicle.model}` : "Unknown",
      vehiclePlate: vehicle?.plate || "Unknown",
      companyId: hire.companyId,
      companyName: company?.name || "Unknown",
      companyLogo: company?.logoUrl,
      customerName: hire.customerName || "Unknown",
      customerId: hire.customerId,
      startDate: hire.startDate,
      endDate: hire.endDate,
      durationDays: hire.days,
      durationHours: hire.durationHours,
      serviceType: hire.driverMode || "self",
      handoverMode: hire.handoverMode || "pickup",
      deliveryAddress: hire.deliveryAddress,
      baseRentalAmount: hire.prefilledInvoice?.baseRentalAmount || hire.baseRate * hire.days,
      deliveryFee: hire.prefilledInvoice?.deliveryFee || hire.logisticsFee,
      chauffeurFee: hire.chauffeurFee,
      washFee: hire.prefilledInvoice?.washFee || hire.washFee || 0,
      securityDeposit: hire.prefilledInvoice?.securityDeposit || hire.depositAmount || 0,
      totalDue: hire.totalAmount,
      amountPaid: totalPaid,
      paymentMethod: lastPayment?.paymentMethod || "unknown",
      paymentDate: lastPayment?.confirmedAt || serverTimestamp(),
      mpesaTransactionCode: lastPayment?.mpesaTransactionCode,
      bankReference: lastPayment?.bankReference,
      status: totalPaid >= hire.totalAmount ? "full" : "partial",
      balanceRemaining: Math.max(0, hire.totalAmount - totalPaid),
      generatedAt: serverTimestamp(),
    };

    // Store receipt on hire request
    await updateDoc(doc(db, COLLECTIONS.HIRE_REQUESTS, hireRequestId), {
      receipt,
      updatedAt: serverTimestamp(),
    });

    return receipt;
  } catch (error) {
    logError("hire-payment", error);
    return null;
  }
}
