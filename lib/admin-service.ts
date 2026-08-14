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
  getDoc,
  addDoc, 
  collection, 
  serverTimestamp, 
  query,
  where,
  getDocs,
  limit,
  orderBy
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions, auth } from "@/lib/firebase";
import { computeSubscriptionExtension } from "@/lib/subscription-utils";


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

// ── Subscription plan configs (aligned with mobile app) ──────────────────────

type SubscriptionPlan = "daily" | "weekly" | "monthly";

const SUBSCRIPTION_PLAN_CONFIG: Record<SubscriptionPlan, { amount: number; durationDays: number }> = {
  daily:   { amount: 100, durationDays: 1 },
  weekly:  { amount: 250, durationDays: 7 },
  monthly: { amount: 500, durationDays: 30 },
};

const HIRE_SUBSCRIPTION_PLAN_CONFIG: Record<SubscriptionPlan, { amount: number; durationDays: number; label: string }> = {
  daily:   { amount: 200,  durationDays: 1,  label: "Daily Hire Pass" },
  weekly:  { amount: 500,  durationDays: 7,  label: "Weekly Hire Pass" },
  monthly: { amount: 1000, durationDays: 30, label: "Monthly Hire Pass" },
};

function computeNextPaymentDueDate(
  plan: SubscriptionPlan,
  startAt: Date,
  serviceType: "taxi" | "hire"
): Date {
  const config = serviceType === "hire"
    ? HIRE_SUBSCRIPTION_PLAN_CONFIG[plan]
    : SUBSCRIPTION_PLAN_CONFIG[plan];
  const dueMs = startAt.getTime() + config.durationDays * 24 * 60 * 60 * 1000;
  return new Date(dueMs);
}

// ── Subscription management ───────────────────────────────────────────────────

export interface ActivateSubscriptionResult {
  success: boolean;
  message: string;
}

/**
 * Manually activates a driver's subscription via direct Firestore write.
 * Aligned with mobile app's verifyPayment() — writes all fields the mobile expects.
 */
