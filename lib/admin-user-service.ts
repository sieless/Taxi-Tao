/**
 * @fileoverview Admin user-management service.
 *
 * All mutations (suspend, unsuspend, delete, role change) are routed through
 * Cloud Functions rather than direct Firestore writes.  This ensures:
 *  1. The Firebase Auth account is also acted on (not just the Firestore profile).
 *  2. Every action generates an audit log entry server-side.
 *  3. Super-admin accounts are protected at the server layer.
 *
 * The `syncRoleClaimsAndRefresh` helper from admin-service.ts must be called
 * before `changeUserRole` so the caller's token carries the latest claims.
 */

import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { isSuperAdmin } from "@/lib/admin-permission-helper";

// ── Shared result shape ────────────────────────────────────────────────────────

export interface UserActionResult {
  success: boolean;
  message: string;
}

// ── Guard ─────────────────────────────────────────────────────────────────────

/**
 * Throws a user-facing error if the target UID belongs to a super-admin.
 * Call this client-side before any destructive action so the user gets
 * immediate feedback rather than a Cloud Function rejection.
 *
 * Note: This is a client-side guard only. The Cloud Function also checks
 * super-admin status server-side as a second layer of protection.
 */
function guardSuperAdmin(targetUid: string, action: string): void {
  // Client-side check uses UID (no custom claims available here)
  // The Cloud Function will also verify server-side
  if (isSuperAdmin(targetUid)) {
    throw new Error(
      `Cannot ${action}: this account is a super-admin and is protected.`
    );
  }
}

// ── Suspend / Unsuspend ───────────────────────────────────────────────────────

/**
 * Suspends a user's account.
 * The Cloud Function disables the Firebase Auth account AND sets
 * `users/{uid}.suspended = true` in Firestore.
 */
export async function suspendUser(
  userId: string,
  targetEmail: string,
  adminUid: string
): Promise<UserActionResult> {
  guardSuperAdmin(userId, "suspend");

  try {
    const fn = httpsCallable(functions, "suspendUser");
    const result = await fn({ userId, adminUid }) as { data: UserActionResult };
    return result.data;
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("suspendUser Cloud Function error:", error);
    }
    throw new Error(error?.message || "Failed to suspend user. Please try again.");
  }
}

/**
 * Unsuspends a user's account.
 * Re-enables the Firebase Auth account and clears the suspended flag.
 */
export async function unsuspendUser(
  userId: string,
  adminUid: string
): Promise<UserActionResult> {
  try {
    const fn = httpsCallable(functions, "unsuspendUser");
    const result = await fn({ userId, adminUid }) as { data: UserActionResult };
    return result.data;
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("unsuspendUser Cloud Function error:", error);
    }
    throw new Error(error?.message || "Failed to unsuspend user. Please try again.");
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

/**
 * Permanently deletes a user from Firebase Auth AND Firestore.
 * Replaces the old `deleteDoc(doc(db, "drivers", id))` which only removed
 * the Firestore document and left the Auth account intact.
 */
export async function deleteUser(
  userId: string,
  targetEmail: string,
  adminUid: string
): Promise<UserActionResult> {
  guardSuperAdmin(userId, "delete");

  try {
    const fn = httpsCallable(functions, "deleteUser");
    const result = await fn({ userId, adminUid }) as { data: UserActionResult };
    return result.data;
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("deleteUser Cloud Function error:", error);
    }
    throw new Error(error?.message || "Failed to delete user. Please try again.");
  }
}

// ── Role change ───────────────────────────────────────────────────────────────

export type AdminRole = "admin" | "assistant" | "customer" | "driver" | "car_hire";

export interface ChangeRolePayload {
  userId: string;
  targetEmail: string;
  newRole: AdminRole;
  adminUid: string;
  /** Required when promoting to `assistant` — explicit permission flags */
  permissions?: {
    manageUsers?: boolean;
    manageDrivers?: boolean;
    managePayments?: boolean;
    manageRides?: boolean;
    manageIssues?: boolean;
    viewAnalytics?: boolean;
  };
}

/**
 * Changes a user's role and updates custom claims.
 * `syncRoleClaimsAndRefresh()` should be called before this if the admin's
 * own role was recently changed.
 */
export async function changeUserRole(
  payload: ChangeRolePayload
): Promise<UserActionResult> {
  guardSuperAdmin(payload.userId, "change role of");

  try {
    const fn = httpsCallable(functions, "changeUserRole");
    const result = await fn(payload) as { data: UserActionResult };
    return result.data;
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("changeUserRole Cloud Function error:", error);
    }
    throw new Error(error?.message || "Failed to change user role. Please try again.");
  }
}
