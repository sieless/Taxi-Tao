/**
 * @fileoverview Admin RBAC permission helper.
 *
 * Mirrors the permission model from the React Native admin portal.
 * Full `admin` role → all permissions implicitly granted.
 * `assistant` role → only permissions explicitly listed in userProfile.permissions.
 */

import type { AppUser } from "@/lib/types";

// ── Permission flag map ────────────────────────────────────────────────────────
export interface AdminPermissions {
  /** Suspend, unsuspend, delete, role-change users */
  manageUsers: boolean;
  /** Approve/reject drivers, manage subscriptions */
  manageDrivers: boolean;
  /** Verify / reject M-Pesa payments */
  managePayments: boolean;
  /** Delete bookings, create share links */
  manageRides: boolean;
  /** Respond to support tickets, update issue status */
  manageIssues: boolean;
  /** View analytics dashboard and audit logs */
  viewAnalytics: boolean;
}

// ── Environment-based super-admin detection ────────────────────────────────────
const MAIN_ADMIN_EMAIL = (
  process.env.MAIN_ADMIN_EMAIL ?? ""
).toLowerCase();

const MAIN_ADMIN_ACTION_EMAIL = (
  process.env.MAIN_ADMIN_ACTION_EMAIL ?? ""
).toLowerCase();

/**
 * Returns true if the email belongs to a super-admin account.
 * Super-admins can NEVER be suspended, deleted, or have their role changed
 * through the admin portal.
 */
export function isSuperAdmin(email: string): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase();
  return (
    (MAIN_ADMIN_EMAIL !== "" && normalized === MAIN_ADMIN_EMAIL) ||
    (MAIN_ADMIN_ACTION_EMAIL !== "" && normalized === MAIN_ADMIN_ACTION_EMAIL)
  );
}

// ── Core authorization function ────────────────────────────────────────────────
/**
 * Checks whether a user has a specific admin permission.
 *
 * - `admin` role → always returns true (all permissions implicitly granted).
 * - `assistant` role → returns true only if the flag is explicitly set to true
 *   in `userProfile.permissions`.
 * - All other roles → always returns false.
 */
export function hasAdminPermission(
  userProfile: AppUser | null,
  permission: keyof AdminPermissions
): boolean {
  if (!userProfile) return false;
  if (userProfile.role === "admin") return true;
  if (userProfile.role === "assistant") {
    return (userProfile as any).permissions?.[permission] === true;
  }
  return false;
}

/**
 * Returns true if the user can access any part of the admin portal at all
 * (i.e. is either `admin` or `assistant`).
 */
export function isAdminOrAssistant(userProfile: AppUser | null): boolean {
  if (!userProfile) return false;
  return userProfile.role === "admin" || userProfile.role === "assistant";
}