export async function manuallyActivateSubscription(
  driverId: string,
  adminUid: string,
  serviceType: "taxi" | "hire" = "taxi",
  plan: SubscriptionPlan = "monthly",
  durationDays?: number
): Promise<ActivateSubscriptionResult> {
  try {
    const driverRef = doc(db, "drivers", driverId);

    // Check if driver document exists, create if needed
    const driverSnap = await getDoc(driverRef);
    const driverExists = driverSnap.exists();

    const planConfig = serviceType === "hire"
      ? HIRE_SUBSCRIPTION_PLAN_CONFIG[plan]
      : SUBSCRIPTION_PLAN_CONFIG[plan];
    const effectiveDuration = durationDays || planConfig.durationDays;

    const activatedAt = new Date();
    const nextPaymentDue = durationDays
      ? new Date(activatedAt.getTime() + effectiveDuration * 24 * 60 * 60 * 1000)
      : computeNextPaymentDueDate(plan, activatedAt, serviceType);

    const updateData: any = {
      updatedAt: serverTimestamp(),
    };

    if (serviceType === "hire") {
      updateData.hireSubscriptionStatus = "active";
      updateData.hireSubscriptionPlan = plan;
      updateData.hireLastPaymentDate = serverTimestamp();
      updateData.hireNextPaymentDue = nextPaymentDue;
    } else {
      updateData.subscriptionStatus = "active";
      updateData.isVisibleToPublic = true;
      updateData.active = true;
      updateData.subscriptionPlan = plan;
      updateData.subscriptionDurationDays = effectiveDuration;
      updateData.subscriptionActivatedAt = serverTimestamp();
      updateData.lastPaymentDate = serverTimestamp();
      updateData.nextPaymentDue = nextPaymentDue;
    }

    if (driverExists) {
      await updateDoc(driverRef, updateData);
    } else {
      // Create driver document with minimal required fields + subscription data
      await setDoc(driverRef, {
        ...updateData,
        userId: driverId,
        createdAt: serverTimestamp(),
        kycStatus: "pending",
        status: "offline",
        isVisibleToPublic: serviceType === "taxi",
      });
    }

    // Sync to user profile for mobile phone status guards
    try {
      const userRef = doc(db, "users", driverId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        await updateDoc(userRef, {
          subscriptionStatus: "active",
          active: true,
          nextPaymentDue,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (userSyncErr) {
      logError("admin_user_sync", userSyncErr);
    }

    // Write in-app notification so mobile phone gets instant notification
    try {
      await addDoc(collection(db, "driverNotifications"), {
        driverId,
        type: "system",
        title: "Subscription Activated",
        message: `Your ${serviceType.toUpperCase()} subscription (${effectiveDuration} day pass) has been activated. You are now active and visible to customers.`,
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (notifErr) {
      logError("admin_driver_notif", notifErr);
    }

    // Refresh driver custom claims so they can immediately access features
    try {
      const refreshClaims = httpsCallable(functions, "refreshUserClaims");
      await refreshClaims({ uid: driverId });
    } catch (claimError: any) {
      if (process.env.NODE_ENV === "development") {
        console.warn("Claims sync skipped or failed:", claimError?.message);
      }
    }

    await logAdminAction(`manual_${serviceType}_activation`, driverId, { adminUid, plan, effectiveDuration });

    return { success: true, message: `${serviceType.toUpperCase()} subscription (${effectiveDuration} days) activated successfully` };
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
 * Aligned with mobile app's verifyPayment() — reads plan/duration from verification,
 * sends notification, refreshes claims.
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
    const serviceType = (verificationData?.serviceType || "taxi") as "taxi" | "hire";
    const plan = (verificationData?.plan || "monthly") as SubscriptionPlan;
    const durationDays = verificationData?.durationDays;

    // 1. Activate driver subscription (with correct plan + duration + claims refresh)
    await manuallyActivateSubscription(driverId, adminUid, serviceType, plan, durationDays);

    // 2. Update verification record
    await updateDoc(verificationRef, {
      status: "verified",
      verifiedAt: serverTimestamp(),
      verifiedBy: adminUid,
      updatedAt: serverTimestamp(),
    });

    // 3. Send notification to driver
    try {
      await addDoc(collection(db, "driverNotifications"), {
        driverId,
        type: "system",
        title: "Payment Verified",
        message: "Thank you. Your subscription payment has been verified. You can go online and accept rides now.",
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch {
      // Non-blocking — don't fail the verification if notification fails
    }

    await logAdminAction(`${serviceType}_payment_verified`, verificationId, { driverId, adminUid, plan });

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
 * Updates both the 'drivers' collection and the 'users' collection (verification object)
 * to stay in sync with the mobile app.
 */
export async function approveDriverKYC(
  driverId: string,
  adminUid: string,
  notes?: string
): Promise<void> {
  try {
    const driverRef = doc(db, "drivers", driverId);
    const userRef = doc(db, "users", driverId);
    const timestamp = serverTimestamp();
    
    // 1. Update Drivers Collection
    await updateDoc(driverRef, {
      kycStatus: "approved",
      kycVerifiedAt: timestamp,
      kycVerifiedBy: adminUid,
      kycNotes: notes || "",
      updatedAt: timestamp,
    });

    // 2. Update Users Collection (Verification object)
    // The mobile app reads verification.driverKyc from the users collection.
    await updateDoc(userRef, {
      "verification.driverKyc": "approved",
      "verification.kycVerifiedAt": timestamp,
      "verification.kycVerifiedBy": adminUid,
      "verification.kycNotes": notes || "",
      updatedAt: timestamp,
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
    const fn = httpsCallable(functions, "sendExpiredSubscriptionReminder");
    const result = await fn({ driverId, daysExpired }) as { data: ReminderResult };
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
    const fn = httpsCallable(functions, "sendBulkExpiredReminders");
    const result = await fn({}) as { data: ReminderResult };
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
    
    // Set initial payment due date (1 month from now)
    const nextDue = computeSubscriptionExtension(null, 1);

    await updateDoc(companyRef, {
      status: "active",
      subscriptionStatus: "active", // Start as active upon initial approval
      subscriptionMonths: 1,
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
    const q = query(collection(db, "vehicles"), where("companyId", "==", companyId), where("status", "==", "active"));
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
 * Records a company payment and extends their subscription.
 * @param months Number of months to extend (defaults to 1). Supports
 *   multi-month subscriptions (e.g. clients paying 3 or 6 months ahead).
 */
export async function recordCompanyPayment(
  companyId: string,
  amount: number,
  reference: string,
  adminUid: string,
  months: number = 1
): Promise<void> {
  try {
    const companyRef = doc(db, "companies", companyId);
    const snap = await getDoc(companyRef);
    if (!snap.exists()) throw new Error("Company not found");

    const data = snap.data();

    // NEW BEHAVIOUR: if the company is already expired (due date in the past),
    // anchor the new due date on NOW so the payment makes them active again.
    // Otherwise extend from the existing due date so no days are lost.
    // Supports multi-month subscriptions via the `months` argument.
    const newDue = computeSubscriptionExtension(data.nextPaymentDue, months);

    const prevMonths = data.subscriptionMonths || 0;

    // 1. Update Company Status and Date
    await updateDoc(companyRef, {
      subscriptionStatus: "active",
      subscriptionMonths: prevMonths + Math.max(1, Math.floor(months || 1)),
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

