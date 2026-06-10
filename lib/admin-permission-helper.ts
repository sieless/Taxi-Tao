/**
 * @fileoverview Admin RBAC permission helper.
 *
 * Mirrors the permission model from the React Native admin portal.
 * Full `admin` role → all permissions implicitly granted.
 * `assistant` role → only permissions explicitly listed in userProfile.permissions.
 *
 * Super admin detection uses UIDs (not emails) for reliability:
 * - Email changes don't break super admin
 * - No environment variable typos
 * - Multiple super admins supported via comma-separated list
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

// ── Environment-based super-admin detection (UID-based) ────────────────────────
// SAFER than email-based: immune to email changes, typos, and account migrations.
// Set SUPER_ADMIN_UIDS as comma-separated UIDs in environment variables.
const SUPER_ADMIN_UIDS = new Set(
  (process.env.SUPER_ADMIN_UIDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
);

/**
 * Returns true if the UID belongs to a super-admin account.
 * Super-admins can NEVER be suspended, deleted, or have their role changed
 * through the admin portal.
 *
 * Priority:
 * 1. Custom claim `superAdmin: true` (set by Cloud Functions)
 * 2. UID in SUPER_ADMIN_UIDS environment variable (fallback)
 */
export function isSuperAdmin(uid: string, claims?: Record<string, unknown>): boolean {
  if (!uid) return false;

  // Check custom claim first (most reliable)
  if (claims?.superAdmin === true) return true;

  // Fallback to environment variable
  return SUPER_ADMIN_UIDS.has(uid);
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
