/**
 * @fileoverview Admin service — subscription & payment management using Direct Firestore Writes.
 *
 * NOTE: Cloud Functions for these actions are currently missing in the backend deployment.
 * To ensure the Admin Dashboard remains functional without interfering with the mobile state,
 * we are performing direct Firestore updates for privileged administrative actions.
 * These actions are protected by Firestore Security Rules that require 'isAdmin()' status.
 */

import { 
  doc, 
  updateDoc, 
  setDoc,
  addDoc, 
  collection, 
  serverTimestamp, 
  getDoc,
  query,
  where,
  getDocs,
  limit,
  orderBy
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions, auth } from "@/lib/firebase";


import { logError } from "@/lib/logger";// ── Token helpers ─────────────────────────────────────────────────────────────

/**
 * Forces a Firebase ID-token refresh so that the latest custom claims
 * (role, permissions) are included in the next request.
 */
export async function forceTokenRefresh(): Promise<void> {
  const currentUser = auth.currentUser;
  if (currentUser) {
    await currentUser.getIdToken(/* forceRefresh */ true);
  }
}

/**
 * Syncs the server-side custom claims for the current user and then
 * force-refreshes the token.
 */
export async function syncRoleClaimsAndRefresh(): Promise<void> {
  try {
    // If refreshUserClaims exists, call it. Otherwise skip to force refresh.
    const syncRoleClaims = httpsCallable(functions, "refreshUserClaims");
    await syncRoleClaims({ uid: auth.currentUser?.uid });
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Claims sync skipped or failed, forcing refresh anyway.");
    }
  }
  await forceTokenRefresh();
}

// ── Audit Logging ────────────────────────────────────────────────────────────

async function logAdminAction(action: string, targetId: string, details: any) {
  try {
    // Sanitize details to remove undefined values which Firestore doesn't support
    const sanitizedDetails = JSON.parse(JSON.stringify(details, (key, value) => 
      value === undefined ? null : value
    ));

    await addDoc(collection(db, "adminAuditEvents"), {
      category: "administrative",
      action,
      severity: "info",
      actorId: auth.currentUser?.uid || "unknown",
      actorEmail: auth.currentUser?.email || "unknown",
      targetId,
      description: `Admin ${auth.currentUser?.email} performed ${action} on ${targetId}`,
      details: sanitizedDetails,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    logError("admin", err);
  }
}

// ── Corporate Pricing Engine ────────────────────────────────────────────────

export const COMPANY_SUBSCRIPTION_TIERS = {
  TIER_1: { maxVehicles: 5, fee: 2000, label: "Micro" },
  TIER_2: { maxVehicles: 10, fee: 3500, label: "Standard" },
  TIER_3: { maxVehicles: Infinity, fee: 5000, label: "Enterprise" },
};

/**
 * Calculates the subscription tier and fee based on vehicle count.
 */
export function calculateCompanyTierAndFee(vehicleCount: number) {
  if (vehicleCount <= COMPANY_SUBSCRIPTION_TIERS.TIER_1.maxVehicles) {
    return { tier: 1, fee: COMPANY_SUBSCRIPTION_TIERS.TIER_1.fee, label: COMPANY_SUBSCRIPTION_TIERS.TIER_1.label };
  } else if (vehicleCount <= COMPANY_SUBSCRIPTION_TIERS.TIER_2.maxVehicles) {
    return { tier: 2, fee: COMPANY_SUBSCRIPTION_TIERS.TIER_2.fee, label: COMPANY_SUBSCRIPTION_TIERS.TIER_2.label };
  } else {
    return { tier: 3, fee: COMPANY_SUBSCRIPTION_TIERS.TIER_3.fee, label: COMPANY_SUBSCRIPTION_TIERS.TIER_3.label };
  }
}

// ── Subscription management ───────────────────────────────────────────────────

export interface ActivateSubscriptionResult {
  success: boolean;
  message: string;
}

/**
 * Manually activates a driver's subscription via direct Firestore write.
 */
export async function manuallyActivateSubscription(
  driverId: string,
  adminUid: string,
  serviceType: "taxi" | "hire" = "taxi"
): Promise<ActivateSubscriptionResult> {
  try {
    const driverRef = doc(db, "drivers", driverId);
    
    // Calculate next payment due (30 days from now)
    const nextDue = new Date();
    nextDue.setDate(nextDue.getDate() + 30);

    const updateData: any = {
      updatedAt: serverTimestamp(),
    };

    if (serviceType === "hire") {
      updateData.hireSubscriptionStatus = "active";
      updateData.hireSubscriptionPlan = "monthly";
      updateData.hireLastPaymentDate = serverTimestamp();
      updateData.hireNextPaymentDue = nextDue;
    } else {
      updateData.subscriptionStatus = "active";
      updateData.isVisibleToPublic = true;
      updateData.active = true;
      updateData.subscriptionPlan = "monthly";
      updateData.subscriptionDurationDays = 30;
      updateData.subscriptionActivatedAt = serverTimestamp(),
      updateData.lastPaymentDate = serverTimestamp();
      updateData.nextPaymentDue = nextDue;
    }

    await updateDoc(driverRef, updateData);

    await logAdminAction(`manual_${serviceType}_activation`, driverId, { adminUid });
    
    return { success: true, message: `${serviceType.toUpperCase()} subscription activated successfully` };
  } catch (err: any) {
    logError("admin", err);
    throw new Error(err.message || "Failed to activate subscription");
  }
}

// ── Payment verification ──────────────────────────────────────────────────────

export interface PaymentActionResult {
  success: boolean;
  message: string;
}

/**
 * Marks a payment verification as verified and activates subscription.
 */
export async function verifyDriverPayment(
  driverId: string,
  verificationId: string,
  adminUid: string
): Promise<PaymentActionResult> {
  try {
    const verificationRef = doc(db, "paymentVerifications", verificationId);
    const verificationSnap = await getDoc(verificationRef);
    const verificationData = verificationSnap.data();
    const serviceType = verificationData?.serviceType || "taxi";
    
    // 1. Update verification record
    await updateDoc(verificationRef, {
      status: "verified",
      verifiedAt: serverTimestamp(),
      verifiedBy: adminUid,
      updatedAt: serverTimestamp(),
    });

    // 2. Activate driver for the specific service
    await manuallyActivateSubscription(driverId, adminUid, serviceType as "taxi" | "hire");

    await logAdminAction(`${serviceType}_payment_verified`, verificationId, { driverId, adminUid });

    return { success: true, message: `${serviceType.toUpperCase()} payment verified and subscription activated` };
  } catch (err: any) {
    logError("admin", err);
    throw new Error(err.message || "Failed to verify payment");
  }
}

/**
 * Rejects a payment verification.
 */
export async function rejectDriverPayment(
  verificationId: string,
  adminUid: string,
  reason: string
): Promise<PaymentActionResult> {
  try {
    const verificationRef = doc(db, "paymentVerifications", verificationId);
    
    await updateDoc(verificationRef, {
      status: "rejected",
      rejectedAt: serverTimestamp(),
      rejectedBy: adminUid,
      rejectionReason: reason,
      updatedAt: serverTimestamp(),
    });

    await logAdminAction("payment_rejected", verificationId, { adminUid, reason });

    return { success: true, message: "Payment verification rejected" };
  } catch (err: any) {
    logError("admin", err);
    throw new Error(err.message || "Failed to reject payment");
  }
}

// ── KYC Management ────────────────────────────────────────────────────────────

/**
 * Approves driver KYC status.
 */
export async function approveDriverKYC(
  driverId: string,
  adminUid: string,
  notes?: string
): Promise<void> {
  try {
    const driverRef = doc(db, "drivers", driverId);
    
    await updateDoc(driverRef, {
      kycStatus: "approved",
      kycVerifiedAt: serverTimestamp(),
      kycVerifiedBy: adminUid,
      kycNotes: notes || "",
      updatedAt: serverTimestamp(),
    });

    await logAdminAction("kyc_approved", driverId, { adminUid, notes });
  } catch (err: any) {
    logError("admin", err);
    throw new Error(err.message || "Failed to approve KYC");
  }
}

/**
 * Rejects driver KYC status.
 * Updates both the 'drivers' collection and the 'users' collection (verification object).
 */
export async function rejectDriverKYC(
  driverId: string,
  adminUid: string,
  reason: string
): Promise<void> {
  try {
    const driverRef = doc(db, "drivers", driverId);
    const userRef = doc(db, "users", driverId);
    const timestamp = serverTimestamp();
    
    // 1. Update Drivers Collection
    await updateDoc(driverRef, {
      kycStatus: "rejected",
      kycRejectedAt: timestamp,
      kycRejectedBy: adminUid,
      kycRejectionReason: reason,
      updatedAt: timestamp,
    });

    // 2. Update Users Collection (Verification object)
    // The mobile app listens to this 'verification' object in the user profile.
    await updateDoc(userRef, {
      "verification.driverKyc": "rejected",
      "verification.rejectionReason": reason,
      "verification.kycRejectedAt": timestamp,
      updatedAt: timestamp,
    });

    await logAdminAction("kyc_rejected", driverId, { adminUid, reason });
  } catch (err: any) {
    logError("admin", err);
    throw new Error(err.message || "Failed to reject KYC");
  }
}

// ── In-app messaging ──────────────────────────────────────────────────────────

export interface SendMessageResult {
  success: boolean;
  message: string;
}

/**
 * Sends an in-app notification by writing directly to the notifications collection.
 */
export async function sendAdminMessage(
  recipientId: string,
  message: string,
  adminUid: string
): Promise<SendMessageResult> {
  try {
    await addDoc(collection(db, "notifications"), {
      userId: recipientId,
      recipientId,
      senderId: adminUid,
      type: "system_broadcast",
      title: "Message from Admin",
      message,
      read: false,
      createdAt: serverTimestamp(),
    });

    await logAdminAction("admin_message_sent", recipientId, { adminUid, message });

    return { success: true, message: "Message sent successfully" };
  } catch (err: any) {
    logError("admin", err);
    throw new Error(err.message || "Failed to send message");
  }
}
// ── Subscription reminders ────────────────────────────────────────────────────

export interface ReminderResult {
  success: boolean;
  sent: number;
  message: string;
}

/**
 * Sends a payment reminder notification to a single expired driver.
 */
export async function sendExpiredSubscriptionReminder(
  driverId: string,
  daysExpired: number
): Promise<ReminderResult> {
  try {
    const fn = httpsCallable<{ driverId: string; daysExpired: number }, ReminderResult>(
      functions,
      "sendExpiredSubscriptionReminder"
    );
    const result = await fn({ driverId, daysExpired });
    return result.data;
  } catch (err: any) {
    logError("admin", err);
    throw new Error(err.message || "Failed to send reminder");
  }
}

/**
 * Sends payment reminder notifications to ALL drivers with expired subscriptions.
 */
export async function sendBulkExpiredReminders(): Promise<ReminderResult> {
  try {
    const fn = httpsCallable<Record<string, never>, ReminderResult>(
      functions,
      "sendBulkExpiredReminders"
    );
    const result = await fn({});
    return result.data;
  } catch (err: any) {
    logError("admin", err);
    throw new Error(err.message || "Failed to send bulk reminders");
  }
}

// ── Car Hire & Corporate Management ──────────────────────────────────────────

/**
 * Approves a company for the car hire platform.
 */
export async function approveCompany(
  companyId: string,
  adminUid: string
): Promise<void> {
  try {
    const companyRef = doc(db, "companies", companyId);
    
    // Set initial payment due date (30 days from now)
    const nextDue = new Date();
    nextDue.setDate(nextDue.getDate() + 30);

    await updateDoc(companyRef, {
      status: "active",
      subscriptionStatus: "active", // Start as active upon initial approval
      nextPaymentDue: nextDue,
      approvedAt: serverTimestamp(),
      approvedBy: adminUid,
      updatedAt: serverTimestamp(),
    });

    // Also update the User document to sync status for guards
    await updateDoc(doc(db, "users", companyId), {
      companyStatus: "active",
    });

    // Trigger initial invoice sync
    await syncCompanySubscriptionAndInvoice(companyId, adminUid);

    await logAdminAction("company_approved", companyId, { adminUid });
  } catch (err: any) {
    logError("admin", err);
    throw new Error(err.message || "Failed to approve company");
  }
}

/**
 * Rejects a company application.
 */
export async function rejectCompany(
  companyId: string,
  adminUid: string,
  reason: string
): Promise<void> {
  try {
    const companyRef = doc(db, "companies", companyId);
    await updateDoc(companyRef, {
      status: "rejected",
      rejectedAt: serverTimestamp(),
      rejectedBy: adminUid,
      rejectionReason: reason,
      updatedAt: serverTimestamp(),
    });

    await logAdminAction("company_rejected", companyId, { adminUid, reason });
  } catch (err: any) {
    logError("admin", err);
    throw new Error(err.message || "Failed to reject company");
  }
}

/**
 * Force releases a vehicle from an active hire.
 * Resets status to 'available' and clears hire data.
 */
export async function forceReleaseVehicle(
  vehicleId: string,
  adminUid: string
): Promise<void> {
  try {
    const vehicleRef = doc(db, "vehicles", vehicleId);
    await updateDoc(vehicleRef, {
      status: "available",
      currentCustomerId: null,
      currentCustomerName: null,
      currentHireId: null,
      dueDate: null,
      updatedAt: serverTimestamp(),
    });

    await logAdminAction("vehicle_force_release", vehicleId, { adminUid });
  } catch (err: any) {
    logError("admin", err);
    throw new Error(err.message || "Failed to release vehicle");
  }
}

/**
 * Updates a specific vehicle in a driver's vehicles array.
 * Note: Firestore doesn't support updating a single array element by index/filter easily,
 * so we read, modify, and write back.
 */
export async function updateDriverVehicle(
  driverId: string,
  vehicleId: string,
  updates: any,
  adminUid: string
): Promise<void> {
  try {
    const driverRef = doc(db, "drivers", driverId);
    const snap = await getDoc(driverRef);
    if (!snap.exists()) throw new Error("Driver not found");

    const data = snap.data();
    const vehicles = data.vehicles || [];
    
    const updatedVehicles = vehicles.map((v: any) => {
      if (v.id === vehicleId) {
        return { ...v, ...updates, updatedAt: new Date().toISOString() };
      }
      return v;
    });

    await updateDoc(driverRef, {
      vehicles: updatedVehicles,
      updatedAt: serverTimestamp(),
    });

    await logAdminAction("driver_vehicle_update", driverId, { vehicleId, updates, adminUid });
  } catch (err: any) {
    logError("admin", err);
    throw new Error(err.message || "Failed to update vehicle");
  }
}

/**
 * Synchronizes a driver's vehicle to the top-level marketplace collection.
 * This makes the vehicle visible to customers for hire.
 */
export async function syncVehicleToMarketplace(
  vehicle: any,
  adminUid: string
): Promise<void> {
  try {
    if (!vehicle.id) throw new Error("Vehicle must have an ID to sync");
    if (!vehicle.driverId) throw new Error("Vehicle must have a driverId to sync");

    const marketplaceRef = doc(db, "vehicles", vehicle.id);
    
    // Prepare the marketplace payload
    const payload = {
      ...vehicle,
      // Ensure specific marketplace fields are set
      isRental: true,
      status: vehicle.status || "active",
      lastSyncedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // Ensure corporate isolation for driver-owned vehicles
      companyId: null,
      source: "driver_portal"
    };

    // Use setDoc with merge to create or update
    await setDoc(marketplaceRef, payload, { merge: true });

    await logAdminAction("vehicle_marketplace_sync", vehicle.id, { 
      driverId: vehicle.driverId, 
      adminUid 
    });
  } catch (err: any) {
    logError("admin", err);
    throw new Error(err.message || "Failed to sync to marketplace");
  }
}

/**
 * Toggles a company's corporate (Executive) status.
 */
export async function toggleCorporateStatus(
  companyId: string, 
  status: boolean,
  adminUid: string
): Promise<void> {
  try {
    const companyRef = doc(db, "companies", companyId);
    await updateDoc(companyRef, {
      isCorporate: status,
      updatedAt: serverTimestamp(),
    });

    await logAdminAction("company_corporate_toggle", companyId, { 
      isCorporate: status, 
      adminUid 
    });
  } catch (err: any) {
    logError("admin", err);
    throw new Error(err.message || "Failed to update corporate status");
  }
}

/**
 * Synchronizes a company's subscription tier based on their current fleet size
 * and generates an invoice for the next cycle.
 */
export async function syncCompanySubscriptionAndInvoice(
  companyId: string,
  adminUid: string
): Promise<void> {
  try {
    // 1. Get current vehicle count
    const q = query(collection(db, "vehicles"), where("companyId", "==", companyId), where("active", "==", true));
    const snap = await getDocs(q);
    const vehicleCount = snap.size;

    // 2. Calculate Tier
    const { tier, fee, label } = calculateCompanyTierAndFee(vehicleCount);

    // 3. Update Company Doc
    const companyRef = doc(db, "companies", companyId);
    await updateDoc(companyRef, {
      subscriptionTier: tier,
      "stats.fleetCount": vehicleCount,
      updatedAt: serverTimestamp(),
    });

    // 4. Create Invoice
    const invoiceRef = collection(db, "companyInvoices");
    await addDoc(invoiceRef, {
      companyId,
      amount: fee,
      tier,
      tierLabel: label,
      vehicleCount,
      status: "unpaid",
      generatedAt: serverTimestamp(),
      dueDate: serverTimestamp(), // Admin typically sets this or it's rolling
      description: `Monthly Subscription for ${label} Tier (${vehicleCount} vehicles)`,
    });

    await logAdminAction("company_invoice_sync", companyId, { tier, fee, vehicleCount, adminUid });
  } catch (err: any) {
    logError("admin", err);
    throw new Error(err.message || "Failed to sync company subscription");
  }
}

/**
 * Records a company payment and extends their subscription by 30 days.
 */
export async function recordCompanyPayment(
  companyId: string,
  amount: number,
  reference: string,
  adminUid: string
): Promise<void> {
  try {
    const companyRef = doc(db, "companies", companyId);
    const snap = await getDoc(companyRef);
    if (!snap.exists()) throw new Error("Company not found");

    const data = snap.data();
    const currentDue = data.nextPaymentDue?.toDate() || new Date();
    
    // Add 30 days to the PREVIOUS due date to ensure they don't lose days
    const newDue = new Date(currentDue);
    newDue.setDate(newDue.getDate() + 30);

    // 1. Update Company Status and Date
    await updateDoc(companyRef, {
      subscriptionStatus: "active",
      lastPaymentDate: serverTimestamp(),
      nextPaymentDue: newDue,
      updatedAt: serverTimestamp(),
    });

    // 2. Create Payment Record
    await addDoc(collection(db, "companyPayments"), {
      companyId,
      amount,
      reference,
      adminId: adminUid,
      timestamp: serverTimestamp(),
      type: "subscription",
    });

    // 3. Mark last invoice as paid
    const invQ = query(
      collection(db, "companyInvoices"), 
      where("companyId", "==", companyId), 
      where("status", "==", "unpaid"),
      orderBy("generatedAt", "desc"),
      limit(1)
    );
    const invSnap = await getDocs(invQ);
    if (!invSnap.empty) {
      await updateDoc(doc(db, "companyInvoices", invSnap.docs[0].id), {
        status: "paid",
        paidAt: serverTimestamp(),
        paymentReference: reference,
      });
    }

    await logAdminAction("company_payment_recorded", companyId, { amount, reference, adminUid });
    
    // 4. Restore fleet visibility
    await syncCompanyFleetVisibility(companyId, true);
  } catch (err: any) {
    logError("admin", err);
    throw new Error(err.message || "Failed to record company payment");
  }
}

/**
 * Toggles the public visibility of all vehicles owned by a company.
 */
export async function syncCompanyFleetVisibility(
  companyId: string,
  isVisible: boolean
): Promise<void> {
  try {
    const q = query(collection(db, "vehicles"), where("companyId", "==", companyId));
    const snap = await getDocs(q);
    
    const batchSize = 500;
    const docs = snap.docs;
    
    for (let i = 0; i < docs.length; i += batchSize) {
      const chunk = docs.slice(i, i + batchSize);
      await Promise.all(chunk.map(d => updateDoc(d.ref, {
        isVisibleToPublic: isVisible,
        updatedAt: serverTimestamp()
      })));
    }
    
    if (process.env.NODE_ENV === "development") {
      console.log(`Synced visibility for ${docs.length} vehicles to ${isVisible}`);
    }
  } catch (err) {
    logError("admin", err);
  }
}

